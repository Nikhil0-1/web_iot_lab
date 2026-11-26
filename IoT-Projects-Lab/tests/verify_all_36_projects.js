/**
 * IoT PROJECTS LAB — Complete 36-Project & Hardware Architecture Verification Suite
 * Validates file integrity, HTML links, CSS, JavaScript syntax, simulation engines,
 * firmware structures, HardwareConfig SSoT, and ESP8266 REST networking across all 36 projects.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let total = 0;
let passed = 0;
let failed = 0;
const failures = [];

function assert(desc, condition, detail = '') {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${desc}`);
  } else {
    failed++;
    const msg = `  ✗ FAIL: ${desc} ${detail ? '(' + detail + ')' : ''}`;
    console.error(msg);
    failures.push(msg);
  }
}

const all36Projects = [
  // CATEGORY A — SENSORS & MONITORING (01–12)
  { id: '01', folder: '01-terrascan-x-elite', category: 'cat-a', group: 'A', name: 'TERRASCAN X ELITE' },
  { id: '02', folder: '02-rainwatch-ai', category: 'cat-a', group: 'A', name: 'RAINWATCH AI' },
  { id: '03', folder: '03-terraiq', category: 'cat-a', group: 'A', name: 'TerraIQ' },
  { id: '04', folder: '04-atmos-ai', category: 'cat-a', group: 'A', name: 'ATMOS AI' },
  { id: '05', folder: '05-smart-air-quality-monitor', category: 'cat-a', group: 'A', name: 'Smart Air Quality Monitor' },
  { id: '06', folder: '06-gas-leakage-detector', category: 'cat-a', group: 'A', name: 'Gas Leakage Detector' },
  { id: '07', folder: '07-ldr-light-intensity-monitor', category: 'cat-a', group: 'A', name: 'LDR Light Intensity Monitor' },
  { id: '08', folder: '08-digital-thermometer', category: 'cat-a', group: 'A', name: 'Digital Thermometer' },
  { id: '09', folder: '09-water-level-monitor', category: 'cat-a', group: 'A', name: 'Water Level Monitor' },
  { id: '10', folder: '10-water-flow-meter', category: 'cat-a', group: 'A', name: 'Water Flow Meter' },
  { id: '11', folder: '11-tds-water-quality-monitor', category: 'cat-a', group: 'A', name: 'TDS Water Quality Monitor' },
  { id: '12', folder: '12-vibration-tilt-monitor', category: 'cat-a', group: 'A', name: 'Vibration & Tilt Monitor' },

  // CATEGORY B — AUTOMATION & CONTROL (13–24)
  { id: '13', folder: '13-automatic-plant-watering', category: 'cat-b', group: 'B', name: 'Automatic Plant Watering' },
  { id: '14', folder: '14-smart-water-tank-controller', category: 'cat-b', group: 'B', name: 'Smart Water Tank Controller' },
  { id: '15', folder: '15-smart-street-light', category: 'cat-b', group: 'B', name: 'Smart Street Light' },
  { id: '16', folder: '16-wifi-home-automation', category: 'cat-b', group: 'B', name: 'Wi-Fi Home Automation' },
  { id: '17', folder: '17-fan-speed-controller', category: 'cat-b', group: 'B', name: 'Fan Speed Controller' },
  { id: '18', folder: '18-smart-exhaust-fan', category: 'cat-b', group: 'B', name: 'Smart Exhaust Fan' },
  { id: '19', folder: '19-automatic-door-controller', category: 'cat-b', group: 'B', name: 'Automatic Door Controller' },
  { id: '20', folder: '20-servo-motor-web-control', category: 'cat-b', group: 'B', name: 'Servo Motor Web Control' },
  { id: '21', folder: '21-dc-motor-control-panel', category: 'cat-b', group: 'B', name: 'DC Motor Control Panel' },
  { id: '22', folder: '22-stepper-motor-controller', category: 'cat-b', group: 'B', name: 'Stepper Motor Controller' },
  { id: '23', folder: '23-relay-control-dashboard', category: 'cat-b', group: 'B', name: 'Relay Control Dashboard' },
  { id: '24', folder: '24-smart-greenhouse-automation', category: 'cat-b', group: 'B', name: 'Smart Greenhouse Automation' },

  // CATEGORY C — SMART SYSTEMS (25–36)
  { id: '25', folder: '25-smart-parking-assistant', category: 'cat-c', group: 'C', name: 'Smart Parking Assistant' },
  { id: '26', folder: '26-rfid-attendance-system', category: 'cat-c', group: 'C', name: 'RFID Attendance System' },
  { id: '27', folder: '27-rfid-door-access', category: 'cat-c', group: 'C', name: 'RFID Door Access' },
  { id: '28', folder: '28-smart-dustbin', category: 'cat-c', group: 'C', name: 'Smart Dustbin' },
  { id: '29', folder: '29-fire-smoke-alert', category: 'cat-c', group: 'C', name: 'Fire & Smoke Alert' },
  { id: '30', folder: '30-intrusion-detection-alarm', category: 'cat-c', group: 'C', name: 'Intrusion Detection Alarm' },
  { id: '31', folder: '31-visitor-counter', category: 'cat-c', group: 'C', name: 'Visitor Counter' },
  { id: '32', folder: '32-smart-energy-meter', category: 'cat-c', group: 'C', name: 'Smart Energy Meter' },
  { id: '33', folder: '33-battery-voltage-monitor', category: 'cat-c', group: 'C', name: 'Battery Voltage Monitor' },
  { id: '34', folder: '34-solar-panel-monitor', category: 'cat-c', group: 'C', name: 'Solar Panel Monitor' },
  { id: '35', folder: '35-digital-notice-board', category: 'cat-c', group: 'C', name: 'Digital Notice Board' },
  { id: '36', folder: '36-smart-room-occupancy', category: 'cat-c', group: 'C', name: 'Smart Room Occupancy' }
];

console.log('====================================================');
console.log('IoT PROJECTS LAB — COMPLETE 36-PROJECT VERIFICATION');
console.log('====================================================\n');

// 1. Verify Project Switcher Registry in common-ui.js
console.log('--- Section 1: CommonUI Project Registry (01–36) ---');
const commonUiPath = path.join(__dirname, '..', 'shared', 'js', 'common-ui.js');
assert('common-ui.js exists', fs.existsSync(commonUiPath));
const commonUiContent = fs.readFileSync(commonUiPath, 'utf8');

all36Projects.forEach(p => {
  assert(`CommonUI registry contains Project ${p.id} (${p.folder})`, commonUiContent.includes(p.folder));
});

// 2. Verify Hardware Configuration System (hardware-config.js)
console.log('\n--- Section 2: Verified Hardware Configuration SSoT ---');
const hwConfigPath = path.join(__dirname, '..', 'shared', 'js', 'hardware-config.js');
assert('hardware-config.js exists', fs.existsSync(hwConfigPath));
const HardwareConfig = require(hwConfigPath);

assert('HardwareConfig has deviceA definition', !!HardwareConfig.devices.deviceA);
assert('HardwareConfig has deviceB definition', !!HardwareConfig.devices.deviceB);
assert('HardwareConfig has deviceC definition', !!HardwareConfig.devices.deviceC);

assert('Device A supports exactly 12 projects', HardwareConfig.devices.deviceA.supportedProjects.length === 12);
assert('Device B supports exactly 12 projects', HardwareConfig.devices.deviceB.supportedProjects.length === 12);
assert('Device C supports exactly 12 projects', HardwareConfig.devices.deviceC.supportedProjects.length === 12);

assert('Device A mapped correctly for project 1', HardwareConfig.getDeviceForProject('01').group === 'A');
assert('Device B mapped correctly for project 16', HardwareConfig.getDeviceForProject('16').group === 'B');
assert('Device C mapped correctly for project 35', HardwareConfig.getDeviceForProject('35').group === 'C');

// 3. Verify Networking Client & Hub Manager (networking.js)
console.log('\n--- Section 3: Shared Networking Client & Hub Manager ---');
const networkingPath = path.join(__dirname, '..', 'shared', 'js', 'networking.js');
assert('networking.js exists', fs.existsSync(networkingPath));
const { ESP8266Client, UniversalHubManager } = require(networkingPath);

// Test baseUrl normalization
const clientBare = new ESP8266Client({ baseUrl: '192.168.4.1' });
assert('ESP8266Client normalizes bare IP to http://', clientBare.baseUrl === 'http://192.168.4.1');

const clientSlash = new ESP8266Client({ baseUrl: 'http://192.168.4.1/' });
assert('ESP8266Client trims trailing slash', clientSlash.baseUrl === 'http://192.168.4.1');

const clientEmpty = new ESP8266Client();
assert('ESP8266Client defaults baseUrl to http://192.168.4.1', clientEmpty.baseUrl === 'http://192.168.4.1');

// Test UniversalHubManager group lookups
assert('UniversalHubManager returns Device A for project 7', UniversalHubManager.getDeviceForProject('07').group === 'A');
assert('UniversalHubManager returns Device B for project 18', UniversalHubManager.getDeviceForProject('18').group === 'B');
assert('UniversalHubManager returns Device C for project 35', UniversalHubManager.getDeviceForProject('35').group === 'C');

// Test Error Diagnostics
const abortErr = new Error('The user aborted a request');
abortErr.name = 'AbortError';
const diagTimeout = clientBare._diagnoseFetchError(abortErr, '/api/health');
assert('Error diagnostic detects timeout', diagTimeout.includes('timed out'));

// 4. Verify Main Hub Dashboard (index.html)
console.log('\n--- Section 4: Main Dashboard (index.html) ---');
const mainIndexPath = path.join(__dirname, '..', 'index.html');
assert('Main index.html exists', fs.existsSync(mainIndexPath));
const mainIndexContent = fs.readFileSync(mainIndexPath, 'utf8');

assert('Main index contains Category A heading', mainIndexContent.includes('Category A &mdash; Sensors &amp; Monitoring') || mainIndexContent.includes('heading-cat-a'));
assert('Main index contains Category B heading', mainIndexContent.includes('Category B &mdash; Automation &amp; Control') || mainIndexContent.includes('heading-cat-b'));
assert('Main index contains Category C heading', mainIndexContent.includes('Category C &mdash; Smart Systems') || mainIndexContent.includes('heading-cat-c'));

assert('Main index contains Physical Hardware Hubs section', mainIndexContent.includes('Physical Hardware Hubs'));
assert('Main index links hardware-config.js', mainIndexContent.includes('hardware-config.js'));
assert('Main index links networking.js', mainIndexContent.includes('networking.js'));

all36Projects.forEach(p => {
  assert(`Main index links to projects/${p.folder}/index.html`, mainIndexContent.includes(`projects/${p.folder}/index.html`));
});

// 5. Verify Project 35 OLED Notice Board End-to-End
console.log('\n--- Section 5: Project 35 (Digital Notice Board) OLED & API ---');
const p35Dir = path.join(__dirname, '..', 'projects', '35-digital-notice-board');
const p35FirmwarePath = path.join(p35Dir, 'firmware', 'digital_notice', 'digital_notice.ino');
assert('Project 35 firmware exists', fs.existsSync(p35FirmwarePath));
const p35FwContent = fs.readFileSync(p35FirmwarePath, 'utf8');

assert('P35 firmware includes Adafruit_SSD1306', p35FwContent.includes('Adafruit_SSD1306.h'));
assert('P35 firmware sets setTextWrap(false) to prevent overlap', p35FwContent.includes('setTextWrap(false)'));
assert('P35 firmware uses getTextBounds for accurate metrics', p35FwContent.includes('getTextBounds'));
assert('P35 firmware includes Private Network Access CORS header', p35FwContent.includes('Access-Control-Allow-Private-Network'));
assert('P35 firmware has /api/health endpoint', p35FwContent.includes('/api/health'));
assert('P35 firmware has /api/device endpoint', p35FwContent.includes('/api/device'));
assert('P35 firmware has /api/readings endpoint', p35FwContent.includes('/api/readings'));
assert('P35 firmware has /api/command endpoint', p35FwContent.includes('/api/command'));

// Test Project 35 Simulation Engine
const p35SimPath = path.join(p35Dir, 'js', 'simulation.js');
assert('Project 35 simulation.js exists', fs.existsSync(p35SimPath));
const OledSim = require(p35SimPath);

assert('OledSim initializes message', !!OledSim.message);
OledSim.fontSize = 1;
OledSim.setMessage('TEST NOTICE');
assert('OledSim sanitizes and sets message', OledSim.message === 'TEST NOTICE');
assert('OledSim calculates text bounds correctly', OledSim.textWidth === 66); // 11 chars * 6px
assert('OledSim recognizes short message fits screen', OledSim.isLongMessage === false);

OledSim.setMessage('THIS IS A VERY LONG ANNOUNCEMENT THAT MUST SCROLL ACROSS THE OLED SCREEN ACCURATELY');
assert('OledSim recognizes long message triggers marquee', OledSim.isLongMessage === true);

// 6. Verify All 36 Projects Structure & Code Validity
console.log('\n--- Section 6: All 36 Projects Directory Integrity ---');
all36Projects.forEach(p => {
  const dir = path.join(__dirname, '..', 'projects', p.folder);
  assert(`[${p.id}] Directory exists: ${p.folder}`, fs.existsSync(dir));

  const indexPath = path.join(dir, 'index.html');
  assert(`[${p.id}] index.html exists`, fs.existsSync(indexPath));

  const cssPath = path.join(dir, 'css', 'style.css');
  assert(`[${p.id}] css/style.css exists`, fs.existsSync(cssPath));

  const simPath = path.join(dir, 'js', 'simulation.js');
  if (fs.existsSync(simPath)) {
    const simCode = fs.readFileSync(simPath, 'utf8');
    let syntaxOk = true;
    try {
      new vm.Script(simCode);
    } catch (e) {
      syntaxOk = false;
    }
    assert(`[${p.id}] simulation.js syntax valid`, syntaxOk);
  }

  const appPath = path.join(dir, 'js', 'app.js');
  if (fs.existsSync(appPath)) {
    const appCode = fs.readFileSync(appPath, 'utf8');
    let syntaxOk = true;
    try {
      new vm.Script(appCode);
    } catch (e) {
      syntaxOk = false;
    }
    assert(`[${p.id}] app.js syntax valid`, syntaxOk);
  }

  const fwDir = path.join(dir, 'firmware');
  assert(`[${p.id}] firmware folder exists`, fs.existsSync(fwDir));
});

console.log('\n====================================================');
console.log(`Summary: ${passed} of ${total} tests passed (${Math.round((passed / total) * 100)}%).`);
console.log(`Failures: ${failed}`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

