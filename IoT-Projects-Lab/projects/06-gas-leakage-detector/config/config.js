/**
 * Project 02 — Gas Leakage Detector Configuration
 */

const GasLeakageConfig = {
  projectId: 'gas-leakage-detector',
  projectName: 'Gas Leakage Detector',
  sensorType: 'MQ-2 / MQ-5 Combustible Gas Sensor',

  defaultDeviceIp: 'http://192.168.4.1',
  pollIntervalMs: 1500,
  connectionTimeoutMs: 3500,

  // Thresholds in estimated PPM
  thresholds: {
    safeMax: 200,      // Ambient background
    warningMax: 500,   // Low-level leak warning
    critical: 800      // Severe leak / Alarm triggered
  },

  chartMaxPoints: 50
};

if (typeof window !== 'undefined') {
  window.GasLeakageConfig = GasLeakageConfig;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GasLeakageConfig;
}
