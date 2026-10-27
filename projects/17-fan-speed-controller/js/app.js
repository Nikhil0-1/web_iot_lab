/**
 * Project 17 — Fan Speed Controller
 * App Controller: Mode switching, ESP8266 REST API integration
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
    if (hwClient) {
      hwClient.stopPolling();
      hwClient = null;
    }
    setStatusPill('Simulating', 'ok');
  } else {
    setStatusPill('Disconnected', 'idle');
  }
}

function setStatusPill(text, type) {
  const pill = document.getElementById('status-pill');
  if (!pill) return;
  pill.className = 'status-pill status-' + type;
  document.getElementById('status-text').textContent = text;
}

function hwConnect() {
  const ip = document.getElementById('hw-ip').value.trim();
  if (!ip) {
    showHwError('Please enter a valid ESP8266 IP address.');
    return;
  }

  if (hwClient) {
    hwClient.stopPolling();
  }
  hideHwError();
  setStatusPill('Connecting…', 'warn');
  const connStatus = document.getElementById('hw-conn-status');
  connStatus.textContent = 'Connecting…';
  connStatus.className = 'status-pill status-warn';

  hwClient = new ESP8266Client({
    baseUrl: 'http://' + ip,
    expectedProjectId: 'fan-controller',
    pollIntervalMs: 1200,
    timeoutMs: 3500,
    onData: onHwData,
    onStateChange: onHwStateChange,
    onError: onHwError
  });

  hwClient.startPolling();
}

function onHwData(data) {
  if (typeof data.speed === 'number') {
    fanState.targetSpeed = data.speed;
    const disp = document.getElementById('speed-display');
    if (disp) disp.textContent = `${data.speed} %`;
    const slider = document.getElementById('speed-slider');
    if (slider) slider.value = data.speed;
    updatePresetButtons(data.speed);
  }
  document.getElementById('hw-last-seen').textContent = 'Last update: ' + new Date().toLocaleTimeString();
}

function onHwStateChange(state, detail) {
  const map = {
    CONNECTED: ['Connected', 'ok'],
    CONNECTING: ['Connecting…', 'warn'],
    ERROR: ['Error', 'danger'],
    DISCONNECTED: ['Disconnected', 'idle']
  };
  const [label, cls] = map[state] || ['Unknown', 'idle'];
  setStatusPill(label, cls);

  const cs = document.getElementById('hw-conn-status');
  if (cs) {
    cs.textContent = label;
    cs.className = 'status-pill status-' + cls;
  }
  if (state === 'ERROR' && detail) showHwError(detail);
}

function onHwError(err) {
  showHwError(err.message || 'Hardware communication failed');
}

function showHwError(msg) {
  const el = document.getElementById('hw-error-msg');
  if (el) {
    el.textContent = msg;
    el.style.display = '';
  }
}

function hideHwError() {
  const el = document.getElementById('hw-error-msg');
  if (el) el.style.display = 'none';
}

async function sendHwSpeed(speed) {
  if (!hwClient || hwClient.state !== 'CONNECTED') return;
  try {
    await fetch(`${hwClient.baseUrl}/api/speed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speed })
    });
  } catch (e) {
    console.error('Failed to post fan speed', e);
  }
}
