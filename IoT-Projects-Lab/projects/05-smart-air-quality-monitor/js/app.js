/**
 * Project 01 — Smart Air Quality Monitor Main Application
 */

class AirQualityApp {
  constructor() {
    this.config = window.AirQualityConfig;
    this.mode = 'simulation';
    this.history = [];

    this.chart = null;
    this.simulation = null;
    this.hardware = null;

    // Particle Canvas
    this.canvas = document.getElementById('air-particles-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.targetParticleCount = 20;
    this.particleColor = 'rgba(16, 185, 129, 0.4)';
    this.animId = null;

    this.dom = {
      primaryValue: document.getElementById('primary-aqi-value'),
      rawAdcValue: document.getElementById('stat-raw-adc'),
      tierBadge: document.getElementById('air-tier-badge'),
      warmupPill: document.getElementById('warmup-status-pill'),
      sensorHealth: document.getElementById('sensor-health-pill'),
      readingValidity: document.getElementById('reading-validity-pill'),
      lastUpdated: document.getElementById('last-updated-text'),
      diagnosticsMsg: document.getElementById('diagnostics-msg'),
      haloProgress: document.getElementById('aqi-halo-progress'),
      haloAqiVal: document.getElementById('halo-aqi-val'),
      statEstCo2: document.getElementById('stat-est-co2'),
      statVentilation: document.getElementById('stat-ventilation'),
      // Controls
      btnStart: document.getElementById('btn-sim-start'),
      btnPause: document.getElementById('btn-sim-pause'),
      btnReset: document.getElementById('btn-sim-reset'),
      speedSelect: document.getElementById('sim-speed-select'),
      scenarioSelect: document.getElementById('sim-scenario-select'),
      aqiSlider: document.getElementById('aqi-override-slider'),
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
    this.initParticleCanvas();

    this.chart = new MiniTimeSeriesChart('#air-chart', {
      maxPoints: this.config.chartMaxPoints,
      lineColor: '#10b981',
      fillColor: 'rgba(16, 185, 129, 0.12)',
      unit: '',
      min: 0,
      max: 350,
      precision: 0
    });

    this.simulation = new AirQualitySimulation(this.config, (data) => {
      if (this.mode === 'simulation') this.updateDisplay(data);
    });

    this.hardware = new AirQualityHardware(
      this.config,
      (data) => {
        if (this.mode === 'hardware') this.updateDisplay(data);
      },
      (state, detail) => {
        if (this.dom.diagnosticsMsg) {
          this.dom.diagnosticsMsg.textContent = `HW: ${state} ${detail || ''}`;
        }
      },
      (err) => {
        CommonUI.updateStatusPill(this.dom.sensorHealth, 'HW Error', 'danger');
      }
    );

    this.bindEvents();
    this.setMode('simulation');
    this.simulation.start();
    this.animateParticles();
  }

  initParticleCanvas() {
    if (!this.canvas) return;
    const resize = () => {
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
    };
    resize();
    window.addEventListener('resize', Utils.debounce(resize, 150));

    // Spawn initial particles
    this.particles = [];
    for (let i = 0; i < 40; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle() {
    const w = this.canvas ? this.canvas.width : 400;
    const h = this.canvas ? this.canvas.height : 240;
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 3 + 1.5,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      alpha: Math.random() * 0.6 + 0.2
    };
  }

  animateParticles() {
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Adjust particle count and color dynamically
      while (this.particles.length < this.targetParticleCount) {
        this.particles.push(this.createParticle());
      }
      if (this.particles.length > this.targetParticleCount) {
        this.particles.length = this.targetParticleCount;
      }

      this.ctx.fillStyle = this.particleColor;
      for (const p of this.particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = this.canvas.width;
        if (p.x > this.canvas.width) p.x = 0;
        if (p.y < 0) p.y = this.canvas.height;
        if (p.y > this.canvas.height) p.y = 0;

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    this.animId = requestAnimationFrame(() => this.animateParticles());
  }

  bindEvents() {
    if (this.dom.modeToggleSim) {
      this.dom.modeToggleSim.addEventListener('click', () => this.setMode('simulation'));
    }
    if (this.dom.modeToggleHw) {
      this.dom.modeToggleHw.addEventListener('click', () => this.setMode('hardware'));
    }

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
    if (this.dom.aqiSlider) {
      this.dom.aqiSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (this.dom.sliderValLabel) this.dom.sliderValLabel.textContent = `AQI ${val}`;
        this.simulation.setManualAqi(val);
      });
    }

    if (this.dom.btnExportCsv) {
      this.dom.btnExportCsv.addEventListener('click', () => {
        if (this.history.length === 0) {
          CommonUI.toast('No recorded air data to export', 'warning');
          return;
        }
        const headers = ['Timestamp', 'Date_Time', 'Mode', 'Air_Index', 'Raw_ADC', 'Air_Tier', 'Sensor_Status'];
        const rows = this.history.map(item => [
          item.timestamp,
          new Date(item.timestamp).toISOString(),
          item.mode,
          item.readings.airQualityIndex ?? '',
          item.readings.rawAdc ?? '',
          item.readings.airTier ?? '',
          item.sensorStatus
        ]);
        Utils.exportToCSV(`air_quality_log_${Date.now()}`, headers, rows);
        CommonUI.toast('Exported Air Quality data to CSV!', 'success');
      });
    }

    if (this.dom.btnTestHw) {
      this.dom.btnTestHw.addEventListener('click', async () => {
        this.hardware.setDeviceIp(this.dom.hwIpInput.value);
        this.dom.hwTestResult.textContent = 'Pinging ESP8266...';
        const res = await this.hardware.testConnection();
        if (res.success) {
          this.dom.hwTestResult.textContent = `✓ Linked with ${res.device.deviceId || 'ESP8266'}`;
          this.dom.hwTestResult.style.color = 'var(--status-ok-text)';
          CommonUI.toast('ESP8266 MQ-135 monitor connected!', 'success');
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
        CommonUI.toast('Connecting to ESP8266...', 'info');
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
    const isFault = data.sensorStatus !== 'ok' || data.readings.airQualityIndex === null;
    const aqi = data.readings.airQualityIndex;
    const rawAdc = data.readings.rawAdc;
    const tier = data.readings.airTier;
    const now = new Date(data.timestamp);

    this.history.push(data);
    if (this.history.length > 200) this.history.shift();

    if (this.dom.lastUpdated) this.dom.lastUpdated.textContent = Utils.formatTime(now);

    if (isFault) {
      if (this.dom.primaryValue) this.dom.primaryValue.textContent = '--';
      if (this.dom.rawAdcValue) this.dom.rawAdcValue.textContent = '--';
      if (this.dom.haloAqiVal) this.dom.haloAqiVal.textContent = '--';
      if (this.dom.haloProgress) this.dom.haloProgress.style.strokeDashoffset = '440';
      CommonUI.updateStatusPill(this.dom.sensorHealth, 'Fault / Disconnected', 'danger');
      CommonUI.updateStatusPill(this.dom.readingValidity, 'Invalid', 'danger');
      if (this.dom.tierBadge) {
        this.dom.tierBadge.className = 'air-tier-badge tier-fault';
        this.dom.tierBadge.textContent = 'Sensor Disconnected';
      }
      this.targetParticleCount = 5;
      this.particleColor = 'rgba(148, 163, 184, 0.2)';
      return;
    }

    if (this.dom.primaryValue) this.dom.primaryValue.textContent = aqi;
    if (this.dom.rawAdcValue) this.dom.rawAdcValue.textContent = `${rawAdc} / 1023`;
    if (this.dom.haloAqiVal) this.dom.haloAqiVal.textContent = aqi;

    // Halo Arc progress: circumference 2 * PI * 70 = ~440. Cap at AQI 350
    if (this.dom.haloProgress) {
      const fraction = Math.min(Math.max(aqi / 350, 0), 1);
      const offset = 440 - (fraction * 340); // sweep 340 of 440 circumference
      this.dom.haloProgress.style.strokeDashoffset = `${offset}`;
      if (tier === 'Good') {
        this.dom.haloProgress.style.stroke = '#10b981';
      } else if (tier === 'Moderate') {
        this.dom.haloProgress.style.stroke = '#f59e0b';
      } else if (tier === 'Unhealthy') {
        this.dom.haloProgress.style.stroke = '#f97316';
      } else {
        this.dom.haloProgress.style.stroke = '#e11d48';
      }
    }

    // Aux calculations
    if (this.dom.statEstCo2) {
      const co2 = Math.round(380 + (aqi * 4.2));
      this.dom.statEstCo2.textContent = `${co2} ppm`;
    }
    if (this.dom.statVentilation) {
      if (tier === 'Good') this.dom.statVentilation.textContent = 'Optimal';
      else if (tier === 'Moderate') this.dom.statVentilation.textContent = 'Adequate';
      else if (tier === 'Unhealthy') this.dom.statVentilation.textContent = 'Needs Airflow';
      else this.dom.statVentilation.textContent = 'Evacuate / Vent';
    }

    CommonUI.updateStatusPill(this.dom.sensorHealth, 'MQ-135 Active', 'ok');
    CommonUI.updateStatusPill(this.dom.readingValidity, 'Valid', 'ok');

    // Warmup status
    if (data.readings.warmupComplete) {
      CommonUI.updateStatusPill(this.dom.warmupPill, 'Preheated & Ready', 'ok');
    } else {
      CommonUI.updateStatusPill(this.dom.warmupPill, `Warming up (${data.readings.warmupRemaining || 0}s)`, 'warn');
    }

    // Tier badge & particle visuals
    if (this.dom.tierBadge) {
      let badgeClass = 'tier-good';
      if (tier === 'Moderate') badgeClass = 'tier-moderate';
      else if (tier === 'Unhealthy') badgeClass = 'tier-unhealthy';
      else if (tier === 'Hazardous') badgeClass = 'tier-hazardous';

      this.dom.tierBadge.className = `air-tier-badge ${badgeClass}`;
      this.dom.tierBadge.textContent = `${tier} Air Quality`;
    }

    // Dynamic particles response
    if (tier === 'Good') {
      this.targetParticleCount = 18;
      this.particleColor = 'rgba(16, 185, 129, 0.45)';
    } else if (tier === 'Moderate') {
      this.targetParticleCount = 40;
      this.particleColor = 'rgba(234, 179, 8, 0.55)';
    } else if (tier === 'Unhealthy') {
      this.targetParticleCount = 75;
      this.particleColor = 'rgba(249, 115, 22, 0.65)';
    } else {
      this.targetParticleCount = 120;
      this.particleColor = 'rgba(225, 29, 72, 0.75)';
    }

    this.chart.addDataPoint(aqi, Utils.formatTime(now));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new AirQualityApp();
  app.init();
  window.airQualityApp = app;
});
