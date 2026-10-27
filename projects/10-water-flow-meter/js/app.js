/**
 * Project 06 — Water Flow Meter Main Application
 */

class WaterFlowApp {
  constructor() {
    this.config = window.WaterFlowConfig;
    this.mode = 'simulation';
    this.history = [];

    this.chart = null;
    this.simulation = null;
    this.hardware = null;

    // Pipe Canvas
    this.canvas = document.getElementById('pipe-flow-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.bubbles = [];
    this.rotorAngle = 0;
    this.currentFlowLpm = 8.5;

    this.dom = {
      primaryValue: document.getElementById('primary-flow-value'),
      statTotalLiters: document.getElementById('stat-total-liters'),
      statPulses: document.getElementById('stat-pulses'),
      flowStatePill: document.getElementById('flow-state-pill'),
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
      flowSlider: document.getElementById('flow-override-slider'),
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
    this.initPipeCanvas();

    this.chart = new MiniTimeSeriesChart('#flow-chart', {
      maxPoints: this.config.chartMaxPoints,
      lineColor: '#0d9488',
      fillColor: 'rgba(13, 148, 136, 0.15)',
      unit: ' L/min',
      min: 0,
      max: 30,
      precision: 1
    });

    this.simulation = new WaterFlowSimulation(this.config, (data) => {
      if (this.mode === 'simulation') this.updateDisplay(data);
    });

    this.hardware = new WaterFlowHardware(
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
    this.animatePipe();
  }

  initPipeCanvas() {
    if (!this.canvas) return;
    const resize = () => {
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
    };
    resize();
    window.addEventListener('resize', Utils.debounce(resize, 150));

    this.bubbles = [];
    for (let i = 0; i < 25; i++) {
      this.bubbles.push({
        x: Math.random() * (this.canvas ? this.canvas.width : 500),
        y: (this.canvas ? this.canvas.height / 2 : 120) + (Math.random() - 0.5) * 40,
        radius: Math.random() * 4 + 2,
        speedMultiplier: Math.random() * 0.4 + 0.8
      });
    }
  }

  animatePipe() {
    if (this.ctx && this.canvas) {
      const { width, height } = this.canvas;
      this.ctx.clearRect(0, 0, width, height);

      const pipeY = height / 2 - 35;
      const pipeH = 70;

      // Pipe outline
      this.ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
      this.ctx.fillRect(0, pipeY, width, pipeH);
      this.ctx.strokeStyle = 'rgba(15, 23, 42, 0.3)';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(0, pipeY, width, pipeH);

      // Water fluid stream inside pipe
      this.ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      this.ctx.fillRect(0, pipeY + 4, width, pipeH - 8);

      // Moving bubbles
      const speed = this.currentFlowLpm * 0.5;
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      for (const b of this.bubbles) {
        b.x += speed * b.speedMultiplier;
        if (b.x > width) b.x = 0;

        this.ctx.beginPath();
        this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // Center Turbine Impeller
      const rotorX = width / 2;
      const rotorY = height / 2;
      const rotorR = 26;

      this.rotorAngle += this.currentFlowLpm * 0.05;

      this.ctx.save();
      this.ctx.translate(rotorX, rotorY);
      this.ctx.rotate(this.rotorAngle);

      // 4 Turbine blades
      this.ctx.fillStyle = '#0d9488';
      for (let i = 0; i < 4; i++) {
        this.ctx.rotate(Math.PI / 2);
        this.ctx.beginPath();
        if (typeof this.ctx.roundRect === 'function') {
          this.ctx.roundRect(-4, -rotorR, 8, rotorR, 3);
        } else {
          this.ctx.rect(-4, -rotorR, 8, rotorR);
        }
        this.ctx.fill();
      }

      // Impeller center hub
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 9, 0, Math.PI * 2);
      this.ctx.fillStyle = '#0f766e';
      this.ctx.fill();
      this.ctx.restore();
    }
    requestAnimationFrame(() => this.animatePipe());
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
    if (this.dom.flowSlider) {
      this.dom.flowSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (this.dom.sliderValLabel) this.dom.sliderValLabel.textContent = `${val.toFixed(1)} L/min`;
        this.simulation.setManualFlow(val);
      });
    }

    if (this.dom.btnExportCsv) {
      this.dom.btnExportCsv.addEventListener('click', () => {
        if (this.history.length === 0) {
          CommonUI.toast('No flow history available to export', 'warning');
          return;
        }
        const headers = ['Timestamp', 'Date_Time', 'Mode', 'Flow_Rate_Lpm', 'Total_Volume_L', 'Pulse_Count', 'Flow_State'];
        const rows = this.history.map(item => [
          item.timestamp,
          new Date(item.timestamp).toISOString(),
          item.mode,
          item.readings.flowRateLpm ?? '',
          item.readings.totalLiters ?? '',
          item.readings.pulseCount ?? '',
          item.readings.flowState
        ]);
        Utils.exportToCSV(`water_flow_log_${Date.now()}`, headers, rows);
        CommonUI.toast('Exported Water Flow data to CSV!', 'success');
      });
    }

    if (this.dom.btnTestHw) {
      this.dom.btnTestHw.addEventListener('click', async () => {
        this.hardware.setDeviceIp(this.dom.hwIpInput.value);
        this.dom.hwTestResult.textContent = 'Contacting ESP8266 Flow Meter...';
        const res = await this.hardware.testConnection();
        if (res.success) {
          this.dom.hwTestResult.textContent = `✓ Linked with ${res.device.deviceId || 'ESP8266'}`;
          this.dom.hwTestResult.style.color = 'var(--status-ok-text)';
          CommonUI.toast('Connected to YF-S201 Flow Meter!', 'success');
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
        CommonUI.toast('Polling ESP8266 Flow Meter...', 'info');
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
    const isFault = data.sensorStatus !== 'ok' || data.readings.flowRateLpm === null;
    const lpm = data.readings.flowRateLpm;
    const total = data.readings.totalLiters;
    const pulses = data.readings.pulseCount;
    const state = data.readings.flowState;
    const now = new Date(data.timestamp);

    this.history.push(data);
    if (this.history.length > 200) this.history.shift();

    if (this.dom.lastUpdated) this.dom.lastUpdated.textContent = Utils.formatTime(now);

    if (isFault) {
      this.currentFlowLpm = 0;
      if (this.dom.primaryValue) this.dom.primaryValue.textContent = '--';
      if (this.dom.statTotalLiters) this.dom.statTotalLiters.textContent = '--';
      if (this.dom.statPulses) this.dom.statPulses.textContent = '--';
      CommonUI.updateStatusPill(this.dom.sensorHealth, 'Fault / Jammed', 'danger');
      CommonUI.updateStatusPill(this.dom.readingValidity, 'Invalid', 'danger');
      CommonUI.updateStatusPill(this.dom.flowStatePill, 'Sensor Fault', 'danger');
      return;
    }

    this.currentFlowLpm = lpm;
    if (this.dom.primaryValue) this.dom.primaryValue.textContent = Utils.formatNumber(lpm, 1);
    if (this.dom.statTotalLiters) this.dom.statTotalLiters.textContent = `${Utils.formatNumber(total, 2)} L`;
    if (this.dom.statPulses) this.dom.statPulses.textContent = pulses.toLocaleString();

    CommonUI.updateStatusPill(this.dom.sensorHealth, 'YF-S201 Active', 'ok');
    CommonUI.updateStatusPill(this.dom.readingValidity, 'Valid', 'ok');

    let pillType = 'ok';
    if (lpm <= this.config.thresholds.zeroFlowMax) pillType = 'info';
    else if (lpm > this.config.thresholds.nominalFlowMax) pillType = 'warn';
    CommonUI.updateStatusPill(this.dom.flowStatePill, state, pillType);

    this.chart.addDataPoint(lpm, Utils.formatTime(now));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new WaterFlowApp();
  app.init();
  window.waterFlowApp = app;
});
