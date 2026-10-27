/**
 * Project 05 — Water Level Monitor Main Application
 */

class WaterLevelApp {
  constructor() {
    this.config = window.WaterLevelConfig;
    this.mode = 'simulation';
    this.history = [];

    this.chart = null;
    this.simulation = null;
    this.hardware = null;

    this.dom = {
      primaryValue: document.getElementById('primary-level-value'),
      statLiters: document.getElementById('stat-liters'),
      statDepth: document.getElementById('stat-depth'),
      statDistance: document.getElementById('stat-distance'),
      tankFluid: document.getElementById('tank-water-fluid'),
      levelPill: document.getElementById('level-status-pill'),
      sensorHealth: document.getElementById('sensor-health-pill'),
      readingValidity: document.getElementById('reading-validity-pill'),
      lastUpdated: document.getElementById('last-updated-text'),
      diagnosticsMsg: document.getElementById('diagnostics-msg'),
      // Controls
      btnStart: document.getElementById('btn-sim-start'),
      btnPause: document.getElementById('btn-sim-pause'),
      btnReset: document.getElementById('btn-sim-reset'),
      speedSelect: document.getElementById('sim-speed-select'),
      scenarioSelect: document.getElementById('sim-scenario-select'),
      levelSlider: document.getElementById('level-override-slider'),
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
    this.chart = new MiniTimeSeriesChart('#tank-chart', {
      maxPoints: this.config.chartMaxPoints,
      lineColor: '#0284c7',
      fillColor: 'rgba(2, 132, 199, 0.15)',
      unit: '%',
      min: 0,
      max: 100,
      precision: 1
    });

    this.simulation = new WaterLevelSimulation(this.config, (data) => {
      if (this.mode === 'simulation') this.updateDisplay(data);
    });

    this.hardware = new WaterLevelHardware(
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
    if (this.dom.levelSlider) {
      this.dom.levelSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (this.dom.sliderValLabel) this.dom.sliderValLabel.textContent = `${val.toFixed(0)}%`;
        this.simulation.setManualPercent(val);
      });
    }

    if (this.dom.btnExportCsv) {
      this.dom.btnExportCsv.addEventListener('click', () => {
        if (this.history.length === 0) {
          CommonUI.toast('No tank log data available', 'warning');
          return;
        }
        const headers = ['Timestamp', 'Date_Time', 'Mode', 'Fill_Percent', 'Water_Liters', 'Depth_Cm', 'Distance_Cm', 'Status'];
        const rows = this.history.map(item => [
          item.timestamp,
          new Date(item.timestamp).toISOString(),
          item.mode,
          item.readings.fillPercent ?? '',
          item.readings.liters ?? '',
          item.readings.waterDepthCm ?? '',
          item.readings.distanceCm ?? '',
          item.readings.levelStatus
        ]);
        Utils.exportToCSV(`water_level_log_${Date.now()}`, headers, rows);
        CommonUI.toast('Exported Water Level log to CSV!', 'success');
      });
    }

    if (this.dom.btnTestHw) {
      this.dom.btnTestHw.addEventListener('click', async () => {
        this.hardware.setDeviceIp(this.dom.hwIpInput.value);
        this.dom.hwTestResult.textContent = 'Contacting ESP8266 Ultrasonic...';
        const res = await this.hardware.testConnection();
        if (res.success) {
          this.dom.hwTestResult.textContent = `✓ Linked with ${res.device.deviceId || 'ESP8266'}`;
          this.dom.hwTestResult.style.color = 'var(--status-ok-text)';
          CommonUI.toast('Connected to Ultrasonic Water Monitor!', 'success');
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
        CommonUI.toast('Polling ESP8266 Water Level...', 'info');
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
    const isFault = data.sensorStatus !== 'ok' || data.readings.fillPercent === null;
    const percent = data.readings.fillPercent;
    const depth = data.readings.waterDepthCm;
    const liters = data.readings.liters;
    const dist = data.readings.distanceCm;
    const status = data.readings.levelStatus;
    const now = new Date(data.timestamp);

    this.history.push(data);
    if (this.history.length > 200) this.history.shift();

    if (this.dom.lastUpdated) this.dom.lastUpdated.textContent = Utils.formatTime(now);

    if (isFault) {
      if (this.dom.primaryValue) this.dom.primaryValue.textContent = '--';
      if (this.dom.statLiters) this.dom.statLiters.textContent = '--';
      if (this.dom.statDepth) this.dom.statDepth.textContent = '--';
      if (this.dom.statDistance) this.dom.statDistance.textContent = '--';
      CommonUI.updateStatusPill(this.dom.sensorHealth, 'Echo Timeout', 'danger');
      CommonUI.updateStatusPill(this.dom.readingValidity, 'Invalid', 'danger');
      CommonUI.updateStatusPill(this.dom.levelPill, 'Sensor Fault', 'danger');
      if (this.dom.tankFluid) this.dom.tankFluid.style.height = '0%';
      return;
    }

    if (this.dom.primaryValue) this.dom.primaryValue.textContent = Utils.formatNumber(percent, 1);
    if (this.dom.statLiters) this.dom.statLiters.textContent = `${Utils.formatNumber(liters, 0)} L`;
    if (this.dom.statDepth) this.dom.statDepth.textContent = `${Utils.formatNumber(depth, 1)} cm`;
    if (this.dom.statDistance) this.dom.statDistance.textContent = `${Utils.formatNumber(dist, 1)} cm`;

    CommonUI.updateStatusPill(this.dom.sensorHealth, 'HC-SR04 Active', 'ok');
    CommonUI.updateStatusPill(this.dom.readingValidity, 'Valid', 'ok');

    // Level status pill
    let pillType = 'ok';
    if (percent >= this.config.tank.warningHighPct) pillType = 'danger';
    else if (percent <= this.config.tank.warningLowPct) pillType = 'warn';
    CommonUI.updateStatusPill(this.dom.levelPill, status, pillType);

    // Fluid height and dynamic color
    if (this.dom.tankFluid) {
      this.dom.tankFluid.style.height = `${percent}%`;
      if (percent >= 90) {
        this.dom.tankFluid.style.background = 'linear-gradient(180deg, #f43f5e 0%, #be123c 100%)';
      } else if (percent <= 20) {
        this.dom.tankFluid.style.background = 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)';
      } else {
        this.dom.tankFluid.style.background = 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)';
      }
    }

    this.chart.addDataPoint(percent, Utils.formatTime(now));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new WaterLevelApp();
  app.init();
  window.waterLevelApp = app;
});
