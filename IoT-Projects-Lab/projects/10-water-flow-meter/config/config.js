/**
 * Project 06 — Water Flow Meter Configuration
 */

const WaterFlowConfig = {
  projectId: 'water-flow-meter',
  projectName: 'Water Flow Meter',
  sensorType: 'YF-S201 Hall-Effect Flow Sensor',

  defaultDeviceIp: 'http://192.168.4.1',
  pollIntervalMs: 1500,
  connectionTimeoutMs: 3500,

  // YF-S201 Specs: Pulse frequency (Hz) = 7.5 * Flow rate (L/min)
  calibrationFactor: 7.5,

  // Thresholds (L/min)
  thresholds: {
    zeroFlowMax: 0.1,    // Stagnant / Stopped
    lowFlowMax: 4.0,     // Gentle faucet / Drip
    nominalFlowMax: 15.0 // Normal shower / tap
    // >15.0 L/min is High Flow
  },

  chartMaxPoints: 50
};

if (typeof window !== 'undefined') {
  window.WaterFlowConfig = WaterFlowConfig;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WaterFlowConfig;
}
