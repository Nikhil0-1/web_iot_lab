/**
 * Project 18 — Smart Exhaust Fan
 * Simulation Engine: DHT sensing model, hysteresis ventilation rules, canvas chart
 */

'use strict';

const exhaustState = {
  temp: 25.0,
  hum: 55,
  threshTemp: 30,
  threshHum: 70,
  autoMode: true,
  fanActive: false,
  manualFan: false,
  rotorAngle: 0,
  history: [],
  events: [],
  lastTime: performance.now()
};

function onTempInput(val) {
  exhaustState.temp = parseFloat(val);
  document.getElementById('slider-temp-disp').textContent = `${exhaustState.temp.toFixed(1)} °C`;
  updateEnvironmentalReadings();
}

function onHumInput(val) {
  exhaustState.hum = parseInt(val, 10);
  document.getElementById('slider-hum-disp').textContent = `${exhaustState.hum} %`;
  updateEnvironmentalReadings();
}

function onThreshChange() {
  const t = parseFloat(document.getElementById('thresh-temp').value);
  const h = parseInt(document.getElementById('thresh-hum').value, 10);

  if (!isNaN(t)) exhaustState.threshTemp = t;
  if (!isNaN(h)) exhaustState.threshHum = h;

  logEvent(`Thresholds updated: Temp > ${exhaustState.threshTemp}°C | Hum > ${exhaustState.threshHum}%`);
  evaluateVentilationLogic();
}

function setAutoMode(isAuto) {
  exhaustState.autoMode = isAuto;
  document.getElementById('mode-auto-btn').classList.toggle('btn-primary', isAuto);
  document.getElementById('mode-auto-btn').classList.toggle('btn-subtle', !isAuto);
  document.getElementById('mode-man-btn').classList.toggle('btn-primary', !isAuto);
  document.getElementById('mode-man-btn').classList.toggle('btn-subtle', isAuto);

  document.getElementById('manual-toggle-group').style.display = isAuto ? 'none' : '';
  document.getElementById('m-mode').textContent = isAuto ? 'AUTO' : 'MANUAL';

  logEvent(`Control mode switched to ${isAuto ? 'AUTOMATIC' : 'MANUAL'}`);
  evaluateVentilationLogic();
}

function toggleManualFan() {
  exhaustState.manualFan = !exhaustState.manualFan;
  const btn = document.getElementById('btn-fan-override');
  if (btn) {
    btn.textContent = exhaustState.manualFan ? 'Turn Fan OFF' : 'Turn Fan ON';
    btn.className = exhaustState.manualFan ? 'btn btn-subtle' : 'btn btn-primary';
  }
  logEvent(`Manual override: Fan ${exhaustState.manualFan ? 'ENABLED' : 'DISABLED'}`);
  evaluateVentilationLogic();
}

function applyPreset(preset) {
  if (preset === 'comfortable') {
    setTempAndHum(24, 50);
    logEvent('Preset Applied: Comfortable (24°C / 50%)');
  } else if (preset === 'steamy') {
    setTempAndHum(29, 85);
    logEvent('Preset Applied: Steamy Shower (29°C / 85%)');
  } else if (preset === 'hotkitchen') {
    setTempAndHum(34, 65);
    logEvent('Preset Applied: Hot Kitchen (34°C / 65%)');
  }
}

function setTempAndHum(t, h) {
  exhaustState.temp = t;
  exhaustState.hum = h;

  const st = document.getElementById('slider-temp');
  if (st) st.value = t;
  const sh = document.getElementById('slider-hum');
  if (sh) sh.value = h;

  document.getElementById('slider-temp-disp').textContent = `${t} °C`;
  document.getElementById('slider-hum-disp').textContent = `${h} %`;

  updateEnvironmentalReadings();
}

function updateEnvironmentalReadings() {
  document.getElementById('disp-temp').textContent = `${exhaustState.temp.toFixed(1)} °C`;
  document.getElementById('disp-hum').textContent = `${exhaustState.hum} %`;
  document.getElementById('m-temp').textContent = `${exhaustState.temp.toFixed(1)} °C`;
  document.getElementById('m-hum').textContent = `${exhaustState.hum} %`;

  evaluateVentilationLogic();
}

function evaluateVentilationLogic() {
  let shouldRun = false;

  if (exhaustState.autoMode) {
    // Hysteresis: cut-in vs cut-out
    if (exhaustState.fanActive) {
      // Must fall below threshold minus deadband (2°C and 5% RH) to turn OFF
      const tempCleared = exhaustState.temp <= (exhaustState.threshTemp - 2.0);
      const humCleared = exhaustState.hum <= (exhaustState.threshHum - 5);
      shouldRun = !(tempCleared && humCleared);
    } else {
      // Turns ON if either threshold is breached
      shouldRun = (exhaustState.temp >= exhaustState.threshTemp) || (exhaustState.hum >= exhaustState.threshHum);
    }
  } else {
    shouldRun = exhaustState.manualFan;
  }

  if (shouldRun !== exhaustState.fanActive) {
    exhaustState.fanActive = shouldRun;
    logEvent(`Exhaust Fan ${shouldRun ? 'ACTIVATED (Relay ON)' : 'STOPPED (Relay OFF)'}`);

    if (appMode === 'hw' && hwClient) {
      sendHwControl(shouldRun);
    }
  }

  updateFanVisualState();
}

function updateFanVisualState() {
  const duct = document.querySelector('.duct-housing');
  if (duct) duct.classList.toggle('active', exhaustState.fanActive);

  const badge = document.getElementById('exhaust-status-badge');
  if (badge) {
    badge.textContent = exhaustState.fanActive ? 'VENTILATING' : 'FAN IDLE';
    badge.className = 'status-pill ' + (exhaustState.fanActive ? 'status-ok' : 'status-idle');
  }

  const relayEl = document.getElementById('m-relay');
  if (relayEl) relayEl.textContent = exhaustState.fanActive ? 'ENERGIZED (ON)' : 'DE-ENERGIZED (OFF)';
}

function animLoop(now) {
  const dt = Math.min(0.1, (now - exhaustState.lastTime) / 1000);
  exhaustState.lastTime = now;

  if (exhaustState.fanActive) {
    exhaustState.rotorAngle = (exhaustState.rotorAngle + 720 * dt) % 360;
    const blades = document.getElementById('exhaust-blades');
    if (blades) {
      blades.setAttribute('transform', `rotate(${exhaustState.rotorAngle.toFixed(1)} 50 50)`);
    }
  }

  requestAnimationFrame(animLoop);
}

function recordHistory() {
  exhaustState.history.push({ temp: exhaustState.temp, hum: exhaustState.hum, fan: exhaustState.fanActive });
  if (exhaustState.history.length > 50) exhaustState.history.shift();

  const ptsEl = document.getElementById('chart-pts');
  if (ptsEl) ptsEl.textContent = `${exhaustState.history.length} pts`;

  renderChart();
}

function renderChart() {
  const canvas = document.getElementById('exhaust-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.parentElement.clientWidth || 300;
  const h = canvas.height = 120;

  ctx.clearRect(0, 0, w, h);

  // Background grid
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = 20; y < h; y += 30) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  if (exhaustState.history.length < 2) return;

  const stepX = w / (exhaustState.history.length - 1);

  // Temperature line (coral/amber)
  ctx.beginPath();
  exhaustState.history.forEach((pt, i) => {
    const x = i * stepX;
    const y = h - 10 - ((pt.temp - 10) / 40) * (h - 20);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Humidity line (teal)
  ctx.beginPath();
  exhaustState.history.forEach((pt, i) => {
    const x = i * stepX;
    const y = h - 10 - (pt.hum / 100) * (h - 20);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#0d9488';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function logEvent(msg) {
  const time = new Date().toLocaleTimeString();
  exhaustState.events.unshift({ msg, time });
  if (exhaustState.events.length > 25) exhaustState.events.pop();

  const list = document.getElementById('event-list');
  if (!list) return;

  list.innerHTML = exhaustState.events.map(e => `
    <div class="event-item">
      <div class="event-dot"></div>
      <div>${e.msg}</div>
      <div class="event-time">${e.time}</div>
    </div>
  `).join('');
}

function clearEventLog() {
  exhaustState.events = [];
  const list = document.getElementById('event-list');
  if (list) list.innerHTML = '<div class="event-empty">No ventilation actions recorded.</div>';
}

window.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(animLoop);
  setInterval(recordHistory, 1000);
  updateEnvironmentalReadings();
});
