/**
 * Project 30: Intrusion Detection Alarm - Simulation Engine
 */

const IntrusionSim = {
  canvas: null,
  ctx: null,
  animId: null,
  isArmed: true,
  activeMotion: false,
  activeZone: null,
  sirenActive: false,
  intruder: null,
  audioCtx: null,
  sirenOsc: null,

  zones: [
    { id: 'z1', name: 'Zone 1 (Entrance)', x: 40, y: 40, w: 180, h: 220, color: '#38bdf8' },
    { id: 'z2', name: 'Zone 2 (Living)',   x: 250, y: 40, w: 200, h: 220, color: '#a855f7' },
    { id: 'z3', name: 'Zone 3 (Perimeter)',x: 480, y: 40, w: 160, h: 220, color: '#f59e0b' }
  ],

  init() {
    this.canvas = document.getElementById('floorplan-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
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
    this.sirenActive = this.isArmed && this.activeMotion;
    const strobe = document.getElementById('siren-strobe');
    if (strobe) strobe.classList.toggle('active', this.sirenActive);

    if (this.sirenActive) this.startSirenSound();
    else this.stopSirenSound();
  },

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Blueprint background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Floorplan grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }

    // Render Detection Zones
    this.zones.forEach(z => {
      const isBreached = this.activeMotion && this.activeZone === z.name;
      ctx.fillStyle = isBreached ? 'rgba(239, 68, 68, 0.22)' : 'rgba(56, 189, 248, 0.05)';
      ctx.fillRect(z.x, z.y, z.w, z.h);

      ctx.strokeStyle = isBreached ? '#ef4444' : (this.isArmed ? z.color : '#475569');
      ctx.lineWidth = isBreached ? 3 : 1.5;
      ctx.strokeRect(z.x, z.y, z.w, z.h);

      ctx.fillStyle = isBreached ? '#fca5a5' : '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.fillText(z.name, z.x + 12, z.y + 24);

      // PIR sensor icon at ceiling corner
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(z.x + z.w - 18, z.y + 18, 6, 0, Math.PI * 2);
      ctx.fill();

      // Detection fan arcs
      if (this.isArmed) {
        ctx.strokeStyle = isBreached ? 'rgba(239,68,68,0.4)' : 'rgba(56,189,248,0.15)';
        ctx.beginPath();
        ctx.arc(z.x + z.w - 18, z.y + 18, 50, Math.PI * 0.5, Math.PI);
        ctx.stroke();
      }
    });

    // Draw Intruder Person if active
    if (this.intruder) {
      ctx.save();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(this.intruder.x, this.intruder.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.fillText('TARGET', this.intruder.x - 20, this.intruder.y + 28);
      ctx.restore();
    }
  },

  triggerIntrusion(zoneName) {
    this.activeMotion = true;
    this.activeZone = zoneName;
    const z = this.zones.find(zn => zn.name === zoneName) || this.zones[0];
    this.intruder = { x: z.x + z.w / 2, y: z.y + z.h / 2 };
  },

  clearIntrusion() {
    this.activeMotion = false;
    this.activeZone = null;
    this.intruder = null;
  },

  startSirenSound() {
    try {
      if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (!this.sirenOsc) {
        this.sirenOsc = this.audioCtx.createOscillator();
        this.sirenGain = this.audioCtx.createGain();
        this.sirenOsc.type = 'sawtooth';
        this.sirenGain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
        this.sirenOsc.connect(this.sirenGain);
        this.sirenGain.connect(this.audioCtx.destination);
        this.sirenOsc.start();
      }
      const t = this.audioCtx.currentTime;
      this.sirenOsc.frequency.setValueAtTime(900 + Math.sin(t * 8) * 300, t);
    } catch (e) {}
  },

  stopSirenSound() {
    if (this.sirenOsc) {
      try {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
      } catch (e) {}
      this.sirenOsc = null;
    }
  }
};
