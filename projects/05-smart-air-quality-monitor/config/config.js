/**
 * Project 01 — Smart Air Quality Monitor Configuration
 */

const AirQualityConfig = {
  projectId: 'smart-air-quality-monitor',
  projectName: 'Smart Air Quality Monitor',
  sensorType: 'MQ-135 Gas & Air Quality Sensor',

  defaultDeviceIp: 'http://192.168.4.1',
  pollIntervalMs: 1500,
  connectionTimeoutMs: 3500,

  // Air Quality Thresholds (Estimated Index / Relative Scale)
  thresholds: {
    goodMax: 50,         // Clean fresh air
    moderateMax: 100,    // Normal indoor air
    unhealthyMax: 200,   // Stale / elevated CO2 & VOCs
    hazardous: 300       // Dangerous / vent required
  },

  // Raw ADC thresholds (NodeMCU A0 is 0-1023 for 0-3.3V)
  adc: {
    cleanAirBaseline: 120,
    maxAdc: 1023
  },

  warmupTimeSeconds: 20, // Preheating status timer for MQ-135 heater
  chartMaxPoints: 50
};

if (typeof window !== 'undefined') {
  window.AirQualityConfig = AirQualityConfig;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AirQualityConfig;
}
