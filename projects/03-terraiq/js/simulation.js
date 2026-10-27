/**
 * TerraIQ — Soil Moisture Simulation Engine
 */

class TerraIQSimulation {
  constructor() {
    this.moisturePct = 52.0;    // 0 to 100%
    this.targetMoisture = 52.0;
    this.airAdc = 850;          // Calibration dry air ADC
    this.waterAdc = 380;        // Calibration submerged in water ADC
    this.rawAdc = 605;
    this.voltage = 1.95;
    this.threshold = 30.0;      // Low moisture alert threshold

    this.mode = 'sim';          // 'sim' | 'hw'
    this.isPaused = false;
    this.speedMultiplier = 1.0;
    this.scenario = 'optimal';  // 'arid' | 'optimal' | 'saturated' | 'drying'

    this.history = [];
    this.listeners = [];
  }

  setScenario(name) {
    this.scenario = name;
    switch (name) {
      case 'arid':
        this.targetMoisture = 16.0;
        break;
      case 'optimal':
        this.targetMoisture = 55.0;
        break;
      case 'saturated':
        this.targetMoisture = 90.0;
        break;
      case 'drying':
        this.targetMoisture = 22.0;
        break;
    }
  }

  setManualMoisture(val) {
    this.targetMoisture = Math.max(0, Math.min(100, parseFloat(val)));
  }

  setThreshold(val) {
    this.threshold = Math.max(10, Math.min(80, parseFloat(val)));
  }

  setCalibration(dryVal, wetVal) {
    this.airAdc = parseInt(dryVal, 10);
    this.waterAdc = parseInt(wetVal, 10);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  reset() {
    this.moisturePct = 52.0;
    this.targetMoisture = 52.0;
    this.isPaused = false;
    this.history = [];
    this.setScenario('optimal');
  }

  update(deltaMs = 50) {
    if (this.isPaused && this.mode === 'sim') return this.getState();

    if (this.mode === 'sim') {
      if (this.scenario === 'drying') {
        this.targetMoisture -= 0.04 * this.speedMultiplier;
        if (this.targetMoisture < 10.0) this.targetMoisture = 85.0;
      }

      // Smooth drift
      const jitter = (Math.random() - 0.5) * 0.4;
      this.moisturePct += (this.targetMoisture - this.moisturePct) * 0.06 + jitter;
      this.moisturePct = Math.max(0, Math.min(100, this.moisturePct));

      // Calculate raw ADC from capacitive moisture curve
      // Raw ADC = airAdc - (moisture / 100) * (airAdc - waterAdc)
      this.rawAdc = Math.round(this.airAdc - (this.moisturePct / 100.0) * (this.airAdc - this.waterAdc));
      this.voltage = parseFloat(((this.rawAdc / 1023.0) * 3.3).toFixed(2));

      // Record history
      if (!this.lastHistoryPush || Date.now() - this.lastHistoryPush > 300) {
        this.history.push({
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          moisture: parseFloat(this.moisturePct.toFixed(1)),
          adc: this.rawAdc
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
    this.moisturePct = parseFloat(data.moisture_pct || data.moisture || 0);
    this.rawAdc = parseInt(data.adc_raw || 600, 10);
    this.voltage = parseFloat(data.voltage || ((this.rawAdc / 1023.0) * 3.3).toFixed(2));

    this.history.push({
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      moisture: parseFloat(this.moisturePct.toFixed(1)),
      adc: this.rawAdc
    });
    if (this.history.length > 40) this.history.shift();

    const state = this.getState();
    this.listeners.forEach(cb => cb(state));
  }

  getState() {
    let status = 'OPTIMAL HYDRATION';
    let statusClass = 'optimal';

    if (this.moisturePct < this.threshold) {
      status = 'ARID / PARCHED (WATER NEEDED)';
      statusClass = 'arid';
    } else if (this.moisturePct > 75) {
      status = 'SATURATED / BOG';
      statusClass = 'saturated';
    }

    return {
      moisture: parseFloat(this.moisturePct.toFixed(1)),
      rawAdc: this.rawAdc,
      voltage: this.voltage,
      threshold: this.threshold,
      status: status,
      statusClass: statusClass,
      history: this.history
    };
  }

  onUpdate(cb) {
    this.listeners.push(cb);
  }
}

if (typeof window !== 'undefined') {
  window.TerraIQSimulation = TerraIQSimulation;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TerraIQSimulation;
}
