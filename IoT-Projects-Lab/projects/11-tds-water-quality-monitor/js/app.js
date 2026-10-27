/**
 * Project 07 — TDS Water Quality Monitor Main Application
 */

class TdsApp {
  constructor() {
    this.config = window.TdsConfig;
    this.mode = 'simulation';
    this.history = [];

    this.chart = null;
    this.simulation = null;
    this.hardware = null;

    this.dom = {
      primaryValue: document.getElementById('primary-tds-value'),
      statVoltage: document.getElementById('stat-voltage'),
      statRawAdc: document.getElementById('stat-raw-adc'),
      tierBadge: document.getElementById('water-tier-pill'),
      sensorHealth: document.getElementById('sensor-health-pill'),
      readingValidity: document.getElementById('reading-validity-pill'),
      lastUpdated: document.getElementById('last-updated-text'),
      diagnosticsMsg: document.getElementById('diagnostics-msg'),
      gaugeNeedle: document.getElementById('gauge-needle'),
      beakerFluid: document.getElementById('beaker-fluid'),
      // Controls
      btnStart: document.getElementById('btn-sim-start'),
      btnPause: document.getElementById('btn-sim-pause'),
      btnReset: document.getElementById('btn-sim-reset'),
      speedSelect: document.getElementById('sim-speed-select'),
      scenarioSelect: document.getElementById('sim-scenario-select'),
      tdsSlider: document.getElementById('tds-override-slider'),
      sliderValLabel: document.getElementById('slider-val-label'),
      modeToggleSim: document.getElementById('mode-btn-sim'),
      modeToggleHw: document.getElementById('mode-btn-hw'),
      simControlsPanel: document.getElementById('sim-controls-panel'),
      hwControlsPanel: document.getElementById('hw-controls-panel'),
      btnExportCsv: document.getElementById('btn-export-csv'),
      // Hardware
      hwIpInput: document.getElementById('hw-device-ip'),
      btnTestHw: document.getElementById('btn-test-hw'),
      btnConnectHw: document.getElementById('btn-connect-hw'),
      btnDisconnectHw: document.getElementById('btn-disconnect-hw'),
      hwTestResult: document.getElementById('hw-test-result')
    };
  }

  init() {
    this.chart = new MiniTimeSeriesChart('#tds-chart', {
      maxPoints: this.config.chartMaxPoints,
      lineColor: '#06b6d4',
      fillColor: 'rgba(6, 182, 212, 0.15)',
      unit: ' PPM',
      min: 0,
      max: 1000,
      precision: 0
    });

    this.simulation = new TdsSimulation(this.config, (data) => {
      if (this.mode === 'simulation') this.updateDisplay(data);
    });

    this.hardware = new TdsHardware(
      this.config,
      (data) => {
        if (this.mode === 'hardware') this.updateDisplay(data);
      },
      (state, detail) => {
        if (this.dom.diagnosticsMsg) this.dom.diagnosticsMsg.textContent = `HW: ${state} ${detail || ''}`;
      },
      (err) => {
        CommonUI.updateStatusPill(this.dom.sensorHealth, 'HW Error', 'danger');
      }
    );

    this.bindEvents();
    this.setMode('simulation');
    this.simulation.start();
  }

  bindEvents() {
    if (this.dom.modeToggleSim) this.dom.modeToggleSim.addEventListener('click', () => this.setMode('simulation'));
    if (this.dom.modeToggleHw) this.dom.modeToggleHw.addEventListener('click', () => this.setMode('hardware'));

    if (this.dom.btnStart) {
      this.dom.btnStart.addEventListener('click', () => {
        this.simulation.start();
        CommonUI.toast('Simulation resumed', 'info');
      });
    }
    if (this.dom.btnPause) {
      this.dom.btnPause.addEventListener('click', () => {
        this.simulation.pause();
        CommonUI.toast('Simulation paused', 'info');
      });
    }
    if (this.dom.btnReset) {
      this.dom.btnReset.addEventListener('click', () => {
        this.simulation.reset();
        this.history = [];
        this.chart.clear();
        this.simulation.start();
        CommonUI.toast('Simulation reset', 'info');
      });
    }
    if (this.dom.speedSelect) {
      this.dom.speedSelect.addEventListener('change', (e) => {
        this.simulation.setSpeed(parseFloat(e.target.value));
      });
    }
    if (this.dom.scenarioSelect) {
      this.dom.scenarioSelect.addEventListener('change', (e) => {
        this.simulation.setScenario(e.target.value);
      });
    }
    if (this.dom.tdsSlider) {
      this.dom.tdsSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (this.dom.sliderValLabel) this.dom.sliderValLabel.textContent = `${val} PPM`;
        this.simulation.setManualTds(val);
      });
    }

    if (this.dom.btnExportCsv) {
      this.dom.btnExportCsv.addEventListener('click', () => {
        if (this.history.length === 0) {
          CommonUI.toast('No TDS data available to export', 'warning');
          return;
        }
        const headers = ['Timestamp', 'Date_Time', 'Mode', 'TDS_PPM', 'Voltage_V', 'Raw_ADC', 'Water_Grade'];
        const rows = this.history.map(item => [
          item.timestamp,
          new Date(item.timestamp).toISOString(),
          item.mode,
          item.readings.tdsPpm ?? '',
          item.readings.voltage ?? '',
          item.readings.rawAdc ?? '',
          item.readings.waterTier
        ]);
        Utils.exportToCSV(`tds_water_log_${Date.now()}`, headers, rows);
        CommonUI.toast('Exported TDS readings to CSV!', 'success');
      });
    }

    if (this.dom.btnTestHw) {
      this.dom.btnTestHw.addEventListener('click', async () => {
        this.hardware.setDeviceIp(this.dom.hwIpInput.value);
        this.dom.hwTestResult.textContent = 'Contacting ESP8266 TDS probe...';
        const res = await this.hardware.testConnection();
        if (res.success) {
          this.dom.hwTestResult.textContent = `✓ Linked with ${res.device.deviceId || 'ESP8266'}`;
          this.dom.hwTestResult.style.color = 'var(--status-ok-text)';
          CommonUI.toast('Connected to TDS Water Monitor!', 'success');
        } else {
          this.dom.hwTestResult.textContent = `✗ ${res.error}`;
          this.dom.hwTestResult.style.color = 'var(--status-danger-text)';
          CommonUI.toast(res.error, 'error');
        }
      });
    }

    if (this.dom.btnConnectHw) {
      this.dom.btnConnectHw.addEventListener('click', () => {
        this.hardware.setDeviceIp(this.dom.hwIpInput.value);
        this.hardware.start();
        CommonUI.toast('Polling ESP8266 TDS...', 'info');
      });
    }

    if (this.dom.btnDisconnectHw) {
      this.dom.btnDisconnectHw.addEventListener('click', () => {
        this.hardware.stop();
        CommonUI.toast('Disconnected hardware', 'info');
      });
    }
  }

  setMode(newMode) {
    this.mode = newMode;
    if (newMode === 'simulation') {
      this.hardware.stop();
      if (this.dom.modeToggleSim) this.dom.modeToggleSim.classList.add('active');
      if (this.dom.modeToggleHw) this.dom.modeToggleHw.classList.remove('active');
      if (this.dom.simControlsPanel) this.dom.simControlsPanel.style.display = 'block';
      if (this.dom.hwControlsPanel) this.dom.hwControlsPanel.style.display = 'none';
      this.simulation.start();
    } else {
      this.simulation.stop();
      if (this.dom.modeToggleSim) this.dom.modeToggleSim.classList.remove('active');
      if (this.dom.modeToggleHw) this.dom.modeToggleHw.classList.add('active');
      if (this.dom.simControlsPanel) this.dom.simControlsPanel.style.display = 'none';
      if (this.dom.hwControlsPanel) this.dom.hwControlsPanel.style.display = 'block';
      this.hardware.start();
    }
  }

  updateDisplay(data) {
    const isFault = data.sensorStatus !== 'ok' || data.readings.tdsPpm === null;
    const ppm = data.readings.tdsPpm;
    const v = data.readings.voltage;
    const adc = data.readings.rawAdc;
    const tier = data.readings.waterTier;
    const now = new Date(data.timestamp);

    this.history.push(data);
    if (this.history.length > 200) this.history.shift();

    if (this.dom.lastUpdated) this.dom.lastUpdated.textContent = Utils.formatTime(now);

    if (isFault) {
      if (this.dom.primaryValue) this.dom.primaryValue.textContent = '--';
      if (this.dom.statVoltage) this.dom.statVoltage.textContent = '--';
      if (this.dom.statRawAdc) this.dom.statRawAdc.textContent = '--';
      CommonUI.updateStatusPill(this.dom.sensorHealth, 'Probe Dry / Disconnected', 'danger');
      CommonUI.updateStatusPill(this.dom.readingValidity, 'Invalid', 'danger');
      CommonUI.updateStatusPill(this.dom.tierBadge, 'Probe Fault', 'danger');
      if (this.dom.gaugeNeedle) this.dom.gaugeNeedle.style.transform = 'rotate(-90deg)';
      return;
    }

    if (this.dom.primaryValue) this.dom.primaryValue.textContent = ppm;
    if (this.dom.statVoltage) this.dom.statVoltage.textContent = `${Utils.formatNumber(v, 2)} V`;
    if (this.dom.statRawAdc) this.dom.statRawAdc.textContent = `${adc} / 1023`;

    CommonUI.updateStatusPill(this.dom.sensorHealth, 'TDS Probe Active', 'ok');
    CommonUI.updateStatusPill(this.dom.readingValidity, 'Valid', 'ok');

    let pillType = 'ok';
    if (ppm > 600) pillType = 'danger';
    else if (ppm > 300) pillType = 'warn';
    CommonUI.updateStatusPill(this.dom.tierBadge, tier, pillType);

    // Rotate needle: 0 PPM -> -90deg, 1000 PPM -> +90deg
    const angle = Utils.clamp(Utils.mapRange(ppm, 0, 1000, -90, 90), -90, 90);
    if (this.dom.gaugeNeedle) {
      this.dom.gaugeNeedle.style.transform = `rotate(${angle}deg)`;
    }

    // Beaker fluid color tint
    if (this.dom.beakerFluid) {
      if (ppm < 100) {
        this.dom.beakerFluid.style.background = 'linear-gradient(180deg, #cffafe 0%, #38bdf8 100%)';
      } else if (ppm <= 300) {
        this.dom.beakerFluid.style.background = 'linear-gradient(180deg, #a7f3d0 0%, #059669 100%)';
      } else if (ppm <= 600) {
        this.dom.beakerFluid.style.background = 'linear-gradient(180deg, #fef08a 0%, #d97706 100%)';
      } else {
        this.dom.beakerFluid.style.background = 'linear-gradient(180deg, #fecdd3 0%, #9f1239 100%)';
      }
    }

    this.chart.addDataPoint(ppm, Utils.formatTime(now));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new TdsApp();
  app.init();
  window.tdsApp = app;
});
