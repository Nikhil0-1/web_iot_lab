/**
 * Tech IoT Warriors — ESP8266 REST API Networking Client
 * Robust polling client with timeout, exponential backoff, identity verification, and error recovery.
 */

class ESP8266Client {
  constructor(options = {}) {
    this.expectedProjectId = options.expectedProjectId || '';
    this.baseUrl = options.baseUrl || 'http://192.168.4.1';
    this.pollIntervalMs = options.pollIntervalMs || 1500;
    this.timeoutMs = options.timeoutMs || 3500;
    this.maxRetries = options.maxRetries || 3;

    this.onData = options.onData || (() => {});
    this.onStateChange = options.onStateChange || (() => {});
    this.onError = options.onError || (() => {});

    // State
    this.state = 'DISCONNECTED'; // 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'
    this.isPolling = false;
    this.pollTimer = null;
    this.retryCount = 0;
    this.lastSuccessfulReading = null;
    this.deviceInfo = null;
  }

  setBaseUrl(url) {
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

  async _fetchWithTimeout(endpoint, timeoutMs = this.timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
        mode: 'cors'
      });
      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error(`Connection timed out after ${timeoutMs}ms`);
      }
      throw err;
    }
  }

  // Test connection and verify device identity
  async testConnection() {
    this._setState('CONNECTING', 'Testing connection to ' + this.baseUrl);
    try {
      // 1. Health check
      const health = await this._fetchWithTimeout('/api/health');
      if (health.status !== 'ok') {
        throw new Error(`Device reported abnormal status: ${health.status}`);
      }

      // 2. Device info & project identity check
      const device = await this._fetchWithTimeout('/api/device');
      this.deviceInfo = device;

      if (this.expectedProjectId) {
        if (Array.isArray(device.supportedProjects)) {
          const supports = device.supportedProjects.some(p => p.includes(this.expectedProjectId) || this.expectedProjectId.includes(p));
          if (!supports) {
            throw new Error(`Connected hub (${device.deviceType || 'unknown'}) does not support project '${this.expectedProjectId}'`);
          }
        } else if (device.projectId && device.projectId !== this.expectedProjectId) {
          throw new Error(`Project mismatch! Expected '${this.expectedProjectId}', but device is running '${device.projectId}'`);
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

  // Send actuator or configuration command
  async sendCommand(cmdObj) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}/api/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(cmdObj),
        signal: controller.signal,
        mode: 'cors'
      });
      clearTimeout(timer);
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error(`Command timed out after ${this.timeoutMs}ms`);
      }
      throw err;
    }
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
    this._setState('DISCONNECTED', 'Polling stopped by user');
  }

  async _poll() {
    if (!this.isPolling) return;

    try {
      const endpoint = this.expectedProjectId
        ? `/api/readings?project=${encodeURIComponent(this.expectedProjectId)}`
        : '/api/readings';
      const data = await this._fetchWithTimeout(endpoint);

      // Validation
      if (!data || typeof data !== 'object') {
        throw new Error('Received invalid non-JSON reading response');
      }

      this.lastSuccessfulReading = new Date();
      this.retryCount = 0;
      this._setState('CONNECTED');

      if (this.onData) {
        this.onData(data);
      }

      this._scheduleNextPoll(false);
    } catch (err) {
      this.retryCount++;
      this._setState('ERROR', `Reading error: ${err.message} (attempt ${this.retryCount})`);
      this.onError(err);

      this._scheduleNextPoll(true);
    }
  }

  _scheduleNextPoll(isError = false) {
    if (!this.isPolling) return;
    let delay = this.pollIntervalMs;
    if (isError) {
      delay = Math.min(10000, this.pollIntervalMs * Math.pow(1.5, Math.min(this.retryCount, 5)));
    }

    this.pollTimer = setTimeout(() => {
      this._poll();
    }, delay);
  }
}

// Universal Hub storage helper for Device 1 & Device 2
class UniversalHubManager {
  static getDevice1Ip() {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('tech_iot_device1_ip') || '192.168.4.1';
    }
    return '192.168.4.1';
  }

  static setDevice1Ip(ip) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tech_iot_device1_ip', ip.trim());
    }
  }

  static getDevice2Ip() {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('tech_iot_device2_ip') || '192.168.4.2';
    }
    return '192.168.4.2';
  }

  static setDevice2Ip(ip) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tech_iot_device2_ip', ip.trim());
    }
  }
}

if (typeof window !== 'undefined') {
  window.ESP8266Client = ESP8266Client;
  window.UniversalHubManager = UniversalHubManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ESP8266Client, UniversalHubManager };
}
