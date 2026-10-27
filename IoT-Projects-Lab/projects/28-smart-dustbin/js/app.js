/**
 * Project 28: Smart Dustbin - Application Controller
 */

let currentMode = 'sim';
let espClient = null;
let binEvents = [];

document.addEventListener('DOMContentLoaded', () => {
  DustbinSim.init();
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

function waveHand() {
  DustbinSim.waveHand(res => {
    logBinEvent('IR Sensor', res.action);
  });
}

function depositWaste() {
  DustbinSim.depositWaste(20);
  logBinEvent('Deposit', `Added waste · Fill now at ${DustbinSim.fillPercent}%`);
}

function emptyDustbin() {
  DustbinSim.emptyBin();
  logBinEvent('Sanitation', 'Dustbin emptied to 0% capacity');
  if (window.CommonUI) CommonUI.toast('Bin emptied successfully', 'info');
}

function toggleLidManual() {
  DustbinSim.toggleLid();
  logBinEvent('Manual', DustbinSim.lidOpen ? 'Lid manually opened' : 'Lid closed');
}

function logBinEvent(source, text) {
  const time = new Date().toLocaleTimeString();
  binEvents.unshift({ time, source, text });
  if (binEvents.length > 25) binEvents.pop();

  const container = document.getElementById('event-list');
  if (!container) return;

  container.innerHTML = binEvents.map(e => `
    <div class="event-item" style="padding:6px 0;border-bottom:1px solid var(--border-subtle);font-size:0.8rem;">
      <span class="meta-text" style="font-family:monospace;margin-right:6px;">[${e.time}]</span>
      <strong style="margin-right:6px;">${e.source}:</strong>
      <span>${e.text}</span>
    </div>
  `).join('');
}

function clearEventLog() {
  binEvents = [];
  const container = document.getElementById('event-list');
  if (container) container.innerHTML = '<div class="event-empty">No sensor interactions logged yet.</div>';
}

// Hardware Link
function hwConnect() {
  const ip = document.getElementById('hw-ip-input').value.trim();
  const errMsg = document.getElementById('hw-error-msg');
  const lastSeen = document.getElementById('hw-last-seen');

  if (errMsg) errMsg.style.display = 'none';

  espClient = new ESP8266Client({
    baseUrl: ip,
    expectedProjectId: '28-smart-dustbin',
    pollIntervalMs: 1500,
    onData: (data) => {
      if (lastSeen) lastSeen.textContent = `Live Telemetry: ${new Date().toLocaleTimeString()}`;
      if (data.fill_percent !== undefined) {
        DustbinSim.fillPercent = data.fill_percent;
      }
      if (data.lid_open !== undefined) {
        if (data.lid_open) DustbinSim.openLid();
        else DustbinSim.closeLid();
      }
      DustbinSim.updateVisuals();
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
      if (window.CommonUI) CommonUI.toast('Connected to ESP8266 Smart Dustbin!', 'success');
      espClient.startPolling();
    }
  });
}
