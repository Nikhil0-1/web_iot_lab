/**
 * Project 33: Battery Voltage Monitor - Application Controller
 */

let currentMode = 'sim';
let espClient = null;

document.addEventListener('DOMContentLoaded', () => {
  BatterySim.init();
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
  const v = BatterySim.voltage;
  const pct = BatterySim.percent;
  const isLow = pct < 20;

  const fill = document.getElementById('battery-charge-fill');
  const gPct = document.getElementById('graphic-pct');
  const gVolts = document.getElementById('graphic-volts');
  const vTerm = document.getElementById('val-vterm');
  const rawAdc = document.getElementById('val-raw-adc');
  const badge = document.getElementById('battery-status-badge');

  if (fill) {
    fill.style.height = `${pct}%`;
    fill.className = 'battery-charge-fill';
    if (pct < 20) fill.classList.add('low');
    else if (pct < 50) fill.classList.add('mid');
  }

  if (gPct) gPct.textContent = `${pct}%`;
  if (gVolts) gVolts.textContent = `${v.toFixed(2)} V`;
  if (vTerm) vTerm.textContent = `${v.toFixed(2)} V`;
  if (rawAdc) {
    const rawVal = Math.round((v / BatterySim.dividerRatio / 3.3) * 1023);
    rawAdc.textContent = `${rawVal} / 1023`;
  }

  if (badge) {
    if (isLow) {
      badge.textContent = 'Low Battery Warning';
      badge.style.background = '#ffe4e6';
      badge.style.color = '#be123c';
    } else {
      badge.textContent = 'Nominal / Healthy';
      badge.style.background = '#dcfce7';
      badge.style.color = '#15803d';
    }
  }
}

function setChargeLevel(pct) {
  BatterySim.setChargeLevel(pct);
  updateUI();
}

function changeChemistry(key) {
  BatterySim.setChemistry(key);
  const sub = document.getElementById('chem-subtitle');
  if (sub) {
    sub.textContent = `Chemistry: ${BatterySim.chemProfiles[key].name} · Cutoff: ${BatterySim.minV}V · Max: ${BatterySim.maxV}V`;
  }
  updateUI();
  if (window.CommonUI) CommonUI.toast(`Selected profile: ${BatterySim.chemProfiles[key].name}`, 'info');
}

// Hardware Link
function hwConnect() {
  const ip = document.getElementById('hw-ip-input').value.trim();
  const errMsg = document.getElementById('hw-error-msg');
  const lastSeen = document.getElementById('hw-last-seen');

  if (errMsg) errMsg.style.display = 'none';

  espClient = new ESP8266Client({
    baseUrl: ip,
    expectedProjectId: '33-battery-voltage-monitor',
    pollIntervalMs: 1500,
    onData: (data) => {
      if (lastSeen) lastSeen.textContent = `Live Telemetry: ${new Date().toLocaleTimeString()}`;
      if (data.voltage !== undefined) {
        BatterySim.voltage = data.voltage;
        BatterySim.calculatePercent();
        BatterySim.history.push(BatterySim.voltage);
        if (BatterySim.history.length > BatterySim.maxPoints) BatterySim.history.shift();
        BatterySim.renderChart();
        updateUI();
      }
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
      if (window.CommonUI) CommonUI.toast('Connected to ESP8266 Battery Monitor!', 'success');
      espClient.startPolling();
    }
  });
}
