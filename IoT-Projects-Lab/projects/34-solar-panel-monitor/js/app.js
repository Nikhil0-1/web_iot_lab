/**
 * Project 34: Solar Panel Monitor - Application Controller
 */

let currentMode = 'sim';
let espClient = null;

document.addEventListener('DOMContentLoaded', () => {
  SolarSim.init();
  setInterval(updateUI, 1000);
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
  const v = SolarSim.voltage;
  const ma = SolarSim.currentMa;
  const w = SolarSim.powerW;
  const wh = SolarSim.dailyWh;

  document.getElementById('val-solar-volts').textContent = v.toFixed(1);
  document.getElementById('val-solar-ma').textContent = ma;
  document.getElementById('val-solar-power').textContent = w.toFixed(1);
  document.getElementById('val-daily-wh').textContent = wh.toFixed(1);

  const badge = document.getElementById('sunlight-badge');
  const sub = document.getElementById('solar-sub');

  if (badge) {
    if (SolarSim.sunIntensity > 0.8) {
      badge.textContent = 'Peak Direct Sunlight';
      badge.style.background = '#fef3c7'; badge.style.color = '#b45309';
    } else if (SolarSim.sunIntensity > 0.3) {
      badge.textContent = 'Diffuse / Overcast';
      badge.style.background = '#e2e8f0'; badge.style.color = '#475569';
    } else if (SolarSim.sunIntensity > 0.05) {
      badge.textContent = 'Low Angle Sunset';
      badge.style.background = '#ffedd5'; badge.style.color = '#c2410c';
    } else {
      badge.textContent = 'Night / Dormant';
      badge.style.background = '#0f172a'; badge.style.color = '#94a3b8';
    }
  }

  if (sub) {
    sub.textContent = `Daylight Factor: ${(SolarSim.sunIntensity * 100).toFixed(0)}% · INA219 Shunt Active`;
  }
}

function setSunlight(type) {
  SolarSim.setSunlight(type);
  updateUI();
  if (window.CommonUI) CommonUI.toast(`Simulating solar condition: ${type.toUpperCase()}`, 'info');
}

// Hardware Link
function hwConnect() {
  const ip = document.getElementById('hw-ip-input').value.trim();
  const errMsg = document.getElementById('hw-error-msg');
  const lastSeen = document.getElementById('hw-last-seen');

  if (errMsg) errMsg.style.display = 'none';

  espClient = new ESP8266Client({
    baseUrl: ip,
    expectedProjectId: '34-solar-panel-monitor',
    pollIntervalMs: 1500,
    onData: (data) => {
      if (lastSeen) lastSeen.textContent = `Live Telemetry: ${new Date().toLocaleTimeString()}`;
      if (data.bus_voltage_v !== undefined) SolarSim.voltage = data.bus_voltage_v;
      if (data.current_ma !== undefined) SolarSim.currentMa = data.current_ma;
      if (data.power_w !== undefined) SolarSim.powerW = data.power_w;
      if (data.daily_wh !== undefined) SolarSim.dailyWh = data.daily_wh;
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
      if (window.CommonUI) CommonUI.toast('Connected to ESP8266 Solar Node!', 'success');
      espClient.startPolling();
    }
  });
}
