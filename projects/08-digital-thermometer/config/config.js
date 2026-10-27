/**
 * Project 04 — Digital Thermometer Configuration
 */

const ThermometerConfig = {
  projectId: 'digital-thermometer',
  projectName: 'Digital Thermometer',
  sensorType: 'DS18B20 OneWire',

  // Default network configuration
  defaultDeviceIp: 'http://192.168.4.1',
  pollIntervalMs: 1500,
  connectionTimeoutMs: 3500,

  // Thresholds & Limits
  thresholds: {
    criticalLow: 0.0,    // Freezing point warning
    warningLow: 15.0,    // Cold
    optimalMin: 18.0,    // Room comfortable min
    optimalMax: 26.0,    // Room comfortable max
    warningHigh: 32.0,   // Warm warning
    criticalHigh: 40.0   // Overheat danger
  },

  // Display options
  defaultUnit: 'C', // 'C' or 'F'
  chartMaxPoints: 50,

  // Simulation parameters
  sim: {
    defaultTemp: 24.5,
    minTemp: -10.0,
    maxTemp: 60.0,
    thermalInertia: 0.08,
    ambientDrift: 0.05
  }
};

if (typeof window !== 'undefined') {
  window.ThermometerConfig = ThermometerConfig;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThermometerConfig;
}
