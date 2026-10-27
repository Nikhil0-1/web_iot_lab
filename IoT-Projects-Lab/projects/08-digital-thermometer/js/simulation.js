/**
 * Project 04 — Digital Thermometer Simulation Engine
 */

class ThermometerSimulation {
  constructor(config, onDataCallback) {
    this.config = config || window.ThermometerConfig;
    this.onData = onDataCallback || (() => {});

    this.currentTemp = this.config.sim.defaultTemp;
    this.targetTemp = this.currentTemp;
    this.manualOverride = false;
    this.scenario = 'normal';

    this.engine = new SimulationEngine({
      name: 'Digital Thermometer Sim',
      intervalMs: 1000,
      generator: (scenario, tick) => this.generateStep(scenario, tick),
      onTick: (data) => this.onData(data)
    });
  }

  setScenario(name, snap = false) {
    this.scenario = name;
    this.manualOverride = false;

    if (name === 'normal') this.targetTemp = 23.5;
    else if (name === 'cold') this.targetTemp = 3.0;
    else if (name === 'hot') this.targetTemp = 42.0;
    else if (name === 'fault') this.targetTemp = -999;

    if (snap && name !== 'fault') {
      this.currentTemp = this.targetTemp;
    }
  }

  setManualTemp(val) {
    this.manualOverride = true;
    this.targetTemp = Number(val);
    this.currentTemp = Number(val);
  }

  generateStep(scenario, tick) {
    if (this.scenario === 'fault') {
      return {
        mode: 'simulation',
        timestamp: Date.now(),
        sensorStatus: 'fault',
        errorMessage: 'DS18B20 sensor disconnected / CRC error',
        readings: {
          temperatureC: null,
          temperatureF: null
        }
      };
    }

    // Thermal inertia step towards target with gentle ambient noise
    const inertia = this.config.sim.thermalInertia;
    const noise = (Math.random() - 0.5) * this.config.sim.ambientDrift * 2;
    this.currentTemp += (this.targetTemp - this.currentTemp) * inertia + noise;

    const tempC = Math.round(this.currentTemp * 10) / 10;
    const tempF = Math.round(((tempC * 9/5) + 32) * 10) / 10;

    return {
      mode: 'simulation',
      timestamp: Date.now(),
      sensorStatus: 'ok',
      readings: {
        temperatureC: tempC,
        temperatureF: tempF
      }
    };
  }

  start() { this.engine.start(); }
  pause() { this.engine.pause(); }
  resume() { this.engine.resume(); }
  stop() { this.engine.stop(); }
  reset() {
    this.currentTemp = this.config.sim.defaultTemp;
    this.targetTemp = this.currentTemp;
    this.manualOverride = false;
    this.scenario = 'normal';
    this.engine.reset();
  }
  setSpeed(speed) { this.engine.setSpeed(speed); }
}

if (typeof window !== 'undefined') {
  window.ThermometerSimulation = ThermometerSimulation;
}
