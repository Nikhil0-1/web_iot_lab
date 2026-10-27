/**
 * Project 07 — TDS Water Quality Monitor Hardware Adapter
 */

class TdsHardware {
  constructor(config, onDataCallback, onStateChangeCallback, onErrorCallback) {
    this.config = config || window.TdsConfig;

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
          readings: { tdsPpm: null, voltage: null, rawAdc: null, waterTier: 'Error' }
        });
      }
      return;
    }

    const ppm = raw.readings.tdsPpm !== undefined ? Number(raw.readings.tdsPpm) : null;
    let tier = 'Unknown';

    if (ppm !== null) {
      if (ppm > this.config.thresholds.hardMax) tier = 'Poor / Non-potable';
      else if (ppm > this.config.thresholds.drinkingMax) tier = 'Hard / High Mineral';
      else if (ppm > this.config.thresholds.pureMax) tier = 'Clean Drinking Water';
      else tier = 'Pure RO Water';
    }

    if (this.onData) {
      this.onData({
        mode: 'hardware',
        deviceId: raw.deviceId || 'ESP8266',
        timestamp: raw.timestamp ? raw.timestamp * 1000 : Date.now(),
        sensorStatus: raw.sensorStatus || 'ok',
        readings: {
          tdsPpm: ppm,
          voltage: raw.readings.voltage ?? null,
          rawAdc: raw.readings.rawAdc ?? null,
          waterTier: tier
        }
      });
    }
  }
}

if (typeof window !== 'undefined') {
  window.TdsHardware = TdsHardware;
}
