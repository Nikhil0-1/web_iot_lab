/**
 * Project 02 — Gas Leakage Detector Main Application
 */

class GasLeakageApp {
  constructor() {
    this.config = window.GasLeakageConfig;
    this.mode = 'simulation';
    this.history = [];
    this.eventLog = [];

    this.chart = null;
    this.simulation = null;
    this.hardware = null;

    // Canvas
    this.canvas = document.getElementById('gas-cloud-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.gasPuffs = [];
    this.currentPpm = 95;

    this.dom = {
      primaryValue: document.getElementById('primary-gas-value'),
      leakStatePill: document.getElementById('leak-state-pill'),
      buzzerPill: document.getElementById('buzzer-state-pill'),
      sensorHealth: document.getElementById('sensor-health-pill'),
      readingValidity: document.getElementById('reading-validity-pill'),
      lastUpdated: document.getElementById('last-updated-text'),
      diagnosticsMsg: document.getElementById('diagnostics-msg'),
      alarmOverlay: document.getElementById('gas-alarm-overlay'),
      strobeIcon: document.getElementById('alarm-strobe-icon'),
      alarmLabel: document.getElementById('alarm-label-text'),
      eventList: document.getElementById('alarm-event-list'),
      valveStatePill: document.getElementById('valve-state-pill'),
      valveDot: document.getElementById('valve-dot'),
      valveText: document.getElementById('valve-text'),
      // Controls
      btnStart: document.getElementById('btn-sim-start'),
      btnPause: document.getElementById('btn-sim-pause'),
      btnReset: document.getElementById('btn-sim-reset'),
      speedSelect: document.getElementById('sim-speed-select'),
      scenarioSelect: document.getElementById('sim-scenario-select'),
      gasSlider: document.getElementById('gas-override-slider'),
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
    this.initGasCanvas();

    this.chart = new MiniTimeSeriesChart('#gas-chart', {
      maxPoints: this.config.chartMaxPoints,
      lineColor: '#f43f5e',
      fillColor: 'rgba(244, 63, 94, 0.12)',
      unit: ' PPM',
      min: 0,
      max: 1000,
      precision: 0
    });

    this.simulation = new GasLeakageSimulation(this.config, (data) => {
      if (this.mode === 'simulation') this.updateDisplay(data);
    });

    this.hardware = new GasLeakageHardware(
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
    this.animateGasCloud();
  }

  initGasCanvas() {
    if (!this.canvas) return;
    const resize = () => {
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
    };
    resize();
    window.addEventListener('resize', Utils.debounce(resize, 150));
  }

  animateGasCloud() {
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Spawn puffs based on PPM level
      const spawnRate = Utils.mapRange(this.currentPpm, 50, 1000, 0.05, 0.4);
      if (Math.random() < spawnRate) {
        this.gasPuffs.push({
          x: this.canvas.width / 2 + (Math.random() - 0.5) * 40,
          y: this.canvas.height / 2 + (Math.random() - 0.5) * 30,
          radius: Math.random() * 15 + 10,
          maxRadius: Math.random() * 80 + 50,
          growthRate: Math.random() * 0.8 + 0.4,
          alpha: 0.6,
          decay: Math.random() * 0.008 + 0.004,
          color: this.currentPpm > 600 ? '244, 63, 94' : '245, 158, 11'
        });
      }

      for (let i = this.gasPuffs.length - 1; i >= 0; i--) {
        const p = this.gasPuffs[i];
        p.radius += p.growthRate;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          this.gasPuffs.splice(i, 1);
          continue;
        }

        const grad = this.ctx.createRadialGradient(p.x, p.y, p.radius * 0.1, p.x, p.y, p.radius);
        grad.addColorStop(0, `rgba(${p.color}, ${p.alpha * 0.5})`);
        grad.addColorStop(1, `rgba(${p.color}, 0)`);

        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    requestAnimationFrame(() => this.animateGasCloud());
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
    if (this.dom.gasSlider) {
      this.dom.gasSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (this.dom.sliderValLabel) this.dom.sliderValLabel.textContent = `${val} PPM`;
        this.simulation.setManualGas(val);
      });
    }

    if (this.dom.btnExportCsv) {
      this.dom.btnExportCsv.addEventListener('click', () => {
        if (this.history.length === 0) {
          CommonUI.toast('No gas history data to export', 'warning');
          return;
        }
        const headers = ['Timestamp', 'Date_Time', 'Mode', 'Gas_PPM', 'Alarm_Active', 'State'];
        const rows = this.history.map(item => [
          item.timestamp,
          new Date(item.timestamp).toISOString(),
          item.mode,
          item.readings.gasPpm ?? '',
          item.readings.alarmActive ? 'YES' : 'NO',
          item.readings.leakState
        ]);
        Utils.exportToCSV(`gas_leak_log_${Date.now()}`, headers, rows);
        CommonUI.toast('Exported Gas log to CSV!', 'success');
      });
    }

    if (this.dom.btnTestHw) {
      this.dom.btnTestHw.addEventListener('click', async () => {
        this.hardware.setDeviceIp(this.dom.hwIpInput.value);
        this.dom.hwTestResult.textContent = 'Contacting ESP8266 gas sensor...';
        const res = await this.hardware.testConnection();
        if (res.success) {
          this.dom.hwTestResult.textContent = `✓ Linked with ${res.device.deviceId || 'ESP8266'}`;
          this.dom.hwTestResult.style.color = 'var(--status-ok-text)';
          CommonUI.toast('Connected to ESP8266 Gas Detector!', 'success');
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
        CommonUI.toast('Polling ESP8266 Gas Detector...', 'info');
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
    const isFault = data.sensorStatus !== 'ok' || data.readings.gasPpm === null;
    const ppm = data.readings.gasPpm;
    const state = data.readings.leakState;
    const alarm = data.readings.alarmActive;
    const now = new Date(data.timestamp);

    this.history.push(data);
    if (this.history.length > 200) this.history.shift();

    if (this.dom.lastUpdated) this.dom.lastUpdated.textContent = Utils.formatTime(now);

    if (isFault) {
      if (this.dom.primaryValue) this.dom.primaryValue.textContent = '--';
      CommonUI.updateStatusPill(this.dom.sensorHealth, 'Fault / Disconnected', 'danger');
      CommonUI.updateStatusPill(this.dom.readingValidity, 'Invalid', 'danger');
      CommonUI.updateStatusPill(this.dom.leakStatePill, 'Sensor Fault', 'danger');
      CommonUI.updateStatusPill(this.dom.buzzerPill, 'Silent', 'info');
      if (this.dom.alarmOverlay) this.dom.alarmOverlay.classList.remove('alarm-active');
      if (this.dom.strobeIcon) this.dom.strobeIcon.classList.remove('strobe-on');
      this.currentPpm = 0;
      return;
    }

    this.currentPpm = ppm;
    if (this.dom.primaryValue) this.dom.primaryValue.textContent = ppm;

    CommonUI.updateStatusPill(this.dom.sensorHealth, 'Sensor OK', 'ok');
    CommonUI.updateStatusPill(this.dom.readingValidity, 'Valid', 'ok');

    if (alarm) {
      CommonUI.updateStatusPill(this.dom.leakStatePill, 'CRITICAL LEAK ALARM', 'danger');
      CommonUI.updateStatusPill(this.dom.buzzerPill, 'SIREN ACTIVE (HIGH)', 'danger');
      CommonUI.updateStatusPill(this.dom.valveStatePill, 'EMERGENCY CUTOFF', 'danger');
      if (this.dom.valveDot) {
        this.dom.valveDot.className = 'valve-indicator-dot closed';
      }
      if (this.dom.valveText) {
        this.dom.valveText.textContent = 'VALVE SHUT (LOCKED)';
      }
      if (this.dom.alarmOverlay) this.dom.alarmOverlay.classList.add('alarm-active');
      if (this.dom.strobeIcon) this.dom.strobeIcon.classList.add('strobe-on');
      if (this.dom.alarmLabel) this.dom.alarmLabel.textContent = 'GAS EVACUATION ALARM';

      this.logEvent(`EMERGENCY: Gas level reached ${ppm} PPM. Buzzer active.`);
    } else if (state === 'Warning') {
      CommonUI.updateStatusPill(this.dom.leakStatePill, 'Elevated Warning', 'warn');
      CommonUI.updateStatusPill(this.dom.buzzerPill, 'Silent', 'info');
      CommonUI.updateStatusPill(this.dom.valveStatePill, 'Caution Advisory', 'warn');
      if (this.dom.valveDot) {
        this.dom.valveDot.className = 'valve-indicator-dot';
      }
      if (this.dom.valveText) {
        this.dom.valveText.textContent = 'Line Open (Armed)';
      }
      if (this.dom.alarmOverlay) this.dom.alarmOverlay.classList.remove('alarm-active');
      if (this.dom.strobeIcon) this.dom.strobeIcon.classList.remove('strobe-on');
      if (this.dom.alarmLabel) this.dom.alarmLabel.textContent = 'Elevated Gas Level';
    } else {
      CommonUI.updateStatusPill(this.dom.leakStatePill, 'Normal / Safe', 'ok');
      CommonUI.updateStatusPill(this.dom.buzzerPill, 'Silent', 'info');
      CommonUI.updateStatusPill(this.dom.valveStatePill, 'Supply Open', 'ok');
      if (this.dom.valveDot) {
        this.dom.valveDot.className = 'valve-indicator-dot';
      }
      if (this.dom.valveText) {
        this.dom.valveText.textContent = 'Line Open (Armed)';
      }
      if (this.dom.alarmOverlay) this.dom.alarmOverlay.classList.remove('alarm-active');
      if (this.dom.strobeIcon) this.dom.strobeIcon.classList.remove('strobe-on');
      if (this.dom.alarmLabel) this.dom.alarmLabel.textContent = 'Environment Safe';
    }

    this.chart.addDataPoint(ppm, Utils.formatTime(now));
  }

  logEvent(msg) {
    if (this.eventLog.length > 0 && this.eventLog[0].msg === msg) return; // avoid duplicate spam
    const timeStr = Utils.formatTime(new Date());
    this.eventLog.unshift({ time: timeStr, msg });
    if (this.eventLog.length > 6) this.eventLog.pop();

    if (this.dom.eventList) {
      this.dom.eventList.innerHTML = this.eventLog.map(e => `
        <li style="margin-bottom: 4px; font-size: 0.8rem; font-family: var(--font-mono);">
          <span style="color: var(--text-muted); font-size: 0.75rem;">[${e.time}]</span> ${e.msg}
        </li>
      `).join('');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new GasLeakageApp();
  app.init();
  window.gasLeakageApp = app;
});
