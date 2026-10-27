/**
 * Project 05 — Water Level Monitor Configuration
 */

const WaterLevelConfig = {
  projectId: 'water-level-monitor',
  projectName: 'Water Level Monitor',
  sensorType: 'HC-SR04 / JSN-SR04T Ultrasonic Sensor',

  defaultDeviceIp: 'http://192.168.4.1',
  pollIntervalMs: 1500,
  connectionTimeoutMs: 3500,

  // Tank Physical Parameters
  tank: {
    heightCm: 100.0,       // Total height of tank in cm
    sensorOffsetCm: 5.0,   // Distance from sensor face to tank 100% full line
    capacityLiters: 500.0, // Full tank volume in Litres
    warningLowPct: 20.0,   // Low water warning (< 20%)
    warningHighPct: 90.0   // Overflow warning (> 90%)
  },

  chartMaxPoints: 50
};

if (typeof window !== 'undefined') {
  window.WaterLevelConfig = WaterLevelConfig;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WaterLevelConfig;
}
