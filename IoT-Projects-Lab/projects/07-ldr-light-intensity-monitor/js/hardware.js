/**
 * Project 03 — LDR Light Intensity Monitor Hardware Adapter
 */

class LdrHardware {
  constructor(config, onDataCallback, onStateChangeCallback, onErrorCallback) {
    this.config = config || window.LdrConfig;

    this.client = new ESP8266Client({
      expectedProjectId: this.config.projectId,
      baseUrl: this.config.defaultDeviceIp,
      pollIntervalMs: this.config.pollIntervalMs,
      timeoutMs: this.config.connectionTimeoutMs,
      onData: (raw) => this.handleData(raw),
      onStateChange: onStateChangeCallback,
      onError: onErrorCallback
    });

    this.onData = onDataCallback;
  }

  setDeviceIp(ip) { this.client.setBaseUrl(ip); }
  async testConnection() { return await this.client.testConnection(); }
  start() { this.client.startPolling(); }
  stop() { this.client.stopPolling(); }

  handleData(raw) {
    if (!raw || !raw.readings) {
      if (this.onData) {
        this.onData({
          mode: 'hardware',
          timestamp: Date.now(),
          sensorStatus: 'error',
          readings: { lightPercent: null, rawAdc: null, approxLux: null, ambientTier: 'Error' }
        });
      }
      return;
    }

    const rawAdc = raw.readings.rawAdc !== undefined ? Number(raw.readings.rawAdc) : null;
    let percent = null;
    let approxLux = null;
    let tier = 'Unknown';

    if (rawAdc !== null) {
      percent = Math.round(Utils.clamp(Utils.mapRange(rawAdc, 0, 1023, 0, 100), 0, 100) * 10) / 10;
      approxLux = Math.round(Math.pow(10, Utils.mapRange(percent, 0, 100, 0, 3.5)));

      if (percent < this.config.thresholds.darkMax) tier = 'Pitch Dark';
      else if (percent < this.config.thresholds.dimMax) tier = 'Dim / Twilight';
      else if (percent < this.config.thresholds.indoorMax) tier = 'Indoor Lighting';
      else tier = 'Bright Sunlight';
    }

    if (this.onData) {
      this.onData({
        mode: 'hardware',
        deviceId: raw.deviceId || 'ESP8266',
        timestamp: raw.timestamp ? raw.timestamp * 1000 : Date.now(),
        sensorStatus: raw.sensorStatus || 'ok',
        readings: {
          lightPercent: percent,
          rawAdc: rawAdc,
          approxLux: approxLux,
          ambientTier: tier
        }
      });
    }
  }
}

if (typeof window !== 'undefined') {
  window.LdrHardware = LdrHardware;
}
