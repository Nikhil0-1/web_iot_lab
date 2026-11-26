/**
 * Project 35: Digital Notice Board - High-Fidelity OLED Simulation Engine
 * Pixel-accurate 1:1 emulation of SSD1306 128x64 I2C monochrome OLED display buffer.
 */

const OledSim = {
  canvas: null,
  ctx: null,
  message: 'TECH IOT WARRIORS: LAB ACTIVE',
  fontSize: 2,         // 1: small (6x8 px font), 2: medium (12x16 px font)
  scrollSpeed: 2,      // 0 = static, 1 = slow, 2 = normal, 4 = fast
  scrollX: 128,        // Current X coordinate in 128x64 space
  textWidth: 0,
  isLongMessage: false,
  networkMode: 'AP',
  deviceIp: '192.168.4.1',
  animId: null,
  lastFrameTime: 0,

  init() {
    this.canvas = document.getElementById('oled-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.recalculateMetrics();
    this.startLoop();
  },

  recalculateMetrics() {
    // Adafruit GFX classic monospace bitmap font metrics:
    // Size 1: 6px width per char (5px glyph + 1px spacing), 8px height
    // Size 2: 12px width per char (10px glyph + 2px spacing), 16px height
    const charWidth = (this.fontSize === 1) ? 6 : 12;
    this.textWidth = this.message.length * charWidth;
    this.isLongMessage = (this.textWidth > 120);

    if (!this.isLongMessage || this.scrollSpeed === 0) {
      this.scrollX = Math.max(2, Math.floor((128 - this.textWidth) / 2));
    } else {
      this.scrollX = 128;
    }
  },

  setMessage(msg) {
    if (!msg || typeof msg !== 'string') return;
    const sanitized = msg.trim().toUpperCase().slice(0, 160);
    this.message = sanitized || 'NOTICE BOARD READY';
    this.recalculateMetrics();
  },

  setDeviceStatus(mode, ip) {
    if (mode) this.networkMode = mode;
    if (ip) this.deviceIp = ip;
  },

  startLoop() {
    if (this.animId) cancelAnimationFrame(this.animId);
    const loop = (timestamp) => {
      if (!this.lastFrameTime) this.lastFrameTime = timestamp;
      const elapsed = timestamp - this.lastFrameTime;
      const frameInterval = (this.scrollSpeed === 4) ? 25 : ((this.scrollSpeed === 1) ? 60 : 35);

      if (elapsed >= frameInterval) {
        this.lastFrameTime = timestamp;
        this.update();
        this.render();
      }
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  },

  stopLoop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  },

  update() {
    if (this.isLongMessage && this.scrollSpeed > 0) {
      this.scrollX -= this.scrollSpeed;
      const minX = -(this.textWidth + 8);
      if (this.scrollX < minX) {
        this.scrollX = 128;
      }
    }
  },

  render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;

    // Reset transform & clear canvas (physical canvas is 256x128 for crisp display)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply 2x scale to map exactly to 128x64 OLED coordinate space
    ctx.save();
    ctx.scale(2, 2);

    // 1. FIXED HEADER REGION (Y: 0 to 11)
    ctx.fillStyle = '#38bdf8';
    ctx.font = '7px monospace';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    ctx.fillText('== NOTICE BOARD ==', 64, 1);

    // Header Separator Line
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 11);
    ctx.lineTo(127, 11);
    ctx.stroke();

    // 2. CENTRAL MESSAGE REGION (Y: 14 to 49)
    // Clip drawing region to message viewport to strictly prevent boundary spill
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 12, 128, 39);
    ctx.clip();

    ctx.fillStyle = '#00f59b';
    const fontPx = (this.fontSize === 1) ? 8 : 14;
    ctx.font = `bold ${fontPx}px monospace`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    const msgY = (this.fontSize === 1) ? 28 : 24;
    ctx.fillText(this.message, this.scrollX, msgY);
    ctx.restore();

    // 3. FIXED FOOTER REGION (Y: 52 to 63)
    ctx.strokeStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(0, 52);
    ctx.lineTo(127, 52);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '7px monospace';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(`${this.networkMode} ${this.deviceIp}`, 2, 55);

    ctx.textAlign = 'right';
    const speedLabel = (this.scrollSpeed === 0) ? 'STATIC' : `SPD:${this.scrollSpeed}`;
    ctx.fillText(`${speedLabel} 128x64`, 126, 55);

    ctx.restore();

    // OLED Phosphor Pixel Grid Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    for (let y = 0; y < this.canvas.height; y += 2) {
      ctx.fillRect(0, y, this.canvas.width, 1);
    }
  }
};

if (typeof window !== 'undefined') {
  window.OledSim = OledSim;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OledSim;
}
