/**
 * RAINWATCH AI — Rain Monitoring Simulation Engine
 */

class RainwatchSimulation {
  constructor() {
    this.intensity = 0.0;       // 0% (Bone Dry) to 100% (Torrential Downpour)
    this.targetIntensity = 0.0;
    this.adcRaw = 1023;         // 1023 = Completely dry, ~150 = Saturated wet
    this.accumulationMm = 0.0;  // Simulated total accumulated rain in mm
    this.rainRateMmPerHour = 0.0;
    this.threshold = 40.0;      // Alert trigger %

    this.mode = 'sim';          // 'sim' | 'hw'
    this.isPaused = false;
    this.speedMultiplier = 1.0;
    this.scenario = 'shower';   // 'dry' | 'mist' | 'shower' | 'storm'

    this.drops = [];            // Rain particles for canvas
    this.ripples = [];          // Splash ripples at bottom
    this.history = [];          // Past readings
    this.listeners = [];

    this.initParticles(80);
    this.setScenario('shower');
  }

  initParticles(count) {
    this.drops = [];
    for (let i = 0; i < count; i++) {
      this.drops.push({
        x: Math.random() * 600,
        y: Math.random() * 400,
        l: 10 + Math.random() * 16,
        s: 6 + Math.random() * 8,
        o: 0.3 + Math.random() * 0.5
      });
    }
  }

  setScenario(name) {
    this.scenario = name;
    switch (name) {
      case 'dry':
        this.targetIntensity = 0.0;
        break;
      case 'mist':
        this.targetIntensity = 22.0;
        break;
      case 'shower':
        this.targetIntensity = 58.0;
        break;
      case 'storm':
        this.targetIntensity = 92.0;
        break;
    }
  }

  setManualIntensity(val) {
    this.targetIntensity = Math.max(0, Math.min(100, parseFloat(val)));
  }

  setThreshold(val) {
    this.threshold = Math.max(5, Math.min(95, parseFloat(val)));
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  reset() {
    this.intensity = 0.0;
    this.targetIntensity = 0.0;
    this.accumulationMm = 0.0;
    this.isPaused = false;
    this.history = [];
    this.setScenario('shower');
  }

  update(deltaMs = 50) {
    if (this.isPaused && this.mode === 'sim') return this.getState();

    if (this.mode === 'sim') {
      // Smooth drift towards target intensity
      const jitter = (Math.random() - 0.5) * 1.5;
      this.intensity += (this.targetIntensity - this.intensity) * 0.08 + (this.targetIntensity > 0 ? jitter : 0);
      this.intensity = Math.max(0, Math.min(100, this.intensity));

      // Calculate ADC value (Inverted: Rain plate resistance drops with water)
      this.adcRaw = Math.round(1023 - (this.intensity / 100) * 880);

      // Rainfall rate: 0 - 65 mm/hr
      this.rainRateMmPerHour = parseFloat(((this.intensity / 100) * 55).toFixed(1));

      // Accumulation increases with rain rate over time
      const dtHours = (deltaMs / 1000) / 3600 * this.speedMultiplier;
      this.accumulationMm += this.rainRateMmPerHour * dtHours;

      // Update rain particle positions
      const activeDropCount = Math.floor((this.intensity / 100) * this.drops.length);
      for (let i = 0; i < this.drops.length; i++) {
        const d = this.drops[i];
        if (i < activeDropCount) {
          d.y += d.s * this.speedMultiplier;
          d.x += 1.5; // Wind angle drift
          if (d.y > 360) {
            d.y = -10;
            d.x = Math.random() * 600;
            // Spawn ripple at bottom
            if (this.ripples.length < 25 && Math.random() > 0.6) {
              this.ripples.push({ x: d.x, y: 350 + Math.random() * 20, r: 1, o: 0.8 });
            }
          }
        }
      }

      // Update ripples
      for (let i = this.ripples.length - 1; i >= 0; i--) {
        const r = this.ripples[i];
        r.r += 0.8;
        r.o -= 0.03;
        if (r.o <= 0) this.ripples.splice(i, 1);
      }

      // Record history
      if (!this.lastHistoryPush || Date.now() - this.lastHistoryPush > 300) {
        this.history.push({
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          intensity: parseFloat(this.intensity.toFixed(1)),
          rate: this.rainRateMmPerHour
        });
        if (this.history.length > 40) this.history.shift();
        this.lastHistoryPush = Date.now();
      }
    }

    const state = this.getState();
    this.listeners.forEach(cb => cb(state));
    return state;
  }

  applyHardwareReading(data) {
    if (!data) return;
    this.intensity = parseFloat(data.intensity_pct || data.rain_pct || 0);
    this.adcRaw = parseInt(data.adc_raw || (1023 - (this.intensity / 100) * 880), 10);
    this.rainRateMmPerHour = parseFloat(data.rate_mmh || ((this.intensity / 100) * 55).toFixed(1));
    if (data.accumulation_mm !== undefined) this.accumulationMm = parseFloat(data.accumulation_mm);

    this.history.push({
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      intensity: parseFloat(this.intensity.toFixed(1)),
      rate: this.rainRateMmPerHour
    });
    if (this.history.length > 40) this.history.shift();

    const state = this.getState();
    this.listeners.forEach(cb => cb(state));
  }

  getState() {
    let status = 'BONE DRY';
    let statusClass = 'dry';

    if (this.intensity >= 75) {
      status = 'TORRENTIAL DOWNPOUR';
      statusClass = 'heavy';
    } else if (this.intensity >= 40) {
      status = 'STEADY RAIN';
      statusClass = 'mist';
    } else if (this.intensity >= 10) {
      status = 'LIGHT DRIZZLE / MIST';
      statusClass = 'mist';
    }

    return {
      intensity: parseFloat(this.intensity.toFixed(1)),
      adcRaw: this.adcRaw,
      rainRate: this.rainRateMmPerHour,
      accumulation: parseFloat(this.accumulationMm.toFixed(2)),
      threshold: this.threshold,
      status: status,
      statusClass: statusClass,
      drops: this.drops,
      ripples: this.ripples,
      history: this.history
    };
  }

  onUpdate(cb) {
    this.listeners.push(cb);
  }
}

if (typeof window !== 'undefined') {
  window.RainwatchSimulation = RainwatchSimulation;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RainwatchSimulation;
}
