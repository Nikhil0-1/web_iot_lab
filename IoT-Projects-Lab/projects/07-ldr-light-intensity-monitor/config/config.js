/**
 * Project 03 — LDR Light Intensity Monitor Configuration
 */

const LdrConfig = {
  projectId: 'ldr-light-intensity-monitor',
  projectName: 'LDR Light Intensity Monitor',
  sensorType: 'Photoresistor (LDR) & 10kΩ Divider',

  defaultDeviceIp: 'http://192.168.4.1',
  pollIntervalMs: 1500,
  connectionTimeoutMs: 3500,

  // Ambient tiers
  thresholds: {
    darkMax: 15,       // % Light (<15% is Night/Dark)
    dimMax: 40,        // Twilight / Dim
    indoorMax: 75      // Normal Office / Room
    // >75% is Bright Sunlight
  },

  chartMaxPoints: 50
};

if (typeof window !== 'undefined') {
  window.LdrConfig = LdrConfig;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LdrConfig;
}
