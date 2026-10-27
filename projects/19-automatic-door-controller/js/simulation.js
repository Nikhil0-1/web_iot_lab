/**
 * Project 19 — Automatic Door Controller
 * Simulation Engine: Proximity ultrasonic model, servo gate state machine, obstruction interlock
 */

'use strict';

const doorState = {
  distance: 150,     // cm
  threshold: 60,     // cm
  autoMode: true,
  state: 'CLOSED',   // 'CLOSED' | 'OPENING' | 'HOLDING' | 'CLOSING'
  doorProgress: 0,   // 0 (closed) to 1 (open)
  servoAngle: 0,     // 0° (closed) to 90° (open)
  holdTimer: 0,      // seconds remaining
  holdDuration: 3.5, // seconds
  obstructed: false,
  events: [],
  lastTime: performance.now()
};

function onDistanceInput(val) {
  doorState.distance = parseInt(val, 10);
  document.getElementById('slider-dist-disp').textContent = `${doorState.distance} cm`;
  document.getElementById('m-dist').textContent = `${doorState.distance} cm`;

  // Scale person avatar based on distance
  const avatar = document.getElementById('approach-avatar');
  if (avatar) {
    const scale = Math.max(0.3, Math.min(1.2, 1.4 - (doorState.distance / 200)));
    const op = Math.max(0.2, Math.min(1.0, 1.3 - (doorState.distance / 200)));
    avatar.style.transform = `scale(${scale.toFixed(2)})`;
    avatar.style.opacity = op.toFixed(2);
  }
}

function onThreshInput(val) {
  doorState.threshold = parseInt(val, 10);
  document.getElementById('slider-thresh-disp').textContent = `${doorState.threshold} cm`;
  logEvent(`Proximity threshold set to ${doorState.threshold} cm`);
}

function setAutoMode(isAuto) {
  doorState.autoMode = isAuto;
  document.getElementById('door-auto-btn').classList.toggle('btn-primary', isAuto);
  document.getElementById('door-auto-btn').classList.toggle('btn-subtle', !isAuto);
  document.getElementById('door-man-btn').classList.toggle('btn-primary', !isAuto);
  document.getElementById('door-man-btn').classList.toggle('btn-subtle', isAuto);

  document.getElementById('manual-controls-group').style.display = isAuto ? 'none' : '';
  logEvent(`Door operator mode switched to ${isAuto ? 'AUTOMATIC' : 'MANUAL'}`);
}

function toggleObstruction(isObstructed) {
  doorState.obstructed = isObstructed;
  const beam = document.getElementById('safety-beam');
  const msg = document.getElementById('beam-msg');

  if (beam) beam.classList.toggle('tripped', isObstructed);
  if (msg) msg.style.display = isObstructed ? '' : 'none';

  if (isObstructed) {
    logEvent('SAFETY ALERT: Optical safety beam interrupted! Pathway blocked.');
    if (doorState.state === 'CLOSING' || doorState.state === 'CLOSED') {
      triggerOpen('Safety Obstruction Re-open');
    }
  } else {
    logEvent('Safety beam restored clear.');
  }
}

function manualDoorCommand(cmd) {
  if (cmd === 'OPEN') {
    triggerOpen('Manual Operator Command');
  } else if (cmd === 'CLOSE') {
    if (doorState.obstructed) {
      alert('Cannot close door while safety beam is obstructed!');
      return;
    }
    doorState.state = 'CLOSING';
    logEvent('Manual Operator: Initiated closing sequence');
  }
}

function simulateApproach() {
  const slider = document.getElementById('slider-dist');
  slider.value = 35;
  onDistanceInput(35);
  logEvent('Scenario: Person walked within proximity (35 cm)');
}

function simulateDepart() {
  const slider = document.getElementById('slider-dist');
  slider.value = 180;
  onDistanceInput(180);
  logEvent('Scenario: Person departed (180 cm)');
}

function triggerOpen(reason) {
  if (doorState.state !== 'HOLDING' && doorState.state !== 'OPENING') {
    doorState.state = 'OPENING';
    logEvent(`Door triggered: ${reason}`);
    if (appMode === 'hw' && hwClient) {
      sendHwDoor('OPEN');
    }
  }
  doorState.holdTimer = doorState.holdDuration;
}

function updateDoorStateMachine(dt) {
  const openingEl = document.querySelector('.door-opening');

  // Auto trigger check
  if (doorState.autoMode) {
    if (doorState.distance <= doorState.threshold) {
      triggerOpen('Person in proximity zone');
    }
  }

  // State transitions
  if (doorState.state === 'OPENING') {
    doorState.doorProgress += dt * 1.5; // Opens in ~0.7 seconds
    if (doorState.doorProgress >= 1.0) {
      doorState.doorProgress = 1.0;
      doorState.state = 'HOLDING';
      doorState.holdTimer = doorState.holdDuration;
    }
  } else if (doorState.state === 'HOLDING') {
    if (doorState.obstructed || (doorState.autoMode && doorState.distance <= doorState.threshold)) {
      doorState.holdTimer = doorState.holdDuration; // Keep resetting hold timer while person is present
    } else {
      doorState.holdTimer -= dt;
      if (doorState.holdTimer <= 0) {
        doorState.holdTimer = 0;
        doorState.state = 'CLOSING';
        logEvent('Hold time elapsed. Initiating door closure');
      }
    }
  } else if (doorState.state === 'CLOSING') {
    if (doorState.obstructed) {
      triggerOpen('Obstruction during closure');
    } else {
      doorState.doorProgress -= dt * 1.0; // Closes slightly slower for safety
      if (doorState.doorProgress <= 0) {
        doorState.doorProgress = 0;
        doorState.state = 'CLOSED';
        logEvent('Door fully closed and latched');
        if (appMode === 'hw' && hwClient) {
          sendHwDoor('CLOSE');
        }
      }
    }
  }

  // Sync visuals
  if (openingEl) {
    openingEl.classList.toggle('open', doorState.doorProgress > 0.05);
  }

  // Update servo angle proportional to progress (0° closed to 90° open)
  doorState.servoAngle = Math.round(doorState.doorProgress * 90);

  // Update telemetry
  document.getElementById('m-state').textContent = doorState.state;
  document.getElementById('m-servo').textContent = `${doorState.servoAngle}°`;
  document.getElementById('m-hold').textContent = `${doorState.holdTimer.toFixed(1)} s`;

  const badge = document.getElementById('door-status-badge');
  if (badge) {
    badge.textContent = doorState.state;
    if (doorState.state === 'CLOSED') badge.className = 'status-pill status-idle';
    else if (doorState.state === 'HOLDING') badge.className = 'status-pill status-ok';
    else badge.className = 'status-pill status-warn';
  }
}

function animLoop(now) {
  const dt = Math.min(0.1, (now - doorState.lastTime) / 1000);
  doorState.lastTime = now;

  updateDoorStateMachine(dt);

  requestAnimationFrame(animLoop);
}

function logEvent(msg) {
  const time = new Date().toLocaleTimeString();
  doorState.events.unshift({ msg, time });
  if (doorState.events.length > 25) doorState.events.pop();

  const list = document.getElementById('event-list');
  if (!list) return;

  list.innerHTML = doorState.events.map(e => `
    <div class="event-item">
      <div class="event-dot"></div>
      <div>${e.msg}</div>
      <div class="event-time">${e.time}</div>
    </div>
  `).join('');
}

function clearEventLog() {
  doorState.events = [];
  const list = document.getElementById('event-list');
  if (list) list.innerHTML = '<div class="event-empty">No door movements recorded.</div>';
}

window.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(animLoop);
  onDistanceInput(150);
});
