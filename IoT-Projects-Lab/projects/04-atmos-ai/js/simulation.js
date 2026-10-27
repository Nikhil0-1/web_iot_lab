/**
 * ATMOS AI — Climate & Comfort Simulation Engine
 */

class AtmosSimulation {
  constructor() {
    this.tempC = 23.5;
    this.targetTempC = 23.5;
    this.humidity = 48.0;
    this.targetHumidity = 48.0;
    this.unit = 'C';            // 'C' | 'F'

    this.heatIndexC = 23.5;
    this.dewPointC = 12.0;

    this.mode = 'sim';          // 'sim' | 'hw'
    this.isPaused = false;
    this.speedMultiplier = 1.0;
    this.scenario = 'office';   // 'office' | 'greenhouse' | 'freeze' | 'desert'

    this.history = [];
    this.listeners = [];
  }

  setScenario(name) {
    this.scenario = name;
    switch (name) {
      case 'office':
        this.targetTempC = 22.5;
        this.targetHumidity = 48.0;
        break;
      case 'greenhouse':
        this.targetTempC = 31.0;
        this.targetHumidity = 82.0;
        break;
      case 'freeze':
        this.targetTempC = -4.0;
        this.targetHumidity = 65.0;
        break;
      case 'desert':
        this.targetTempC = 41.5;
        this.targetHumidity = 18.0;
        break;
    }
  }

  setManualTemp(val) {
    this.targetTempC = parseFloat(val);
  }

  setManualHumidity(val) {
    this.targetHumidity = Math.max(0, Math.min(100, parseFloat(val)));
  }

  toggleUnit() {
    this.unit = this.unit === 'C' ? 'F' : 'C';
    return this.unit;
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  reset() {
    this.tempC = 23.5;
    this.targetTempC = 23.5;
    this.humidity = 48.0;
    this.targetHumidity = 48.0;
    this.isPaused = false;
    this.history = [];
    this.setScenario('office');
  }

  // Calculate Heat Index using Rothfusz polynomial
  calculateHeatIndex(T_C, R) {
    if (T_C < 27.0 || R < 40.0) return T_C; // Heat index only meaningful above 27°C and 40% RH
    const T_F = T_C * 1.8 + 32.0;
    const HI_F = -42.379 + 2.04901523 * T_F + 10.14333127 * R - 0.22475541 * T_F * R -
      0.00683783 * T_F * T_F - 0.05481717 * R * R + 0.00122874 * T_F * T_F * R +
      0.00085282 * T_F * R * R - 0.00000199 * T_F * T_F * R * R;
    return (HI_F - 32.0) / 1.8;
  }

  // Magnus-Tetens approximation for Dew Point
  calculateDewPoint(T, RH) {
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * T) / (b + T)) + Math.log(RH / 100.0);
    return (b * alpha) / (a - alpha);
  }

  update(deltaMs = 50) {
    if (this.isPaused && this.mode === 'sim') return this.getState();

    if (this.mode === 'sim') {
      // Smooth drift
      const tJitter = (Math.random() - 0.5) * 0.12;
      const hJitter = (Math.random() - 0.5) * 0.3;

      this.tempC += (this.targetTempC - this.tempC) * 0.06 + tJitter;
      this.humidity += (this.targetHumidity - this.humidity) * 0.06 + hJitter;
      this.humidity = Math.max(5, Math.min(99, this.humidity));

      this.heatIndexC = this.calculateHeatIndex(this.tempC, this.humidity);
      this.dewPointC = this.calculateDewPoint(this.tempC, this.humidity);

      // Record history
      if (!this.lastHistoryPush || Date.now() - this.lastHistoryPush > 300) {
        this.history.push({
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          temp: parseFloat(this.tempC.toFixed(1)),
          humidity: parseFloat(this.humidity.toFixed(1))
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
    this.tempC = parseFloat(data.temperature || data.temp_c || 22.0);
    this.humidity = parseFloat(data.humidity || 50.0);
    this.heatIndexC = this.calculateHeatIndex(this.tempC, this.humidity);
    this.dewPointC = this.calculateDewPoint(this.tempC, this.humidity);

    this.history.push({
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      temp: parseFloat(this.tempC.toFixed(1)),
      humidity: parseFloat(this.humidity.toFixed(1))
    });
    if (this.history.length > 40) this.history.shift();

    const state = this.getState();
    this.listeners.forEach(cb => cb(state));
  }

  getState() {
    let comfort = 'IDEAL THERMAL COMFORT';
    let comfortClass = 'ideal';

    if (this.tempC > 34 || this.heatIndexC > 38) {
      comfort = 'HAZARDOUS HEAT INDEX';
      comfortClass = 'hot';
    } else if (this.tempC > 27 && this.humidity > 65) {
      comfort = 'WARM & MUGGY (VENTILATE)';
      comfortClass = 'muggy';
    } else if (this.tempC < 16) {
      comfort = 'COLD / CHILLY';
      comfortClass = 'cold';
    }

    const displayTemp = this.unit === 'F' ? (this.tempC * 1.8 + 32) : this.tempC;
    const displayHI = this.unit === 'F' ? (this.heatIndexC * 1.8 + 32) : this.heatIndexC;
    const displayDP = this.unit === 'F' ? (this.dewPointC * 1.8 + 32) : this.dewPointC;

    return {
      temp: parseFloat(displayTemp.toFixed(1)),
      tempC: parseFloat(this.tempC.toFixed(1)),
      humidity: parseFloat(this.humidity.toFixed(1)),
      heatIndex: parseFloat(displayHI.toFixed(1)),
      dewPoint: parseFloat(displayDP.toFixed(1)),
      unit: this.unit,
      comfort: comfort,
      comfortClass: comfortClass,
      history: this.history
    };
  }

  onUpdate(cb) {
    this.listeners.push(cb);
  }
}

if (typeof window !== 'undefined') {
  window.AtmosSimulation = AtmosSimulation;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AtmosSimulation;
}
