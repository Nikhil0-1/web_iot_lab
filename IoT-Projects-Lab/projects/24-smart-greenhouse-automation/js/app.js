/**
 * Project 24 — Smart Greenhouse Automation
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
    expectedProjectId: 'greenhouse-automation',
    pollIntervalMs: 1500,
    timeoutMs: 3500,
    onData: onHwData,
    onStateChange: onHwStateChange,
    onError: onHwError
  });

  hwClient.startPolling();
}

function onHwData(data) {
  if (typeof data.temperature === 'number') {
    ghState.temp = data.temperature;
    document.getElementById('val-temp').textContent = `${data.temperature.toFixed(1)} °C`;
  }
  if (typeof data.humidity === 'number') {
    ghState.hum = Math.round(data.humidity);
    document.getElementById('val-hum').textContent = `${ghState.hum} %`;
  }
  if (typeof data.moisture === 'number') {
    ghState.moist = Math.round(data.moisture);
    document.getElementById('val-moist').textContent = `${ghState.moist} %`;
  }
  if (typeof data.lux === 'number') {
    ghState.lux = Math.round(data.lux);
    document.getElementById('val-lux').textContent = `${ghState.lux} Lux`;
  }
  if (typeof data.fanOn === 'boolean') {
    ghState.fanActive = data.fanOn;
  }
  if (typeof data.pumpOn === 'boolean') {
    ghState.pumpActive = data.pumpOn;
  }
  if (typeof data.tankEmpty === 'boolean') {
    ghState.reservoirEmpty = data.tankEmpty;
  }
  updateActuatorVisuals();
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
  showHwError(err.message || 'Greenhouse link communication error');
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

async function sendHwActuators() {
  if (!hwClient || hwClient.state !== 'CONNECTED') return;
  try {
    await fetch(`${hwClient.baseUrl}/api/actuators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fanOn: ghState.fanActive,
        pumpOn: ghState.pumpActive
      })
    });
  } catch (e) {
    console.error('Failed to post actuator command', e);
  }
}
