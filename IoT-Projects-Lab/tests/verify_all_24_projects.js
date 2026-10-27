/**
 * IoT PROJECTS LAB — Comprehensive 24-Project Test & Verification Runner
 * Validates file integrity, HTML links, CSS, JavaScript syntax, simulation engines,
 * firmware structures, and registry consistency across Category A and Category B.
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

const projects = [
  // CATEGORY A — SENSORS & MONITORING (01–12)
  { id: '01', folder: '01-terrascan-x-elite', category: 'cat-a', name: 'TERRASCAN X ELITE' },
  { id: '02', folder: '02-rainwatch-ai', category: 'cat-a', name: 'RAINWATCH AI' },
  { id: '03', folder: '03-terraiq', category: 'cat-a', name: 'TerraIQ' },
  { id: '04', folder: '04-atmos-ai', category: 'cat-a', name: 'ATMOS AI' },
  { id: '05', folder: '05-smart-air-quality-monitor', category: 'cat-a', name: 'Smart Air Quality Monitor' },
  { id: '06', folder: '06-gas-leakage-detector', category: 'cat-a', name: 'Gas Leakage Detector' },
  { id: '07', folder: '07-ldr-light-intensity-monitor', category: 'cat-a', name: 'LDR Light Intensity Monitor' },
  { id: '08', folder: '08-digital-thermometer', category: 'cat-a', name: 'Digital Thermometer' },
  { id: '09', folder: '09-water-level-monitor', category: 'cat-a', name: 'Water Level Monitor' },
  { id: '10', folder: '10-water-flow-meter', category: 'cat-a', name: 'Water Flow Meter' },
  { id: '11', folder: '11-tds-water-quality-monitor', category: 'cat-a', name: 'TDS Water Quality Monitor' },
  { id: '12', folder: '12-vibration-tilt-monitor', category: 'cat-a', name: 'Vibration & Tilt Monitor' },

  // CATEGORY B — AUTOMATION & CONTROL (13–24)
  { id: '13', folder: '13-automatic-plant-watering', category: 'cat-b', name: 'Automatic Plant Watering' },
  { id: '14', folder: '14-smart-water-tank-controller', category: 'cat-b', name: 'Smart Water Tank Controller' },
  { id: '15', folder: '15-smart-street-light', category: 'cat-b', name: 'Smart Street Light' },
  { id: '16', folder: '16-wifi-home-automation', category: 'cat-b', name: 'Wi-Fi Home Automation' },
  { id: '17', folder: '17-fan-speed-controller', category: 'cat-b', name: 'Fan Speed Controller' },
  { id: '18', folder: '18-smart-exhaust-fan', category: 'cat-b', name: 'Smart Exhaust Fan' },
  { id: '19', folder: '19-automatic-door-controller', category: 'cat-b', name: 'Automatic Door Controller' },
  { id: '20', folder: '20-servo-motor-web-control', category: 'cat-b', name: 'Servo Motor Web Control' },
  { id: '21', folder: '21-dc-motor-control-panel', category: 'cat-b', name: 'DC Motor Control Panel' },
  { id: '22', folder: '22-stepper-motor-controller', category: 'cat-b', name: 'Stepper Motor Controller' },
  { id: '23', folder: '23-relay-control-dashboard', category: 'cat-b', name: 'Relay Control Dashboard' },
  { id: '24', folder: '24-smart-greenhouse-automation', category: 'cat-b', name: 'Smart Greenhouse Automation' }
];

console.log('====================================================');
console.log('IoT PROJECTS LAB — 24-PROJECT VERIFICATION SUITE');
console.log('====================================================\n');

// 1. Verify Project Switcher Registry
console.log('Checking CommonUI.projectsList in shared/js/common-ui.js:');
const commonUiPath = path.join(__dirname, '..', 'shared', 'js', 'common-ui.js');
assert('common-ui.js exists', fs.existsSync(commonUiPath));
const commonUiContent = fs.readFileSync(commonUiPath, 'utf8');

// Parse registry array
const registryMatch = commonUiContent.match(/projectsList:\s*\[([\s\S]*?)\]\s*,/);
assert('CommonUI contains projectsList array', !!registryMatch);

projects.forEach(p => {
  assert(`CommonUI registry has Project ${p.id} (${p.folder})`, commonUiContent.includes(p.folder));
});

// 2. Verify Main Dashboard Launcher
console.log('\nChecking Main Dashboard (index.html):');
const mainIndexPath = path.join(__dirname, '..', 'index.html');
assert('Main index.html exists', fs.existsSync(mainIndexPath));
const mainIndexContent = fs.readFileSync(mainIndexPath, 'utf8');
assert('Main index has DOCTYPE', mainIndexContent.includes('<!DOCTYPE html>'));
assert('Main index has Category A heading', mainIndexContent.includes('SENSORS &amp; MONITORING — 01–12') || mainIndexContent.includes('SENSORS & MONITORING'));
assert('Main index has Category B heading', mainIndexContent.includes('AUTOMATION &amp; CONTROL — 13–24') || mainIndexContent.includes('AUTOMATION & CONTROL'));

projects.forEach(p => {
  const linkStr = `projects/${p.folder}/index.html`;
  assert(`Main index links to ${linkStr}`, mainIndexContent.includes(linkStr));
});

// 3. Verify each project's directory structure, syntax, and firmware
projects.forEach(p => {
  console.log(`\nChecking [${p.folder}] (Project ${p.id} · ${p.name}):`);
  const pDir = path.join(__dirname, '..', 'projects', p.folder);
  assert(`Folder exists: ${p.folder}`, fs.existsSync(pDir));

  // index.html
  const indexPath = path.join(pDir, 'index.html');
  assert('index.html exists', fs.existsSync(indexPath));
  if (fs.existsSync(indexPath)) {
    const idxContent = fs.readFileSync(indexPath, 'utf8');
    assert('index.html has DOCTYPE', idxContent.includes('<!DOCTYPE html>'));
    assert('index.html links design-system.css', idxContent.includes('design-system.css'));
    assert('index.html links simulation.js', idxContent.includes('simulation.js'));
    assert('index.html links app.js', idxContent.includes('app.js'));
    assert(`index.html mentions Project ${p.id}`, idxContent.includes(`Project ${p.id}`));
  }

  // css/style.css
  const cssPath = path.join(pDir, 'css', 'style.css');
  assert('css/style.css exists and non-empty', fs.existsSync(cssPath) && fs.statSync(cssPath).size > 100);

  // js/simulation.js
  const simPath = path.join(pDir, 'js', 'simulation.js');
  assert('js/simulation.js exists and non-empty', fs.existsSync(simPath) && fs.statSync(simPath).size > 100);
  if (fs.existsSync(simPath)) {
    try {
      const simCode = fs.readFileSync(simPath, 'utf8');
      new vm.Script(simCode);
      assert('js/simulation.js passes JS syntax validation', true);
    } catch (e) {
      assert('js/simulation.js passes JS syntax validation', false, e.message);
    }
  }

  // js/app.js
  const appPath = path.join(pDir, 'js', 'app.js');
  assert('js/app.js exists and non-empty', fs.existsSync(appPath) && fs.statSync(appPath).size > 100);
  if (fs.existsSync(appPath)) {
    try {
      const appCode = fs.readFileSync(appPath, 'utf8');
      new vm.Script(appCode);
      assert('js/app.js passes JS syntax validation', true);
    } catch (e) {
      assert('js/app.js passes JS syntax validation', false, e.message);
    }
  }

  // firmware/*.ino
  const fwDir = path.join(pDir, 'firmware');
  assert('firmware directory exists', fs.existsSync(fwDir));
  if (fs.existsSync(fwDir)) {
    const inoFiles = fs.readdirSync(fwDir).filter(f => f.endsWith('.ino'));
    assert(`firmware/*.ino exists (${inoFiles[0] || 'none'})`, inoFiles.length > 0);
    if (inoFiles.length > 0) {
      const inoCode = fs.readFileSync(path.join(fwDir, inoFiles[0]), 'utf8');
      assert('firmware includes ESP8266WebServer', inoCode.includes('ESP8266WebServer'));
      assert('firmware formats JSON (ArduinoJson or REST JSON API)', inoCode.includes('ArduinoJson') || inoCode.includes('application/json'));
    }
  }

  // README.md
  const readmePath = path.join(pDir, 'README.md');
  assert('README.md exists and documented', fs.existsSync(readmePath) && fs.statSync(readmePath).size > 100);

  // Hardware / Wiring guide
  const wiringPath1 = path.join(pDir, 'hardware', 'wiring.md');
  const wiringPath2 = path.join(pDir, 'wiring.md');
  assert('wiring guide exists and documented', (fs.existsSync(wiringPath1) && fs.statSync(wiringPath1).size > 50) || (fs.existsSync(wiringPath2) && fs.statSync(wiringPath2).size > 50));
});

console.log('\n====================================================');
console.log(`Summary: ${passed} of ${total} tests passed (${Math.round((passed / total) * 100)}%).`);
console.log(`Failures: ${failed}`);
if (failed > 0) {
  console.log('Failed Tests:');
  failures.forEach(f => console.log(f));
}
console.log('====================================================');

process.exit(failed > 0 ? 1 : 0);
