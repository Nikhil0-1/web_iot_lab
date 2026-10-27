/**
 * Project 06 — Water Flow Meter Hardware Adapter
 */

class WaterFlowHardware {
  constructor(config, onDataCallback, onStateChangeCallback, onErrorCallback) {
    this.config = config || window.WaterFlowConfig;

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
          readings: { flowRateLpm: null, totalLiters: null, pulseCount: null, flowState: 'Error' }
        });
      }
      return;
    }

    const lpm = raw.readings.flowRateLpm !== undefined ? Number(raw.readings.flowRateLpm) : null;
    let state = 'Unknown';

    if (lpm !== null) {
      if (lpm <= this.config.thresholds.zeroFlowMax) state = 'No Flow (Stopped)';
      else if (lpm <= this.config.thresholds.lowFlowMax) state = 'Low Flow Rate';
      else if (lpm > this.config.thresholds.nominalFlowMax) state = 'High Flow Rate';
      else state = 'Nominal Flow';
    }

    if (this.onData) {
      this.onData({
        mode: 'hardware',
        deviceId: raw.deviceId || 'ESP8266',
        timestamp: raw.timestamp ? raw.timestamp * 1000 : Date.now(),
        sensorStatus: raw.sensorStatus || 'ok',
        readings: {
          flowRateLpm: lpm,
          totalLiters: raw.readings.totalLiters !== undefined ? Number(raw.readings.totalLiters) : 0,
          pulseCount: raw.readings.pulseCount !== undefined ? Number(raw.readings.pulseCount) : 0,
          flowState: state
        }
      });
    }
  }
}

if (typeof window !== 'undefined') {
  window.WaterFlowHardware = WaterFlowHardware;
}
