/**
 * Project 14 — Smart Water Tank Controller
 * Simulation: HC-SR04 distance model, fill level, hysteresis pump control
 */
'use strict';

const tankState = {
  fill: 50,           // 0-100%
  targetFill: 50,
  lowThresh: 20,
  highThresh: 85,
  capacity: 500,      // litres
  tankHeightCm: 100,  // simulated tank height
  pumpOn: false,
  autoMode: true,
  events: [],
  history: [],
  tickCount: 0,
  paused: false,
  speed: 1,
  simTimer: null,
};

function initSimulation() {
  tankState.fill = 50;
  tankState.pumpOn = false;
  tankState.events = [];
  tankState.history = [];
  tankState.tickCount = 0;
  clearEvents();
  renderChart();
  simTick();
}

function simTick() {
  if (tankState.paused) return;
  tankState.tickCount++;

  // Natural drain (slow)
  tankState.fill = Math.max(0, tankState.fill - 0.1);

  // Pull toward target (simulating user fill via slider)
  const diff = tankState.targetFill - tankState.fill;
  tankState.fill += diff * 0.03;

  // Pump adds water
  if (tankState.pumpOn) {
    tankState.fill = Math.min(100, tankState.fill + 0.6);
  }

  tankState.fill = Math.max(0, Math.min(100, tankState.fill));

  // Hysteresis control
  if (tankState.autoMode) {
    if (!tankState.pumpOn && tankState.fill <= tankState.lowThresh) {
      setPump(true, 'Auto — level low');
    }
    if (tankState.pumpOn && tankState.fill >= tankState.highThresh) {
      setPump(false, 'Auto — tank full');
    }
  }

  // History
  tankState.history.push(Math.round(tankState.fill * 10) / 10);
  if (tankState.history.length > 60) tankState.history.shift();

  updateUI();
  const interval = Math.max(100, 1000 / tankState.speed);
  tankState.simTimer = setTimeout(simTick, interval);
}

function setPump(on, reason) {
  if (tankState.pumpOn === on) return;
  tankState.pumpOn = on;
  addEvent((on ? '🔵 Pump ON' : '⏹ Pump OFF') + ' — ' + reason);
}

function setAutoMode(auto) {
  tankState.autoMode = auto;
  document.getElementById('btn-auto').classList.toggle('active', auto);
  document.getElementById('btn-manual').classList.toggle('active', !auto);
  document.getElementById('btn-pump-manual').style.display = auto ? 'none' : '';
  if (!auto) setPump(false, 'Manual mode');
}

function manualPumpToggle() {
  setPump(!tankState.pumpOn, 'Manual');
}

function setLowThresh(v) {
  v = Math.min(v, tankState.highThresh - 5);
  tankState.lowThresh = v;
  document.getElementById('lbl-low').textContent = v;
  document.getElementById('m-low-thresh').textContent = v;
  document.getElementById('sl-low').value = v;
  updateThresholdLines();
}

function setHighThresh(v) {
  v = Math.max(v, tankState.lowThresh + 5);
  tankState.highThresh = v;
  document.getElementById('lbl-high').textContent = v;
  document.getElementById('m-high-thresh').textContent = v;
  document.getElementById('sl-high').value = v;
  updateThresholdLines();
}

function setCap(cap, btn) {
  tankState.capacity = cap;
  document.querySelectorAll('.cap-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function updateThresholdLines() {
  // Tank SVG: fill zone is y=41 to y=259, height=218
  const totalH = 218;
  const hiY = 41 + totalH - (tankState.highThresh / 100) * totalH;
  const loY = 41 + totalH - (tankState.lowThresh / 100) * totalH;
  const hLine = document.getElementById('high-line');
  const lLine = document.getElementById('low-line');
  if (hLine) { hLine.setAttribute('y1', hiY); hLine.setAttribute('y2', hiY); }
  if (lLine) { lLine.setAttribute('y1', loY); lLine.setAttribute('y2', loY); }
  const hLbl = document.getElementById('high-lbl');
  const lLbl = document.getElementById('low-lbl');
  if (hLbl) { hLbl.setAttribute('y', hiY - 2); }
  if (lLbl) { lLbl.setAttribute('y', loY + 3); }
}

function addEvent(text) {
  const time = new Date().toLocaleTimeString();
  tankState.events.unshift({ text, time });
  if (tankState.events.length > 20) tankState.events.pop();
  renderEvents();
}

function clearEvents() {
  tankState.events = [];
  renderEvents();
}

function renderEvents() {
  const el = document.getElementById('event-list');
  if (!tankState.events.length) { el.innerHTML = '<div class="event-empty">No pump events yet.</div>'; return; }
  el.innerHTML = tankState.events.map(e => `
    <div class="event-item">
      <span class="event-dot"></span>
      <span>${e.text}</span>
      <span class="event-time">${e.time}</span>
    </div>`).join('');
}

function updateUI() {
  const f = Math.round(tankState.fill);
  const distCm = Math.round(tankState.tankHeightCm * (1 - tankState.fill / 100));
  const vol = Math.round((tankState.fill / 100) * tankState.capacity);

  // Update text
  document.getElementById('i-fill').textContent = f;
  document.getElementById('i-dist').textContent = distCm;
  document.getElementById('i-vol').textContent = vol;
  document.getElementById('i-pump').textContent = tankState.pumpOn ? 'ON' : 'OFF';
  document.getElementById('i-pump').style.color = tankState.pumpOn ? 'var(--theme-accent)' : '';

  document.getElementById('m-fill').textContent = f;
  const s = f < tankState.lowThresh ? 'Low' : f > tankState.highThresh ? 'Full' : 'Normal';
  const sc = f < tankState.lowThresh ? '#ef4444' : f > tankState.highThresh ? '#16a34a' : '';
  document.getElementById('m-fill-status').textContent = s;
  document.getElementById('m-fill-status').style.color = sc;
  document.getElementById('m-pump').textContent = tankState.pumpOn ? 'ON' : 'OFF';
  document.getElementById('m-pump').style.color = tankState.pumpOn ? 'var(--theme-accent)' : '';
  document.getElementById('m-pump-sub').textContent = tankState.autoMode ? 'Auto' : 'Manual';

  // Pump chip
  document.getElementById('pump-dot').className = 'pump-dot' + (tankState.pumpOn ? ' active' : '');
  document.getElementById('pump-label').textContent = tankState.pumpOn ? 'Pump ON' : 'Pump OFF';

  // SVG water fill: tank interior y=41 height=218
  const waterH = Math.round((tankState.fill / 100) * 218);
  const waterY = 41 + 218 - waterH;
  const wFill = document.getElementById('water-fill');
  if (wFill) {
    wFill.setAttribute('y', waterY);
    wFill.setAttribute('height', waterH);
  }

  // Percentage text inside tank
  const pctText = document.getElementById('tank-pct-text');
  if (pctText) pctText.textContent = f;

  // Distance line
  const dl = document.getElementById('dist-line');
  if (dl) dl.setAttribute('y2', waterY + 4);

  updateThresholdLines();
  renderChart();
  document.getElementById('chart-pts').textContent = tankState.history.length + ' pts';
}

function renderChart() {
  const canvas = document.getElementById('fill-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 400;
  canvas.width = W; const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const data = tankState.history;
  if (data.length < 2) return;
  const pad = { t: 6, r: 8, b: 18, l: 30 };
  const gW = W - pad.l - pad.r; const gH = H - pad.t - pad.b;

  [0, 25, 50, 75, 100].forEach(v => {
    const y = pad.t + gH - (v / 100) * gH;
    ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px sans-serif'; ctx.fillText(v, 0, y + 4);
  });

  // Low/High threshold lines
  const ly = pad.t + gH - (tankState.lowThresh / 100) * gH;
  const hy = pad.t + gH - (tankState.highThresh / 100) * gH;
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(pad.l, ly); ctx.lineTo(W - pad.r, ly); ctx.stroke();
  ctx.strokeStyle = '#16a34a';
  ctx.beginPath(); ctx.moveTo(pad.l, hy); ctx.lineTo(W - pad.r, hy); ctx.stroke();
  ctx.setLineDash([]);

  const step = gW / (data.length - 1);
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t + gH - (data[0] / 100) * gH);
  data.forEach((v, i) => ctx.lineTo(pad.l + i * step, pad.t + gH - (v / 100) * gH));
  ctx.lineTo(pad.l + (data.length - 1) * step, pad.t + gH);
  ctx.lineTo(pad.l, pad.t + gH); ctx.closePath();
  ctx.fillStyle = 'rgba(3,105,161,0.12)'; ctx.fill();

  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t + gH - (data[0] / 100) * gH);
  data.forEach((v, i) => ctx.lineTo(pad.l + i * step, pad.t + gH - (v / 100) * gH));
  ctx.strokeStyle = '#0369a1'; ctx.lineWidth = 2; ctx.stroke();
}

function togglePause() {
  tankState.paused = !tankState.paused;
  document.getElementById('btn-pause').textContent = tankState.paused ? 'Resume' : 'Pause';
  if (!tankState.paused) { clearTimeout(tankState.simTimer); simTick(); }
}

function resetSim() {
  tankState.paused = false;
  clearTimeout(tankState.simTimer);
  initSimulation();
  document.getElementById('btn-pause').textContent = 'Pause';
}

function setSpeed(s, btn) {
  tankState.speed = s;
  document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}
