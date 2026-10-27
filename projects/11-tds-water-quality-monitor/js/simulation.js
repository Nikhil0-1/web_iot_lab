/**
 * Project 07 — TDS Water Quality Monitor Simulation
 */

class TdsSimulation {
  constructor(config, onDataCallback) {
    this.config = config || window.TdsConfig;
    this.onData = onDataCallback || (() => {});

    this.currentTds = 165;
    this.targetTds = 165;
    this.scenario = 'drinking';
    this.manualOverride = false;

    this.engine = new SimulationEngine({
      name: 'TDS Sim',
      intervalMs: 1000,
      generator: (scenario, tick) => this.generateStep(scenario, tick),
      onTick: (data) => this.onData(data)
    });
  }

  setScenario(name, snap = false) {
    this.scenario = name;
    this.manualOverride = false;

    if (name === 'pure') this.targetTds = 28;
    else if (name === 'drinking') this.targetTds = 165;
    else if (name === 'hard') this.targetTds = 440;
    else if (name === 'contaminated') this.targetTds = 780;
    else if (name === 'fault') this.targetTds = -1;

    if (snap && name !== 'fault') {
      this.currentTds = this.targetTds;
    }
  }

  setManualTds(val) {
    this.manualOverride = true;
    this.targetTds = Number(val);
    this.currentTds = Number(val);
  }

  generateStep(scenario, tick) {
    if (this.scenario === 'fault') {
      return {
        mode: 'simulation',
        timestamp: Date.now(),
        sensorStatus: 'fault',
        errorMessage: 'TDS probe dry, disconnected, or out of water',
        readings: {
          tdsPpm: null,
          voltage: null,
          rawAdc: 0,
          waterTier: 'Fault'
        }
      };
    }

    const diff = this.targetTds - this.currentTds;
    const noise = (Math.random() - 0.5) * 4;
    this.currentTds = Math.max(5, this.currentTds + diff * 0.15 + noise);

    const ppm = Math.round(this.currentTds);
    // Approximate polynomial voltage curve for TDS sensor
    const voltage = Math.round(Utils.mapRange(ppm, 0, 1000, 0.1, 2.3) * 100) / 100;
    const rawAdc = Math.round((voltage / 3.3) * 1023);

    let tier = 'Pure RO Water';
    if (ppm > this.config.thresholds.hardMax) tier = 'Poor / Non-potable';
    else if (ppm > this.config.thresholds.drinkingMax) tier = 'Hard / High Mineral';
    else if (ppm > this.config.thresholds.pureMax) tier = 'Clean Drinking Water';

    return {
      mode: 'simulation',
      timestamp: Date.now(),
      sensorStatus: 'ok',
      readings: {
        tdsPpm: ppm,
        voltage: voltage,
        rawAdc: rawAdc,
        waterTier: tier
      }
    };
  }

  start() { this.engine.start(); }
  pause() { this.engine.pause(); }
  resume() { this.engine.resume(); }
  stop() { this.engine.stop(); }
  reset() {
    this.currentTds = 165;
    this.targetTds = 165;
    this.scenario = 'drinking';
    this.manualOverride = false;
    this.engine.reset();
  }
  setSpeed(speed) { this.engine.setSpeed(speed); }
}

if (typeof window !== 'undefined') {
  window.TdsSimulation = TdsSimulation;
}
