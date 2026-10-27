/**
 * Tech IoT Warriors — Simulation Engine & Physics Utilities
 */

class SimulationEngine {
  constructor(options = {}) {
    this.name = options.name || 'Simulation';
    this.intervalMs = options.intervalMs || 1000;
    this.speed = options.speed || 1.0;
    this.generator = options.generator || (() => ({}));
    this.onTick = options.onTick || (() => {});
    this.scenario = options.scenario || 'normal'; // 'normal', 'warning', 'critical', 'fault'

    this.timer = null;
    this.isRunning = false;
    this.isPaused = false;
    this.tickCount = 0;
  }

  start() {
    if (this.isRunning && !this.isPaused) return;
    this.isRunning = true;
    this.isPaused = false;
    this._scheduleNext();
  }

  pause() {
    this.isPaused = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  resume() {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this._scheduleNext();
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  reset() {
    this.stop();
    this.tickCount = 0;
    if (this.onReset) this.onReset();
  }

  setSpeed(speedMultiplier) {
    this.speed = Math.max(0.1, Math.min(10, speedMultiplier));
    if (this.isRunning && !this.isPaused) {
      if (this.timer) clearTimeout(this.timer);
      this._scheduleNext();
    }
  }

  setScenario(scenarioName) {
    this.scenario = scenarioName;
  }

  _scheduleNext() {
    if (!this.isRunning || this.isPaused) return;
    const effectiveInterval = Math.max(50, this.intervalMs / this.speed);
    this.timer = setTimeout(() => {
      this._tick();
      this._scheduleNext();
    }, effectiveInterval);
  }

  _tick() {
    this.tickCount++;
    try {
      const data = this.generator(this.scenario, this.tickCount);
      if (this.onTick) {
        this.onTick(data);
      }
    } catch (err) {
      console.error(`SimulationEngine [${this.name}] error:`, err);
    }
  }
}

const SimUtils = {
  // Smooth random walk towards target
  smoothStep(current, target, speed = 0.1, jitter = 0.1) {
    const diff = target - current;
    const step = diff * speed;
    const noise = (Math.random() - 0.5) * 2 * jitter;
    return current + step + noise;
  },

  // Sine wave oscillation with frequency & amplitude
  sineWave(step, period = 20, amplitude = 5, offset = 25) {
    return offset + Math.sin((step / period) * Math.PI * 2) * amplitude;
  },

  // Random float between min and max
  randomBetween(min, max) {
    return min + Math.random() * (max - min);
  },

  // Introduce occasional noise spikes or dropouts
  applyFault(val, faultType) {
    if (faultType === 'disconnected') return null;
    if (faultType === 'spike') return val * 2.5;
    if (faultType === 'zero') return 0;
    if (faultType === 'nan') return NaN;
    return val;
  }
};

if (typeof window !== 'undefined') {
  window.SimulationEngine = SimulationEngine;
  window.SimUtils = SimUtils;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SimulationEngine, SimUtils };
}
