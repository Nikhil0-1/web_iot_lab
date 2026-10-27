/**
 * Project 16 — Wi-Fi Home Automation
 * Simulation Engine: 4-relay appliance controller, load model, events
 */

'use strict';

const homeState = {
  devices: [
    { id: 0, name: 'Living Room Light', state: false, watts: 15, pin: 'D1' },
    { id: 1, name: 'Ceiling Fan', state: false, watts: 65, pin: 'D2' },
    { id: 2, name: 'AC Unit', state: false, watts: 1200, pin: 'D5' },
    { id: 3, name: 'Kitchen Outlet', state: false, watts: 150, pin: 'D6' }
  ],
  breakerTripped: false,
  events: []
};

function updateDeviceUI(id) {
  const dev = homeState.devices[id];
  const card = document.getElementById(`card-dev-${id}`);
  const sw = document.getElementById(`sw-dev-${id}`);
  const sub = document.getElementById(`status-sub-${id}`);

  if (card && sw && sub) {
    card.classList.toggle('active', dev.state);
    sw.checked = dev.state;
    sub.textContent = `${dev.state ? 'ON' : 'OFF'} · Ch ${id + 1} (${dev.pin})`;
  }
}

function updateSummaryMetrics() {
  const activeDevs = homeState.devices.filter(d => d.state);
  const activeCount = activeDevs.length;
  const totalWatts = activeDevs.reduce((sum, d) => sum + d.watts, 0);

  const activeSumEl = document.getElementById('active-summary');
  if (activeSumEl) activeSumEl.textContent = `${activeCount} of 4 devices active`;

  const mCountEl = document.getElementById('m-active-count');
  if (mCountEl) mCountEl.textContent = `${activeCount} / 4`;

  const mWattsEl = document.getElementById('m-est-watts');
  if (mWattsEl) mWattsEl.textContent = `${totalWatts} W`;
}

function toggleDevice(id, state) {
  if (homeState.breakerTripped && state) {
    alert('Circuit breaker is tripped! Please reset the breaker in the Simulation Workbench first.');
    const sw = document.getElementById(`sw-dev-${id}`);
    if (sw) sw.checked = false;
    return;
  }

  homeState.devices[id].state = state;
  updateDeviceUI(id);
  updateSummaryMetrics();
  logEvent(`${homeState.devices[id].name} switched ${state ? 'ON' : 'OFF'}`);

  if (appMode === 'hw' && hwClient) {
    sendHwRelay(id, state);
  }
}

function toggleAll(state) {
  if (homeState.breakerTripped && state) {
    alert('Circuit breaker is tripped! Reset breaker before turning on devices.');
    return;
  }

  homeState.devices.forEach((dev, idx) => {
    dev.state = state;
    updateDeviceUI(idx);
  });
  updateSummaryMetrics();
  logEvent(`Master command: All appliances turned ${state ? 'ON' : 'OFF'}`);

  if (appMode === 'hw' && hwClient) {
    sendHwAll(state);
  }
}

function applyPreset(preset) {
  if (preset === 'away') {
    toggleAll(false);
  } else if (preset === 'evening') {
    homeState.devices[0].state = true;
    homeState.devices[1].state = true;
    homeState.devices[2].state = false;
    homeState.devices[3].state = false;
    homeState.devices.forEach((_, idx) => updateDeviceUI(idx));
    updateSummaryMetrics();
    logEvent('Applied Preset: Evening Mode');
  } else if (preset === 'summer') {
    homeState.devices[0].state = false;
    homeState.devices[1].state = true;
    homeState.devices[2].state = true;
    homeState.devices[3].state = false;
    homeState.devices.forEach((_, idx) => updateDeviceUI(idx));
    updateSummaryMetrics();
    logEvent('Applied Preset: Cooling Mode (Fan + AC)');
  }
}

function injectFault(type) {
  if (type === 'overload') {
    homeState.breakerTripped = true;
    toggleAll(false);
    logEvent('WARNING: Main circuit breaker tripped due to simulated overload!');
    document.getElementById('sim-indicator').textContent = 'Breaker Tripped';
    document.getElementById('sim-indicator').className = 'status-pill status-danger';
  } else if (type === 'reset') {
    homeState.breakerTripped = false;
    logEvent('Circuit breaker reset to normal operation.');
    document.getElementById('sim-indicator').textContent = 'Active';
    document.getElementById('sim-indicator').className = 'status-pill status-ok';
  }
}

function logEvent(msg) {
  const time = new Date().toLocaleTimeString();
  homeState.events.unshift({ msg, time });
  if (homeState.events.length > 25) homeState.events.pop();

  const list = document.getElementById('event-list');
  if (!list) return;

  list.innerHTML = homeState.events.map(e => `
    <div class="event-item">
      <div class="event-dot"></div>
      <div>${e.msg}</div>
      <div class="event-time">${e.time}</div>
    </div>
  `).join('');
}

function clearEventLog() {
  homeState.events = [];
  const list = document.getElementById('event-list');
  if (list) list.innerHTML = '<div class="event-empty">No switching actions recorded.</div>';
}
