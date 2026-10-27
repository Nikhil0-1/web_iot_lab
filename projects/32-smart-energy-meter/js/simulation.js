/**
 * Project 32: Smart Energy Meter - Simulation Engine
 */

const EnergySim = {
  canvas: null,
  ctx: null,
  voltage: 228.4,
  current: 2.15,
  power: 491.0,
  energyKwh: 12.84,
  frequency: 50.0,
  powerFactor: 0.98,
  tariffPerKwh: 0.18,
  history: [],
  maxPoints: 50,
  timer: null,

  init() {
    this.canvas = document.getElementById('energy-chart-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Pre-populate history
    for (let i = 0; i < this.maxPoints; i++) {
      this.history.push(480 + (Math.random() - 0.5) * 40);
    }

    this.startPolling();
  },

  startPolling() {
    this.timer = setInterval(() => {
      this.tick();
      this.render();
      if (window.onEnergyUpdate) window.onEnergyUpdate();
    }, 1500);
  },

  tick() {
    // Add minor micro-fluctuations to voltage and current
    this.voltage = Number((228 + (Math.random() - 0.5) * 3.5).toFixed(1));
    this.current = Number((this.power / (this.voltage * this.powerFactor)).toFixed(2));
    this.power = Number((this.voltage * this.current * this.powerFactor).toFixed(1));
    this.frequency = Number((50.0 + (Math.random() - 0.5) * 0.12).toFixed(1));

    // Accumulate energy (kW * time in hrs)
    const deltaHours = 1.5 / 3600;
    this.energyKwh = Number((this.energyKwh + (this.power / 1000) * deltaHours).toFixed(4));

    this.history.push(this.power);
    if (this.history.length > this.maxPoints) this.history.shift();
  },

  setLoad(type) {
    if (type === 'light') {
      this.power = 45.0;
      this.powerFactor = 0.92;
    } else if (type === 'pc') {
      this.power = 280.0;
      this.powerFactor = 0.96;
    } else if (type === 'heater') {
      this.power = 1500.0;
      this.powerFactor = 0.99;
    } else if (type === 'standby') {
      this.power = 8.5;
      this.powerFactor = 0.70;
    }
    this.tick();
    this.render();
    if (window.onEnergyUpdate) window.onEnergyUpdate();
  },

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Dark high-tech background
    ctx.fillStyle = '#0b132b';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#1c2541';
    ctx.lineWidth = 1;
    for (let y = 30; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    if (this.history.length < 2) return;

    // Scale calculation
    const maxVal = Math.max(1600, ...this.history);
    const minVal = 0;
    const stepX = w / (this.maxPoints - 1);

    // Area Gradient Fill
    ctx.beginPath();
    ctx.moveTo(0, h);
    this.history.forEach((val, i) => {
      const x = i * stepX;
      const y = h - ((val - minVal) / (maxVal - minVal)) * (h - 40) - 20;
      if (i === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo((this.history.length - 1) * stepX, h);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(217, 119, 6, 0.45)');
    grad.addColorStop(1, 'rgba(217, 119, 6, 0.0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Line Path
    ctx.beginPath();
    this.history.forEach((val, i) => {
      const x = i * stepX;
      const y = h - ((val - minVal) / (maxVal - minVal)) * (h - 40) - 20;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw active pulse dot at latest point
    const latestX = (this.history.length - 1) * stepX;
    const latestY = h - ((this.history[this.history.length - 1] - minVal) / (maxVal - minVal)) * (h - 40) - 20;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(latestX, latestY, 5, 0, Math.PI * 2);
    ctx.fill();
  }
};
