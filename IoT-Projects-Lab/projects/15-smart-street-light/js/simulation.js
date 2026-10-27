/**
 * Project 15 — Smart Street Light Simulation Engine
 */
'use strict';

const lightState = {
  lux: 500,
  targetLux: 500,
  threshold: 300,
  brightness: 0,
  lightOn: false,
  autoMode: true,
  motionActive: false,
  motionBrightBoost: 30,
  manualBrightness: 100,
  history: [],
  events: [],
  tickCount: 0,
  paused: false,
  speed: 1,
  simTimer: null,
};

function initSimulation() {
  lightState.lux = 500; lightState.brightness = 0; lightState.lightOn = false;
  lightState.history = []; lightState.events = []; lightState.tickCount = 0;
  clearEvents(); renderChart(); simTick();
}

function simTick() {
  if (lightState.paused) return;
  lightState.tickCount++;

  // Drift toward target lux
  const diff = lightState.targetLux - lightState.lux;
  lightState.lux += diff * 0.08;
  lightState.lux = Math.max(0, Math.min(2000, lightState.lux));

  // Auto logic
  if (lightState.autoMode) {
    const shouldBeOn = lightState.lux < lightState.threshold;
    if (shouldBeOn !== lightState.lightOn) {
      lightState.lightOn = shouldBeOn;
      addEvent(shouldBeOn ? '💡 Light ON — dark threshold' : '🌅 Light OFF — bright');
    }

    // Brightness by inverse ambient + motion boost
    if (lightState.lightOn) {
      const ambRatio = 1 - (lightState.lux / lightState.threshold);
      let b = 50 + ambRatio * 50;
      if (lightState.motionActive) b = Math.min(100, b + lightState.motionBrightBoost);
      lightState.brightness = Math.round(b);
    } else {
      lightState.brightness = 0;
    }
  } else {
    lightState.brightness = lightState.lightOn ? lightState.manualBrightness : 0;
  }

  lightState.history.push(Math.round(lightState.lux));
  if (lightState.history.length > 60) lightState.history.shift();

  updateUI();
  const interval = Math.max(100, 1000 / lightState.speed);
  lightState.simTimer = setTimeout(simTick, interval);
}

function setAutoMode(auto) {
  lightState.autoMode = auto;
  document.getElementById('btn-auto').classList.toggle('active', auto);
  document.getElementById('btn-manual').classList.toggle('active', !auto);
  document.getElementById('btn-light-manual').style.display = auto ? 'none' : '';
}

function manualLightToggle() {
  lightState.lightOn = !lightState.lightOn;
  addEvent(lightState.lightOn ? '💡 Light ON — manual' : '⏹ Light OFF — manual');
}

function setScenario(s) {
  const map = { day: 1800, dusk: 350, night: 30 };
  lightState.targetLux = map[s] || 500;
  document.getElementById('sl-lux').value = lightState.targetLux;
  document.getElementById('lbl-lux').textContent = lightState.targetLux;
}

function addEvent(text) {
  lightState.events.unshift({ text, time: new Date().toLocaleTimeString() });
  if (lightState.events.length > 20) lightState.events.pop();
  renderEvents();
}
function clearEvents() { lightState.events = []; renderEvents(); }
function renderEvents() {
  const el = document.getElementById('event-list');
  if (!lightState.events.length) { el.innerHTML = '<div class="event-empty">No events yet.</div>'; return; }
  el.innerHTML = lightState.events.map(e => `<div class="event-item"><span class="event-dot"></span><span>${e.text}</span><span class="event-time">${e.time}</span></div>`).join('');
}

function updateUI() {
  const lux = Math.round(lightState.lux);
  const b = lightState.brightness;
  const on = lightState.lightOn;

  document.getElementById('sc-lux').textContent = lux;
  document.getElementById('sc-bright').textContent = b;
  document.getElementById('m-lux').textContent = lux;
  document.getElementById('m-bright').textContent = b;
  document.getElementById('m-bright-status').textContent = on ? (b > 80 ? 'Full' : 'Dimmed') : 'Off';
  document.getElementById('m-time').textContent = lux < 50 ? 'Night' : lux < 400 ? 'Dusk/Dawn' : 'Daylight';
  document.getElementById('m-motion').textContent = lightState.motionActive ? 'Detected' : 'None';
  document.getElementById('m-motion').style.color = lightState.motionActive ? '#16a34a' : '';

  // Light visual
  const lampBulb = document.getElementById('lamp-bulb');
  const lampGlow = document.getElementById('lamp-glow');
  const lightCone = document.getElementById('light-cone');
  const lightDot = document.getElementById('light-dot');
  const lightLabel = document.getElementById('light-label');
  const badge = document.getElementById('light-state-badge');

  lampBulb.className = 'lamp-bulb' + (on ? ' on' : '');
  lampGlow.className = 'lamp-glow' + (on ? ' on' : '');
  lightCone.className = 'light-cone' + (on ? ' on' : '');

  // Cone color intensity based on brightness
  if (on) {
    lightCone.style.borderBottomColor = `rgba(254,240,138,${(b / 100) * 0.2})`;
  } else {
    lightCone.style.borderBottomColor = 'rgba(254,240,138,0)';
  }

  lightDot.className = 'pump-dot' + (on ? ' active' : '');
  lightLabel.textContent = on ? `Light ON (${b}%)` : 'Light OFF';
  badge.textContent = on ? 'ON' : 'OFF';
  badge.className = 'light-badge ' + (on ? 'on' : 'off');

  // Sky color based on lux
  const skyEl = document.getElementById('sky-bg');
  if (lux < 100) {
    skyEl.style.background = 'linear-gradient(180deg,#020617 0%,#0f172a 60%,#1e3a5f 100%)';
  } else if (lux < 500) {
    skyEl.style.background = 'linear-gradient(180deg,#0f172a 0%,#1e3a5f 50%,#7c3aed22 100%)';
  } else if (lux < 1000) {
    skyEl.style.background = 'linear-gradient(180deg,#1e3a5f 0%,#ea580c33 60%,#fef9c3 100%)';
  } else {
    skyEl.style.background = 'linear-gradient(180deg,#bfdbfe 0%,#e0f2fe 60%,#f0f9ff 100%)';
  }

  // Stars visibility
  const starsEl = document.getElementById('stars');
  starsEl.style.opacity = lux < 200 ? '1' : lux < 600 ? String(1 - (lux - 200) / 400) : '0';

  // Moon
  document.getElementById('moon').style.opacity = lux < 400 ? '1' : String(Math.max(0, 1 - (lux - 400) / 600));

  renderChart();
  document.getElementById('chart-pts').textContent = lightState.history.length + ' pts';
}

function renderChart() {
  const canvas = document.getElementById('lux-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 400; canvas.width = W;
  const H = canvas.height; ctx.clearRect(0, 0, W, H);
  const data = lightState.history;
  if (data.length < 2) return;
  const pad = { t: 6, r: 8, b: 18, l: 38 };
  const gW = W - pad.l - pad.r; const gH = H - pad.t - pad.b;
  const MAX = 2000;

  [0, 500, 1000, 1500, 2000].forEach(v => {
    const y = pad.t + gH - (v / MAX) * gH;
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.fillStyle = '#64748b'; ctx.font = '9px sans-serif'; ctx.fillText(v, 0, y + 4);
  });

  // Threshold line
  const ty = pad.t + gH - (lightState.threshold / MAX) * gH;
  ctx.setLineDash([4, 3]); ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(pad.l, ty); ctx.lineTo(W - pad.r, ty); ctx.stroke();
  ctx.setLineDash([]);

  const step = gW / (data.length - 1);
  ctx.beginPath(); ctx.moveTo(pad.l, pad.t + gH - (data[0] / MAX) * gH);
  data.forEach((v, i) => ctx.lineTo(pad.l + i * step, pad.t + gH - (v / MAX) * gH));
  ctx.lineTo(pad.l + (data.length - 1) * step, pad.t + gH);
  ctx.lineTo(pad.l, pad.t + gH); ctx.closePath();
  ctx.fillStyle = 'rgba(180,83,9,0.15)'; ctx.fill();

  ctx.beginPath(); ctx.moveTo(pad.l, pad.t + gH - (data[0] / MAX) * gH);
  data.forEach((v, i) => ctx.lineTo(pad.l + i * step, pad.t + gH - (v / MAX) * gH));
  ctx.strokeStyle = '#b45309'; ctx.lineWidth = 2; ctx.stroke();
}

function togglePause() {
  lightState.paused = !lightState.paused;
  document.getElementById('btn-pause').textContent = lightState.paused ? 'Resume' : 'Pause';
  if (!lightState.paused) { clearTimeout(lightState.simTimer); simTick(); }
}
function resetSim() { lightState.paused = false; clearTimeout(lightState.simTimer); initSimulation(); document.getElementById('btn-pause').textContent = 'Pause'; }
function setSpeed(s, btn) { lightState.speed = s; document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); }
