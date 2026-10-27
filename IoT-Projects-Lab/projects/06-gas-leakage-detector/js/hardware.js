/**
 * Project 02 — Gas Leakage Detector Hardware Adapter
 */

class GasLeakageHardware {
  constructor(config, onDataCallback, onStateChangeCallback, onErrorCallback) {
    this.config = config || window.GasLeakageConfig;

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
          readings: { gasPpm: null, alarmActive: false, leakState: 'Error' }
        });
      }
      return;
    }

    const ppm = raw.readings.gasPpm !== undefined ? Number(raw.readings.gasPpm) : null;
    let state = 'Safe';
    let alarm = false;

    if (ppm !== null) {
      if (ppm >= this.config.thresholds.critical) {
        state = 'Hazardous / Alarm';
        alarm = true;
      } else if (ppm >= this.config.thresholds.safeMax) {
        state = 'Warning';
      }
    }

    if (this.onData) {
      this.onData({
        mode: 'hardware',
        deviceId: raw.deviceId || 'ESP8266',
        timestamp: raw.timestamp ? raw.timestamp * 1000 : Date.now(),
        sensorStatus: raw.sensorStatus || 'ok',
        readings: {
          gasPpm: ppm,
          alarmActive: raw.readings.alarmActive ?? alarm,
          leakState: state
        }
      });
    }
  }
}

if (typeof window !== 'undefined') {
  window.GasLeakageHardware = GasLeakageHardware;
}
