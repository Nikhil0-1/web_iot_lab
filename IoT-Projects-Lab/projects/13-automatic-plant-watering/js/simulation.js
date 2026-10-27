/**
 * Project 13 — Automatic Plant Watering
 * Simulation Engine: deterministic soil moisture model with hysteresis
 */

'use strict';

const simState = {
  moisture: 50,           // current moisture %
  targetMoisture: 50,     // slider set point
  threshold: 40,          // auto-water below this
  hysteresis: 10,         // stop watering above threshold+hysteresis
  pumpOn: false,
  autoMode: true,
  waterDuration: 10,       // seconds
  pumpTimer: 0,            // remaining pump seconds
  minInterval: 30,         // minimum seconds between waterings
  cooldown: 0,             // cooldown counter
  events: [],
  history: [],
  tickCount: 0,
  paused: false,
  speed: 1,
  totalEvents: 0,
  lastEventTime: null,
  simTimer: null,
};

function initSimulation() {
  simState.moisture = 50;
  simState.pumpOn = false;
  simState.pumpTimer = 0;
  simState.cooldown = 0;
  simState.events = [];
  simState.history = [];
  simState.tickCount = 0;
  simState.totalEvents = 0;
  simState.lastEventTime = null;
  clearHistory();
  renderChart();
  simTick();
}

function simTick() {
  if (simState.paused) return;

  simState.tickCount++;

  // Natural evaporation / drying (slow)
  const dryRate = 0.15; // % per tick
  simState.moisture = Math.max(0, simState.moisture - dryRate);

  // Move toward target set by slider (gentle pull, not instant)
  const diff = simState.targetMoisture - simState.moisture;
  simState.moisture += diff * 0.04;
  simState.moisture = Math.max(0, Math.min(100, simState.moisture));

  // Pump watering effect: adds moisture
  if (simState.pumpOn) {
    simState.moisture = Math.min(100, simState.moisture + 0.8);
    simState.pumpTimer = Math.max(0, simState.pumpTimer - 1);
    if (simState.pumpTimer <= 0) {
      stopPump('Duration reached');
    }
  }

  // Cooldown countdown
  if (simState.cooldown > 0) simState.cooldown--;

  // Auto-mode logic with hysteresis
  if (simState.autoMode && !simState.pumpOn) {
    const stopLevel = simState.threshold + simState.hysteresis;
    if (simState.moisture <= simState.threshold && simState.cooldown <= 0) {
      startPump('Auto — low moisture');
    }
  }

  // Record history (max 60 points)
  simState.history.push(Math.round(simState.moisture * 10) / 10);
  if (simState.history.length > 60) simState.history.shift();

  updateUI();

  const interval = Math.max(100, 1000 / simState.speed);
  simState.simTimer = setTimeout(simTick, interval);
}

function startPump(reason) {
  if (simState.pumpOn) return;
  simState.pumpOn = true;
  simState.pumpTimer = simState.waterDuration;
  simState.totalEvents++;
  simState.lastEventTime = new Date();
  addEvent('💧 Pump started — ' + reason);
}

function stopPump(reason) {
  if (!simState.pumpOn) return;
  simState.pumpOn = false;
  simState.cooldown = simState.minInterval;
  addEvent('⏹ Pump stopped — ' + reason);
}

function setAutoMode(auto) {
  simState.autoMode = auto;
  document.getElementById('btn-auto').classList.toggle('active', auto);
  document.getElementById('btn-manual').classList.toggle('active', !auto);
  document.getElementById('btn-pump-manual').style.display = auto ? 'none' : '';
  if (!auto && simState.pumpOn) stopPump('Manual mode activated');
}

function manualPumpToggle() {
  if (simState.pumpOn) {
    stopPump('Manual stop');
  } else {
    startPump('Manual start');
  }
}

function addEvent(text) {
  const time = new Date().toLocaleTimeString();
  simState.events.unshift({ text, time });
  if (simState.events.length > 20) simState.events.pop();
  renderEvents();
}

function clearHistory() {
  simState.events = [];
  renderEvents();
}

function renderEvents() {
  const el = document.getElementById('event-list');
  if (simState.events.length === 0) {
    el.innerHTML = '<div class="event-empty">No watering events yet.</div>';
    return;
  }
  el.innerHTML = simState.events.map(e => `
    <div class="event-item">
      <span class="event-dot"></span>
      <span>${e.text}</span>
      <span class="event-time">${e.time}</span>
    </div>
  `).join('');
}

function updateUI() {
  const m = Math.round(simState.moisture);
  const pct = m;

  // Moisture value
  document.getElementById('moisture-value').textContent = m;
  document.getElementById('m-moisture').textContent = m;

  // Status label
  let statusLabel = 'Optimal', statusClass = 'status-ok';
  if (m < 20) { statusLabel = 'Critical Dry'; statusClass = 'status-danger'; }
  else if (m < simState.threshold) { statusLabel = 'Dry — Watering'; statusClass = 'status-warn'; }
  else if (m < 60) { statusLabel = 'Moist'; statusClass = 'status-ok'; }
  else { statusLabel = 'Wet'; statusClass = 'status-info'; }

  document.getElementById('moisture-status-label').textContent = statusLabel;
  document.getElementById('m-moisture-status').textContent = statusLabel;

  // Pump state
  const pumpEl = document.getElementById('pump-chip');
  const pumpDot = document.getElementById('pump-dot');
  const pumpLabel = document.getElementById('pump-label');
  const pumpChip = document.getElementById('m-pump');
  pumpDot.className = 'pump-dot' + (simState.pumpOn ? ' active' : '');
  pumpLabel.textContent = simState.pumpOn ? 'Pump ON' : 'Pump OFF';
  pumpChip.textContent = simState.pumpOn ? 'ON' : 'OFF';
  pumpChip.style.color = simState.pumpOn ? 'var(--theme-accent)' : '';
  document.getElementById('m-pump-reason').textContent = simState.pumpOn
    ? `${simState.pumpTimer}s remaining` : (simState.cooldown > 0 ? `Cooldown ${simState.cooldown}s` : 'Idle');

  // Events count
  document.getElementById('m-events').textContent = simState.totalEvents;
  document.getElementById('m-last-water').textContent = simState.lastEventTime
    ? 'Last: ' + simState.lastEventTime.toLocaleTimeString() : 'Never';

  // Plant visual state
  const plantScene = document.getElementById('plant-scene');
  const plantSvg = document.getElementById('plant-svg').parentElement;
  plantScene.classList.remove('watering');
  if (simState.pumpOn) plantScene.classList.add('watering');

  const plantContainer = document.getElementById('plant-container');
  plantContainer.className = 'plant-container ' + (m < 25 ? 'plant-dry' : (m > 50 ? 'plant-healthy' : ''));

  // Sky bg follows moisture
  document.getElementById('plant-sky').style.background = m > 50
    ? 'linear-gradient(180deg,#b3e5fc 0%,#e8f5e9 60%,transparent 100%)'
    : 'linear-gradient(180deg,#ffe0b2 0%,#fff8e1 60%,transparent 100%)';

  // Water drops opacity
  document.getElementById('water-drops').style.opacity = simState.pumpOn ? '1' : '0';

  // Gauge canvas
  drawGauge(pct);

  // Chart
  renderChart();
  document.getElementById('chart-pts').textContent = simState.history.length + ' pts';
}

function drawGauge(pct) {
  const canvas = document.getElementById('moisture-gauge');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2, cy = H - 4;
  const r = H - 8;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const angle = startAngle + (pct / 100) * Math.PI;

  // Track
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Fill
  const color = pct < 20 ? '#ef4444' : pct < 40 ? '#f59e0b' : '#16a34a';
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, angle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function renderChart() {
  const canvas = document.getElementById('moisture-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 400;
  canvas.width = W;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const data = simState.history;
  if (data.length < 2) return;

  const pad = { t: 10, r: 10, b: 20, l: 34 };
  const gW = W - pad.l - pad.r;
  const gH = H - pad.t - pad.b;

  // Grid lines
  ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1;
  [0, 25, 50, 75, 100].forEach(v => {
    const y = pad.t + gH - (v / 100) * gH;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px sans-serif';
    ctx.fillText(v, 0, y + 4);
  });

  // Threshold line
  const ty = pad.t + gH - (simState.threshold / 100) * gH;
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(pad.l, ty); ctx.lineTo(W - pad.r, ty); ctx.stroke();
  ctx.setLineDash([]);

  // Area fill
  const step = gW / (data.length - 1);
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t + gH - (data[0] / 100) * gH);
  data.forEach((v, i) => ctx.lineTo(pad.l + i * step, pad.t + gH - (v / 100) * gH));
  ctx.lineTo(pad.l + (data.length - 1) * step, pad.t + gH);
  ctx.lineTo(pad.l, pad.t + gH);
  ctx.closePath();
  ctx.fillStyle = 'rgba(22,163,74,0.12)';
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t + gH - (data[0] / 100) * gH);
  data.forEach((v, i) => ctx.lineTo(pad.l + i * step, pad.t + gH - (v / 100) * gH));
  ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 2; ctx.stroke();
}

function togglePause() {
  simState.paused = !simState.paused;
  document.getElementById('btn-pause').textContent = simState.paused ? 'Resume' : 'Pause';
  if (!simState.paused) {
    clearTimeout(simState.simTimer);
    simTick();
  }
}

function resetSim() {
  simState.paused = false;
  clearTimeout(simState.simTimer);
  initSimulation();
  document.getElementById('btn-pause').textContent = 'Pause';
}

function setSpeed(s, btn) {
  simState.speed = s;
  document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}
