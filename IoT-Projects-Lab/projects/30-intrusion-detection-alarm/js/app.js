/**
 * Project 30: Intrusion Detection Alarm - Application Controller
 */

let currentMode = 'sim';
let espClient = null;
let securityEvents = [];

document.addEventListener('DOMContentLoaded', () => {
  IntrusionSim.init();
  updateUI();
});

function setMode(mode) {
  currentMode = mode;
  document.getElementById('mode-btn-sim').classList.toggle('active', mode === 'sim');
  document.getElementById('mode-btn-hw').classList.toggle('active', mode === 'hw');

  const statusText = document.getElementById('status-text');
  const simControls = document.getElementById('sim-controls');

  if (mode === 'sim') {
    statusText.textContent = 'Simulating';
    simControls.style.display = 'flex';
    if (espClient) espClient.stopPolling();
  } else {
    statusText.textContent = 'Hardware Mode';
    simControls.style.display = 'none';
    if (espClient) espClient.startPolling();
  }
}

function updateUI() {
  const armed = IntrusionSim.isArmed;
  const motion = IntrusionSim.activeMotion;
  const siren = IntrusionSim.sirenActive;

  const armBtn = document.getElementById('arm-btn');
  const secSub = document.getElementById('sec-sub');
  const valArmed = document.getElementById('val-armed-state');
  const valMotion = document.getElementById('val-motion-state');
  const valZone = document.getElementById('val-motion-zone');
  const valSiren = document.getElementById('val-siren-state');
  const sirenBadge = document.getElementById('siren-status-badge');

  if (armBtn) {
    armBtn.textContent = armed ? 'Disarm System' : 'Arm System';
    armBtn.className = armed ? 'btn btn-sm btn-subtle' : 'btn btn-sm btn-primary';
  }
  if (secSub) secSub.textContent = armed ? 'Zone Status: Armed · HC-SR501 Active' : 'Zone Status: Disarmed (Standby)';
  if (valArmed) {
    valArmed.textContent = armed ? 'ARMED' : 'DISARMED';
    valArmed.style.color = armed ? '#ea580c' : '#64748b';
  }
  if (valMotion) {
    valMotion.textContent = motion ? 'DETECTED' : 'Clear';
    valMotion.style.color = motion ? '#e11d48' : '#059669';
  }
  if (valZone) valZone.textContent = motion ? IntrusionSim.activeZone : 'All Zones Clear';
  if (valSiren) {
    valSiren.textContent = siren ? 'BLARING' : 'Silent';
    valSiren.style.color = siren ? '#e11d48' : '#64748b';
  }
  if (sirenBadge) {
    sirenBadge.textContent = siren ? 'ALARM ACTIVE' : 'Siren Standby';
    sirenBadge.style.background = siren ? '#ffe4e6' : '#ecfdf5';
    sirenBadge.style.color = siren ? '#be123c' : '#059669';
  }
}

function toggleArmedState() {
  IntrusionSim.isArmed = !IntrusionSim.isArmed;
  if (!IntrusionSim.isArmed) IntrusionSim.clearIntrusion();
  updateUI();
  logSecurityEvent('System', IntrusionSim.isArmed ? 'Perimeter armed by user' : 'System disarmed by user');
}

function triggerIntrusion(zone) {
  IntrusionSim.triggerIntrusion(zone);
  updateUI();
  logSecurityEvent(IntrusionSim.isArmed ? 'BREACH ALERT' : 'Activity', `PIR motion detected in ${zone}`);
}

function clearIntrusion() {
  IntrusionSim.clearIntrusion();
  updateUI();
  logSecurityEvent('Resolved', 'All zone motion cleared');
}

function logSecurityEvent(type, text) {
  const time = new Date().toLocaleTimeString();
  securityEvents.unshift({ time, type, text });
  if (securityEvents.length > 25) securityEvents.pop();

  const container = document.getElementById('event-list');
  if (!container) return;

  container.innerHTML = securityEvents.map(e => `
    <div class="event-item" style="padding:6px 0;border-bottom:1px solid var(--border-subtle);font-size:0.8rem;">
      <span class="meta-text" style="font-family:monospace;margin-right:6px;">[${e.time}]</span>
      <strong style="color:${e.type.includes('BREACH') ? '#e11d48' : '#0284c7'};margin-right:6px;">${e.type}:</strong>
      <span>${e.text}</span>
    </div>
  `).join('');
}

function clearEventLog() {
  securityEvents = [];
  const container = document.getElementById('event-list');
  if (container) container.innerHTML = '<div class="event-empty">No security breaches logged.</div>';
}

// Hardware Link
function hwConnect() {
  const ip = document.getElementById('hw-ip-input').value.trim();
  const errMsg = document.getElementById('hw-error-msg');
  const lastSeen = document.getElementById('hw-last-seen');

  if (errMsg) errMsg.style.display = 'none';

  espClient = new ESP8266Client({
    baseUrl: ip,
    expectedProjectId: '30-intrusion-detection-alarm',
    pollIntervalMs: 1200,
    onData: (data) => {
      if (lastSeen) lastSeen.textContent = `Live Telemetry: ${new Date().toLocaleTimeString()}`;
      if (data.motion_detected !== undefined) {
        if (data.motion_detected) IntrusionSim.triggerIntrusion('Hardware Zone (HC-SR501)');
        else IntrusionSim.clearIntrusion();
      }
      if (data.armed !== undefined) IntrusionSim.isArmed = data.armed;
      updateUI();
    },
    onError: (err) => {
      if (errMsg) {
        errMsg.textContent = `Hardware Error: ${err.message}`;
        errMsg.style.display = 'block';
      }
    }
  });

  espClient.testConnection().then(res => {
    if (res.success) {
      if (window.CommonUI) CommonUI.toast('Connected to ESP8266 Intrusion Alarm Node!', 'success');
      espClient.startPolling();
    }
  });
}
