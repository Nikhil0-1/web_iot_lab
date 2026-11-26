/**
 * Tech IoT Warriors — ESP8266 REST API Networking Client & Device Hub Manager
 * Robust polling client with timeout, exponential backoff, identity verification, 
 * private network access support, explicit state machine, and comprehensive error diagnostics.
 */

class ESP8266Client {
  constructor(options = {}) {
    this.expectedProjectId = options.expectedProjectId || '';
    this.pollIntervalMs = options.pollIntervalMs || 1500;
    this.timeoutMs = options.timeoutMs || 3500;
    this.maxRetries = options.maxRetries || 3;

    this.onData = options.onData || (() => {});
    this.onStateChange = options.onStateChange || (() => {});
    this.onError = options.onError || (() => {});

    // State Machine: 'DISCONNECTED' | 'DISCOVERING' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'ERROR'
    this.state = 'DISCONNECTED';
    this.isPolling = false;
    this.pollTimer = null;
    this.activeController = null;
    this.retryCount = 0;
    this.lastSuccessfulReading = null;
    this.lastSuccessfulResponseTime = null;
    this.deviceInfo = null;
    this._lastCommandTime = 0;

    // Properly normalize baseUrl (accepts '192.168.4.1', 'http://192.168.4.1', etc.)
    this.setBaseUrl(options.baseUrl || '192.168.4.1');
  }

  setBaseUrl(url) {
    if (!url || typeof url !== 'string') {
      url = '192.168.4.1';
    }
    let clean = url.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'http://' + clean;
    }
    if (clean.endsWith('/')) {
      clean = clean.slice(0, -1);
    }
    this.baseUrl = clean;
  }

  _setState(newState, detail = '') {
    if (this.state !== newState) {
      this.state = newState;
      this.onStateChange(this.state, detail);
    }
  }

  _diagnoseFetchError(err, endpoint) {
    if (err && err.name === 'AbortError') {
      return `Connection timed out after ${this.timeoutMs}ms. Verify that ESP8266 is powered on, Wi-Fi is active, and server is reachable at ${this.baseUrl}.`;
    }

    const isHttps = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
    const isTargetHttp = this.baseUrl.startsWith('http://');
    if (isHttps && isTargetHttp) {
      return `Mixed Content Blocked: Browser security prevents an HTTPS page from connecting directly to an unencrypted HTTP device (${this.baseUrl}). Open this dashboard over HTTP on localhost (e.g. http://localhost:8080) or deploy an HTTP-to-HTTPS relay.`;
    }

    const isFileOrigin = typeof window !== 'undefined' && window.location && window.location.protocol === 'file:';
    if (isFileOrigin) {
      return `Local File Origin Restriction: Request from file:// to ${this.baseUrl}${endpoint} was blocked or unreachable. Ensure: 1) Your computer is on the same network subnet as the ESP8266 (if in AP mode at 192.168.4.1, connect laptop Wi-Fi to the ESP Access Point). 2) Launch a local web server (e.g., run 'npx serve' or python HTTP server) and access via http://localhost:8080.`;
    }

    const rawMsg = (err && err.message) ? err.message : 'Failed to fetch';
    return `Cannot reach ${this.baseUrl}${endpoint} (${rawMsg}). Verify device power, antenna connection, and ensure computer is on the same subnet.`;
  }

  async _fetchWithTimeout(endpoint, options = {}, timeoutMs = this.timeoutMs) {
    const controller = new AbortController();
    this.activeController = controller;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const fetchOpts = {
        method: options.method || 'GET',
        headers: {
          'Accept': 'application/json',
          ...(options.headers || {})
        },
        signal: controller.signal,
        mode: 'cors'
      };

      if (options.body) {
        fetchOpts.body = options.body;
      }

      const response = await fetch(url, fetchOpts);
      clearTimeout(timer);
      this.activeController = null;

      if (!response.ok) {
        let errDetail = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errJson = await response.json();
          if (errJson && errJson.error) errDetail = errJson.error;
        } catch (_) {}
        throw new Error(errDetail);
      }

      this.lastSuccessfulResponseTime = Date.now();
      return await response.json();
    } catch (err) {
      clearTimeout(timer);
      this.activeController = null;
      const diagnosed = this._diagnoseFetchError(err, endpoint);
      const enrichedErr = new Error(diagnosed);
      enrichedErr.originalError = err;
      throw enrichedErr;
    }
  }

  // Test connection and verify device identity
  async testConnection() {
    this._setState('CONNECTING', `Connecting to ${this.baseUrl}…`);
    try {
      // 1. Health check
      const health = await this._fetchWithTimeout('/api/health');
      if (!health || health.status !== 'ok') {
        throw new Error(`Device reported abnormal health status: ${health ? health.status : 'empty'}`);
      }

      // 2. Device info & project identity check
      const device = await this._fetchWithTimeout('/api/device');
      this.deviceInfo = device;

      if (this.expectedProjectId) {
        const expected = String(this.expectedProjectId).toLowerCase();
        let matches = false;

        if (Array.isArray(device.supportedProjects)) {
          matches = device.supportedProjects.some(p => {
            const str = String(p).toLowerCase();
            return str.includes(expected) || expected.includes(str);
          });
        } else if (device.projectId) {
          const pid = String(device.projectId).toLowerCase();
          matches = (pid === expected || pid.includes(expected) || expected.includes(pid));
        } else if (device.projects && Array.isArray(device.projects)) {
          matches = device.projects.some(p => {
            const str = String(p).toLowerCase();
            return str.includes(expected) || expected.includes(str);
          });
        } else {
          // Hub accepts connections if projects array not strictly restricted
          matches = true;
        }

        if (!matches) {
          throw new Error(`Connected device (${device.deviceId || device.deviceType || 'hub'}) does not advertise project '${this.expectedProjectId}'`);
        }
      }

      this._setState('CONNECTED', `Connected to ${device.deviceId || 'ESP8266'}`);
      return { success: true, device, health };
    } catch (err) {
      this._setState('ERROR', err.message);
      this.onError(err);
      return { success: false, error: err.message };
    }
  }

  // Send actuator, display, or configuration command
  async sendCommand(cmdObj) {
    if (this.state !== 'CONNECTED' && this.state !== 'RECONNECTING') {
      throw new Error(`Cannot send command: Device is currently ${this.state}.`);
    }

    // Rate limiting: 150ms between commands to protect ESP8266 heap & queue
    const now = Date.now();
    if (now - this._lastCommandTime < 150) {
      throw new Error('Rate limit: Please wait a moment between sending commands.');
    }
    this._lastCommandTime = now;

    const payload = {
      ...(this.expectedProjectId ? { project_id: this.expectedProjectId } : {}),
      ...cmdObj
    };

    return await this._fetchWithTimeout('/api/command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  }

  // Start polling /api/readings
  async startPolling() {
    if (this.isPolling) return;
    this.isPolling = true;
    this.retryCount = 0;

    const connectionTest = await this.testConnection();
    if (!connectionTest.success) {
      this._scheduleNextPoll(true);
      return;
    }

    this._poll();
  }

  stopPolling() {
    this.isPolling = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.activeController) {
      try { this.activeController.abort(); } catch (_) {}
      this.activeController = null;
    }
    this._setState('DISCONNECTED', 'Polling stopped by user');
  }

  async _poll() {
    if (!this.isPolling) return;

    try {
      const endpoint = this.expectedProjectId
        ? `/api/readings?project=${encodeURIComponent(this.expectedProjectId)}`
        : '/api/readings';
      const data = await this._fetchWithTimeout(endpoint);

      if (!this.isPolling) return;

      if (!data || typeof data !== 'object') {
        throw new Error('Received invalid non-JSON telemetry response');
      }

      this.lastSuccessfulReading = new Date();
      this.retryCount = 0;
      this._setState('CONNECTED', 'Streaming live telemetry');

      if (this.onData) {
        this.onData(data);
      }

      this._scheduleNextPoll(false);
    } catch (err) {
      if (!this.isPolling) return;

      this.retryCount++;
      const nextState = this.retryCount <= this.maxRetries ? 'RECONNECTING' : 'ERROR';
      this._setState(nextState, `Reading failure: ${err.message} (attempt ${this.retryCount})`);
      this.onError(err);

      this._scheduleNextPoll(true);
    }
  }

  _scheduleNextPoll(isError = false) {
    if (!this.isPolling) return;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    let delay = this.pollIntervalMs;
    if (isError) {
      // Exponential backoff capped at 8000ms
      delay = Math.min(8000, Math.max(1500, this.pollIntervalMs * Math.pow(1.5, Math.min(this.retryCount, 4))));
    }

    this.pollTimer = setTimeout(() => {
      this._poll();
    }, delay);
  }
}

// Universal Hub storage helper for Device A, Device B, and Device C
class UniversalHubManager {
  // Device A (Sensors Hub: Projects 01–12)
  static getDeviceAIp() {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('tech_iot_deviceA_ip') ||
             localStorage.getItem('tech_iot_device1_ip') || '192.168.4.1';
    }
    return '192.168.4.1';
  }

  static setDeviceAIp(ip) {
    if (typeof localStorage !== 'undefined' && ip) {
      const clean = ip.trim();
      localStorage.setItem('tech_iot_deviceA_ip', clean);
      localStorage.setItem('tech_iot_device1_ip', clean);
    }
  }

  // Device B (Automation Hub: Projects 13–24)
  static getDeviceBIp() {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('tech_iot_deviceB_ip') ||
             localStorage.getItem('tech_iot_device2_ip') || '192.168.4.2';
    }
    return '192.168.4.2';
  }

  static setDeviceBIp(ip) {
    if (typeof localStorage !== 'undefined' && ip) {
      const clean = ip.trim();
      localStorage.setItem('tech_iot_deviceB_ip', clean);
      localStorage.setItem('tech_iot_device2_ip', clean);
    }
  }

  // Device C (Smart Systems Hub: Projects 25–36)
  static getDeviceCIp() {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('tech_iot_deviceC_ip') ||
             localStorage.getItem('tech_iot_device3_ip') || '192.168.4.3';
    }
    return '192.168.4.3';
  }

  static setDeviceCIp(ip) {
    if (typeof localStorage !== 'undefined' && ip) {
      const clean = ip.trim();
      localStorage.setItem('tech_iot_deviceC_ip', clean);
      localStorage.setItem('tech_iot_device3_ip', clean);
    }
  }

  // Backward compatibility alias methods
  static getDevice1Ip() { return this.getDeviceAIp(); }
  static setDevice1Ip(ip) { this.setDeviceAIp(ip); }
  static getDevice2Ip() { return this.getDeviceBIp(); }
  static setDevice2Ip(ip) { this.setDeviceBIp(ip); }
  static getDevice3Ip() { return this.getDeviceCIp(); }
  static setDevice3Ip(ip) { this.setDeviceCIp(ip); }

  // Map any project number (1..36) to its hardware group and saved IP
  static getDeviceForProject(projectId) {
    const num = parseInt(projectId, 10);
    if (!isNaN(num)) {
      if (num >= 1 && num <= 12) {
        return { group: 'A', id: 'esp8266-sensors-hub-01', name: 'Device A — Sensors Hub', ip: this.getDeviceAIp() };
      }
      if (num >= 13 && num <= 24) {
        return { group: 'B', id: 'esp8266-automation-hub-02', name: 'Device B — Automation Hub', ip: this.getDeviceBIp() };
      }
      if (num >= 25 && num <= 36) {
        return { group: 'C', id: 'esp8266-smart-systems-hub-03', name: 'Device C — Smart Systems Hub', ip: this.getDeviceCIp() };
      }
    }
    return { group: 'A', id: 'esp8266-sensors-hub-01', name: 'Device A — Sensors Hub', ip: this.getDeviceAIp() };
  }
}

if (typeof window !== 'undefined') {
  window.ESP8266Client = ESP8266Client;
  window.UniversalHubManager = UniversalHubManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ESP8266Client, UniversalHubManager };
}
