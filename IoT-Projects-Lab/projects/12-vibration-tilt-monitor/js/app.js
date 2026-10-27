/**
 * Project 08 — Vibration & Tilt Monitor Main Application
 */

class VibrationTiltApp {
  constructor() {
    this.config = window.VibrationTiltConfig;
    this.mode = 'simulation';
    this.history = [];

    this.chart = null;
    this.simulation = null;
    this.hardware = null;

    // Horizon Canvas
    this.canvas = document.getElementById('attitude-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.pitch = 0.0;
    this.roll = 0.0;

    this.dom = {
      primaryPitch: document.getElementById('primary-pitch-value'),
      statRoll: document.getElementById('stat-roll'),
      statGForce: document.getElementById('stat-gforce'),
      motionStatePill: document.getElementById('motion-state-pill'),
      sensorHealth: document.getElementById('sensor-health-pill'),
      readingValidity: document.getElementById('reading-validity-pill'),
      lastUpdated: document.getElementById('last-updated-text'),
      diagnosticsMsg: document.getElementById('diagnostics-msg'),
      attitudeBadge: document.getElementById('attitude-info-badge'),
      // Controls
      btnStart: document.getElementById('btn-sim-start'),
      btnPause: document.getElementById('btn-sim-pause'),
      btnReset: document.getElementById('btn-sim-reset'),
      speedSelect: document.getElementById('sim-speed-select'),
      scenarioSelect: document.getElementById('sim-scenario-select'),
      pitchSlider: document.getElementById('pitch-override-slider'),
      pitchValLabel: document.getElementById('pitch-val-label'),
      rollSlider: document.getElementById('roll-override-slider'),
      rollValLabel: document.getElementById('roll-val-label'),
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
    this.initAttitudeCanvas();

    this.chart = new MiniTimeSeriesChart('#imu-chart', {
      maxPoints: this.config.chartMaxPoints,
      lineColor: '#8b5cf6',
      fillColor: 'rgba(139, 92, 246, 0.15)',
      unit: ' g',
      min: 0.5,
      max: 3.5,
      precision: 2
    });

    this.simulation = new VibrationTiltSimulation(this.config, (data) => {
      if (this.mode === 'simulation') this.updateDisplay(data);
    });

    this.hardware = new VibrationTiltHardware(
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
    this.animateAttitude();
  }

  initAttitudeCanvas() {
    if (!this.canvas) return;
    const resize = () => {
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
    };
    resize();
    window.addEventListener('resize', Utils.debounce(resize, 150));
  }

  animateAttitude() {
    if (this.ctx && this.canvas) {
      const { width, height } = this.canvas;
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) * 0.44;

      this.ctx.clearRect(0, 0, width, height);

      // Clip circular instrument dial
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      this.ctx.clip();

      // Transform according to pitch & roll
      this.ctx.translate(cx, cy);
      this.ctx.rotate((this.roll * Math.PI) / 180);
      const pitchPixels = (this.pitch / 90) * radius;
      this.ctx.translate(0, pitchPixels);

      // Sky hemisphere (top)
      this.ctx.fillStyle = '#3b82f6';
      this.ctx.fillRect(-radius * 2, -radius * 2, radius * 4, radius * 2);

      // Ground hemisphere (bottom)
      this.ctx.fillStyle = '#92400e';
      this.ctx.fillRect(-radius * 2, 0, radius * 4, radius * 2);

      // White Horizon dividing line
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(-radius * 2, 0);
      this.ctx.lineTo(radius * 2, 0);
      this.ctx.stroke();

      // Pitch Ladder Marks (+/- 10°, 20°, 30°)
      this.ctx.lineWidth = 1.5;
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '10px ui-monospace, monospace';
      this.ctx.textAlign = 'center';

      for (let deg = -40; deg <= 40; deg += 10) {
        if (deg === 0) continue;
        const y = (-deg / 90) * radius;
        const w = (deg % 20 === 0) ? 36 : 20;

        this.ctx.beginPath();
        this.ctx.moveTo(-w, y);
        this.ctx.lineTo(w, y);
        this.ctx.stroke();

        if (deg % 20 === 0) {
          this.ctx.fillText(`${deg}°`, w + 14, y + 3);
          this.ctx.fillText(`${deg}°`, -w - 14, y + 3);
        }
      }

      this.ctx.restore();

      // Outer bezel ring
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.lineWidth = 4;
      this.ctx.stroke();

      // Center Fixed Aircraft Symbol
      this.ctx.strokeStyle = '#facc15';
      this.ctx.lineWidth = 3.5;
      this.ctx.beginPath();
      this.ctx.moveTo(cx - 30, cy);
      this.ctx.lineTo(cx - 10, cy);
      this.ctx.lineTo(cx, cy + 6);
      this.ctx.lineTo(cx + 10, cy);
      this.ctx.lineTo(cx + 30, cy);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      this.ctx.fillStyle = '#facc15';
      this.ctx.fill();
    }
    requestAnimationFrame(() => this.animateAttitude());
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
    if (this.dom.pitchSlider) {
      this.dom.pitchSlider.addEventListener('input', (e) => {
        const p = parseFloat(e.target.value);
        if (this.dom.pitchValLabel) this.dom.pitchValLabel.textContent = `${p}°`;
        this.simulation.setManualOrientation(p, this.dom.rollSlider ? parseFloat(this.dom.rollSlider.value) : 0);
      });
    }
    if (this.dom.rollSlider) {
      this.dom.rollSlider.addEventListener('input', (e) => {
        const r = parseFloat(e.target.value);
        if (this.dom.rollValLabel) this.dom.rollValLabel.textContent = `${r}°`;
        this.simulation.setManualOrientation(this.dom.pitchSlider ? parseFloat(this.dom.pitchSlider.value) : 0, r);
      });
    }

    if (this.dom.btnExportCsv) {
      this.dom.btnExportCsv.addEventListener('click', () => {
        if (this.history.length === 0) {
          CommonUI.toast('No IMU kinematics data to export', 'warning');
          return;
        }
        const headers = ['Timestamp', 'Date_Time', 'Mode', 'Pitch_Deg', 'Roll_Deg', 'Total_G', 'State'];
        const rows = this.history.map(item => [
          item.timestamp,
          new Date(item.timestamp).toISOString(),
          item.mode,
          item.readings.pitchDeg ?? '',
          item.readings.rollDeg ?? '',
          item.readings.totalG ?? '',
          item.readings.motionState
        ]);
        Utils.exportToCSV(`imu_kinematics_log_${Date.now()}`, headers, rows);
        CommonUI.toast('Exported IMU Kinematics data to CSV!', 'success');
      });
    }

    if (this.dom.btnTestHw) {
      this.dom.btnTestHw.addEventListener('click', async () => {
        this.hardware.setDeviceIp(this.dom.hwIpInput.value);
        this.dom.hwTestResult.textContent = 'Contacting ESP8266 MPU6050...';
        const res = await this.hardware.testConnection();
        if (res.success) {
          this.dom.hwTestResult.textContent = `✓ Linked with ${res.device.deviceId || 'ESP8266'}`;
          this.dom.hwTestResult.style.color = 'var(--status-ok-text)';
          CommonUI.toast('Connected to MPU6050 IMU!', 'success');
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
        CommonUI.toast('Polling ESP8266 MPU6050...', 'info');
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
    const isFault = data.sensorStatus !== 'ok' || data.readings.pitchDeg === null;
    const p = data.readings.pitchDeg;
    const r = data.readings.rollDeg;
    const g = data.readings.totalG;
    const state = data.readings.motionState;
    const now = new Date(data.timestamp);

    this.history.push(data);
    if (this.history.length > 200) this.history.shift();

    if (this.dom.lastUpdated) this.dom.lastUpdated.textContent = Utils.formatTime(now);

    if (isFault) {
      this.pitch = 0;
      this.roll = 0;
      if (this.dom.primaryPitch) this.dom.primaryPitch.textContent = '--';
      if (this.dom.statRoll) this.dom.statRoll.textContent = '--';
      if (this.dom.statGForce) this.dom.statGForce.textContent = '--';
      CommonUI.updateStatusPill(this.dom.sensorHealth, 'I2C NACK / Fault', 'danger');
      CommonUI.updateStatusPill(this.dom.readingValidity, 'Invalid', 'danger');
      CommonUI.updateStatusPill(this.dom.motionStatePill, 'Sensor Fault', 'danger');
      return;
    }

    this.pitch = p;
    this.roll = r;

    if (this.dom.primaryPitch) this.dom.primaryPitch.textContent = `${p}°`;
    if (this.dom.statRoll) this.dom.statRoll.textContent = `${r}°`;
    if (this.dom.statGForce) this.dom.statGForce.textContent = `${Utils.formatNumber(g, 2)} g`;

    CommonUI.updateStatusPill(this.dom.sensorHealth, 'MPU6050 Active', 'ok');
    CommonUI.updateStatusPill(this.dom.readingValidity, 'Valid', 'ok');

    let pillType = 'ok';
    if (state.includes('Shock')) pillType = 'danger';
    else if (state.includes('Vibration') || state.includes('Tilt')) pillType = 'warn';
    CommonUI.updateStatusPill(this.dom.motionStatePill, state, pillType);

    if (this.dom.attitudeBadge) {
      this.dom.attitudeBadge.textContent = `P: ${p}° | R: ${r}° | ${Utils.formatNumber(g, 2)}g`;
    }

    this.chart.addDataPoint(g, Utils.formatTime(now));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new VibrationTiltApp();
  app.init();
  window.vibrationTiltApp = app;
});
