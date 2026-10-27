/**
 * Project 06 — Water Flow Meter Simulation
 */

class WaterFlowSimulation {
  constructor(config, onDataCallback) {
    this.config = config || window.WaterFlowConfig;
    this.onData = onDataCallback || (() => {});

    this.currentFlow = 8.5;
    this.targetFlow = 8.5;
    this.totalLiters = 14.2;
    this.totalPulses = 6400;
    this.scenario = 'nominal';
    this.manualOverride = false;

    this.engine = new SimulationEngine({
      name: 'Water Flow Sim',
      intervalMs: 1000,
      generator: (scenario, tick) => this.generateStep(scenario, tick),
      onTick: (data) => this.onData(data)
    });
  }

  setScenario(name, snap = false) {
    this.scenario = name;
    this.manualOverride = false;

    if (name === 'stagnant') this.targetFlow = 0.0;
    else if (name === 'low') this.targetFlow = 3.2;
    else if (name === 'nominal') this.targetFlow = 8.5;
    else if (name === 'high') this.targetFlow = 22.0;
    else if (name === 'fault') this.targetFlow = -1;

    if (snap && name !== 'fault') {
      this.currentFlow = this.targetFlow;
    }
  }

  setManualFlow(val) {
    this.manualOverride = true;
    this.targetFlow = Number(val);
    this.currentFlow = Number(val);
  }

  generateStep(scenario, tick) {
    if (this.scenario === 'fault') {
      return {
        mode: 'simulation',
        timestamp: Date.now(),
        sensorStatus: 'fault',
        errorMessage: 'YF-S201 Hall sensor pulse wire disconnected or rotor jammed',
        readings: {
          flowRateLpm: null,
          totalLiters: null,
          pulseCount: null,
          flowState: 'Fault'
        }
      };
    }

    const diff = this.targetFlow - this.currentFlow;
    const noise = this.targetFlow > 0 ? (Math.random() - 0.5) * 0.3 : 0;
    this.currentFlow = Math.max(0, this.currentFlow + diff * 0.18 + noise);

    const lpm = Math.round(this.currentFlow * 10) / 10;

    // Accumulate total volume: flow per second = LPM / 60
    const litersThisSec = lpm / 60.0;
    this.totalLiters += litersThisSec;
    const pulsesThisSec = Math.round(lpm * this.config.calibrationFactor);
    this.totalPulses += pulsesThisSec;

    let state = 'Nominal Flow';
    if (lpm <= this.config.thresholds.zeroFlowMax) state = 'No Flow (Stopped)';
    else if (lpm <= this.config.thresholds.lowFlowMax) state = 'Low Flow Rate';
    else if (lpm > this.config.thresholds.nominalFlowMax) state = 'High Flow Rate';

    return {
      mode: 'simulation',
      timestamp: Date.now(),
      sensorStatus: 'ok',
      readings: {
        flowRateLpm: lpm,
        totalLiters: Math.round(this.totalLiters * 100) / 100,
        pulseCount: this.totalPulses,
        flowState: state
      }
    };
  }

  start() { this.engine.start(); }
  pause() { this.engine.pause(); }
  resume() { this.engine.resume(); }
  stop() { this.engine.stop(); }
  reset() {
    this.currentFlow = 8.5;
    this.targetFlow = 8.5;
    this.totalLiters = 0.0;
    this.totalPulses = 0;
    this.scenario = 'nominal';
    this.manualOverride = false;
    this.engine.reset();
  }
  setSpeed(speed) { this.engine.setSpeed(speed); }
}

if (typeof window !== 'undefined') {
  window.WaterFlowSimulation = WaterFlowSimulation;
}
