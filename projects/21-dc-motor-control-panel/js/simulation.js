/**
 * Project 21 — DC Motor Control Panel
 * Simulation Engine: Bidirectional H-bridge dynamics, PWM speed curve, mechanical load & stall model
 */

'use strict';

const motorState = {
  direction: 'FORWARD', // 'FORWARD' | 'REVERSE' | 'BRAKE'
  targetSpeed: 0,       // 0 to 100%
  currentSpeed: 0,      // 0 to 100% (with inertia)
  loadPct: 0,           // 0 to 100% mechanical load
  rotorAngle: 0,
  maxRpm: 3200,
  events: [],
  lastTime: performance.now()
};

function onSpeedSlider(val) {
  const speed = parseInt(val, 10);
  setSpeed(speed);
  updatePresetButtons(speed);
}

function setSpeedPreset(speed) {
  const slider = document.getElementById('speed-slider');
  if (slider) slider.value = speed;
  setSpeed(speed);
  updatePresetButtons(speed);
}

function updatePresetButtons(speed) {
  document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
  const match = document.getElementById(`btn-p-${speed}`);
  if (match) match.classList.add('active');
}

function setDirection(dir) {
  motorState.direction = dir;
  document.querySelectorAll('.dir-btn').forEach(btn => btn.classList.remove('active'));
  if (dir === 'FORWARD') document.getElementById('btn-dir-fwd').classList.add('active');
  else if (dir === 'REVERSE') document.getElementById('btn-dir-rev').classList.add('active');
  else if (dir === 'BRAKE') document.getElementById('btn-dir-brake').classList.add('active');

  logEvent(`H-Bridge set to ${dir}`);

  if (appMode === 'hw' && hwClient) {
    sendHwMotor();
  }
}

function brakeMotor() {
  setDirection('BRAKE');
  setSpeedPreset(0);
}

function stopMotor() {
  brakeMotor();
  logEvent('EMERGENCY STOP executed');
}

function onLoadSlider(val) {
  motorState.loadPct = parseInt(val, 10);
  document.getElementById('load-disp').textContent = `${motorState.loadPct} %`;
  logEvent(`Mechanical load set to ${motorState.loadPct}%`);
}

function setSpeed(speed) {
  motorState.targetSpeed = Math.max(0, Math.min(100, speed));
  document.getElementById('speed-disp').textContent = `${motorState.targetSpeed} %`;
  document.getElementById('m-pwm').textContent = `${motorState.targetSpeed} %`;

  logEvent(`Speed command: ${motorState.targetSpeed}%`);

  if (appMode === 'hw' && hwClient) {
    sendHwMotor();
  }
}

function updateMotorPhysics(dt) {
  // Inertia towards target speed
  const target = (motorState.direction === 'BRAKE') ? 0 : motorState.targetSpeed;
  const diff = target - motorState.currentSpeed;
  const accelRate = (motorState.direction === 'BRAKE') ? 8.0 : 3.0; // Brake halts much faster

  motorState.currentSpeed += diff * Math.min(1.0, dt * accelRate);
  if (Math.abs(diff) < 0.1) motorState.currentSpeed = target;

  // Mechanical load effect on actual RPM
  // High load reduces actual RPM slightly
  const loadDamping = 1.0 - (motorState.loadPct / 100) * 0.35;
  const actualRpm = Math.round((motorState.currentSpeed / 100) * motorState.maxRpm * loadDamping);

  // Rotate rotor
  const dirSign = (motorState.direction === 'REVERSE') ? -1 : 1;
  const rps = (actualRpm / 60) * dirSign;
  motorState.rotorAngle = (motorState.rotorAngle + (rps * 360 * dt)) % 360;

  const rotor = document.getElementById('motor-rotor');
  if (rotor) {
    rotor.setAttribute('transform', `rotate(${motorState.rotorAngle.toFixed(1)} 100 100)`);
  }

  // Current draw calculation (mA)
  // Idle ~120mA, Load adds up to 700mA, Stall up to 1800mA
  let currentMa = 0;
  if (motorState.currentSpeed > 0 && motorState.direction !== 'BRAKE') {
    const baseCurrent = 120 + (motorState.currentSpeed / 100) * 250;
    const loadCurrent = (motorState.loadPct / 100) * (motorState.currentSpeed / 100) * 850;
    currentMa = Math.round(baseCurrent + loadCurrent);
  }
  const powerW = ((12.0 * currentMa) / 1000).toFixed(1);

  // Stall detection: motor has power but speed drops near zero due to 100% load
  const isStalled = (motorState.targetSpeed > 10 && motorState.loadPct > 85 && actualRpm < 250);
  const stallWarn = document.getElementById('stall-warning');
  if (stallWarn) stallWarn.style.display = isStalled ? '' : 'none';

  // Telemetry updates
  document.getElementById('live-rpm').textContent = `${actualRpm} RPM`;
  document.getElementById('m-current').textContent = `${currentMa} mA`;
  document.getElementById('m-power').textContent = `${powerW} W`;

  const dirTextEl = document.getElementById('live-dir');
  const badge = document.getElementById('motor-status-badge');

  if (motorState.direction === 'BRAKE' || actualRpm < 5) {
    if (dirTextEl) dirTextEl.textContent = 'STOPPED / IDLE';
    if (badge) {
      badge.textContent = 'STOPPED';
      badge.className = 'status-pill status-idle';
    }
  } else if (motorState.direction === 'FORWARD') {
    if (dirTextEl) dirTextEl.textContent = 'CLOCKWISE (CW)';
    if (badge) {
      badge.textContent = 'RUNNING CW';
      badge.className = 'status-pill status-ok';
    }
  } else if (motorState.direction === 'REVERSE') {
    if (dirTextEl) dirTextEl.textContent = 'COUNTER-CLOCKWISE (CCW)';
    if (badge) {
      badge.textContent = 'RUNNING CCW';
      badge.className = 'status-pill status-ok';
    }
  }
}

function animLoop(now) {
  const dt = Math.min(0.1, (now - motorState.lastTime) / 1000);
  motorState.lastTime = now;

  updateMotorPhysics(dt);

  requestAnimationFrame(animLoop);
}

function logEvent(msg) {
  const time = new Date().toLocaleTimeString();
  motorState.events.unshift({ msg, time });
  if (motorState.events.length > 25) motorState.events.pop();

  const list = document.getElementById('event-list');
  if (!list) return;

  list.innerHTML = motorState.events.map(e => `
    <div class="event-item">
      <div class="event-dot"></div>
      <div>${e.msg}</div>
      <div class="event-time">${e.time}</div>
    </div>
  `).join('');
}

function clearEventLog() {
  motorState.events = [];
  const list = document.getElementById('event-list');
  if (list) list.innerHTML = '<div class="event-empty">No motor commands recorded.</div>';
}

window.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(animLoop);
  setSpeed(0);
});
