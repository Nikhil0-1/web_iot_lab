/**
 * Project 08 — Vibration & Tilt Monitor Configuration
 */

const VibrationTiltConfig = {
  projectId: 'vibration-tilt-monitor',
  projectName: 'Vibration & Tilt Monitor',
  sensorType: 'MPU6050 6-Axis IMU (I2C)',

  defaultDeviceIp: 'http://192.168.4.1',
  pollIntervalMs: 1500,
  connectionTimeoutMs: 3500,

  // Thresholds for motion activity
  thresholds: {
    vibrationThresholdG: 1.25, // Above 1.25g is active vibration
    shockThresholdG: 2.5,     // Above 2.5g is high shock/impact
    tiltWarningDeg: 35.0      // Excessive tilt warning
  },

  chartMaxPoints: 50
};

if (typeof window !== 'undefined') {
  window.VibrationTiltConfig = VibrationTiltConfig;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VibrationTiltConfig;
}
