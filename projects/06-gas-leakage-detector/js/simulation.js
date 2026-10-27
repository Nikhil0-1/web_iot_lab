/**
 * Project 02 — Gas Leakage Detector Simulation
 */

class GasLeakageSimulation {
  constructor(config, onDataCallback) {
    this.config = config || window.GasLeakageConfig;
    this.onData = onDataCallback || (() => {});

    this.currentGas = 95;
    this.targetGas = 95;
    this.scenario = 'safe';
    this.manualOverride = false;

    this.engine = new SimulationEngine({
      name: 'Gas Leakage Sim',
      intervalMs: 1000,
      generator: (scenario, tick) => this.generateStep(scenario, tick),
      onTick: (data) => this.onData(data)
    });
  }

  setScenario(name, snap = false) {
    this.scenario = name;
    this.manualOverride = false;

    if (name === 'safe') this.targetGas = 90;
    else if (name === 'minor-leak') this.targetGas = 380;
    else if (name === 'danger-leak') this.targetGas = 950;
    else if (name === 'fault') this.targetGas = -1;

    if (snap && name !== 'fault') {
      this.currentGas = this.targetGas;
    }
  }

  setManualGas(ppm) {
    this.manualOverride = true;
    this.targetGas = Number(ppm);
    this.currentGas = Number(ppm);
  }

  generateStep(scenario, tick) {
    if (this.scenario === 'fault') {
      return {
        mode: 'simulation',
        timestamp: Date.now(),
        sensorStatus: 'fault',
        errorMessage: 'MQ-2 gas sensor disconnected or heating element open',
        readings: {
          gasPpm: null,
          alarmActive: false,
          leakState: 'Fault'
        }
      };
    }

    const diff = this.targetGas - this.currentGas;
    const noise = (Math.random() - 0.5) * 6;
    this.currentGas = Math.max(30, this.currentGas + diff * 0.15 + noise);

    const ppm = Math.round(this.currentGas);
    let state = 'Safe';
    let alarm = false;

    if (ppm >= this.config.thresholds.critical) {
      state = 'Hazardous / Alarm';
      alarm = true;
    } else if (ppm >= this.config.thresholds.safeMax) {
      state = 'Warning';
    }

    return {
      mode: 'simulation',
      timestamp: Date.now(),
      sensorStatus: 'ok',
      readings: {
        gasPpm: ppm,
        alarmActive: alarm,
        leakState: state
      }
    };
  }

  start() { this.engine.start(); }
  pause() { this.engine.pause(); }
  resume() { this.engine.resume(); }
  stop() { this.engine.stop(); }
  reset() {
    this.currentGas = 95;
    this.targetGas = 95;
    this.scenario = 'safe';
    this.manualOverride = false;
    this.engine.reset();
  }
  setSpeed(speed) { this.engine.setSpeed(speed); }
}

if (typeof window !== 'undefined') {
  window.GasLeakageSimulation = GasLeakageSimulation;
}
