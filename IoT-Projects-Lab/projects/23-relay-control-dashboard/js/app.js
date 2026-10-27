/**
 * Project 23 — Relay Control Dashboard
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
    expectedProjectId: 'relay-dashboard',
    pollIntervalMs: 1200,
    timeoutMs: 3500,
    onData: onHwData,
    onStateChange: onHwStateChange,
    onError: onHwError
  });

  hwClient.startPolling();
}

function onHwData(data) {
  if (Array.isArray(data.relays)) {
    data.relays.forEach((state, idx) => {
      if (idx < relayState.relays.length) {
        relayState.relays[idx].state = !!state;
        updateRelayCard(idx);
      }
    });
    updateTelemetry();
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
  showHwError(err.message || 'Relay board communication error');
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

async function sendHwRelay(channel, state) {
  if (!hwClient || hwClient.state !== 'CONNECTED') return;
  try {
    await fetch(`${hwClient.baseUrl}/api/relay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, state })
    });
  } catch (e) {
    console.error('Failed to post relay command', e);
  }
}

async function sendHwAll(state) {
  if (!hwClient || hwClient.state !== 'CONNECTED') return;
  try {
    await fetch(`${hwClient.baseUrl}/api/all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state })
    });
  } catch (e) {
    console.error('Failed to post all command', e);
  }
}
