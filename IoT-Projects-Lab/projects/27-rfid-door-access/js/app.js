/**
 * Project 27: RFID Door Access - Application Controller
 */

let currentMode = 'sim';
let espClient = null;
let auditEvents = [];

document.addEventListener('DOMContentLoaded', () => {
  DoorSim.init();
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

function pressKey(digit) {
  DoorSim.pressKey(digit);
}

function clearPin() {
  DoorSim.clearPin();
}

function submitPin() {
  DoorSim.submitPin(result => {
    logAudit(result.success ? 'Granted' : 'Denied', result.message);
    const countEl = document.getElementById('failed-count');
    if (countEl) countEl.textContent = `${DoorSim.failedAttempts} / 3`;
  });
}

function enterDemoPin(pin) {
  DoorSim.currentInput = pin;
  DoorSim.updateKeypadDisplay();
  submitPin();
}

function forceLockToggle() {
  if (DoorSim.isLocked) {
    DoorSim.grantAccess(res => logAudit('Override', 'Emergency manual unlock triggered'));
  } else {
    DoorSim.lockDoor();
    logAudit('Override', 'Emergency manual lock engaged');
  }
}

function logAudit(type, message) {
  const time = new Date().toLocaleTimeString();
  auditEvents.unshift({ time, type, message });
  if (auditEvents.length > 25) auditEvents.pop();

  const container = document.getElementById('audit-list');
  if (!container) return;

  container.innerHTML = auditEvents.map(e => `
    <div class="event-item" style="padding:6px 0;border-bottom:1px solid var(--border-subtle);font-size:0.8rem;">
      <span class="meta-text" style="font-family:monospace;margin-right:6px;">[${e.time}]</span>
      <strong style="color:${e.type === 'Granted' ? '#15803d' : '#be123c'};margin-right:6px;">${e.type}:</strong>
      <span>${e.message}</span>
    </div>
  `).join('');
}

function clearAuditLog() {
  auditEvents = [];
  const container = document.getElementById('audit-list');
  if (container) container.innerHTML = '<div class="event-empty">No access attempts recorded.</div>';
}

// Hardware Link
function hwConnect() {
  const ip = document.getElementById('hw-ip-input').value.trim();
  const errMsg = document.getElementById('hw-error-msg');
  const lastSeen = document.getElementById('hw-last-seen');

  if (errMsg) errMsg.style.display = 'none';

  espClient = new ESP8266Client({
    baseUrl: ip,
    expectedProjectId: '27-rfid-door-access',
    pollIntervalMs: 1500,
    onData: (data) => {
      if (lastSeen) lastSeen.textContent = `Live Telemetry: ${new Date().toLocaleTimeString()}`;
      if (data.lock_state) {
        const unlocked = (data.lock_state === 'unlocked');
        DoorSim.updateVisualState(unlocked);
      }
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
      if (window.CommonUI) CommonUI.toast('Connected to ESP8266 Door Access Terminal!', 'success');
      espClient.startPolling();
    }
  });
}
