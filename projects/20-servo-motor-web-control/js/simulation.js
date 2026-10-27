/**
 * Project 20 — Servo Motor Web Control
 * Simulation Engine: Mechanical angle positioning, continuous sweep generator, PWM calculations, canvas chart
 */

'use strict';

const servoState = {
  angle: 90,           // 0 to 180 degrees
  displayAngle: 90,    // smooth visual interpolation
  sweepActive: false,
  sweepDir: 1,         // 1 or -1
  sweepSpeed: 60,      // degrees per second
  history: [],
  events: [],
  lastTime: performance.now()
};

function onAngleSlider(val) {
  const angle = parseInt(val, 10);
  setServoAngle(angle);
  updatePresetButtons(angle);
}

function setPreset(angle) {
  const slider = document.getElementById('angle-slider');
  if (slider) slider.value = angle;
  setServoAngle(angle);
  updatePresetButtons(angle);
}

function updatePresetButtons(angle) {
  document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
  const match = document.getElementById(`btn-ang-${angle}`);
  if (match) match.classList.add('active');
}

function centerServo() {
  setPreset(90);
}

function toggleSweep(enabled) {
  servoState.sweepActive = enabled;
  logEvent(`Sweep generator ${enabled ? 'STARTED (Oscillating 0°–180°)' : 'STOPPED'}`);
}

function setServoAngle(angle) {
  servoState.angle = Math.max(0, Math.min(180, angle));

  document.getElementById('slider-angle-disp').textContent = `${servoState.angle}°`;
  document.getElementById('live-angle').textContent = `${servoState.angle}°`;
  document.getElementById('m-angle').textContent = `${servoState.angle}°`;

  // Standard 50Hz Servo pulse width: 1000µs (0°) to 2000µs (180°), 1500µs center
  const pulseWidth = Math.round(1000 + (servoState.angle / 180) * 1000);
  document.getElementById('m-pulse').textContent = `${pulseWidth} µs`;

  // Duty cycle for 20ms period (50Hz)
  const duty = ((pulseWidth / 20000) * 100).toFixed(1);
  document.getElementById('m-duty').textContent = `${duty} %`;

  // SVG Horn transformation (rotate around pivot 120, 150)
  // At 0°, angle is pointing left; at 90°, straight up; at 180°, pointing right
  const horn = document.getElementById('servo-horn');
  if (horn) {
    // 0 deg in SVG arm coordinates: arm was drawn vertical at 90.
    // So rotation = servoState.angle - 90
    horn.setAttribute('transform', `rotate(${servoState.angle - 90} 120 150)`);
  }

  // Update Status Badge
  const badge = document.getElementById('servo-status-badge');
  if (badge) {
    badge.textContent = `HOLDING ${servoState.angle}°`;
  }

  logEvent(`Servo positioned to ${servoState.angle}°`);

  if (appMode === 'hw' && hwClient) {
    sendHwAngle(servoState.angle);
  }
}

function updateSweep(dt) {
  if (!servoState.sweepActive) return;

  servoState.angle += servoState.sweepDir * servoState.sweepSpeed * dt;
  if (servoState.angle >= 180) {
    servoState.angle = 180;
    servoState.sweepDir = -1;
  } else if (servoState.angle <= 0) {
    servoState.angle = 0;
    servoState.sweepDir = 1;
  }

  const rounded = Math.round(servoState.angle);
  const slider = document.getElementById('angle-slider');
  if (slider) slider.value = rounded;

  document.getElementById('slider-angle-disp').textContent = `${rounded}°`;
  document.getElementById('live-angle').textContent = `${rounded}°`;
  document.getElementById('m-angle').textContent = `${rounded}°`;

  const pulseWidth = Math.round(1000 + (rounded / 180) * 1000);
  document.getElementById('m-pulse').textContent = `${pulseWidth} µs`;

  const duty = ((pulseWidth / 20000) * 100).toFixed(1);
  document.getElementById('m-duty').textContent = `${duty} %`;

  const horn = document.getElementById('servo-horn');
  if (horn) {
    horn.setAttribute('transform', `rotate(${rounded - 90} 120 150)`);
  }

  updatePresetButtons(rounded);
}

function recordHistory() {
  servoState.history.push(servoState.angle);
  if (servoState.history.length > 50) servoState.history.shift();

  const ptsEl = document.getElementById('chart-pts');
  if (ptsEl) ptsEl.textContent = `${servoState.history.length} pts`;

  renderChart();
}

function renderChart() {
  const canvas = document.getElementById('servo-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.parentElement.clientWidth || 300;
  const h = canvas.height = 120;

  ctx.clearRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = 20; y < h; y += 30) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  if (servoState.history.length < 2) return;

  const stepX = w / (servoState.history.length - 1);
  ctx.beginPath();
  servoState.history.forEach((ang, i) => {
    const x = i * stepX;
    const y = h - 10 - (ang / 180) * (h - 20);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

function animLoop(now) {
  const dt = Math.min(0.1, (now - servoState.lastTime) / 1000);
  servoState.lastTime = now;

  updateSweep(dt);

  requestAnimationFrame(animLoop);
}

function logEvent(msg) {
  const time = new Date().toLocaleTimeString();
  servoState.events.unshift({ msg, time });
  if (servoState.events.length > 25) servoState.events.pop();

  const list = document.getElementById('event-list');
  if (!list) return;

  list.innerHTML = servoState.events.map(e => `
    <div class="event-item">
      <div class="event-dot"></div>
      <div>${e.msg}</div>
      <div class="event-time">${e.time}</div>
    </div>
  `).join('');
}

function clearEventLog() {
  servoState.events = [];
  const list = document.getElementById('event-list');
  if (list) list.innerHTML = '<div class="event-empty">No angular movements recorded.</div>';
}

window.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(animLoop);
  setInterval(recordHistory, 1000);
  setServoAngle(90);
});
