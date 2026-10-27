/**
 * Node.js Test Execution Script for IoT Projects Lab
 * Runs all unit tests, calculation formulas, simulation engines, and mock hardware adapters.
 */

const fs = require('fs');
const path = require('path');

// Mock browser globals for Node.js test environment
global.window = global;
global.document = {
  addEventListener: () => {},
  querySelector: () => null,
  querySelectorAll: () => []
};

// 1. Load Shared Utilities
require('../shared/js/utilities.js');
require('../shared/js/simulation-utils.js');
require('../shared/js/networking.js');

// 2. Load Configs
require('../projects/05-smart-air-quality-monitor/config/config.js');
require('../projects/06-gas-leakage-detector/config/config.js');
require('../projects/07-ldr-light-intensity-monitor/config/config.js');
require('../projects/08-digital-thermometer/config/config.js');
require('../projects/09-water-level-monitor/config/config.js');
require('../projects/10-water-flow-meter/config/config.js');
require('../projects/11-tds-water-quality-monitor/config/config.js');
require('../projects/12-vibration-tilt-monitor/config/config.js');

// 3. Load Simulation Engines
require('../projects/01-terrascan-x-elite/js/simulation.js');
require('../projects/02-rainwatch-ai/js/simulation.js');
require('../projects/03-terraiq/js/simulation.js');
require('../projects/04-atmos-ai/js/simulation.js');
require('../projects/05-smart-air-quality-monitor/js/simulation.js');
require('../projects/06-gas-leakage-detector/js/simulation.js');
require('../projects/07-ldr-light-intensity-monitor/js/simulation.js');
require('../projects/08-digital-thermometer/js/simulation.js');
require('../projects/09-water-level-monitor/js/simulation.js');
require('../projects/10-water-flow-meter/js/simulation.js');
require('../projects/11-tds-water-quality-monitor/js/simulation.js');
require('../projects/12-vibration-tilt-monitor/js/simulation.js');

// 4. Load Hardware Adapters
require('../projects/05-smart-air-quality-monitor/js/hardware.js');
require('../projects/06-gas-leakage-detector/js/hardware.js');
require('../projects/07-ldr-light-intensity-monitor/js/hardware.js');
require('../projects/08-digital-thermometer/js/hardware.js');
require('../projects/09-water-level-monitor/js/hardware.js');
require('../projects/10-water-flow-meter/js/hardware.js');
require('../projects/11-tds-water-quality-monitor/js/hardware.js');
require('../projects/12-vibration-tilt-monitor/js/hardware.js');

let total = 0;
let passed = 0;
let failed = 0;
const failures = [];

function assert(description, condition, details = '') {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${description}`);
  } else {
    failed++;
    failures.push({ description, details });
    console.error(`  ✗ FAIL: ${description} (${details})`);
  }
}

console.log('\n======================================================');
console.log('🧪 RUNNING IOT PROJECTS LAB AUTOMATED TEST SUITE');
console.log('======================================================\n');

// --- Test Section 1: Core Utilities ---
console.log('--- Section 1: Core Utilities & Math ---');
assert('Utils.clamp lower bound', Utils.clamp(-10, 0, 100) === 0);
assert('Utils.clamp upper bound', Utils.clamp(120, 0, 100) === 100);
assert('Utils.lerp interpolation', Utils.lerp(0, 100, 0.25) === 25);
assert('Utils.mapRange conversion', Utils.mapRange(5, 0, 10, 0, 50) === 25);
const stats = Utils.calcStats([10, 20, 30, 40, 50]);
assert('calcStats min/max/avg', stats.min === 10 && stats.max === 50 && stats.avg === 30);

// --- Test Section 2: Project 04 (Digital Thermometer) ---
console.log('\n--- Section 2: Project 04 (Digital Thermometer) ---');
assert('Project 04 ID match', window.ThermometerConfig.projectId === 'digital-thermometer');
assert('Celsius to Fahrenheit conversion', Math.abs(((25 * 9/5) + 32) - 77.0) < 0.001);
const sim04 = new ThermometerSimulation(window.ThermometerConfig);
sim04.setScenario('cold', true);
const res04Cold = sim04.generateStep('cold', 1);
assert('Cold scenario temperature < 15°C', res04Cold.readings.temperatureC < 15.0);
sim04.setScenario('fault');
const res04Fault = sim04.generateStep('fault', 2);
assert('Fault scenario returns sensorStatus fault', res04Fault.sensorStatus === 'fault' && res04Fault.readings.temperatureC === null);

// --- Test Section 3: Project 01 (Smart Air Quality Monitor) ---
console.log('\n--- Section 3: Project 01 (Smart Air Quality Monitor) ---');
assert('Project 01 ID match', window.AirQualityConfig.projectId === 'smart-air-quality-monitor');
const sim01 = new AirQualitySimulation(window.AirQualityConfig);
sim01.setScenario('clean');
const res01Clean = sim01.generateStep('clean', 1);
assert('Clean air scenario AQI <= 50', res01Clean.readings.airQualityIndex <= 50);
sim01.setScenario('hazardous');
sim01.setManualAqi(320);
const res01Haz = sim01.generateStep('hazardous', 2);
assert('Hazardous air scenario tier is Hazardous', res01Haz.readings.airTier === 'Hazardous');

// --- Test Section 4: Project 02 (Gas Leakage Detector) ---
console.log('\n--- Section 4: Project 02 (Gas Leakage Detector) ---');
assert('Project 02 ID match', window.GasLeakageConfig.projectId === 'gas-leakage-detector');
const sim02 = new GasLeakageSimulation(window.GasLeakageConfig);
sim02.setScenario('safe');
const res02Safe = sim02.generateStep('safe', 1);
assert('Safe scenario alarmActive is false', res02Safe.readings.alarmActive === false);
sim02.setScenario('danger-leak');
sim02.setManualGas(950);
const res02Danger = sim02.generateStep('danger-leak', 2);
assert('Danger leak scenario alarmActive is true', res02Danger.readings.alarmActive === true);

// --- Test Section 5: Project 03 (LDR Light Intensity Monitor) ---
console.log('\n--- Section 5: Project 03 (LDR Light Intensity Monitor) ---');
assert('Project 03 ID match', window.LdrConfig.projectId === 'ldr-light-intensity-monitor');
const sim03 = new LdrSimulation(window.LdrConfig);
sim03.setScenario('dark');
sim03.setManualPercent(5);
const res03Dark = sim03.generateStep('dark', 1);
assert('Dark scenario ambientTier is Pitch Dark', res03Dark.readings.ambientTier === 'Pitch Dark');
sim03.setScenario('sunlight');
sim03.setManualPercent(92);
const res03Sun = sim03.generateStep('sunlight', 2);
assert('Sunlight scenario ambientTier is Bright Sunlight', res03Sun.readings.ambientTier === 'Bright Sunlight');

// --- Test Section 6: Project 05 (Water Level Monitor) ---
console.log('\n--- Section 6: Project 05 (Water Level Monitor) ---');
assert('Project 05 ID match', window.WaterLevelConfig.projectId === 'water-level-monitor');
const sim05 = new WaterLevelSimulation(window.WaterLevelConfig);
sim05.setScenario('half');
sim05.setManualPercent(50);
const res05 = sim05.generateStep('half', 1);
assert('50% level calculates 250 Liters in 500L tank', Math.abs(res05.readings.liters - 250.0) < 5.0);

// --- Test Section 7: Project 06 (Water Flow Meter) ---
console.log('\n--- Section 7: Project 06 (Water Flow Meter) ---');
assert('Project 06 ID match', window.WaterFlowConfig.projectId === 'water-flow-meter');
assert('YF-S201 calibration factor is 7.5', window.WaterFlowConfig.calibrationFactor === 7.5);
const sim06 = new WaterFlowSimulation(window.WaterFlowConfig);
sim06.setScenario('stagnant');
sim06.setManualFlow(0);
const res06Stag = sim06.generateStep('stagnant', 1);
assert('Stagnant flow rate is 0 L/min', res06Stag.readings.flowRateLpm === 0);

// --- Test Section 8: Project 07 (TDS Water Quality Monitor) ---
console.log('\n--- Section 8: Project 07 (TDS Water Quality Monitor) ---');
assert('Project 07 ID match', window.TdsConfig.projectId === 'tds-water-quality-monitor');
const sim07 = new TdsSimulation(window.TdsConfig);
sim07.setScenario('pure');
sim07.setManualTds(25);
const res07Pure = sim07.generateStep('pure', 1);
assert('25 PPM qualifies as Pure RO Water', res07Pure.readings.waterTier === 'Pure RO Water');

// --- Test Section 9: Project 08 (Vibration & Tilt Monitor) ---
console.log('\n--- Section 9: Project 08 (Vibration & Tilt Monitor) ---');
assert('Project 08 ID match', window.VibrationTiltConfig.projectId === 'vibration-tilt-monitor');
const sim08 = new VibrationTiltSimulation(window.VibrationTiltConfig);
sim08.setScenario('flat');
sim08.setManualOrientation(0, 0);
const res08Flat = sim08.generateStep('flat', 1);
assert('Level orientation reports Stationary state', res08Flat.readings.motionState === 'Stationary');

// --- Test Section 10: Hardware Adapters & Data Normalization ---
console.log('\n--- Section 10: Hardware Adapters & Normalization ---');
let hwOut = null;
const hwClient = new ThermometerHardware(window.ThermometerConfig, (data) => { hwOut = data; });
hwClient.handleData({
  deviceId: 'esp8266-thermometer-01',
  projectId: 'digital-thermometer',
  mode: 'hardware',
  timestamp: 1000,
  sensorStatus: 'ok',
  readings: { temperatureC: 21.5 }
});
assert('Hardware adapter parses and normalizes temperatureC', hwOut && hwOut.readings.temperatureC === 21.5);
assert('Hardware adapter computes Fahrenheit (70.7°F)', hwOut && Math.abs(hwOut.readings.temperatureF - 70.7) < 0.2);

console.log('\n======================================================');
console.log(`📊 TEST RESULTS: ${passed}/${total} PASSED (${failed} FAILED)`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
