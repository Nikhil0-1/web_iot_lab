/**
 * Project 08 — Vibration & Tilt Monitor Hardware Adapter
 */

class VibrationTiltHardware {
  constructor(config, onDataCallback, onStateChangeCallback, onErrorCallback) {
    this.config = config || window.VibrationTiltConfig;

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
          readings: { pitchDeg: null, rollDeg: null, totalG: null, motionState: 'Error' }
        });
      }
      return;
    }

    const p = raw.readings.pitchDeg !== undefined ? Number(raw.readings.pitchDeg) : null;
    const r = raw.readings.rollDeg !== undefined ? Number(raw.readings.rollDeg) : null;
    const g = raw.readings.totalG !== undefined ? Number(raw.readings.totalG) : 1.0;
    let state = 'Unknown';

    if (p !== null && r !== null) {
      if (g >= this.config.thresholds.shockThresholdG) state = 'Shock / Impact';
      else if (g >= this.config.thresholds.vibrationThresholdG) state = 'Active Vibration';
      else if (Math.abs(p) > this.config.thresholds.tiltWarningDeg || Math.abs(r) > this.config.thresholds.tiltWarningDeg) state = 'Excessive Tilt';
      else if (Math.abs(p) > 5.0 || Math.abs(r) > 5.0) state = 'Inclined';
      else state = 'Stationary';
    }

    if (this.onData) {
      this.onData({
        mode: 'hardware',
        deviceId: raw.deviceId || 'ESP8266',
        timestamp: raw.timestamp ? raw.timestamp * 1000 : Date.now(),
        sensorStatus: raw.sensorStatus || 'ok',
        readings: {
          pitchDeg: p,
          rollDeg: r,
          totalG: g,
          accelX: raw.readings.accelX ?? 0,
          accelY: raw.readings.accelY ?? 0,
          accelZ: raw.readings.accelZ ?? 1,
          motionState: state
        }
      });
    }
  }
}

if (typeof window !== 'undefined') {
  window.VibrationTiltHardware = VibrationTiltHardware;
}
