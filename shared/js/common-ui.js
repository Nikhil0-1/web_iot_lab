/**
 * Tech IoT Warriors — Shared Common UI Components
 * Toast system, Modal dialog manager, Status updates and Mode Controls
 */

const CommonUI = {
  projectsList: [
    // CATEGORY A — SENSORS & MONITORING (01–12)
    { id: '01', name: 'TERRASCAN X ELITE', sensor: 'HC-SR04 Ultrasonic Radar', folder: '01-terrascan-x-elite', color: '#00f59b', icon: '📡' },
    { id: '02', name: 'RAINWATCH AI', sensor: 'Resistive Rain Grid & LM393', folder: '02-rainwatch-ai', color: '#38bdf8', icon: '🌧️' },
    { id: '03', name: 'TerraIQ', sensor: 'Capacitive Soil Probe v1.2', folder: '03-terraiq', color: '#10b981', icon: '🌱' },
    { id: '04', name: 'ATMOS AI', sensor: 'DHT22 Climate Sensor', folder: '04-atmos-ai', color: '#0284c7', icon: '🌤️' },
    { id: '05', name: 'Smart Air Quality Monitor', sensor: 'MQ-135 Gas Sensor', folder: '05-smart-air-quality-monitor', color: '#059669', icon: '🍃' },
    { id: '06', name: 'Gas Leakage Detector', sensor: 'MQ-2 / MQ-5 Gas Sensor', folder: '06-gas-leakage-detector', color: '#e11d48', icon: '🚨' },
    { id: '07', name: 'LDR Light Intensity Monitor', sensor: 'Photoresistor (LDR)', folder: '07-ldr-light-intensity-monitor', color: '#d97706', icon: '☀️' },
    { id: '08', name: 'Digital Thermometer', sensor: 'DS18B20 OneWire Sensor', folder: '08-digital-thermometer', color: '#ea580c', icon: '🌡️' },
    { id: '09', name: 'Water Level Monitor', sensor: 'HC-SR04 Ultrasonic', folder: '09-water-level-monitor', color: '#0284c7', icon: '💧' },
    { id: '10', name: 'Water Flow Meter', sensor: 'YF-S201 Hall Effect', folder: '10-water-flow-meter', color: '#0d9488', icon: '🌊' },
    { id: '11', name: 'TDS Water Quality Monitor', sensor: 'Analog TDS Sensor', folder: '11-tds-water-quality-monitor', color: '#0891b2', icon: '🧪' },
    { id: '12', name: 'Vibration & Tilt Monitor', sensor: 'SW-420 & MPU-6050', folder: '12-vibration-tilt-monitor', color: '#7c3aed', icon: '📐' },

    // CATEGORY B — AUTOMATION & CONTROL (13–24)
    { id: '13', name: 'Automatic Plant Watering', sensor: 'Capacitive Soil + Relay Pump', folder: '13-automatic-plant-watering', color: '#059669', icon: '🪴' },
    { id: '14', name: 'Smart Water Tank Controller', sensor: 'Ultrasonic + Dual Float Relay', folder: '14-smart-water-tank-controller', color: '#0284c7', icon: '🚰' },
    { id: '15', name: 'Smart Street Light', sensor: 'LDR + PIR Motion + PWM LED', folder: '15-smart-street-light', color: '#d97706', icon: '💡' },
    { id: '16', name: 'Wi-Fi Home Automation', sensor: '4-Channel Isolated Relay', folder: '16-wifi-home-automation', color: '#2563eb', icon: '🏠' },
    { id: '17', name: 'Fan Speed Controller', sensor: 'PWM MOSFET Driver + RPM Tach', folder: '17-fan-speed-controller', color: '#0d9488', icon: '🌀' },
    { id: '18', name: 'Smart Exhaust Fan', sensor: 'DHT22 Environmental + Relay', folder: '18-smart-exhaust-fan', color: '#0891b2', icon: '💨' },
    { id: '19', name: 'Automatic Door Controller', sensor: 'Proximity Sensor + Servo', folder: '19-automatic-door-controller', color: '#4f46e5', icon: '🚪' },
    { id: '20', name: 'Servo Motor Web Control', sensor: 'PWM Servo Micro-Actuator', folder: '20-servo-motor-web-control', color: '#7c3aed', icon: '🦾' },
    { id: '21', name: 'DC Motor Control Panel', sensor: 'H-Bridge Driver L298N', folder: '21-dc-motor-control-panel', color: '#c026d3', icon: '⚙️' },
    { id: '22', name: 'Stepper Motor Controller', sensor: 'A4988 Bipolar Driver', folder: '22-stepper-motor-controller', color: '#db2777', icon: '🎯' },
    { id: '23', name: 'Relay Control Dashboard', sensor: 'Multi-Channel Load Switching', folder: '23-relay-control-dashboard', color: '#dc2626', icon: '⚡' },
    { id: '24', name: 'Smart Greenhouse Automation', sensor: 'Quad-Sensor Multi-Actuator Hub', folder: '24-smart-greenhouse-automation', color: '#16a34a', icon: '🏡' },

    // CATEGORY C — SMART SYSTEMS (25–36)
    { id: '25', name: 'Smart Parking Assistant', sensor: 'Ultrasonic + Servo Barrier', folder: '25-smart-parking-assistant', color: '#0284c7', icon: '🅿️' },
    { id: '26', name: 'RFID Attendance System', sensor: 'MFRC522 RFID 13.56MHz', folder: '26-rfid-attendance-system', color: '#059669', icon: '🪪' },
    { id: '27', name: 'RFID Door Access', sensor: 'Keypad / RC522 + Solenoid Lock', folder: '27-rfid-door-access', color: '#4f46e5', icon: '🔐' },
    { id: '28', name: 'Smart Dustbin', sensor: 'Ultrasonic Fill + IR Proximity + Servo', folder: '28-smart-dustbin', color: '#0d9488', icon: '🗑️' },
    { id: '29', name: 'Fire & Smoke Alert', sensor: 'MQ-2 Gas/Smoke + Flame Sensor', folder: '29-fire-smoke-alert', color: '#e11d48', icon: '🔥' },
    { id: '30', name: 'Intrusion Detection Alarm', sensor: 'HC-SR501 PIR + Piezo Siren', folder: '30-intrusion-detection-alarm', color: '#ea580c', icon: '🚨' },
    { id: '31', name: 'Visitor Counter', sensor: 'Dual Break-Beam Sensors (A & B)', folder: '31-visitor-counter', color: '#7c3aed', icon: '👥' },
    { id: '32', name: 'Smart Energy Meter', sensor: 'PZEM-004T AC Power Monitor', folder: '32-smart-energy-meter', color: '#d97706', icon: '⚡' },
    { id: '33', name: 'Battery Voltage Monitor', sensor: 'Precision Voltage Divider + ADC', folder: '33-battery-voltage-monitor', color: '#16a34a', icon: '🔋' },
    { id: '34', name: 'Solar Panel Monitor', sensor: 'INA219 High-Side Power Sensor', folder: '34-solar-panel-monitor', color: '#ca8a04', icon: '☀️' },
    { id: '35', name: 'Digital Notice Board', sensor: 'SSD1306 128x64 OLED Marquee', folder: '35-digital-notice-board', color: '#06b6d4', icon: '📋' },
    { id: '36', name: 'Smart Room Occupancy', sensor: 'LD2410 mmWave Radar + Presence', folder: '36-smart-room-occupancy', color: '#8b5cf6', icon: '📡' }
  ],

  // Toast notifications
  toast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toastEl.innerHTML = `
      <div style="flex-shrink:0">${iconSvg}</div>
      <div style="flex-grow:1; line-height: 1.4;">${message}</div>
    `;

    container.appendChild(toastEl);
    requestAnimationFrame(() => {
      toastEl.classList.add('toast-visible');
    });

    setTimeout(() => {
      toastEl.classList.remove('toast-visible');
      setTimeout(() => {
        if (toastEl.parentNode) {
          toastEl.parentNode.removeChild(toastEl);
        }
      }, 300);
    }, duration);
  },

  // Modal dialog handling
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  // Project Switcher Drawer
  openSwitcher() {
    let drawer = document.getElementById('project-switcher-drawer');
    if (!drawer) {
      drawer = CommonUI.createSwitcherDrawer();
    }
    drawer.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeSwitcher() {
    const drawer = document.getElementById('project-switcher-drawer');
    if (drawer) {
      drawer.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  createSwitcherDrawer() {
    const isRoot = window.location.pathname.endsWith('index.html') && !window.location.pathname.includes('/projects/');
    const basePath = isRoot ? 'projects/' : '../';

    const drawer = document.createElement('div');
    drawer.id = 'project-switcher-drawer';
    drawer.className = 'switcher-drawer-overlay';

    const currentPath = window.location.pathname;

    let itemsHtml = CommonUI.projectsList.map(p => {
      const isCurrent = currentPath.includes(p.folder);
      const targetUrl = isRoot ? `projects/${p.folder}/index.html` : `../${p.folder}/index.html`;
      return `
        <a href="${targetUrl}" class="switcher-item ${isCurrent ? 'active' : ''}">
          <span class="switcher-icon" style="background:${p.color}15; color:${p.color};">${p.icon}</span>
          <div class="switcher-info">
            <span class="switcher-num">Project ${p.id}</span>
            <span class="switcher-title">${p.name}</span>
            <span class="switcher-sensor">${p.sensor}</span>
          </div>
          ${isCurrent ? '<span class="switcher-badge">Current</span>' : '<span class="switcher-arrow">→</span>'}
        </a>
      `;
    }).join('');

    const homeUrl = isRoot ? 'index.html' : '../../index.html';

    drawer.innerHTML = `
      <div class="switcher-backdrop"></div>
      <div class="switcher-panel">
        <div class="switcher-header">
          <div>
            <h3 style="margin:0; font-size:1.15rem; font-weight:700; color:var(--text-main);">Tech IoT Warriors</h3>
            <p style="margin:2px 0 0 0; font-size:0.8rem; color:var(--text-muted);">Quick-switch between active hardware sensors</p>
          </div>
          <button class="switcher-close-btn" id="btn-close-switcher" title="Close Switcher (Esc)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="switcher-home-link">
          <a href="${homeUrl}" class="btn btn-subtle" style="width:100%; justify-content:center; gap:8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Return to Lab Hub &amp; Launcher
          </a>
        </div>
        <div class="switcher-list">
          ${itemsHtml}
        </div>
      </div>
    `;

    document.body.appendChild(drawer);

    drawer.querySelector('.switcher-backdrop').addEventListener('click', CommonUI.closeSwitcher);
    drawer.querySelector('#btn-close-switcher').addEventListener('click', CommonUI.closeSwitcher);

    return drawer;
  },

  initModals() {
    document.addEventListener('click', (e) => {
      const openBtn = e.target.closest('[data-modal-open]');
      if (openBtn) {
        const targetId = openBtn.getAttribute('data-modal-open');
        CommonUI.openModal(targetId);
      }

      const closeBtn = e.target.closest('[data-modal-close]');
      if (closeBtn) {
        const modal = closeBtn.closest('.modal-overlay');
        if (modal) {
          CommonUI.closeModal(modal.id);
        }
      }

      if (e.target.classList.contains('modal-overlay')) {
        CommonUI.closeModal(e.target.id);
      }

      const switcherBtn = e.target.closest('[data-open-switcher]');
      if (switcherBtn) {
        e.preventDefault();
        CommonUI.openSwitcher();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) {
          CommonUI.closeModal(activeModal.id);
        }
        CommonUI.closeSwitcher();
      }
      // Alt+P or Ctrl+K to open project switcher
      if ((e.altKey && e.key.toLowerCase() === 'p') || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        CommonUI.openSwitcher();
      }
    });
  },

  // Update Status Pill
  updateStatusPill(element, label, type = 'info') {
    if (!element) return;
    element.className = `status-pill status-${type}`;
    element.innerHTML = `<span class="pulse-dot"></span><span>${label}</span>`;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  CommonUI.initModals();
});

if (typeof window !== 'undefined') {
  window.CommonUI = CommonUI;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CommonUI;
}

