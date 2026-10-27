/**
 * Project 04 — Digital Thermometer Hardware Adapter
 */

class ThermometerHardware {
  constructor(config, onDataCallback, onStateChangeCallback, onErrorCallback) {
    this.config = config || window.ThermometerConfig;

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

  setDeviceIp(ip) {
    this.client.setBaseUrl(ip);
  }

  async testConnection() {
    return await this.client.testConnection();
  }

  start() {
    this.client.startPolling();
  }

  stop() {
    this.client.stopPolling();
  }

  handleData(raw) {
    if (!raw || !raw.readings) {
      if (this.onData) {
        this.onData({
          mode: 'hardware',
          timestamp: Date.now(),
          sensorStatus: 'error',
          errorMessage: 'Malformed payload from ESP8266',
          readings: { temperatureC: null, temperatureF: null }
        });
      }
      return;
    }

    const tempC = raw.readings.temperatureC !== undefined ? Number(raw.readings.temperatureC) : null;
    const tempF = tempC !== null ? Math.round(((tempC * 9/5) + 32) * 10) / 10 : null;

    if (this.onData) {
      this.onData({
        mode: 'hardware',
        deviceId: raw.deviceId || 'ESP8266',
        timestamp: raw.timestamp ? raw.timestamp * 1000 : Date.now(),
        sensorStatus: raw.sensorStatus || 'ok',
        readings: {
          temperatureC: tempC,
          temperatureF: tempF
        }
      });
    }
  }
}

if (typeof window !== 'undefined') {
  window.ThermometerHardware = ThermometerHardware;
}
