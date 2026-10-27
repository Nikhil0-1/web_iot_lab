/**
 * Project 31: Visitor Counter - Application Controller
 */

let currentMode = 'sim';
let espClient = null;
let crossingEvents = [];

document.addEventListener('DOMContentLoaded', () => {
  VisitorSim.init();
  updateUI();

  window.onVisitorCrossing = (type, text) => {
    updateUI();
    logCrossingEvent(type, text);
  };
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
  const occ = VisitorSim.occupancy;
  const inCount = VisitorSim.totalEntered;
  const outCount = VisitorSim.totalExited;

  const valOcc = document.getElementById('val-occupancy');
  const valIn = document.getElementById('val-entered');
  const valOut = document.getElementById('val-exited');
  const badge = document.getElementById('occupancy-badge');

  if (valOcc) valOcc.textContent = occ;
  if (valIn) valIn.textContent = inCount;
  if (valOut) valOut.textContent = outCount;
  if (badge) badge.textContent = `${occ} Present`;
}

function simulateEntry() {
  VisitorSim.simulateEntry();
}

function simulateExit() {
  VisitorSim.simulateExit();
}

function resetCounters() {
  VisitorSim.reset();
  updateUI();
  logCrossingEvent('Reset', 'Occupancy and directional counters reset to 0');
  if (window.CommonUI) CommonUI.toast('Counters reset', 'info');
}

function logCrossingEvent(type, text) {
  const time = new Date().toLocaleTimeString();
  crossingEvents.unshift({ time, type, text });
  if (crossingEvents.length > 25) crossingEvents.pop();

  const container = document.getElementById('event-list');
  if (!container) return;

  container.innerHTML = crossingEvents.map(e => `
    <div class="event-item" style="padding:6px 0;border-bottom:1px solid var(--border-subtle);font-size:0.8rem;">
      <span class="meta-text" style="font-family:monospace;margin-right:6px;">[${e.time}]</span>
      <strong style="color:${e.type === 'Entry' ? '#059669' : (e.type === 'Exit' ? '#e11d48' : '#7c3aed')};margin-right:6px;">${e.type}:</strong>
      <span>${e.text}</span>
    </div>
  `).join('');
}

function clearEventLog() {
  crossingEvents = [];
  const container = document.getElementById('event-list');
  if (container) container.innerHTML = '<div class="event-empty">No visitor transitions logged yet.</div>';
}

// Hardware Link
function hwConnect() {
  const ip = document.getElementById('hw-ip-input').value.trim();
  const errMsg = document.getElementById('hw-error-msg');
  const lastSeen = document.getElementById('hw-last-seen');

  if (errMsg) errMsg.style.display = 'none';

  espClient = new ESP8266Client({
    baseUrl: ip,
    expectedProjectId: '31-visitor-counter',
    pollIntervalMs: 1200,
    onData: (data) => {
      if (lastSeen) lastSeen.textContent = `Live Telemetry: ${new Date().toLocaleTimeString()}`;
      if (data.total_in !== undefined) VisitorSim.totalEntered = data.total_in;
      if (data.total_out !== undefined) VisitorSim.totalExited = data.total_out;
      if (data.occupancy !== undefined) VisitorSim.occupancy = data.occupancy;
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
      if (window.CommonUI) CommonUI.toast('Connected to ESP8266 Visitor Node!', 'success');
      espClient.startPolling();
    }
  });
}
