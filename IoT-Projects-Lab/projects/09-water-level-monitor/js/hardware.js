/**
 * Project 05 — Water Level Monitor Hardware Adapter
 */

class WaterLevelHardware {
  constructor(config, onDataCallback, onStateChangeCallback, onErrorCallback) {
    this.config = config || window.WaterLevelConfig;

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
          readings: { distanceCm: null, waterDepthCm: null, fillPercent: null, liters: null, levelStatus: 'Error' }
        });
      }
      return;
    }

    const dist = raw.readings.distanceCm !== undefined ? Number(raw.readings.distanceCm) : null;
    let depth = null;
    let percent = null;
    let liters = null;
    let status = 'Unknown';

    if (dist !== null && dist > 0 && dist < 400) {
      const tankH = this.config.tank.heightCm;
      depth = Math.max(0, tankH - dist);
      percent = Utils.clamp(Math.round((depth / tankH) * 100 * 10) / 10, 0, 100);
      liters = Math.round((percent / 100) * this.config.tank.capacityLiters * 10) / 10;

      if (percent >= this.config.tank.warningHighPct) status = 'High / Overflow Risk';
      else if (percent <= this.config.tank.warningLowPct) status = 'Low Water Warning';
      else status = 'Normal';
    }

    if (this.onData) {
      this.onData({
        mode: 'hardware',
        deviceId: raw.deviceId || 'ESP8266',
        timestamp: raw.timestamp ? raw.timestamp * 1000 : Date.now(),
        sensorStatus: (dist !== null && dist < 400) ? 'ok' : 'fault',
        readings: {
          distanceCm: dist,
          waterDepthCm: depth,
          fillPercent: percent,
          liters: liters,
          levelStatus: status
        }
      });
    }
  }
}

if (typeof window !== 'undefined') {
  window.WaterLevelHardware = WaterLevelHardware;
}
