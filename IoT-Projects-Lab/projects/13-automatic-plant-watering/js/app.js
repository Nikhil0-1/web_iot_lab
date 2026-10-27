/**
 * Project 13 — Automatic Plant Watering
 * App controller: mode switching, hardware connection
 */

'use strict';

let appMode = 'sim'; // 'sim' | 'hw'
let hwClient = null;

function setMode(mode) {
  appMode = mode;
  document.getElementById('mode-btn-sim').classList.toggle('active', mode === 'sim');
  document.getElementById('mode-btn-hw').classList.toggle('active', mode === 'hw');
  document.getElementById('sim-controls-card').style.display = mode === 'sim' ? '' : 'none';
  document.getElementById('hw-controls-card').style.display = mode === 'hw' ? '' : 'none';

  if (mode === 'sim') {
    // Stop HW polling
    if (hwClient) { hwClient.stopPolling(); hwClient = null; }
    setStatusPill('Simulating', 'ok');
    clearTimeout(simState.simTimer);
    simState.paused = false;
    simTick();
  } else {
    // Stop simulation
    simState.paused = true;
    clearTimeout(simState.simTimer);
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
  if (!ip) { showHwError('Please enter a valid IP address.'); return; }

  if (hwClient) { hwClient.stopPolling(); }
  hideHwError();
  setStatusPill('Connecting…', 'warn');
  document.getElementById('hw-conn-status').textContent = 'Connecting…';
  document.getElementById('hw-conn-status').className = 'status-pill status-warn';

  hwClient = new ESP8266Client({
    baseUrl: 'http://' + ip,
    expectedProjectId: 'plant-watering',
    pollIntervalMs: 1500,
    timeoutMs: 4000,
    onData: onHwData,
    onStateChange: onHwStateChange,
    onError: onHwError,
  });
  hwClient.startPolling();
}

function onHwData(data) {
  if (typeof data.moisture === 'number') {
    document.getElementById('moisture-value').textContent = Math.round(data.moisture);
    document.getElementById('m-moisture').textContent = Math.round(data.moisture);
    simState.history.push(data.moisture);
    if (simState.history.length > 60) simState.history.shift();
    renderChart();
  }
  if (typeof data.pump === 'boolean') {
    document.getElementById('m-pump').textContent = data.pump ? 'ON' : 'OFF';
  }
  document.getElementById('hw-last-seen').textContent = 'Last update: ' + new Date().toLocaleTimeString();
}

function onHwStateChange(state, detail) {
  const map = { CONNECTED: ['Connected', 'ok'], CONNECTING: ['Connecting…', 'warn'], ERROR: ['Error', 'danger'], DISCONNECTED: ['Disconnected', 'idle'] };
  const [label, cls] = map[state] || ['Unknown', 'idle'];
  setStatusPill(label, cls);
  const cs = document.getElementById('hw-conn-status');
  cs.textContent = label;
  cs.className = 'status-pill ' + (cls === 'ok' ? 'connected' : cls === 'danger' ? 'error' : '');
  if (state === 'ERROR' && detail) showHwError(detail);
}

function onHwError(err) {
  showHwError(err.message || 'Connection error');
}

function showHwError(msg) {
  const el = document.getElementById('hw-error-msg');
  el.textContent = msg;
  el.style.display = '';
}

function hideHwError() {
  document.getElementById('hw-error-msg').style.display = 'none';
}

// Init
window.addEventListener('DOMContentLoaded', () => {
  initSimulation();
  // Close modal on outside click
  document.getElementById('hw-modal').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('open');
  });
});
