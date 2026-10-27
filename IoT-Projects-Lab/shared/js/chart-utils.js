/**
 * Tech IoT Warriors — Shared Canvas Time-Series Chart
 * Responsive, zero-dependency, retina-ready canvas chart engine
 */

class MiniTimeSeriesChart {
  constructor(canvasElement, options = {}) {
    this.canvas = typeof canvasElement === 'string' ? document.querySelector(canvasElement) : canvasElement;
    if (!this.canvas) {
      console.warn('MiniTimeSeriesChart: canvas element not found');
      return;
    }
    this.ctx = this.canvas.getContext('2d');

    this.options = {
      maxPoints: options.maxPoints || 50,
      lineColor: options.lineColor || '#0284c7',
      fillColor: options.fillColor || 'rgba(56, 189, 248, 0.12)',
      gridColor: options.gridColor || 'rgba(15, 23, 42, 0.06)',
      textColor: options.textColor || '#64748b',
      unit: options.unit || '',
      min: options.min !== undefined ? options.min : null,
      max: options.max !== undefined ? options.max : null,
      precision: options.precision !== undefined ? options.precision : 1,
      ...options
    };

    this.dataPoints = []; // [{ time: Date, value: Number }]
    this.initCanvas();

    window.addEventListener('resize', Utils.debounce(() => {
      this.initCanvas();
      this.render();
    }, 150));
  }

  initCanvas() {
    if (!this.canvas) return;
    const container = this.canvas.parentElement || this.canvas;
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.floor(rect.width || 400);
    this.height = Math.floor((rect.height && rect.height > 60) ? rect.height : (this.canvas.clientHeight || 200));

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.canvas.style.display = 'block';

    if (this.ctx.resetTransform) {
      this.ctx.resetTransform();
    } else {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    this.ctx.scale(dpr, dpr);
  }

  addDataPoint(value, label = null) {
    if (value === null || value === undefined || isNaN(value)) return;
    const now = new Date();
    this.dataPoints.push({
      time: now,
      label: label || Utils.formatTime(now),
      value: Number(value)
    });

    if (this.dataPoints.length > this.options.maxPoints) {
      this.dataPoints.shift();
    }
    this.render();
  }

  clear() {
    this.dataPoints = [];
    this.render();
  }

  getValues() {
    return this.dataPoints.map(p => p.value);
  }

  getData() {
    return [...this.dataPoints];
  }

  render() {
    if (!this.ctx || !this.width || !this.height) return;
    const { ctx, width, height, options, dataPoints } = this;

    ctx.clearRect(0, 0, width, height);

    const padLeft = 46;
    const padRight = 16;
    const padTop = 18;
    const padBottom = 26;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    if (dataPoints.length === 0) {
      ctx.fillStyle = options.textColor;
      ctx.font = '12px ' + (getComputedStyle(document.body).fontFamily || 'sans-serif');
      ctx.textAlign = 'center';
      ctx.fillText('Awaiting live data...', width / 2, height / 2);
      return;
    }

    const values = dataPoints.map(d => d.value);
    let minVal = options.min !== null ? options.min : Math.min(...values);
    let maxVal = options.max !== null ? options.max : Math.max(...values);

    if (minVal === maxVal) {
      minVal -= 1;
      maxVal += 1;
    }
    const range = maxVal - minVal;
    const yPad = range * 0.1;
    const yMin = options.min !== null ? options.min : minVal - yPad;
    const yMax = options.max !== null ? options.max : maxVal + yPad;

    // Draw Grid Lines & Y-Axis Labels
    ctx.lineWidth = 1;
    ctx.strokeStyle = options.gridColor;
    ctx.fillStyle = options.textColor;
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'right';

    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
      const yFrac = i / ySteps;
      const yVal = yMax - yFrac * (yMax - yMin);
      const yPos = padTop + yFrac * chartH;

      ctx.beginPath();
      ctx.moveTo(padLeft, yPos);
      ctx.lineTo(width - padRight, yPos);
      ctx.stroke();

      ctx.fillText(`${yVal.toFixed(options.precision)}${options.unit}`, padLeft - 6, yPos + 3);
    }

    // Coordinates mapping
    const getX = (idx) => {
      if (dataPoints.length <= 1) return padLeft + chartW / 2;
      return padLeft + (idx / (dataPoints.length - 1)) * chartW;
    };

    const getY = (val) => {
      const frac = (val - yMin) / (yMax - yMin);
      return padTop + chartH - frac * chartH;
    };

    // Draw Area Fill
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(dataPoints[0].value));
    for (let i = 1; i < dataPoints.length; i++) {
      ctx.lineTo(getX(i), getY(dataPoints[i].value));
    }
    ctx.lineTo(getX(dataPoints.length - 1), padTop + chartH);
    ctx.lineTo(getX(0), padTop + chartH);
    ctx.closePath();
    ctx.fillStyle = options.fillColor;
    ctx.fill();

    // Draw Smooth Line
    ctx.beginPath();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = options.lineColor;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (let i = 0; i < dataPoints.length; i++) {
      const x = getX(i);
      const y = getY(dataPoints[i].value);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw Latest Point Glow Dot
    const latest = dataPoints[dataPoints.length - 1];
    const lx = getX(dataPoints.length - 1);
    const ly = getY(latest.value);

    ctx.beginPath();
    ctx.arc(lx, ly, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = options.lineColor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Time label on X-axis (first and last)
    ctx.fillStyle = options.textColor;
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(dataPoints[0].label, padLeft, height - 8);

    if (dataPoints.length > 1) {
      ctx.textAlign = 'right';
      ctx.fillText(latest.label, width - padRight, height - 8);
    }
  }
}

if (typeof window !== 'undefined') {
  window.MiniTimeSeriesChart = MiniTimeSeriesChart;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MiniTimeSeriesChart;
}
