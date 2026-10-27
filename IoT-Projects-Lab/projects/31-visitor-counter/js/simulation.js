/**
 * Project 31: Visitor Counter - Simulation Engine
 */

const VisitorSim = {
  canvas: null,
  ctx: null,
  animId: null,
  beamA_broken: false,
  beamB_broken: false,
  totalEntered: 142,
  totalExited: 128,
  occupancy: 14,
  pedestrian: null,

  // Break-beam X coordinates
  beamA_X: 280,
  beamB_X: 400,

  init() {
    this.canvas = document.getElementById('doorway-canvas');
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
    if (this.pedestrian) {
      const p = this.pedestrian;
      p.x += p.vx;

      // Check Beam A collision
      this.beamA_broken = Math.abs(p.x - this.beamA_X) < 18;
      // Check Beam B collision
      this.beamB_broken = Math.abs(p.x - this.beamB_X) < 18;

      // Track sequence
      if (this.beamA_broken && !p.hitA) p.hitA = true;
      if (this.beamB_broken && !p.hitB) p.hitB = true;

      // Finished crossing
      if (p.dir === 'in' && p.x > 580) {
        if (p.hitA && p.hitB) {
          this.totalEntered++;
          this.occupancy++;
          if (window.onVisitorCrossing) window.onVisitorCrossing('Entry', 'Visitor entered facility (A → B)');
        }
        this.pedestrian = null;
        this.beamA_broken = false;
        this.beamB_broken = false;
      } else if (p.dir === 'out' && p.x < 100) {
        if (p.hitB && p.hitA) {
          this.totalExited++;
          this.occupancy = Math.max(0, this.occupancy - 1);
          if (window.onVisitorCrossing) window.onVisitorCrossing('Exit', 'Visitor departed facility (B → A)');
        }
        this.pedestrian = null;
        this.beamA_broken = false;
        this.beamB_broken = false;
      }
    }

    // UI Tags
    const tagA = document.getElementById('tag-beam-a');
    const tagB = document.getElementById('tag-beam-b');
    if (tagA) {
      tagA.classList.toggle('broken', this.beamA_broken);
      tagA.textContent = this.beamA_broken ? 'Beam A: TRIPPED' : 'Beam A: Clear';
    }
    if (tagB) {
      tagB.classList.toggle('broken', this.beamB_broken);
      tagB.textContent = this.beamB_broken ? 'Beam B: TRIPPED' : 'Beam B: Clear';
    }
  },

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Floor background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Doorway Frame
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(240, 20, 200, 220);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.strokeRect(240, 20, 200, 220);

    // Outside / Inside Floor labels
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.fillText('OUTSIDE (ENTRANCE)', 80, 245);
    ctx.fillText('INSIDE (FACILITY)', 490, 245);

    // Render Beam A (Red/Green line)
    ctx.strokeStyle = this.beamA_broken ? '#ef4444' : '#10b981';
    ctx.lineWidth = this.beamA_broken ? 3 : 1.5;
    ctx.setLineDash(this.beamA_broken ? [4, 4] : []);
    ctx.beginPath();
    ctx.moveTo(this.beamA_X, 20);
    ctx.lineTo(this.beamA_X, 240);
    ctx.stroke();

    // Render Beam B (Red/Green line)
    ctx.strokeStyle = this.beamB_broken ? '#ef4444' : '#38bdf8';
    ctx.lineWidth = this.beamB_broken ? 3 : 1.5;
    ctx.setLineDash(this.beamB_broken ? [4, 4] : []);
    ctx.beginPath();
    ctx.moveTo(this.beamB_X, 20);
    ctx.lineTo(this.beamB_X, 240);
    ctx.stroke();
    ctx.setLineDash([]);

    // Transducer Nodes
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(this.beamA_X - 4, 16, 8, 8);
    ctx.fillRect(this.beamA_X - 4, 236, 8, 8);
    ctx.fillRect(this.beamB_X - 4, 16, 8, 8);
    ctx.fillRect(this.beamB_X - 4, 236, 8, 8);

    // Render Moving Person
    if (this.pedestrian) {
      ctx.save();
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(this.pedestrian.x, 130, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.fillText(this.pedestrian.dir === 'in' ? '→' : '←', this.pedestrian.x - 4, 134);
      ctx.restore();
    }
  },

  simulateEntry() {
    if (this.pedestrian) return;
    this.pedestrian = { x: 120, vx: 3.5, dir: 'in', hitA: false, hitB: false };
  },

  simulateExit() {
    if (this.pedestrian) return;
    this.pedestrian = { x: 560, vx: -3.5, dir: 'out', hitA: false, hitB: false };
  },

  reset() {
    this.totalEntered = 0;
    this.totalExited = 0;
    this.occupancy = 0;
    this.pedestrian = null;
    this.beamA_broken = false;
    this.beamB_broken = false;
  }
};
