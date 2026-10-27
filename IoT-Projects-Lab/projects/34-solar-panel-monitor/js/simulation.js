/**
 * Project 34: Solar Panel Monitor - Simulation Engine
 */

const SolarSim = {
  canvas: null,
  ctx: null,
  animId: null,
  sunAngle: 0.5 * Math.PI, // Solar noon
  sunIntensity: 1.0,
  voltage: 18.2,
  currentMa: 1420,
  powerW: 25.8,
  dailyWh: 142.5,
  sunRays: [],

  init() {
    this.canvas = document.getElementById('solar-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Init rays
    for (let i = 0; i < 20; i++) {
      this.sunRays.push({
        offset: Math.random() * Math.PI * 2,
        len: 15 + Math.random() * 25
      });
    }

    this.startLoop();
  },

  startLoop() {
    const loop = () => {
      this.update();
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  },

  update() {
    // Micro fluctuations
    if (this.sunIntensity > 0.05) {
      const noise = (Math.random() - 0.5) * 0.1;
      this.voltage = Number((18.0 * this.sunIntensity + noise).toFixed(1));
      this.currentMa = Math.round(1450 * this.sunIntensity + (Math.random() - 0.5) * 30);
      this.powerW = Number(((this.voltage * this.currentMa) / 1000).toFixed(1));
      // Accumulate Wh
      this.dailyWh = Number((this.dailyWh + (this.powerW / 3600) * 0.05).toFixed(1));
    } else {
      this.voltage = 0.4;
      this.currentMa = 0;
      this.powerW = 0.0;
    }
  },

  setSunlight(type) {
    if (type === 'noon') {
      this.sunIntensity = 1.0;
      this.sunAngle = 0.5 * Math.PI;
    } else if (type === 'overcast') {
      this.sunIntensity = 0.35;
      this.sunAngle = 0.4 * Math.PI;
    } else if (type === 'sunset') {
      this.sunIntensity = 0.12;
      this.sunAngle = 0.15 * Math.PI;
    } else if (type === 'night') {
      this.sunIntensity = 0.0;
      this.sunAngle = 0;
    }
  },

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Sky Background gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (this.sunIntensity > 0.6) {
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(1, '#38bdf8');
    } else if (this.sunIntensity > 0.2) {
      skyGrad.addColorStop(0, '#475569');
      skyGrad.addColorStop(1, '#94a3b8');
    } else if (this.sunIntensity > 0.05) {
      skyGrad.addColorStop(0, '#78350f');
      skyGrad.addColorStop(1, '#ea580c');
    } else {
      skyGrad.addColorStop(0, '#09090b');
      skyGrad.addColorStop(1, '#1e293b');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Ground Grass / Roof
    ctx.fillStyle = '#166534';
    ctx.fillRect(0, 210, w, 50);

    // Draw Sun if visible
    if (this.sunIntensity > 0) {
      const sunX = 140 + Math.cos(this.sunAngle) * 80;
      const sunY = 70 - Math.sin(this.sunAngle) * 30;

      ctx.save();
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 30 * this.sunIntensity;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 26, 0, Math.PI * 2);
      ctx.fill();

      // Sunrays
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.4)';
      ctx.lineWidth = 2;
      this.sunRays.forEach(r => {
        ctx.beginPath();
        const rx = sunX + Math.cos(r.offset) * (32 + r.len);
        const ry = sunY + Math.sin(r.offset) * (32 + r.len);
        ctx.moveTo(sunX + Math.cos(r.offset) * 28, sunY + Math.sin(r.offset) * 28);
        ctx.lineTo(rx, ry);
        ctx.stroke();
      });
      ctx.restore();
    }

    // Solar Panel Array Isometric Stand
    const px = 420;
    const py = 120;

    // Panel Frame
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(px - 100, py + 70);
    ctx.lineTo(px + 100, py + 70);
    ctx.lineTo(px + 70, py - 40);
    ctx.lineTo(px - 130, py - 40);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Blue Monocrystalline Photovoltaic Cells Grid
    ctx.fillStyle = this.sunIntensity > 0.05 ? '#1d4ed8' : '#0f172a';
    ctx.beginPath();
    ctx.moveTo(px - 94, py + 65);
    ctx.lineTo(px + 94, py + 65);
    ctx.lineTo(px + 66, py - 35);
    ctx.lineTo(px - 124, py - 35);
    ctx.closePath();
    ctx.fill();

    // Grid lines on solar panel
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    for (let c = -80; c <= 80; c += 35) {
      ctx.beginPath();
      ctx.moveTo(px + c - 20, py - 35);
      ctx.lineTo(px + c, py + 65);
      ctx.stroke();
    }

    // Metal Stand Legs
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(px - 120, py - 35);
    ctx.lineTo(px - 120, py + 90);
    ctx.moveTo(px + 60, py - 35);
    ctx.lineTo(px + 60, py + 90);
    ctx.stroke();

    ctx.restore();
  }
};
