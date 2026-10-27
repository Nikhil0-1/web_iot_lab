/**
 * Project 25: Smart Parking Assistant - Simulation Engine
 * Top-down dynamic canvas parking lot with cars, bay sonar beams, and animated barrier.
 */

const ParkingSim = {
  canvas: null,
  ctx: null,
  animId: null,
  selectedBay: 0,
  barrierOpen: false,

  bays: [
    { id: 0, x: 90,  y: 80,  w: 100, h: 180, occupied: false, distCm: 120, carColor: '#38bdf8' },
    { id: 1, x: 230, y: 80,  w: 100, h: 180, occupied: true,  distCm: 14,  carColor: '#f43f5e' },
    { id: 2, x: 370, y: 80,  w: 100, h: 180, occupied: false, distCm: 115, carColor: '#a855f7' },
    { id: 3, x: 510, y: 80,  w: 100, h: 180, occupied: false, distCm: 130, carColor: '#10b981' }
  ],

  enteringCar: null,

  init() {
    this.canvas = document.getElementById('parking-canvas');
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

  stopLoop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  },

  update() {
    // Handle moving vehicle animation if active
    if (this.enteringCar) {
      const car = this.enteringCar;
      const targetBay = this.bays[car.targetBay];
      const targetX = targetBay.x + 15;
      const targetY = targetBay.y + 20;

      if (car.state === 'driving-in') {
        car.x += (targetX - car.x) * 0.05;
        car.y += (targetY - car.y) * 0.05;
        // Sonar distance decreases
        targetBay.distCm = Math.max(12, Math.round(140 - ((car.y / targetY) * 126)));

        if (Math.abs(car.x - targetX) < 2 && Math.abs(car.y - targetY) < 2) {
          car.x = targetX;
          car.y = targetY;
          car.state = 'parked';
          targetBay.occupied = true;
          targetBay.distCm = 15;
          this.setBarrier(false);
          this.enteringCar = null;
          if (window.onParkingStateChange) window.onParkingStateChange();
        }
      } else if (car.state === 'driving-out') {
        car.y += 3;
        targetBay.distCm = Math.min(130, Math.round(15 + ((car.y - targetY) * 1.5)));
        if (car.y > 380) {
          targetBay.occupied = false;
          targetBay.distCm = 125;
          this.enteringCar = null;
          this.setBarrier(false);
          if (window.onParkingStateChange) window.onParkingStateChange();
        }
      }
    }
  },

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Asphalt Floor
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, w, h);

    // Driving lane road markings
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 12]);
    ctx.beginPath();
    ctx.moveTo(30, 310);
    ctx.lineTo(650, 310);
    ctx.stroke();
    ctx.setLineDash([]);

    // Entry Way
    ctx.fillStyle = '#334155';
    ctx.fillRect(590, 0, 90, 360);
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.fillText('ENTRY / EXIT', 600, 30);

    // Draw Bays
    this.bays.forEach((bay, idx) => {
      const isSelected = this.selectedBay === idx;

      // Bay Ground
      ctx.fillStyle = bay.occupied ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)';
      ctx.fillRect(bay.x, bay.y, bay.w, bay.h);

      // Bay Boundary
      ctx.strokeStyle = isSelected ? '#38bdf8' : (bay.occupied ? '#f87171' : '#34d399');
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeRect(bay.x, bay.y, bay.w, bay.h);

      // Bay Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.fillText(`BAY 0${idx + 1}`, bay.x + 30, bay.y - 12);

      // Ultrasonic Sensor Transducer icon on wall
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(bay.x + 50, bay.y - 4, 6, 0, Math.PI * 2);
      ctx.fill();

      // Ultrasonic distance pulse lines
      if (bay.occupied || isSelected) {
        ctx.strokeStyle = bay.occupied ? 'rgba(239,68,68,0.5)' : 'rgba(56,189,248,0.4)';
        ctx.lineWidth = 1.5;
        const beamY = bay.y + Math.min(bay.distCm, 140);
        ctx.beginPath();
        ctx.moveTo(bay.x + 25, beamY);
        ctx.lineTo(bay.x + 75, beamY);
        ctx.stroke();
      }

      // Draw Parked Car
      if (bay.occupied && (!this.enteringCar || this.enteringCar.targetBay !== idx)) {
        this.drawCar(ctx, bay.x + 15, bay.y + 20, bay.carColor);
      }
    });

    // Draw active animated car
    if (this.enteringCar) {
      this.drawCar(ctx, this.enteringCar.x, this.enteringCar.y, this.enteringCar.color);
    }
  },

  drawCar(ctx, x, y, color) {
    // Car Chassis
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, 70, 135, 12);
    ctx.fill();

    // Windshield & Windows
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 30, 54, 30, 4);
    ctx.fill();

    // Rear Window
    ctx.beginPath();
    ctx.roundRect(x + 10, y + 90, 50, 18, 4);
    ctx.fill();

    // Headlights
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + 8, y + 4, 12, 6);
    ctx.fillRect(x + 50, y + 4, 12, 6);

    // Taillights
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 8, y + 125, 12, 5);
    ctx.fillRect(x + 50, y + 125, 12, 5);

    ctx.restore();
  },

  parkCarInBay() {
    // Find first vacant bay
    const freeBay = this.bays.find(b => !b.occupied);
    if (!freeBay) {
      if (window.CommonUI) CommonUI.toast('All parking bays are occupied!', 'warning');
      return;
    }

    this.setBarrier(true);
    this.enteringCar = {
      x: 610,
      y: 300,
      targetBay: freeBay.id,
      color: freeBay.carColor,
      state: 'driving-in'
    };
  },

  exitCarFromBay() {
    const occBay = this.bays.find(b => b.occupied);
    if (!occBay) {
      if (window.CommonUI) CommonUI.toast('All parking bays are empty!', 'info');
      return;
    }

    this.setBarrier(true);
    this.enteringCar = {
      x: occBay.x + 15,
      y: occBay.y + 20,
      targetBay: occBay.id,
      color: occBay.carColor,
      state: 'driving-out'
    };
  },

  setBarrier(open) {
    this.barrierOpen = open;
    const arm = document.getElementById('gate-arm');
    const label = document.getElementById('gate-label');
    if (arm) arm.classList.toggle('open', open);
    if (label) label.textContent = open ? 'Gate: Open (Servo 90°)' : 'Gate: Closed (Servo 0°)';
  },

  reset() {
    this.bays[0].occupied = false; this.bays[0].distCm = 120;
    this.bays[1].occupied = true;  this.bays[1].distCm = 14;
    this.bays[2].occupied = false; this.bays[2].distCm = 115;
    this.bays[3].occupied = false; this.bays[3].distCm = 130;
    this.enteringCar = null;
    this.setBarrier(false);
  }
};
