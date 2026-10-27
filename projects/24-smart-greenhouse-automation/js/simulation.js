/**
 * Project 24 — Smart Greenhouse Automation
 * Simulation Engine: Multi-sensor climate loop, coordinated actuation, dry-run safety lockout
 */

'use strict';

const ghState = {
  temp: 24.5,
  hum: 60,
  moist: 48,
  lux: 850,
  reservoirEmpty: false,
  autoMode: true,
  fanActive: false,
  pumpActive: false,
  manualFan: false,
  manualPump: false,
  fanAngle: 0,
  events: [],
  lastTime: performance.now()
};

function onTempSlider(val) {
  ghState.temp = parseFloat(val);
  document.getElementById('disp-temp').textContent = `${ghState.temp} °C`;
  document.getElementById('val-temp').textContent = `${ghState.temp.toFixed(1)} °C`;
  evaluateClimateAutomation();
}

function onHumSlider(val) {
  ghState.hum = parseInt(val, 10);
  document.getElementById('disp-hum').textContent = `${ghState.hum} %`;
  document.getElementById('val-hum').textContent = `${ghState.hum} %`;
  evaluateClimateAutomation();
}

function onMoistSlider(val) {
  ghState.moist = parseInt(val, 10);
  document.getElementById('disp-moist').textContent = `${ghState.moist} %`;
  document.getElementById('val-moist').textContent = `${ghState.moist} %`;

  // Update soil color depth
  const soilOverlay = document.getElementById('soil-moist-overlay');
  if (soilOverlay) {
    soilOverlay.style.opacity = (ghState.moist / 100 * 0.6).toFixed(2);
  }

  evaluateClimateAutomation();
}

function onLuxSlider(val) {
  ghState.lux = parseInt(val, 10);
  document.getElementById('disp-lux').textContent = `${ghState.lux} Lux`;
  document.getElementById('val-lux').textContent = `${ghState.lux} Lux`;

  // Scale sun orb opacity
  const sun = document.getElementById('sun-orb');
  if (sun) {
    sun.style.opacity = Math.max(0.2, Math.min(1.0, ghState.lux / 1000)).toFixed(2);
  }
}

function toggleTankEmpty(isEmpty) {
  ghState.reservoirEmpty = isEmpty;
  const sub = document.getElementById('tank-level-sub');
  if (sub) {
    sub.textContent = isEmpty ? 'RESERVOIR EMPTY (PUMP LOCKED OUT)' : 'Sufficient water in reservoir';
    sub.style.color = isEmpty ? '#ef4444' : '';
  }

  if (isEmpty) {
    logEvent('SAFETY ALERT: Float switch indicates water reservoir is EMPTY! Immediate pump interlock engaged.');
  } else {
    logEvent('Water reservoir level restored to normal.');
  }

  evaluateClimateAutomation();
}

function setAutoMode(isAuto) {
  ghState.autoMode = isAuto;
  document.getElementById('gh-auto-btn').classList.toggle('btn-primary', isAuto);
  document.getElementById('gh-auto-btn').classList.toggle('btn-subtle', !isAuto);
  document.getElementById('gh-man-btn').classList.toggle('btn-primary', !isAuto);
  document.getElementById('gh-man-btn').classList.toggle('btn-subtle', isAuto);

  document.getElementById('manual-controls-group').style.display = isAuto ? 'none' : '';
  logEvent(`Greenhouse climate control set to ${isAuto ? 'AUTOMATIC' : 'MANUAL'}`);
  evaluateClimateAutomation();
}

function toggleManualFan() {
  ghState.manualFan = !ghState.manualFan;
  logEvent(`Manual command: Fan ${ghState.manualFan ? 'ENABLED' : 'DISABLED'}`);
  evaluateClimateAutomation();
}

function toggleManualPump() {
  if (ghState.reservoirEmpty && !ghState.manualPump) {
    alert('Cannot activate irrigation pump: Water reservoir is empty (Dry-run safety interlock)!');
    return;
  }
  ghState.manualPump = !ghState.manualPump;
  logEvent(`Manual command: Pump ${ghState.manualPump ? 'ENABLED' : 'DISABLED'}`);
  evaluateClimateAutomation();
}

function evaluateClimateAutomation() {
  let shouldFan = false;
  let shouldPump = false;

  if (ghState.autoMode) {
    // Ventilation Fan Hysteresis (Cut-in: Temp >= 28°C OR Hum >= 75%)
    if (ghState.fanActive) {
      shouldFan = (ghState.temp > 26.0 || ghState.hum > 70);
    } else {
      shouldFan = (ghState.temp >= 28.0 || ghState.hum >= 75);
    }

    // Irrigation Pump Hysteresis (Cut-in: Soil Moisture <= 35%, Cut-out: >= 60%)
    if (!ghState.reservoirEmpty) {
      if (ghState.pumpActive) {
        shouldPump = (ghState.moist < 60);
      } else {
        shouldPump = (ghState.moist <= 35);
      }
    } else {
      shouldPump = false; // Interlock lockout
    }
  } else {
    shouldFan = ghState.manualFan;
    shouldPump = ghState.manualPump && !ghState.reservoirEmpty;
  }

  // Update Fan state
  if (shouldFan !== ghState.fanActive) {
    ghState.fanActive = shouldFan;
    logEvent(`Exhaust Fan ${shouldFan ? 'STARTED (Ventilating greenhouse)' : 'STOPPED'}`);
    if (appMode === 'hw' && hwClient) sendHwActuators();
  }

  // Update Pump state
  if (shouldPump !== ghState.pumpActive) {
    ghState.pumpActive = shouldPump;
    logEvent(`Irrigation Pump ${shouldPump ? 'ACTIVATED (Drip lines active)' : 'HALTED'}`);
    if (appMode === 'hw' && hwClient) sendHwActuators();
  }

  updateActuatorVisuals();
}

function updateActuatorVisuals() {
  // Fan Card
  const fanCard = document.getElementById('act-fan-card');
  const fanPill = document.getElementById('act-fan-pill');
  if (fanCard) fanCard.classList.toggle('active', ghState.fanActive);
  if (fanPill) {
    fanPill.textContent = ghState.fanActive ? 'VENTILATING' : 'IDLE';
    fanPill.className = 'status-pill ' + (ghState.fanActive ? 'status-ok' : 'status-idle');
  }

  // Pump Card
  const pumpCard = document.getElementById('act-pump-card');
  const pumpPill = document.getElementById('act-pump-pill');
  if (pumpCard) pumpCard.classList.toggle('active', ghState.pumpActive);
  if (pumpPill) {
    if (ghState.reservoirEmpty) {
      pumpPill.textContent = 'LOCKOUT';
      pumpPill.className = 'status-pill status-danger';
    } else {
      pumpPill.textContent = ghState.pumpActive ? 'IRRIGATING' : 'IDLE';
      pumpPill.className = 'status-pill ' + (ghState.pumpActive ? 'status-ok' : 'status-idle');
    }
  }

  // Overall Climate Status Badge
  const badge = document.getElementById('gh-status-badge');
  if (badge) {
    if (ghState.reservoirEmpty) {
      badge.textContent = 'TANK EMPTY';
      badge.className = 'status-pill status-danger';
    } else if (ghState.fanActive || ghState.pumpActive) {
      badge.textContent = 'REGULATING';
      badge.className = 'status-pill status-warn';
    } else {
      badge.textContent = 'OPTIMAL';
      badge.className = 'status-pill status-ok';
    }
  }
}

function animLoop(now) {
  const dt = Math.min(0.1, (now - ghState.lastTime) / 1000);
  ghState.lastTime = now;

  if (ghState.fanActive) {
    ghState.fanAngle = (ghState.fanAngle + 600 * dt) % 360;
    const fanBlades = document.getElementById('gh-fan-blades');
    if (fanBlades) {
      fanBlades.setAttribute('transform', `rotate(${ghState.fanAngle.toFixed(1)} 225 55)`);
    }
  }

  // Drip line animation
  const dripLine = document.getElementById('drip-line');
  if (dripLine) {
    dripLine.style.stroke = ghState.pumpActive ? '#0284c7' : 'transparent';
  }

  requestAnimationFrame(animLoop);
}

function logEvent(msg) {
  const time = new Date().toLocaleTimeString();
  ghState.events.unshift({ msg, time });
  if (ghState.events.length > 25) ghState.events.pop();

  const list = document.getElementById('event-list');
  if (!list) return;

  list.innerHTML = ghState.events.map(e => `
    <div class="event-item">
      <div class="event-dot"></div>
      <div>${e.msg}</div>
      <div class="event-time">${e.time}</div>
    </div>
  `).join('');
}

function clearEventLog() {
  ghState.events = [];
  const list = document.getElementById('event-list');
  if (list) list.innerHTML = '<div class="event-empty">No automation events recorded.</div>';
}

window.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(animLoop);
  evaluateClimateAutomation();
});
