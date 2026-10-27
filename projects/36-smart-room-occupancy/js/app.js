/**
 * Project 36: Smart Room Occupancy - Application Controller
 */

let currentMode = 'sim';
let espClient = null;
let activityEvents = [];

document.addEventListener('DOMContentLoaded', () => {
  RoomSim.init();
  updateUI();

  window.onDwellTick = (seconds) => {
    const dwellEl = document.getElementById('val-dwell-time');
    if (dwellEl) dwellEl.textContent = formatDwellTime(seconds);
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
  const state = RoomSim.presenceState;
  const dist = RoomSim.targetDistanceM;

  const valState = document.getElementById('val-presence-state');
  const valType = document.getElementById('val-presence-type');
  const valRange = document.getElementById('val-target-range');
  const badge = document.getElementById('presence-badge');
  const hudState = document.getElementById('hud-radar-state');
  const hudDist = document.getElementById('hud-radar-dist');
  const radarSub = document.getElementById('radar-sub');

  if (valState) {
    valState.textContent = state === 'vacant' ? 'Vacant' : 'Occupied';
    valState.style.color = state === 'vacant' ? '#64748b' : '#7c3aed';
  }
  if (valType) {
    if (state === 'stationary') valType.textContent = 'Stationary Body (Breathing)';
    else if (state === 'moving') valType.textContent = 'Active Human Movement';
    else valType.textContent = 'No Presence Detected';
  }
  if (valRange) valRange.textContent = dist > 0 ? dist.toFixed(1) : '--';

  if (badge) {
    badge.textContent = state === 'vacant' ? 'Room Vacant' : 'Presence Verified';
    badge.style.background = state === 'vacant' ? '#f1f5f9' : '#ede9fe';
    badge.style.color = state === 'vacant' ? '#475569' : '#7c3aed';
  }

  if (hudState) hudState.textContent = state === 'vacant' ? 'Radar: Sweep Clear' : 'Radar: Target Tracked';
  if (hudDist) hudDist.textContent = dist > 0 ? `Distance: ${dist.toFixed(1)}m` : 'Distance: --';
  if (radarSub) {
    if (state === 'stationary') radarSub.textContent = 'Target: Stationary Human (Breathing / Micro-Motion)';
    else if (state === 'moving') radarSub.textContent = 'Target: Active Human Trajectory';
    else radarSub.textContent = 'Target: Standby / Passive Detection Grid';
  }
}

function setOccupancyState(state) {
  RoomSim.setState(state);
  updateUI();
  logActivityEvent('State Transition', `Presence state changed to ${state.toUpperCase()}`);
  if (window.CommonUI) CommonUI.toast(`Simulated state: ${state.toUpperCase()}`, 'info');
}

function formatDwellTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function logActivityEvent(type, text) {
  const time = new Date().toLocaleTimeString();
  activityEvents.unshift({ time, type, text });
  if (activityEvents.length > 25) activityEvents.pop();

  const container = document.getElementById('activity-list');
  if (!container) return;

  container.innerHTML = activityEvents.map(e => `
    <div class="event-item" style="padding:6px 0;border-bottom:1px solid var(--border-subtle);font-size:0.8rem;">
      <span class="meta-text" style="font-family:monospace;margin-right:6px;">[${e.time}]</span>
      <strong style="color:#7c3aed;margin-right:6px;">${e.type}:</strong>
      <span>${e.text}</span>
    </div>
  `).join('');
}

function clearActivityLog() {
  activityEvents = [];
  const container = document.getElementById('activity-list');
  if (container) container.innerHTML = '<div class="event-empty">No occupancy events recorded.</div>';
}

// Hardware Link
function hwConnect() {
  const ip = document.getElementById('hw-ip-input').value.trim();
  const errMsg = document.getElementById('hw-error-msg');
  const lastSeen = document.getElementById('hw-last-seen');

  if (errMsg) errMsg.style.display = 'none';

  espClient = new ESP8266Client({
    baseUrl: ip,
    expectedProjectId: '36-smart-room-occupancy',
    pollIntervalMs: 1500,
    onData: (data) => {
      if (lastSeen) lastSeen.textContent = `Live Telemetry: ${new Date().toLocaleTimeString()}`;
      if (data.target_state !== undefined) {
        RoomSim.setState(data.target_state);
      }
      if (data.target_distance_m !== undefined) {
        RoomSim.targetDistanceM = data.target_distance_m;
      }
      if (data.dwell_seconds !== undefined) {
        RoomSim.dwellSeconds = data.dwell_seconds;
      }
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
      if (window.CommonUI) CommonUI.toast('Connected to ESP8266 mmWave Radar Node!', 'success');
      espClient.startPolling();
    }
  });
}
