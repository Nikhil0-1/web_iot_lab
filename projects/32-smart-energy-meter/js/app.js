/**
 * Project 32: Smart Energy Meter - Application Controller
 */

let currentMode = 'sim';
let espClient = null;

document.addEventListener('DOMContentLoaded', () => {
  EnergySim.init();
  updateUI();

  window.onEnergyUpdate = () => {
    updateUI();
  };
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
  const v = EnergySim.voltage;
  const a = EnergySim.current;
  const w = EnergySim.power;
  const kwh = EnergySim.energyKwh;
  const pf = EnergySim.powerFactor;
  const freq = EnergySim.frequency;
  const tariff = EnergySim.tariffPerKwh;

  const cost = (kwh * tariff).toFixed(2);
  const monthlyEst = ((w * 24 * 30 / 1000) * tariff).toFixed(2);

  document.getElementById('val-voltage').textContent = v;
  document.getElementById('val-current').textContent = a;
  document.getElementById('val-power').textContent = w;
  document.getElementById('val-energy').textContent = kwh.toFixed(2);
  document.getElementById('val-freq').textContent = `${freq} Hz Line Freq`;
  document.getElementById('val-pf').textContent = `PF: ${pf.toFixed(2)} Lagging`;
  document.getElementById('val-cost').textContent = `Est. Cost: $${cost}`;
  document.getElementById('monthly-bill-est').textContent = `$${monthlyEst}`;
}

function setLoad(type) {
  EnergySim.setLoad(type);
  if (window.CommonUI) CommonUI.toast(`Switched load profile: ${type.toUpperCase()}`, 'info');
}

function updateTariff(val) {
  EnergySim.tariffPerKwh = parseFloat(val) || 0.18;
  updateUI();
}

function resetAccumulator() {
  EnergySim.energyKwh = 0.0;
  updateUI();
  if (window.CommonUI) CommonUI.toast('Cumulative energy counter reset to 0.0 kWh', 'info');
}

// Hardware Link
function hwConnect() {
  const ip = document.getElementById('hw-ip-input').value.trim();
  const errMsg = document.getElementById('hw-error-msg');
  const lastSeen = document.getElementById('hw-last-seen');

  if (errMsg) errMsg.style.display = 'none';

  espClient = new ESP8266Client({
    baseUrl: ip,
    expectedProjectId: '32-smart-energy-meter',
    pollIntervalMs: 1500,
    onData: (data) => {
      if (lastSeen) lastSeen.textContent = `Live Telemetry: ${new Date().toLocaleTimeString()}`;
      if (data.voltage !== undefined) EnergySim.voltage = data.voltage;
      if (data.current !== undefined) EnergySim.current = data.current;
      if (data.power !== undefined) EnergySim.power = data.power;
      if (data.energy_kwh !== undefined) EnergySim.energyKwh = data.energy_kwh;
      if (data.frequency !== undefined) EnergySim.frequency = data.frequency;
      if (data.power_factor !== undefined) EnergySim.powerFactor = data.power_factor;

      EnergySim.history.push(EnergySim.power);
      if (EnergySim.history.length > EnergySim.maxPoints) EnergySim.history.shift();
      EnergySim.render();
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
      if (window.CommonUI) CommonUI.toast('Connected to ESP8266 PZEM-004T Meter!', 'success');
      espClient.startPolling();
    }
  });
}
