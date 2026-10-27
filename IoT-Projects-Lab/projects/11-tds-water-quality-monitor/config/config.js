/**
 * Project 07 — TDS Water Quality Monitor Configuration
 */

const TdsConfig = {
  projectId: 'tds-water-quality-monitor',
  projectName: 'TDS Water Quality Monitor',
  sensorType: 'Analog TDS Sensor & Titanium Probe',

  defaultDeviceIp: 'http://192.168.4.1',
  pollIntervalMs: 1500,
  connectionTimeoutMs: 3500,

  // Calibration coefficients (Vref = 3.3V)
  vRef: 3.3,
  tempCompensationFactor: 1.0, // at 25°C baseline

  // Water Quality Tiers in PPM
  thresholds: {
    pureMax: 50,         // RO / Distilled / Pure
    drinkingMax: 300,    // Acceptable Drinking / Tap water
    hardMax: 600         // Hard / Mineralized water
    // >600 is Poor / Contaminated / Non-potable
  },

  chartMaxPoints: 50
};

if (typeof window !== 'undefined') {
  window.TdsConfig = TdsConfig;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TdsConfig;
}
