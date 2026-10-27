const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, 'IoT-Projects-Lab');

const directories = [
  'assets/icons',
  'assets/images',
  'shared/css',
  'shared/js',
  'tests'
];

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

const subdirs = ['css', 'js', 'config', 'firmware', 'hardware', 'tests'];

// Create base and core directories
for (const dir of directories) {
  fs.mkdirSync(path.join(baseDir, dir), { recursive: true });
}

// Create project directories
for (const p of projects) {
  for (const s of subdirs) {
    fs.mkdirSync(path.join(baseDir, 'projects', p, s), { recursive: true });
  }
}

console.log('Successfully created all directories for IoT-Projects-Lab');
