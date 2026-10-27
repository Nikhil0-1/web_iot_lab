/**
 * Project 01 — Smart Air Quality Monitor Hardware Adapter
 */

class AirQualityHardware {
  constructor(config, onDataCallback, onStateChangeCallback, onErrorCallback) {
    this.config = config || window.AirQualityConfig;

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

  start() { this.client.startPolling(); }
  stop() { this.client.stopPolling(); }

  handleData(raw) {
    if (!raw || !raw.readings) {
      if (this.onData) {
        this.onData({
          mode: 'hardware',
          timestamp: Date.now(),
          sensorStatus: 'error',
          errorMessage: 'Malformed payload from ESP8266',
          readings: { rawAdc: null, airQualityIndex: null, airTier: 'Error' }
        });
      }
      return;
    }

    const rawAdc = raw.readings.rawAdc !== undefined ? Number(raw.readings.rawAdc) : null;
    let aqi = null;
    let tier = 'Unknown';

    if (rawAdc !== null) {
      // Calculate relative air index from ADC
      const baseline = this.config.adc.cleanAirBaseline;
      aqi = Math.max(0, Math.round((rawAdc - baseline) / 2.3));

      if (aqi > this.config.thresholds.unhealthyMax) tier = 'Hazardous';
      else if (aqi > this.config.thresholds.moderateMax) tier = 'Unhealthy';
      else if (aqi > this.config.thresholds.goodMax) tier = 'Moderate';
      else tier = 'Good';
    }

    if (this.onData) {
      this.onData({
        mode: 'hardware',
        deviceId: raw.deviceId || 'ESP8266',
        timestamp: raw.timestamp ? raw.timestamp * 1000 : Date.now(),
        sensorStatus: raw.sensorStatus || 'ok',
        readings: {
          rawAdc: rawAdc,
          airQualityIndex: aqi,
          airTier: tier,
          warmupComplete: raw.readings.warmupComplete ?? true
        }
      });
    }
  }
}

if (typeof window !== 'undefined') {
  window.AirQualityHardware = AirQualityHardware;
}
