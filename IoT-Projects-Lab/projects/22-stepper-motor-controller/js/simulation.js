/**
 * Project 22 — Stepper Motor Controller
 * Simulation Engine: Step generation, coordinate indexing, limit switch trip model
 */

'use strict';

const stepperState = {
  currentStep: 0,
  targetStep: 0,
  stepRate: 400,     // Pulses Per Second (PPS)
  stepAngleDeg: 1.8, // Standard 200 steps/rev
  minLimit: -400,
  maxLimit: 400,
  isHoming: false,
  events: [],
  lastTime: performance.now()
};

function onPositionSlider(val) {
  const steps = parseInt(val, 10);
  moveTo(steps);
}

function onSpeedInput(val) {
  stepperState.stepRate = parseInt(val, 10);
  document.getElementById('speed-disp').textContent = `${stepperState.stepRate} PPS`;
  document.getElementById('m-pps').textContent = `${stepperState.stepRate} PPS`;
  logEvent(`Step rate set to ${stepperState.stepRate} PPS`);
}

function jogSteps(delta) {
  moveTo(stepperState.targetStep + delta);
}

function moveTo(target) {
  // Check limit boundaries
  if (target < stepperState.minLimit) {
    target = stepperState.minLimit;
    logEvent('WARNING: Movement clamped to CCW hardware limit switch');
  } else if (target > stepperState.maxLimit) {
    target = stepperState.maxLimit;
    logEvent('WARNING: Movement clamped to CW hardware limit switch');
  }

  stepperState.targetStep = target;
  document.getElementById('pos-disp').textContent = `${target} steps`;
  document.getElementById('m-target-step').textContent = target;

  const slider = document.getElementById('pos-slider');
  if (slider) slider.value = target;

  logEvent(`Index command: Move to target step ${target}`);

  if (appMode === 'hw' && hwClient) {
    sendHwMove(target, stepperState.stepRate);
  }
}

function homeAxis() {
  stepperState.isHoming = true;
  logEvent('Homing sequence initiated: Traversing towards coordinate 0');
  moveTo(0);
}

function zeroCoordinates() {
  stepperState.currentStep = 0;
  stepperState.targetStep = 0;
  document.getElementById('pos-disp').textContent = '0 steps';
  document.getElementById('m-target-step').textContent = '0';
  const slider = document.getElementById('pos-slider');
  if (slider) slider.value = 0;
  logEvent('Coordinate system zeroed. Current position set to origin (0)');
}

function abortMotion() {
  stepperState.targetStep = Math.round(stepperState.currentStep);
  document.getElementById('pos-disp').textContent = `${stepperState.targetStep} steps`;
  document.getElementById('m-target-step').textContent = stepperState.targetStep;
  const slider = document.getElementById('pos-slider');
  if (slider) slider.value = stepperState.targetStep;
  logEvent('Motion aborted! Motor holding current position.');
}

function updateStepperPhysics(dt) {
  const diff = stepperState.targetStep - stepperState.currentStep;

  if (Math.abs(diff) > 0.01) {
    const dir = diff > 0 ? 1 : -1;
    const stepDelta = dir * stepperState.stepRate * dt;

    if (Math.abs(stepDelta) >= Math.abs(diff)) {
      stepperState.currentStep = stepperState.targetStep;
      if (stepperState.isHoming) {
        stepperState.isHoming = false;
        logEvent('Homing sequence complete: Origin verified.');
      }
    } else {
      stepperState.currentStep += stepDelta;
    }
  }

  const roundedStep = Math.round(stepperState.currentStep);
  const currentDeg = (stepperState.currentStep * stepperState.stepAngleDeg);
  const normalizedDeg = ((currentDeg % 360) + 360) % 360;

  // Rotate compass needle
  const pointer = document.getElementById('stepper-pointer');
  if (pointer) {
    pointer.setAttribute('transform', `rotate(${currentDeg.toFixed(1)} 110 110)`);
  }

  // Live Readouts
  document.getElementById('live-steps').textContent = roundedStep;
  document.getElementById('live-deg').textContent = `${currentDeg.toFixed(1)}° · ABSOLUTE POSITION`;

  // Limit Switch Chips
  const ccwTripped = (roundedStep <= stepperState.minLimit);
  const cwTripped = (roundedStep >= stepperState.maxLimit);

  const chipCcw = document.getElementById('chip-ccw-limit');
  const chipCw = document.getElementById('chip-cw-limit');
  if (chipCcw) chipCcw.classList.toggle('tripped', ccwTripped);
  if (chipCw) chipCw.classList.toggle('tripped', cwTripped);

  // Status Badge
  const badge = document.getElementById('stepper-status-badge');
  if (badge) {
    if (Math.abs(diff) > 0.1) {
      badge.textContent = stepperState.isHoming ? 'HOMING' : 'INDEXING';
      badge.className = 'status-pill status-warn';
    } else {
      badge.textContent = 'HOLDING';
      badge.className = 'status-pill status-ok';
    }
  }
}

function animLoop(now) {
  const dt = Math.min(0.1, (now - stepperState.lastTime) / 1000);
  stepperState.lastTime = now;

  updateStepperPhysics(dt);

  requestAnimationFrame(animLoop);
}

function logEvent(msg) {
  const time = new Date().toLocaleTimeString();
  stepperState.events.unshift({ msg, time });
  if (stepperState.events.length > 25) stepperState.events.pop();

  const list = document.getElementById('event-list');
  if (!list) return;

  list.innerHTML = stepperState.events.map(e => `
    <div class="event-item">
      <div class="event-dot"></div>
      <div>${e.msg}</div>
      <div class="event-time">${e.time}</div>
    </div>
  `).join('');
}

function clearEventLog() {
  stepperState.events = [];
  const list = document.getElementById('event-list');
  if (list) list.innerHTML = '<div class="event-empty">No motion commands logged.</div>';
}

window.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(animLoop);
  moveTo(0);
});
