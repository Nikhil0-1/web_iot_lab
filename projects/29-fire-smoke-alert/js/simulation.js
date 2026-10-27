/**
 * Project 29: Fire & Smoke Alert - Simulation Engine
 * Particle canvas for smoke plume & thermal convective dynamics.
 */

const SmokeSim = {
  canvas: null,
  ctx: null,
  animId: null,
  smokePpm: 65,
  thresholdPpm: 300,
  flameDetected: false,
  isWarmedUp: true,
  audioMuted: false,
  sirenOsc: null,
  audioCtx: null,

  particles: [],

  init() {
    this.canvas = document.getElementById('smoke-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.initParticles();
    this.startLoop();
  },

  initParticles() {
    this.particles = [];
    const count = 45;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: 340 + (Math.random() - 0.5) * 80,
        y: 270 - Math.random() * 260,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -0.8 - Math.random() * 1.5,
        radius: 8 + Math.random() * 22,
        alpha: 0.1 + Math.random() * 0.4
      });
    }
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
    const intensity = Math.min(3.5, Math.max(0.4, this.smokePpm / 150));

    this.particles.forEach(p => {
      p.y += p.vy * intensity;
      p.x += p.vx * intensity + (Math.random() - 0.5) * 0.5;
      p.radius += 0.15;
      p.alpha -= 0.003 * intensity;

      if (p.y < 0 || p.alpha <= 0) {
        p.x = 340 + (Math.random() - 0.5) * (this.flameDetected ? 60 : 30);
        p.y = 270;
        p.radius = 6 + Math.random() * 10;
        p.alpha = this.smokePpm > 150 ? (0.2 + Math.random() * 0.45) : 0.08;
      }
    });

    // Sound alert if alarm condition
    const isAlarm = (this.smokePpm >= this.thresholdPpm) || this.flameDetected;
    if (isAlarm && !this.audioMuted) {
      this.playSirenTone();
    } else {
      this.stopSirenTone();
    }
  },

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, w, h);

    // Grid Floor
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }

    // Heat / Combustion Source at bottom center
    ctx.fillStyle = this.flameDetected ? '#ef4444' : (this.smokePpm > 200 ? '#f59e0b' : '#3f3f46');
    ctx.beginPath();
    ctx.arc(340, 275, this.flameDetected ? 28 : 14, 0, Math.PI * 2);
    ctx.fill();

    // Render Smoke Particles
    this.particles.forEach(p => {
      ctx.save();
      const rgb = this.flameDetected ? '239, 68, 68' : (this.smokePpm > 200 ? '161, 161, 170' : '113, 113, 122');
      ctx.fillStyle = `rgba(${rgb}, ${Math.max(0, p.alpha)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  },

  playSirenTone() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (!this.sirenOsc) {
        this.sirenOsc = this.audioCtx.createOscillator();
        this.sirenGain = this.audioCtx.createGain();
        this.sirenOsc.type = 'sawtooth';
        this.sirenGain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
        this.sirenOsc.connect(this.sirenGain);
        this.sirenGain.connect(this.audioCtx.destination);
        this.sirenOsc.start();
      }
      // Modulate frequency between 700Hz and 1200Hz
      const time = this.audioCtx.currentTime;
      const freq = 850 + Math.sin(time * 6) * 350;
      this.sirenOsc.frequency.setValueAtTime(freq, time);
    } catch (e) {}
  },

  stopSirenTone() {
    if (this.sirenOsc) {
      try {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
      } catch (e) {}
      this.sirenOsc = null;
    }
  }
};
