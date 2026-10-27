/**
 * Project 04 — Digital Thermometer Main Application
 */

class ThermometerApp {
  constructor() {
    this.config = window.ThermometerConfig;
    this.mode = 'simulation'; // 'simulation' | 'hardware'
    this.unit = this.config.defaultUnit; // 'C' | 'F'
    this.history = []; // for CSV export & statistics

    this.chart = null;
    this.simulation = null;
    this.hardware = null;

    this.dom = {
      primaryValue: document.getElementById('primary-temp-value'),
      primaryUnit: document.getElementById('primary-temp-unit'),
      unitToggleBtn: document.getElementById('unit-toggle-btn'),
      secondaryMin: document.getElementById('stat-temp-min'),
      secondaryMax: document.getElementById('stat-temp-max'),
      secondaryAvg: document.getElementById('stat-temp-avg'),
      sensorHealth: document.getElementById('sensor-health-pill'),
      readingValidity: document.getElementById('reading-validity-pill'),
      lastUpdated: document.getElementById('last-updated-text'),
      diagnosticsMsg: document.getElementById('diagnostics-msg'),
      mercuryFluid: document.getElementById('mercury-fluid'),
      mercuryBulb: document.getElementById('mercury-bulb'),
      tempBadge: document.getElementById('temp-status-badge'),
      // Controls
      btnStart: document.getElementById('btn-sim-start'),
      btnPause: document.getElementById('btn-sim-pause'),
      btnReset: document.getElementById('btn-sim-reset'),
      speedSelect: document.getElementById('sim-speed-select'),
      scenarioSelect: document.getElementById('sim-scenario-select'),
      tempSlider: document.getElementById('temp-override-slider'),
      sliderValLabel: document.getElementById('slider-val-label'),
      modeToggleSim: document.getElementById('mode-btn-sim'),
      modeToggleHw: document.getElementById('mode-btn-hw'),
      simControlsPanel: document.getElementById('sim-controls-panel'),
      hwControlsPanel: document.getElementById('hw-controls-panel'),
      btnExportCsv: document.getElementById('btn-export-csv'),
      // Hardware settings
      hwIpInput: document.getElementById('hw-device-ip'),
      btnTestHw: document.getElementById('btn-test-hw'),
      btnConnectHw: document.getElementById('btn-connect-hw'),
      btnDisconnectHw: document.getElementById('btn-disconnect-hw'),
      hwTestResult: document.getElementById('hw-test-result')
    };
  }

  init() {
    // 1. Initialize Chart
    this.chart = new MiniTimeSeriesChart('#thermometer-chart', {
      maxPoints: this.config.chartMaxPoints,
      lineColor: '#f97316',
      fillColor: 'rgba(249, 115, 22, 0.12)',
      unit: '°' + this.unit,
      min: 0,
      max: 50,
      precision: 1
    });

    // 2. Initialize Simulation
    this.simulation = new ThermometerSimulation(this.config, (data) => {
      if (this.mode === 'simulation') {
        this.updateDisplay(data);
      }
    });

    // 3. Initialize Hardware Adapter
    this.hardware = new ThermometerHardware(
      this.config,
      (data) => {
        if (this.mode === 'hardware') {
          this.updateDisplay(data);
        }
      },
      (state, detail) => {
        this.updateHardwareState(state, detail);
      },
      (err) => {
        this.updateHardwareError(err);
      }
    );

    // 4. Attach Event Listeners
    this.bindEvents();

    // 5. Start in Simulation mode
    this.setMode('simulation');
    this.simulation.start();
  }

  bindEvents() {
    // Unit Toggle (°C <-> °F)
    if (this.dom.unitToggleBtn) {
      this.dom.unitToggleBtn.addEventListener('click', () => {
        this.unit = this.unit === 'C' ? 'F' : 'C';
        this.dom.unitToggleBtn.textContent = `Switch to °${this.unit === 'C' ? 'F' : 'C'}`;
        this.chart.options.unit = '°' + this.unit;
        this.chart.render();
        CommonUI.toast(`Temperature unit changed to °${this.unit}`, 'info');
      });
    }

    // Mode Toggle
    if (this.dom.modeToggleSim) {
      this.dom.modeToggleSim.addEventListener('click', () => this.setMode('simulation'));
    }
    if (this.dom.modeToggleHw) {
      this.dom.modeToggleHw.addEventListener('click', () => this.setMode('hardware'));
    }

    // Simulation Controls
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
        this.updateStats();
        this.simulation.start();
        CommonUI.toast('Simulation reset to defaults', 'info');
      });
    }
    if (this.dom.speedSelect) {
      this.dom.speedSelect.addEventListener('change', (e) => {
        const speed = parseFloat(e.target.value);
        this.simulation.setSpeed(speed);
        CommonUI.toast(`Simulation speed: ${speed}x`, 'info');
      });
    }
    if (this.dom.scenarioSelect) {
      this.dom.scenarioSelect.addEventListener('change', (e) => {
        const sc = e.target.value;
        this.simulation.setScenario(sc);
        CommonUI.toast(`Scenario set to: ${e.target.options[e.target.selectedIndex].text}`, 'info');
      });
    }
    if (this.dom.tempSlider) {
      this.dom.tempSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (this.dom.sliderValLabel) this.dom.sliderValLabel.textContent = `${val.toFixed(1)} °C`;
        this.simulation.setManualTemp(val);
      });
    }

    // CSV Export
    if (this.dom.btnExportCsv) {
      this.dom.btnExportCsv.addEventListener('click', () => {
        if (this.history.length === 0) {
          CommonUI.toast('No recorded data available to export yet', 'warning');
          return;
        }
        const headers = ['Timestamp', 'Date_Time', 'Mode', 'Temp_C', 'Temp_F', 'Sensor_Status'];
        const rows = this.history.map(item => [
          item.timestamp,
          new Date(item.timestamp).toISOString(),
          item.mode,
          item.readings.temperatureC ?? '',
          item.readings.temperatureF ?? '',
          item.sensorStatus
        ]);
        Utils.exportToCSV(`thermometer_readings_${Date.now()}`, headers, rows);
        CommonUI.toast('Exported readings to CSV successfully!', 'success');
      });
    }

    // Hardware Controls
    if (this.dom.btnTestHw) {
      this.dom.btnTestHw.addEventListener('click', async () => {
        const ip = this.dom.hwIpInput.value.trim();
        this.hardware.setDeviceIp(ip);
        this.dom.hwTestResult.textContent = 'Testing connection...';
        this.dom.hwTestResult.style.color = 'var(--text-muted)';
        const res = await this.hardware.testConnection();
        if (res.success) {
          this.dom.hwTestResult.textContent = `✓ Success! Connected to ${res.device.deviceId || 'ESP8266'}`;
          this.dom.hwTestResult.style.color = 'var(--status-ok-text)';
          CommonUI.toast('ESP8266 hardware verified successfully!', 'success');
        } else {
          this.dom.hwTestResult.textContent = `✗ Failed: ${res.error}`;
          this.dom.hwTestResult.style.color = 'var(--status-danger-text)';
          CommonUI.toast(`Connection failed: ${res.error}`, 'error');
        }
      });
    }

    if (this.dom.btnConnectHw) {
      this.dom.btnConnectHw.addEventListener('click', () => {
        const ip = this.dom.hwIpInput.value.trim();
        this.hardware.setDeviceIp(ip);
        this.hardware.start();
        CommonUI.toast('Polling ESP8266 hardware...', 'info');
      });
    }

    if (this.dom.btnDisconnectHw) {
      this.dom.btnDisconnectHw.addEventListener('click', () => {
        this.hardware.stop();
        CommonUI.toast('Disconnected from hardware', 'info');
      });
    }
  }

  setMode(newMode) {
    if (this.mode === newMode) return;
    this.mode = newMode;

    if (newMode === 'simulation') {
      this.hardware.stop();
      if (this.dom.modeToggleSim) this.dom.modeToggleSim.classList.add('active');
      if (this.dom.modeToggleHw) this.dom.modeToggleHw.classList.remove('active');
      if (this.dom.simControlsPanel) this.dom.simControlsPanel.style.display = 'block';
      if (this.dom.hwControlsPanel) this.dom.hwControlsPanel.style.display = 'none';
      this.simulation.start();
      CommonUI.toast('Switched to Simulation Mode', 'info');
    } else {
      this.simulation.stop();
      if (this.dom.modeToggleSim) this.dom.modeToggleSim.classList.remove('active');
      if (this.dom.modeToggleHw) this.dom.modeToggleHw.classList.add('active');
      if (this.dom.simControlsPanel) this.dom.simControlsPanel.style.display = 'none';
      if (this.dom.hwControlsPanel) this.dom.hwControlsPanel.style.display = 'block';
      this.hardware.start();
      CommonUI.toast('Switched to ESP8266 Hardware Mode', 'info');
    }
  }

  updateDisplay(data) {
    const isFault = data.sensorStatus !== 'ok' || data.readings.temperatureC === null;
    const tempC = data.readings.temperatureC;
    const tempF = data.readings.temperatureF;
    const now = new Date(data.timestamp);

    // Record bounded history
    this.history.push(data);
    if (this.history.length > 200) this.history.shift();

    if (this.dom.lastUpdated) {
      this.dom.lastUpdated.textContent = Utils.formatTime(now);
    }

    if (isFault) {
      if (this.dom.primaryValue) this.dom.primaryValue.textContent = '--';
      CommonUI.updateStatusPill(this.dom.sensorHealth, 'Fault / Offline', 'danger');
      CommonUI.updateStatusPill(this.dom.readingValidity, 'Invalid', 'danger');
      if (this.dom.diagnosticsMsg) {
        this.dom.diagnosticsMsg.textContent = data.errorMessage || 'Sensor fault detected. Check wiring/pullup.';
      }
      this.updateThermometerVisual(null);
      return;
    }

    // Valid reading
    const displayVal = this.unit === 'C' ? tempC : tempF;
    if (this.dom.primaryValue) {
      this.dom.primaryValue.textContent = Utils.formatNumber(displayVal, 1);
    }
    if (this.dom.primaryUnit) {
      this.dom.primaryUnit.textContent = '°' + this.unit;
    }

    CommonUI.updateStatusPill(this.dom.sensorHealth, 'Sensor OK', 'ok');
    CommonUI.updateStatusPill(this.dom.readingValidity, 'Valid', 'ok');

    if (this.dom.diagnosticsMsg) {
      this.dom.diagnosticsMsg.textContent = `Operating normally. Source: ${data.mode.toUpperCase()}`;
    }

    // Add to chart
    this.chart.addDataPoint(displayVal, Utils.formatTime(now));

    // Update visuals & statistics
    this.updateThermometerVisual(tempC);
    this.updateStats();
  }

  updateThermometerVisual(tempC) {
    if (tempC === null || tempC === undefined) {
      if (this.dom.mercuryFluid) this.dom.mercuryFluid.style.height = '0%';
      if (this.dom.tempBadge) {
        this.dom.tempBadge.className = 'temp-badge-large temp-badge-fault';
        this.dom.tempBadge.textContent = 'Fault State';
      }
      return;
    }

    // Map 0°C to 50°C -> 5% to 100% height
    const percent = Utils.clamp(Utils.mapRange(tempC, 0, 50, 5, 98), 4, 100);
    if (this.dom.mercuryFluid) {
      this.dom.mercuryFluid.style.height = `${percent}%`;
    }

    // Color gradient & status badge based on temperature
    let colorGradient = 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)';
    let bulbGradient = 'radial-gradient(circle at 35% 35%, #38bdf8 0%, #0369a1 100%)';
    let badgeClass = 'temp-badge-cold';
    let badgeText = 'Cold Temperature';

    if (tempC >= 18 && tempC <= 27) {
      colorGradient = 'linear-gradient(180deg, #34d399 0%, #059669 100%)';
      bulbGradient = 'radial-gradient(circle at 35% 35%, #34d399 0%, #047857 100%)';
      badgeClass = 'temp-badge-optimal';
      badgeText = 'Optimal Room Temp';
    } else if (tempC > 27 && tempC <= 35) {
      colorGradient = 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)';
      bulbGradient = 'radial-gradient(circle at 35% 35%, #fbbf24 0%, #b45309 100%)';
      badgeClass = 'temp-badge-warm';
      badgeText = 'Warm Temperature';
    } else if (tempC > 35) {
      colorGradient = 'linear-gradient(180deg, #f43f5e 0%, #be123c 100%)';
      bulbGradient = 'radial-gradient(circle at 35% 35%, #f43f5e 0%, #9f1239 100%)';
      badgeClass = 'temp-badge-hot';
      badgeText = 'High Heat Alert!';
    }

    if (this.dom.mercuryFluid) this.dom.mercuryFluid.style.background = colorGradient;
    if (this.dom.mercuryBulb) this.dom.mercuryBulb.style.background = bulbGradient;
    if (this.dom.tempBadge) {
      this.dom.tempBadge.className = `temp-badge-large ${badgeClass}`;
      this.dom.tempBadge.textContent = badgeText;
    }
  }

  updateStats() {
    const validReadings = this.history
      .filter(item => item.sensorStatus === 'ok' && item.readings.temperatureC !== null)
      .map(item => this.unit === 'C' ? item.readings.temperatureC : item.readings.temperatureF);

    if (validReadings.length === 0) return;

    const stats = Utils.calcStats(validReadings);
    if (this.dom.secondaryMin) this.dom.secondaryMin.textContent = Utils.formatNumber(stats.min, 1) + '°' + this.unit;
    if (this.dom.secondaryMax) this.dom.secondaryMax.textContent = Utils.formatNumber(stats.max, 1) + '°' + this.unit;
    if (this.dom.secondaryAvg) this.dom.secondaryAvg.textContent = Utils.formatNumber(stats.avg, 1) + '°' + this.unit;
  }

  updateHardwareState(state, detail) {
    if (this.dom.diagnosticsMsg) {
      this.dom.diagnosticsMsg.textContent = `Hardware State: ${state} ${detail ? `(${detail})` : ''}`;
    }
  }

  updateHardwareError(err) {
    CommonUI.updateStatusPill(this.dom.sensorHealth, 'HW Error', 'danger');
    if (this.dom.diagnosticsMsg) {
      this.dom.diagnosticsMsg.textContent = `Network / HW Error: ${err.message}`;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new ThermometerApp();
  app.init();
  window.thermometerApp = app;
});
