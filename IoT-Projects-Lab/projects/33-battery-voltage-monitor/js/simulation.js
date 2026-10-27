/**
 * Project 33: Battery Voltage Monitor - Simulation Engine
 */

const BatterySim = {
  canvas: null,
  ctx: null,
  voltage: 12.42,
  percent: 78,
  chemistry: 'lead-acid',
  minV: 10.5,
  maxV: 13.8,
  dividerRatio: 4.18,
  history: [],
  maxPoints: 40,

  chemProfiles: {
    'lead-acid': { name: '12V Lead-Acid', minV: 10.5, maxV: 13.8, defaultV: 12.42 },
    'li-ion-1s': { name: '1S 18650 Li-Ion', minV: 3.0, maxV: 4.2, defaultV: 3.85 },
    'li-ion-3s': { name: '3S Li-Ion Pack', minV: 9.0, maxV: 12.6, defaultV: 11.4 },
    'lifepo4-4s': { name: '4S LiFePO4 Pack', minV: 10.0, maxV: 14.4, defaultV: 13.2 }
  },

  init() {
    this.canvas = document.getElementById('voltage-chart-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    for (let i = 0; i < this.maxPoints; i++) {
      this.history.push(this.voltage + (Math.random() - 0.5) * 0.04);
    }

    this.renderChart();
  },

  setChemistry(key) {
    if (!this.chemProfiles[key]) return;
    this.chemistry = key;
    const p = this.chemProfiles[key];
    this.minV = p.minV;
    this.maxV = p.maxV;
    this.voltage = p.defaultV;
    this.calculatePercent();
    this.history = Array(this.maxPoints).fill(this.voltage);
    this.renderChart();
  },

  calculatePercent() {
    const raw = ((this.voltage - this.minV) / (this.maxV - this.minV)) * 100;
    this.percent = Math.max(0, Math.min(100, Math.round(raw)));
  },

  setChargeLevel(targetPct) {
    this.percent = targetPct;
    this.voltage = Number((this.minV + (targetPct / 100) * (this.maxV - this.minV)).toFixed(2));
    this.history.push(this.voltage);
    if (this.history.length > this.maxPoints) this.history.shift();
    this.renderChart();
  },

  renderChart() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1;
    for (let y = 20; y < h; y += 35) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    if (this.history.length < 2) return;

    const min = this.minV * 0.95;
    const max = this.maxV * 1.05;
    const stepX = w / (this.maxPoints - 1);

    // Area fill
    ctx.beginPath();
    ctx.moveTo(0, h);
    this.history.forEach((val, i) => {
      const x = i * stepX;
      const y = h - ((val - min) / (max - min)) * (h - 30) - 15;
      ctx.lineTo(x, y);
    });
    ctx.lineTo((this.history.length - 1) * stepX, h);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(34, 197, 94, 0.35)');
    grad.addColorStop(1, 'rgba(34, 197, 94, 0.0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Line Path
    ctx.beginPath();
    this.history.forEach((val, i) => {
      const x = i * stepX;
      const y = h - ((val - min) / (max - min)) * (h - 30) - 15;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
};
