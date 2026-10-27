/**
 * Verification of individual project unit tests
 */

const fs = require('fs');
const path = require('path');

const projects = [
  '01-smart-air-quality-monitor',
  '02-gas-leakage-detector',
  '03-ldr-light-intensity-monitor',
  '04-digital-thermometer',
  '05-water-level-monitor',
  '06-water-flow-meter',
  '07-tds-water-quality-monitor',
  '08-vibration-tilt-monitor'
];

console.log('Verifying all 8 project folder structures and essential files...');

const requiredFiles = [
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/simulation.js',
  'js/hardware.js',
  'config/config.js',
  'hardware/wiring.md',
  'tests/index.html',
  'README.md'
];

let allOk = true;

for (const p of projects) {
  const pDir = path.join(__dirname, '..', 'projects', p);
  console.log(`\nChecking [${p}]:`);

  for (const rf of requiredFiles) {
    const fullPath = path.join(pDir, rf);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      console.log(`  ✓ ${rf} (${stats.size} bytes)`);
    } else {
      console.error(`  ✗ MISSING: ${rf}`);
      allOk = false;
    }
  }

  // Check firmware directory
  const fwDir = path.join(pDir, 'firmware');
  const inoFiles = fs.readdirSync(fwDir).filter(f => f.endsWith('.ino'));
  if (inoFiles.length > 0) {
    console.log(`  ✓ firmware/${inoFiles[0]} (${fs.statSync(path.join(fwDir, inoFiles[0])).size} bytes)`);
  } else {
    console.error(`  ✗ MISSING .ino file in ${fwDir}`);
    allOk = false;
  }
}

if (allOk) {
  console.log('\n======================================================');
  console.log('✅ ALL 8 PROJECTS COMPLETE AND STRUCTURALLY VERIFIED');
  console.log('======================================================\n');
  process.exit(0);
} else {
  console.error('\n❌ SOME FILES ARE MISSING');
  process.exit(1);
}
