/**
 * Project 03 — LDR Light Intensity Monitor Main Application
 */

class LdrApp {
  constructor() {
    this.config = window.LdrConfig;
    this.mode = 'simulation';
    this.history = [];

    this.chart = null;
    this.simulation = null;
    this.hardware = null;

    this.dom = {
      primaryValue: document.getElementById('primary-light-value'),
      rawAdcValue: document.getElementById('stat-raw-adc'),
      approxLuxValue: document.getElementById('stat-approx-lux'),
      tierBadge: document.getElementById('ambient-tier-pill'),
      sensorHealth: document.getElementById('sensor-health-pill'),
      readingValidity: document.getElementById('reading-validity-pill'),
      lastUpdated: document.getElementById('last-updated-text'),
      diagnosticsMsg: document.getElementById('diagnostics-msg'),
      // Visuals
      sunContainer: document.getElementById('sun-visualizer-container'),
      sunCore: document.getElementById('sun-core'),
      sunCorona: document.getElementById('sun-corona'),
      sunRays: document.getElementById('sun-rays'),
      sunInfoBadge: document.getElementById('sun-info-badge'),
      luxIndicator: document.getElementById('lux-indicator'),
      // Controls
      btnStart: document.getElementById('btn-sim-start'),
      btnPause: document.getElementById('btn-sim-pause'),
      btnReset: document.getElementById('btn-sim-reset'),
      speedSelect: document.getElementById('sim-speed-select'),
      scenarioSelect: document.getElementById('sim-scenario-select'),
      lightSlider: document.getElementById('light-override-slider'),
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
    this.chart = new MiniTimeSeriesChart('#ldr-chart', {
      maxPoints: this.config.chartMaxPoints,
      lineColor: '#eab308',
      fillColor: 'rgba(234, 179, 8, 0.15)',
      unit: '%',
      min: 0,
      max: 100,
      precision: 1
    });

    this.simulation = new LdrSimulation(this.config, (data) => {
      if (this.mode === 'simulation') this.updateDisplay(data);
    });

    this.hardware = new LdrHardware(
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
    if (this.dom.lightSlider) {
      this.dom.lightSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (this.dom.sliderValLabel) this.dom.sliderValLabel.textContent = `${val.toFixed(0)}%`;
        this.simulation.setManualPercent(val);
      });
    }

    if (this.dom.btnExportCsv) {
      this.dom.btnExportCsv.addEventListener('click', () => {
        if (this.history.length === 0) {
          CommonUI.toast('No light measurements to export', 'warning');
          return;
        }
        const headers = ['Timestamp', 'Date_Time', 'Mode', 'Light_Percent', 'Approx_Lux', 'Raw_ADC', 'Ambient_Tier'];
        const rows = this.history.map(item => [
          item.timestamp,
          new Date(item.timestamp).toISOString(),
          item.mode,
          item.readings.lightPercent ?? '',
          item.readings.approxLux ?? '',
          item.readings.rawAdc ?? '',
          item.readings.ambientTier
        ]);
        Utils.exportToCSV(`ldr_light_log_${Date.now()}`, headers, rows);
        CommonUI.toast('Exported LDR readings to CSV!', 'success');
      });
    }

    if (this.dom.btnTestHw) {
      this.dom.btnTestHw.addEventListener('click', async () => {
        this.hardware.setDeviceIp(this.dom.hwIpInput.value);
        this.dom.hwTestResult.textContent = 'Contacting ESP8266 LDR...';
        const res = await this.hardware.testConnection();
        if (res.success) {
          this.dom.hwTestResult.textContent = `✓ Linked with ${res.device.deviceId || 'ESP8266'}`;
          this.dom.hwTestResult.style.color = 'var(--status-ok-text)';
          CommonUI.toast('Connected to ESP8266 LDR Sensor!', 'success');
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
        CommonUI.toast('Polling ESP8266 LDR...', 'info');
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
    const isFault = data.sensorStatus !== 'ok' || data.readings.lightPercent === null;
    const percent = data.readings.lightPercent;
    const rawAdc = data.readings.rawAdc;
    const approxLux = data.readings.approxLux;
    const tier = data.readings.ambientTier;
    const now = new Date(data.timestamp);

    this.history.push(data);
    if (this.history.length > 200) this.history.shift();

    if (this.dom.lastUpdated) this.dom.lastUpdated.textContent = Utils.formatTime(now);

    if (isFault) {
      if (this.dom.primaryValue) this.dom.primaryValue.textContent = '--';
      if (this.dom.rawAdcValue) this.dom.rawAdcValue.textContent = '--';
      if (this.dom.approxLuxValue) this.dom.approxLuxValue.textContent = '--';
      CommonUI.updateStatusPill(this.dom.sensorHealth, 'Sensor Disconnected', 'danger');
      CommonUI.updateStatusPill(this.dom.readingValidity, 'Invalid', 'danger');
      CommonUI.updateStatusPill(this.dom.tierBadge, 'Fault State', 'danger');
      if (this.dom.sunCore) this.dom.sunCore.style.transform = 'scale(0.3)';
      if (this.dom.sunCorona) this.dom.sunCorona.style.opacity = '0';
      return;
    }

    if (this.dom.primaryValue) this.dom.primaryValue.textContent = Utils.formatNumber(percent, 1);
    if (this.dom.rawAdcValue) this.dom.rawAdcValue.textContent = `${rawAdc} / 1023`;
    if (this.dom.approxLuxValue) this.dom.approxLuxValue.textContent = `${approxLux} lx`;

    CommonUI.updateStatusPill(this.dom.sensorHealth, 'LDR Active', 'ok');
    CommonUI.updateStatusPill(this.dom.readingValidity, 'Valid', 'ok');
    CommonUI.updateStatusPill(this.dom.tierBadge, tier, percent > 40 ? 'ok' : 'info');

    if (this.dom.sunInfoBadge) {
      this.dom.sunInfoBadge.textContent = `${tier} (${percent}% Intensity)`;
    }

    // Dynamic solar scaling
    const scale = Utils.mapRange(percent, 0, 100, 0.4, 1.35);
    const coronaScale = Utils.mapRange(percent, 0, 100, 0.2, 1.8);
    const coronaOpacity = Utils.mapRange(percent, 0, 100, 0.1, 0.85);

    if (this.dom.sunCore) {
      this.dom.sunCore.style.transform = `scale(${scale})`;
      if (percent < 20) {
        this.dom.sunCore.style.background = 'radial-gradient(circle at 35% 35%, #94a3b8 0%, #475569 100%)';
        this.dom.sunCore.style.boxShadow = '0 0 10px rgba(148, 163, 184, 0.3)';
        if (this.dom.sunContainer) this.dom.sunContainer.style.background = 'radial-gradient(circle at center, #334155 0%, #0f172a 100%)';
      } else {
        this.dom.sunCore.style.background = 'radial-gradient(circle at 35% 35%, #fef08a 0%, #eab308 100%)';
        this.dom.sunCore.style.boxShadow = `0 0 ${20 + percent * 0.4}px rgba(234, 179, 8, 0.7)`;
        if (this.dom.sunContainer) this.dom.sunContainer.style.background = 'radial-gradient(circle at center, #fefce8 0%, #ede9fe 100%)';
      }
    }

    if (this.dom.sunCorona) {
      this.dom.sunCorona.style.transform = `scale(${coronaScale})`;
      this.dom.sunCorona.style.opacity = coronaOpacity;
    }

    if (this.dom.luxIndicator) {
      this.dom.luxIndicator.style.left = `${Math.min(Math.max(percent, 0), 100)}%`;
    }

    this.chart.addDataPoint(percent, Utils.formatTime(now));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new LdrApp();
  app.init();
  window.ldrApp = app;
});
