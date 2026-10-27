/**
 * Project 23 — Relay Control Dashboard
 * Simulation Engine: Independent multi-relay switching, pulse timers, channel renaming, coil telemetry
 */

'use strict';

const relayState = {
  relays: [
    { id: 0, name: 'Submersible Pump', state: false, pin: 'D1 (GPIO 5)' },
    { id: 1, name: 'Solenoid Valve', state: false, pin: 'D2 (GPIO 4)' },
    { id: 2, name: 'High-Bay Floodlight', state: false, pin: 'D5 (GPIO 14)' },
    { id: 3, name: 'Acoustic Siren', state: false, pin: 'D6 (GPIO 12)' }
  ],
  pulseTimers: [null, null, null, null],
  busFault: false,
  events: []
};

function updateRelayCard(id) {
  const r = relayState.relays[id];
  const card = document.getElementById(`relay-card-${id}`);
  const sw = document.getElementById(`sw-relay-${id}`);
  const nameEl = document.getElementById(`name-relay-${id}`);

  if (card) card.classList.toggle('active', r.state);
  if (sw) sw.checked = r.state;
  if (nameEl) nameEl.textContent = r.name;
}

function updateTelemetry() {
  const activeCount = relayState.relays.filter(r => r.state).length;
  // Standard 5V relay coil draws ~72mA when energized
  const coilCurrent = activeCount * 72;

  const summary = document.getElementById('active-summary');
  if (summary) summary.textContent = `${activeCount} of 4 coils energized`;

  const mActive = document.getElementById('m-active-coils');
  if (mActive) mActive.textContent = `${activeCount} / 4`;

  const mCurrent = document.getElementById('m-coil-current');
  if (mCurrent) mCurrent.textContent = `${coilCurrent} mA`;
}

function toggleRelay(id, state) {
  if (relayState.busFault) {
    alert('Relay power bus is offline! Restore bus connection first.');
    const sw = document.getElementById(`sw-relay-${id}`);
    if (sw) sw.checked = !state;
    return;
  }

  // Clear any running pulse timer on manual switch
  if (relayState.pulseTimers[id]) {
    clearTimeout(relayState.pulseTimers[id]);
    relayState.pulseTimers[id] = null;
  }

  relayState.relays[id].state = state;
  updateRelayCard(id);
  updateTelemetry();
  logEvent(`Relay CH ${id + 1} (${relayState.relays[id].name}): Coiled ${state ? 'ENERGIZED (ON)' : 'DE-ENERGIZED (OFF)'}`);

  if (appMode === 'hw' && hwClient) {
    sendHwRelay(id, state);
  }
}

function toggleAllRelays(state) {
  if (relayState.busFault) {
    alert('Relay power bus is offline! Restore bus connection first.');
    return;
  }

  relayState.relays.forEach((r, idx) => {
    if (relayState.pulseTimers[idx]) {
      clearTimeout(relayState.pulseTimers[idx]);
      relayState.pulseTimers[idx] = null;
    }
    r.state = state;
    updateRelayCard(idx);
  });
  updateTelemetry();
  logEvent(`Master command: All relay coils ${state ? 'ENERGIZED' : 'DE-ENERGIZED'}`);

  if (appMode === 'hw' && hwClient) {
    sendHwAll(state);
  }
}

function pulseRelay(id) {
  if (relayState.busFault) return;

  logEvent(`Pulse command: CH ${id + 1} (${relayState.relays[id].name}) pulsing for 5.0s`);
  toggleRelay(id, true);

  if (relayState.pulseTimers[id]) clearTimeout(relayState.pulseTimers[id]);
  relayState.pulseTimers[id] = setTimeout(() => {
    toggleRelay(id, false);
    logEvent(`Pulse elapsed: CH ${id + 1} (${relayState.relays[id].name}) auto-released`);
    relayState.pulseTimers[id] = null;
  }, 5000);
}

function renameChannel() {
  const sel = document.getElementById('select-ch');
  const input = document.getElementById('input-ch-name');
  const id = parseInt(sel.value, 10);
  const newName = input.value.trim();

  if (!newName) {
    alert('Please enter a valid channel label.');
    return;
  }

  relayState.relays[id].name = newName;
  updateRelayCard(id);
  input.value = '';
  logEvent(`Channel ${id + 1} renamed to "${newName}"`);
}

function simulateConnLoss() {
  relayState.busFault = true;
  toggleAllRelays(false);
  document.getElementById('m-board-health').textContent = 'BUS OFFLINE';
  document.getElementById('m-board-health').style.color = '#ef4444';
  logEvent('WARNING: Relay supply bus dropped! All contacts dropped out for safety.');
}

function restoreConn() {
  relayState.busFault = false;
  document.getElementById('m-board-health').textContent = 'NOMINAL';
  document.getElementById('m-board-health').style.color = '';
  logEvent('Relay supply bus restored to nominal operation.');
}

function logEvent(msg) {
  const time = new Date().toLocaleTimeString();
  relayState.events.unshift({ msg, time });
  if (relayState.events.length > 25) relayState.events.pop();

  const list = document.getElementById('event-list');
  if (!list) return;

  list.innerHTML = relayState.events.map(e => `
    <div class="event-item">
      <div class="event-dot"></div>
      <div>${e.msg}</div>
      <div class="event-time">${e.time}</div>
    </div>
  `).join('');
}

function clearEventLog() {
  relayState.events = [];
  const list = document.getElementById('event-list');
  if (list) list.innerHTML = '<div class="event-empty">No switching commands recorded.</div>';
}

window.addEventListener('DOMContentLoaded', () => {
  relayState.relays.forEach((_, idx) => updateRelayCard(idx));
  updateTelemetry();
});
