/**
 * Project 05 — Water Level Monitor Simulation
 */

class WaterLevelSimulation {
  constructor(config, onDataCallback) {
    this.config = config || window.WaterLevelConfig;
    this.onData = onDataCallback || (() => {});

    this.currentPercent = 65.0;
    this.targetPercent = 65.0;
    this.scenario = 'half';
    this.flowRate = 0.5; // % per tick when filling/draining
    this.manualOverride = false;

    this.engine = new SimulationEngine({
      name: 'Water Level Sim',
      intervalMs: 1000,
      generator: (scenario, tick) => this.generateStep(scenario, tick),
      onTick: (data) => this.onData(data)
    });
  }

  setScenario(name, snap = false) {
    this.scenario = name;
    this.manualOverride = false;

    if (name === 'half') this.targetPercent = 50.0;
    else if (name === 'filling') this.targetPercent = 95.0;
    else if (name === 'draining') this.targetPercent = 8.0;
    else if (name === 'overflow') this.targetPercent = 98.0;
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
        errorMessage: 'HC-SR04 ultrasonic echo pulse timeout (>400cm or reflection lost)',
        readings: {
          distanceCm: null,
          waterDepthCm: null,
          fillPercent: null,
          liters: null,
          levelStatus: 'Fault'
        }
      };
    }

    if (this.scenario === 'filling') {
      if (this.currentPercent < 95.0) this.currentPercent += 1.2;
    } else if (this.scenario === 'draining') {
      if (this.currentPercent > 8.0) this.currentPercent -= 1.2;
    } else {
      const diff = this.targetPercent - this.currentPercent;
      this.currentPercent += diff * 0.12;
    }

    // Add tiny ripple noise
    const ripple = (Math.random() - 0.5) * 0.4;
    const percent = Utils.clamp(Math.round((this.currentPercent + ripple) * 10) / 10, 0, 100);

    const tankHeight = this.config.tank.heightCm;
    const waterDepth = Math.round((percent / 100.0) * tankHeight * 10) / 10;
    const distance = Math.round((tankHeight - waterDepth + this.config.tank.sensorOffsetCm) * 10) / 10;
    const liters = Math.round((percent / 100.0) * this.config.tank.capacityLiters * 10) / 10;

    let status = 'Normal';
    if (percent >= this.config.tank.warningHighPct) status = 'High / Overflow Risk';
    else if (percent <= this.config.tank.warningLowPct) status = 'Low Water Warning';

    return {
      mode: 'simulation',
      timestamp: Date.now(),
      sensorStatus: 'ok',
      readings: {
        distanceCm: distance,
        waterDepthCm: waterDepth,
        fillPercent: percent,
        liters: liters,
        levelStatus: status
      }
    };
  }

  start() { this.engine.start(); }
  pause() { this.engine.pause(); }
  resume() { this.engine.resume(); }
  stop() { this.engine.stop(); }
  reset() {
    this.currentPercent = 65.0;
    this.targetPercent = 65.0;
    this.scenario = 'half';
    this.manualOverride = false;
    this.engine.reset();
  }
  setSpeed(speed) { this.engine.setSpeed(speed); }
}

if (typeof window !== 'undefined') {
  window.WaterLevelSimulation = WaterLevelSimulation;
}
