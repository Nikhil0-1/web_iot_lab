/**
 * Project 14 — Smart Water Tank Controller
 * App controller
 */
'use strict';
let appMode = 'sim';
let hwClient = null;

function setMode(mode) {
  appMode = mode;
  document.getElementById('mode-btn-sim').classList.toggle('active', mode === 'sim');
  document.getElementById('mode-btn-hw').classList.toggle('active', mode === 'hw');
  document.getElementById('sim-controls-card').style.display = mode === 'sim' ? '' : 'none';
  document.getElementById('hw-controls-card').style.display = mode === 'hw' ? '' : 'none';
  if (mode === 'sim') {
    if (hwClient) { hwClient.stopPolling(); hwClient = null; }
    setStatusPill('Simulating', 'ok');
    tankState.paused = false;
    clearTimeout(tankState.simTimer);
    simTick();
  } else {
    tankState.paused = true;
    clearTimeout(tankState.simTimer);
    setStatusPill('Disconnected', 'idle');
  }
}

function setStatusPill(text, type) {
  const pill = document.getElementById('status-pill');
  pill.className = 'status-pill status-' + type;
  document.getElementById('status-text').textContent = text;
}

function hwConnect() {
  const ip = document.getElementById('hw-ip').value.trim();
  if (!ip) return;
  if (hwClient) hwClient.stopPolling();
  hwClient = new ESP8266Client({
    baseUrl: 'http://' + ip,
    expectedProjectId: 'water-tank',
    pollIntervalMs: 1500,
    onData: d => {
      if (typeof d.fill === 'number') {
        tankState.history.push(d.fill);
        if (tankState.history.length > 60) tankState.history.shift();
        renderChart();
      }
      document.getElementById('hw-last-seen').textContent = 'Last: ' + new Date().toLocaleTimeString();
    },
    onStateChange: (s, detail) => {
      const map = { CONNECTED:['Connected','ok'], CONNECTING:['Connecting…','warn'], ERROR:['Error','danger'], DISCONNECTED:['Disconnected','idle'] };
      const [lbl, cls] = map[s] || ['Unknown','idle'];
      setStatusPill(lbl, cls);
      if (s === 'ERROR' && detail) { document.getElementById('hw-error-msg').textContent = detail; document.getElementById('hw-error-msg').style.display = ''; }
      else { document.getElementById('hw-error-msg').style.display = 'none'; }
    },
    onError: err => { document.getElementById('hw-error-msg').textContent = err.message; document.getElementById('hw-error-msg').style.display = ''; }
  });
  hwClient.startPolling();
}

window.addEventListener('DOMContentLoaded', () => {
  initSimulation();
  document.getElementById('hw-modal').addEventListener('click', function(e) { if (e.target === this) this.classList.remove('open'); });
});
