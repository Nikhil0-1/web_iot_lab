/**
 * Project 03 — LDR Light Intensity Simulation
 */

class LdrSimulation {
  constructor(config, onDataCallback) {
    this.config = config || window.LdrConfig;
    this.onData = onDataCallback || (() => {});

    this.currentPercent = 55;
    this.targetPercent = 55;
    this.scenario = 'indoor';
    this.manualOverride = false;

    this.engine = new SimulationEngine({
      name: 'LDR Sim',
      intervalMs: 1000,
      generator: (scenario, tick) => this.generateStep(scenario, tick),
      onTick: (data) => this.onData(data)
    });
  }

  setScenario(name, snap = false) {
    this.scenario = name;
    this.manualOverride = false;

    if (name === 'dark') this.targetPercent = 4;
    else if (name === 'dim') this.targetPercent = 25;
    else if (name === 'indoor') this.targetPercent = 58;
    else if (name === 'sunlight') this.targetPercent = 94;
    else if (name === 'fault') this.targetPercent = -1;

    if (snap && name !== 'fault') {
      this.currentPercent = this.targetPercent;
    }
  }

  setManualPercent(val) {
    this.manualOverride = true;
    this.targetPercent = Number(val);
    this.currentPercent = Number(val);
  }

  generateStep(scenario, tick) {
    if (this.scenario === 'fault') {
      return {
        mode: 'simulation',
        timestamp: Date.now(),
        sensorStatus: 'fault',
        errorMessage: 'LDR open circuit / resistor divider floating',
        readings: {
          lightPercent: null,
          rawAdc: null,
          approxLux: null,
          ambientTier: 'Fault'
        }
      };
    }

    const diff = this.targetPercent - this.currentPercent;
    const noise = (Math.random() - 0.5) * 1.5;
    this.currentPercent = Utils.clamp(this.currentPercent + diff * 0.15 + noise, 0, 100);

    const percent = Math.round(this.currentPercent * 10) / 10;
    const rawAdc = Math.round(Utils.mapRange(percent, 0, 100, 20, 1010));
    // Approximate lux mapping for standard 5528 LDR
    const approxLux = Math.round(Math.pow(10, Utils.mapRange(percent, 0, 100, 0, 3.5)));

    let tier = 'Bright Sunlight';
    if (percent < this.config.thresholds.darkMax) tier = 'Pitch Dark';
    else if (percent < this.config.thresholds.dimMax) tier = 'Dim / Twilight';
    else if (percent < this.config.thresholds.indoorMax) tier = 'Indoor Lighting';

    return {
      mode: 'simulation',
      timestamp: Date.now(),
      sensorStatus: 'ok',
      readings: {
        lightPercent: percent,
        rawAdc: rawAdc,
        approxLux: approxLux,
        ambientTier: tier
      }
    };
  }

  start() { this.engine.start(); }
  pause() { this.engine.pause(); }
  resume() { this.engine.resume(); }
  stop() { this.engine.stop(); }
  reset() {
    this.currentPercent = 55;
    this.targetPercent = 55;
    this.scenario = 'indoor';
    this.manualOverride = false;
    this.engine.reset();
  }
  setSpeed(speed) { this.engine.setSpeed(speed); }
}

if (typeof window !== 'undefined') {
  window.LdrSimulation = LdrSimulation;
}
