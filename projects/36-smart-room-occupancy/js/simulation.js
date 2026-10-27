/**
 * Project 36: Smart Room Occupancy - Simulation Engine
 */

const RoomSim = {
  canvas: null,
  ctx: null,
  animId: null,
  presenceState: 'stationary', // 'stationary' | 'moving' | 'vacant'
  targetDistanceM: 1.8,
  dwellSeconds: 342,
  dwellTimer: null,
  radarAngle: 0,

  init() {
    this.canvas = document.getElementById('room-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.startLoop();
    this.startDwellTimer();
  },

  startLoop() {
    const loop = () => {
      this.update();
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  },

  startDwellTimer() {
    this.dwellTimer = setInterval(() => {
      if (this.presenceState !== 'vacant') {
        this.dwellSeconds++;
        if (window.onDwellTick) window.onDwellTick(this.dwellSeconds);
      }
    }, 1000);
  },

  setState(state) {
    this.presenceState = state;
    if (state === 'vacant') {
      this.targetDistanceM = 0;
      this.dwellSeconds = 0;
    } else if (state === 'stationary') {
      this.targetDistanceM = 1.8;
    } else if (state === 'moving') {
      this.targetDistanceM = 2.4;
    }
  },

  update() {
    this.radarAngle += 0.04;
    if (this.radarAngle > Math.PI * 2) this.radarAngle = 0;
  },

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Dark Room Blueprint background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Floor grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 35) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }

    // Room Furniture (Office Desk, Chair, Doorway)
    // Desk
    ctx.fillStyle = '#334155';
    ctx.fillRect(260, 100, 160, 70);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(260, 100, 160, 70);

    // Chair
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(340, 195, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Radar Sensor Unit on Wall (top-center)
    const rx = 340;
    const ry = 15;
    ctx.fillStyle = '#8b5cf6';
    ctx.beginPath();
    ctx.arc(rx, ry, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c4b5fd';
    ctx.font = '10px monospace';
    ctx.fillText('LD2410 mmWave (24GHz)', rx - 65, ry + 20);

    // Render Sweeping Radar Fan Arc
    ctx.save();
    ctx.translate(rx, ry);
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
    ctx.lineWidth = 1.5;
    for (let r = 50; r <= 220; r += 45) {
      ctx.beginPath();
      ctx.arc(0, 0, r, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
    }

    // Rotating Radar Sweep Beam
    const sweepAngle = Math.PI * 0.2 + (Math.sin(this.radarAngle) + 1) * 0.5 * (Math.PI * 0.6);
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(sweepAngle) * 220, Math.sin(sweepAngle) * 220);
    ctx.stroke();
    ctx.restore();

    // Render Target Human Presence if Occupied
    if (this.presenceState !== 'vacant') {
      const hx = this.presenceState === 'stationary' ? 340 : (320 + Math.sin(this.radarAngle * 1.5) * 45);
      const hy = this.presenceState === 'stationary' ? 195 : 140;

      ctx.save();
      // Target pulse aura
      ctx.fillStyle = this.presenceState === 'stationary' ? 'rgba(139, 92, 246, 0.25)' : 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      const pulseR = 24 + Math.sin(this.radarAngle * 3) * 6;
      ctx.arc(hx, hy, pulseR, 0, Math.PI * 2);
      ctx.fill();

      // Person Icon
      ctx.fillStyle = this.presenceState === 'stationary' ? '#8b5cf6' : '#0284c7';
      ctx.beginPath();
      ctx.arc(hx, hy, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '9px sans-serif';
      ctx.fillText(this.presenceState === 'stationary' ? 'HUMAN' : 'MOVING', hx - 18, hy + 30);
      ctx.restore();
    }
  }
};
