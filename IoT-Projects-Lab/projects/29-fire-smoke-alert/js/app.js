/**
 * Project 29: Fire & Smoke Alert - Application Controller
 */

let currentMode = 'sim';
let espClient = null;
let incidentEvents = [];

document.addEventListener('DOMContentLoaded', () => {
  SmokeSim.init();
  updateUI();
});

function setMode(mode) {
  currentMode = mode;
  document.getElementById('mode-btn-sim').classList.toggle('active', mode === 'sim');
  document.getElementById('mode-btn-hw').classList.toggle('active', mode === 'hw');

  const statusText = document.getElementById('status-text');
  const simControls = document.getElementById('sim-controls');

  if (mode === 'sim') {
    statusText.textContent = 'Simulating';
    simControls.style.display = 'flex';
    if (espClient) espClient.stopPolling();
  } else {
    statusText.textContent = 'Hardware Mode';
    simControls.style.display = 'none';
    if (espClient) espClient.startPolling();
  }
}

function updateUI() {
  const ppm = SmokeSim.smokePpm;
  const thres = SmokeSim.thresholdPpm;
  const flame = SmokeSim.flameDetected;
  const isAlarm = (ppm >= thres) || flame;
  const isWarning = (!isAlarm && ppm > (thres * 0.65));

  // Banner
  const banner = document.getElementById('emergency-banner');
  const bTitle = document.getElementById('banner-title');
  const bSub = document.getElementById('banner-sub');

  if (banner) {
    banner.className = 'card emergency-banner';
    if (isAlarm) {
      banner.classList.add('alarm');
      bTitle.textContent = flame ? 'EMERGENCY: OPEN FLAME DETECTED!' : 'EMERGENCY: SMOKE THRESHOLD EXCEEDED!';
      bSub.textContent = flame ? 'Optical phototransistor detected infrared flame radiation. Sounding evacuation buzzer.' : 'Smoke density at hazardous levels. Exhaust ventilation activated.';
    } else if (isWarning) {
      banner.classList.add('warning');
      bTitle.textContent = 'CAUTION: ELEVATED SMOKE READINGS';
      bSub.textContent = 'Combustion aerosols detected approaching threshold limits.';
    } else {
      bTitle.textContent = 'STATUS: NORMAL CONDITIONS';
      bSub.textContent = 'Smoke concentration well below safety threshold. Optical flame sensor clear.';
    }
  }

  // Flame Indicator
  const flameInd = document.getElementById('flame-indicator');
  if (flameInd) {
    flameInd.classList.toggle('active', flame);
    flameInd.querySelector('span').textContent = flame ? 'Optical Flame: ACTIVE HAZARD' : 'Optical Flame: Inactive';
  }

  // Metrics
  const valPpm = document.getElementById('val-smoke-ppm');
  const valTier = document.getElementById('val-smoke-tier');
  const valFlame = document.getElementById('val-flame-state');

  if (valPpm) valPpm.textContent = ppm;
  if (valTier) {
    if (ppm < 120) valTier.textContent = 'Clean Atmosphere';
    else if (ppm < 250) valTier.textContent = 'Hazy / Ambient Dust';
    else valTier.textContent = 'Toxic Smoke Density';
  }
  if (valFlame) {
    valFlame.textContent = flame ? 'FIRE DETECTED' : 'Clear';
    valFlame.style.color = flame ? '#e11d48' : '#059669';
  }
}

function setScenario(scen) {
  if (scen === 'clean') {
    SmokeSim.smokePpm = 60;
    SmokeSim.flameDetected = false;
    logIncident('Normal', 'Atmosphere returned to baseline clean air (60 PPM)');
  } else if (scen === 'smolder') {
    SmokeSim.smokePpm = 220;
    SmokeSim.flameDetected = false;
    logIncident('Warning', 'Smoldering paper aerosol plume simulated (220 PPM)');
  } else if (scen === 'fire') {
    SmokeSim.smokePpm = 550;
    SmokeSim.flameDetected = true;
    logIncident('CRITICAL ALARM', 'Open flame & dense combustion smoke detected (550 PPM)');
  } else if (scen === 'warmup') {
    SmokeSim.smokePpm = 45;
    SmokeSim.flameDetected = false;
    const badge = document.getElementById('warmup-badge');
    if (badge) {
      badge.textContent = 'Heater Preheating… (20s)';
      badge.style.background = '#fef3c7';
      badge.style.color = '#b45309';
      setTimeout(() => {
        badge.textContent = 'Sensor Warmed Up';
        badge.style.background = '#e0f2fe';
        badge.style.color = '#0369a1';
      }, 3000);
    }
    logIncident('Diagnostics', 'Simulated 24-hr heater thermal preheat cycle');
  }
  updateUI();
}

function updateThreshold(val) {
  SmokeSim.thresholdPpm = parseInt(val, 10);
  document.getElementById('val-threshold').textContent = val;
  document.getElementById('threshold-display').textContent = `${val} PPM`;
  updateUI();
}

function toggleAudioAlarm() {
  SmokeSim.audioMuted = !SmokeSim.audioMuted;
  const btn = document.getElementById('audio-toggle-btn');
  if (btn) {
    btn.textContent = SmokeSim.audioMuted ? '🔇 Siren Muted' : '🔊 Siren Enabled';
  }
}

function logIncident(tier, text) {
  const time = new Date().toLocaleTimeString();
  incidentEvents.unshift({ time, tier, text });
  if (incidentEvents.length > 25) incidentEvents.pop();

  const container = document.getElementById('event-list');
  if (!container) return;

  container.innerHTML = incidentEvents.map(e => `
    <div class="event-item" style="padding:6px 0;border-bottom:1px solid var(--border-subtle);font-size:0.8rem;">
      <span class="meta-text" style="font-family:monospace;margin-right:6px;">[${e.time}]</span>
      <strong style="color:${e.tier.includes('ALARM') ? '#e11d48' : (e.tier.includes('Warning') ? '#d97706' : '#059669')};margin-right:6px;">${e.tier}:</strong>
      <span>${e.text}</span>
    </div>
  `).join('');
}

function clearEventLog() {
  incidentEvents = [];
  const container = document.getElementById('event-list');
  if (container) container.innerHTML = '<div class="event-empty">No hazardous events recorded.</div>';
}

// Hardware Link
function hwConnect() {
  const ip = document.getElementById('hw-ip-input').value.trim();
  const errMsg = document.getElementById('hw-error-msg');
  const lastSeen = document.getElementById('hw-last-seen');

  if (errMsg) errMsg.style.display = 'none';

  espClient = new ESP8266Client({
    baseUrl: ip,
    expectedProjectId: '29-fire-smoke-alert',
    pollIntervalMs: 1500,
    onData: (data) => {
      if (lastSeen) lastSeen.textContent = `Live Telemetry: ${new Date().toLocaleTimeString()}`;
      if (data.smoke_ppm !== undefined) SmokeSim.smokePpm = data.smoke_ppm;
      if (data.flame_detected !== undefined) SmokeSim.flameDetected = data.flame_detected;
      updateUI();
    },
    onError: (err) => {
      if (errMsg) {
        errMsg.textContent = `Hardware Error: ${err.message}`;
        errMsg.style.display = 'block';
      }
    }
  });

  espClient.testConnection().then(res => {
    if (res.success) {
      if (window.CommonUI) CommonUI.toast('Connected to ESP8266 Fire Alert Unit!', 'success');
      espClient.startPolling();
    }
  });
}
