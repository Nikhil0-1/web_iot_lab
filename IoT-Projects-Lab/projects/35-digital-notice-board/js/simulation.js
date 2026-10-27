/**
 * Project 35: Digital Notice Board - Simulation Engine
 * Pixel-accurate emulation of an SSD1306 128x64 monochrome OLED screen.
 */

const OledSim = {
  canvas: null,
  ctx: null,
  message: 'TECH IOT WARRIORS: LAB IS ACTIVE TODAY!',
  fontSize: 2,
  scrollSpeed: 2,
  scrollX: 0,
  animId: null,

  init() {
    this.canvas = document.getElementById('oled-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.scrollX = this.canvas.width;
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

  setMessage(msg) {
    this.message = msg.toUpperCase();
    this.scrollX = this.canvas.width;
  },

  update() {
    if (this.scrollSpeed > 0) {
      this.scrollX -= this.scrollSpeed;
      // Calculate text width approx
      const textW = this.message.length * (this.fontSize * 9);
      if (this.scrollX < -textW) {
        this.scrollX = this.canvas.width;
      }
    } else {
      this.scrollX = 10;
    }
  },

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // OLED Deep Black
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);

    // Decorative top title bar (classic Arduino Adafruit sample style)
    ctx.fillStyle = '#38bdf8';
    ctx.font = '10px monospace';
    ctx.fillText('== IoT NOTICE HUB ==', 56, 14);

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(8, 20);
    ctx.lineTo(w - 8, 20);
    ctx.stroke();

    // Scrolling text in Bright OLED Cyan
    ctx.fillStyle = '#00f59b';
    const fontPx = this.fontSize === 1 ? 12 : (this.fontSize === 2 ? 18 : 26);
    ctx.font = `bold ${fontPx}px monospace`;
    ctx.fillText(this.message, this.scrollX, 68);

    // Status bar at bottom
    ctx.fillStyle = '#0ea5e9';
    ctx.font = '9px monospace';
    const now = new Date().toLocaleTimeString();
    ctx.fillText(`TIME: ${now}  |  128x64`, 8, h - 8);

    // Draw pixel grid overlay for CRT / OLED matrix effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    for (let y = 0; y < h; y += 2) {
      ctx.fillRect(0, y, w, 1);
    }
  }
};
