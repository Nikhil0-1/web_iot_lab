/**
 * IoT Projects Lab — Verification & Integrity Test Suite for Category B (Projects 13–24)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const baseDir = path.resolve(__dirname, '..');
const projects = [
  '13-automatic-plant-watering',
  '14-smart-water-tank-controller',
  '15-smart-street-light',
  '16-wifi-home-automation',
  '17-fan-speed-controller',
  '18-smart-exhaust-fan',
  '19-automatic-door-controller',
  '20-servo-motor-web-control',
  '21-dc-motor-control-panel',
  '22-stepper-motor-controller',
  '23-relay-control-dashboard',
  '24-smart-greenhouse-automation'
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('====================================================');
console.log('IoT Projects Lab — Category B Comprehensive Test Run');
console.log('====================================================\n');

// 1. Project Files Integrity
projects.forEach((proj) => {
  console.log(`Checking [${proj}]:`);
  const pDir = path.join(baseDir, 'projects', proj);

  // HTML
  const htmlPath = path.join(pDir, 'index.html');
  assert(fs.existsSync(htmlPath), `index.html exists`);
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    assert(html.includes('<!DOCTYPE html>'), `index.html has DOCTYPE`);
    assert(html.includes('shared/css/design-system.css'), `index.html links design-system.css`);
    assert(html.includes('shared/js/networking.js'), `index.html links networking.js`);
    assert(html.includes('js/simulation.js'), `index.html links simulation.js`);
    assert(html.includes('js/app.js'), `index.html links app.js`);
  }

  // CSS
  const cssPath = path.join(pDir, 'css', 'style.css');
  assert(fs.existsSync(cssPath) && fs.statSync(cssPath).size > 100, `css/style.css exists and non-empty`);

  // Simulation JS
  const simPath = path.join(pDir, 'js', 'simulation.js');
  assert(fs.existsSync(simPath) && fs.statSync(simPath).size > 100, `js/simulation.js exists and non-empty`);
  if (fs.existsSync(simPath)) {
    try {
      const code = fs.readFileSync(simPath, 'utf8');
      new vm.Script(code);
      assert(true, `js/simulation.js passes JS syntax validation`);
    } catch (e) {
      assert(false, `js/simulation.js syntax error: ${e.message}`);
    }
  }

  // App JS
  const appPath = path.join(pDir, 'js', 'app.js');
  assert(fs.existsSync(appPath) && fs.statSync(appPath).size > 100, `js/app.js exists and non-empty`);
  if (fs.existsSync(appPath)) {
    try {
      const code = fs.readFileSync(appPath, 'utf8');
      new vm.Script(code);
      assert(true, `js/app.js passes JS syntax validation`);
    } catch (e) {
      assert(false, `js/app.js syntax error: ${e.message}`);
    }
  }

  // Firmware
  const fwDir = path.join(pDir, 'firmware');
  const inoFiles = fs.existsSync(fwDir) ? fs.readdirSync(fwDir).filter(f => f.endsWith('.ino')) : [];
  assert(inoFiles.length > 0, `firmware/*.ino exists (${inoFiles[0] || 'none'})`);
  if (inoFiles.length > 0) {
    const inoContent = fs.readFileSync(path.join(fwDir, inoFiles[0]), 'utf8');
    assert(inoContent.includes('ESP8266WebServer'), `firmware includes ESP8266WebServer`);
    assert(inoContent.includes('ArduinoJson'), `firmware includes ArduinoJson`);
  }

  // Documentation
  const readmePath = path.join(pDir, 'README.md');
  const wiringPath = path.join(pDir, 'wiring.md');
  assert(fs.existsSync(readmePath) && fs.statSync(readmePath).size > 100, `README.md exists and documented`);
  assert(fs.existsSync(wiringPath) && fs.statSync(wiringPath).size > 100, `wiring.md exists and documented`);

  console.log('');
});

// 2. Global Docs Integrity
console.log('Checking Global Documentation:');
['docs/hardware-guide.md', 'docs/api-reference.md', 'docs/safety.md'].forEach(doc => {
  const docPath = path.join(baseDir, doc);
  assert(fs.existsSync(docPath) && fs.statSync(docPath).size > 100, `${doc} exists and documented`);
});

// 3. Launcher Links Integrity
console.log('\nChecking Main Launcher (index.html) Links:');
const mainIndex = fs.readFileSync(path.join(baseDir, 'index.html'), 'utf8');
projects.forEach(proj => {
  const link = `projects/${proj}/index.html`;
  assert(mainIndex.includes(link), `Main launcher links to ${link}`);
  assert(fs.existsSync(path.join(baseDir, link)), `Target file ${link} exists on disk`);
});

console.log('\n====================================================');
console.log(`Summary: ${passedTests} of ${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%).`);
console.log(`Failures: ${failedTests}`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
}
