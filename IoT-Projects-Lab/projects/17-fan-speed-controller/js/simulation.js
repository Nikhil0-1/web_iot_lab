/**
 * Project 17 — Fan Speed Controller
 * Simulation Engine: Rotor dynamics, aerodynamic inertia, PWM mapping, canvas chart
 */

'use strict';

const fanState = {
  targetSpeed: 0,   // 0 - 100%
  currentSpeed: 0,  // 0 - 100% (smooth inertia)
  rotorAngle: 0,
  maxRpm: 2800,
  paused: false,
  history: [],
  events: [],
  lastTime: performance.now()
};

function onSpeedSliderInput(val) {
  const speed = parseInt(val, 10);
  setFanSpeed(speed);
  updatePresetButtons(speed);
}

function setSpeedPreset(speed) {
  const slider = document.getElementById('speed-slider');
  if (slider) slider.value = speed;
  setFanSpeed(speed);
  updatePresetButtons(speed);
}

function updatePresetButtons(speed) {
  document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
  const match = document.getElementById(`btn-p${speed}`);
  if (match) match.classList.add('active');
}

function setFanSpeed(speed) {
  fanState.targetSpeed = Math.max(0, Math.min(100, speed));
  const disp = document.getElementById('speed-display');
  if (disp) disp.textContent = `${fanState.targetSpeed} %`;

  const targetEl = document.getElementById('m-target-spd');
  if (targetEl) targetEl.textContent = `${fanState.targetSpeed} %`;

  logEvent(`Fan target set to ${fanState.targetSpeed}%`);

  if (appMode === 'hw' && hwClient) {
    sendHwSpeed(fanState.targetSpeed);
  }
}

function resetFan() {
  setSpeedPreset(0);
}

function updateFanPhysics(dt) {
  // Smooth aerodynamic inertia
  const diff = fanState.targetSpeed - fanState.currentSpeed;
  const inertiaFactor = diff > 0 ? 3.5 : 2.0; // Accelerates slightly faster than freewheeling coast-down
  fanState.currentSpeed += diff * Math.min(1, dt * inertiaFactor);

  if (Math.abs(diff) < 0.2) {
    fanState.currentSpeed = fanState.targetSpeed;
  }

  // Update rotor angle
  const currentRpm = (fanState.currentSpeed / 100) * fanState.maxRpm;
  const rps = currentRpm / 60;
  fanState.rotorAngle = (fanState.rotorAngle + (rps * 360 * dt)) % 360;

  // Render SVG rotation
  const bladesGroup = document.getElementById('fan-blades-group');
  if (bladesGroup) {
    bladesGroup.setAttribute('transform', `rotate(${fanState.rotorAngle.toFixed(1)} 100 100)`);
  }

  // Update Telemetry Displays
  const liveRpmEl = document.getElementById('live-rpm');
  if (liveRpmEl) liveRpmEl.textContent = Math.round(currentRpm);

  const pwmVal = Math.round((fanState.currentSpeed / 100) * 1023);
  const pwmEl = document.getElementById('m-pwm-val');
  if (pwmEl) pwmEl.textContent = `${pwmVal} / 1023`;

  const voltage = ((fanState.currentSpeed / 100) * 12.0).toFixed(1);
  const voltEl = document.getElementById('m-voltage');
  if (voltEl) voltEl.textContent = `${voltage} V`;

  const airflow = ((fanState.currentSpeed / 100) * 4.6).toFixed(1);
  const airEl = document.getElementById('m-airflow');
  if (airEl) airEl.textContent = `${airflow} m/s`;

  // Status Badge
  const badge = document.getElementById('fan-state-badge');
  if (badge) {
    if (fanState.currentSpeed < 1) {
      badge.textContent = 'STOPPED';
      badge.className = 'status-pill status-idle';
    } else if (fanState.currentSpeed < 40) {
      badge.textContent = 'LOW SPEED';
      badge.className = 'status-pill status-ok';
    } else if (fanState.currentSpeed < 80) {
      badge.textContent = 'NOMINAL';
      badge.className = 'status-pill status-ok';
    } else {
      badge.textContent = 'HIGH VELOCITY';
      badge.className = 'status-pill status-warn';
    }
  }
}

// Chart rendering
function recordHistory() {
  fanState.history.push(fanState.currentSpeed);
  if (fanState.history.length > 50) fanState.history.shift();

  const ptsEl = document.getElementById('chart-pts');
  if (ptsEl) ptsEl.textContent = `${fanState.history.length} pts`;

  renderChart();
}

function renderChart() {
  const canvas = document.getElementById('fan-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.parentElement.clientWidth || 300;
  const h = canvas.height = 120;

  ctx.clearRect(0, 0, w, h);

  // Grid lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = 20; y < h; y += 30) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  if (fanState.history.length < 2) return;

  const stepX = w / (fanState.history.length - 1);
  ctx.beginPath();
  fanState.history.forEach((val, i) => {
    const x = i * stepX;
    const y = h - 10 - (val / 100) * (h - 20);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Gradient fill
  ctx.lineTo((fanState.history.length - 1) * stepX, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(2, 132, 199, 0.25)');
  grad.addColorStop(1, 'rgba(2, 132, 199, 0.0)');
  ctx.fillStyle = grad;
  ctx.fill();
}

// Animation loop
function animLoop(now) {
  const dt = Math.min(0.1, (now - fanState.lastTime) / 1000);
  fanState.lastTime = now;

  if (!fanState.paused) {
    updateFanPhysics(dt);
  }

  requestAnimationFrame(animLoop);
}

function logEvent(msg) {
  const time = new Date().toLocaleTimeString();
  fanState.events.unshift({ msg, time });
  if (fanState.events.length > 25) fanState.events.pop();

  const list = document.getElementById('event-list');
  if (!list) return;

  list.innerHTML = fanState.events.map(e => `
    <div class="event-item">
      <div class="event-dot"></div>
      <div>${e.msg}</div>
      <div class="event-time">${e.time}</div>
    </div>
  `).join('');
}

function clearEventLog() {
  fanState.events = [];
  const list = document.getElementById('event-list');
  if (list) list.innerHTML = '<div class="event-empty">No control events recorded.</div>';
}

window.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(animLoop);
  setInterval(recordHistory, 1000);
});
