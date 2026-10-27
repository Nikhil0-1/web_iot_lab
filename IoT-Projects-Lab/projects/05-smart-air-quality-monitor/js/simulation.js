/**
 * Project 01 — Smart Air Quality Monitor Simulation
 */

class AirQualitySimulation {
  constructor(config, onDataCallback) {
    this.config = config || window.AirQualityConfig;
    this.onData = onDataCallback || (() => {});

    this.scenario = 'clean';
    this.currentAqi = 28;
    this.targetAqi = 28;
    this.manualOverride = false;
    this.warmupSeconds = 0;

    this.engine = new SimulationEngine({
      name: 'Air Quality Sim',
      intervalMs: 1000,
      generator: (scenario, tick) => this.generateStep(scenario, tick),
      onTick: (data) => this.onData(data)
    });
  }

  setScenario(name, snap = false) {
    this.scenario = name;
    this.manualOverride = false;

    if (name === 'clean') this.targetAqi = 25;
    else if (name === 'moderate') this.targetAqi = 75;
    else if (name === 'unhealthy') this.targetAqi = 160;
    else if (name === 'hazardous') this.targetAqi = 310;
    else if (name === 'fault') this.targetAqi = -1;

    if (snap && name !== 'fault') {
      this.currentAqi = this.targetAqi;
    }
  }

  setManualAqi(val) {
    this.manualOverride = true;
    this.targetAqi = Number(val);
    this.currentAqi = Number(val);
  }

  generateStep(scenario, tick) {
    if (this.scenario === 'fault') {
      return {
        mode: 'simulation',
        timestamp: Date.now(),
        sensorStatus: 'fault',
        errorMessage: 'MQ-135 sensor signal disconnected / ADC floating',
        readings: {
          rawAdc: 0,
          airQualityIndex: null,
          airTier: 'Fault',
          warmupComplete: false
        }
      };
    }

    if (this.warmupSeconds < this.config.warmupTimeSeconds) {
      this.warmupSeconds++;
    }

    // Step towards target with organic atmospheric jitter
    const diff = this.targetAqi - this.currentAqi;
    const noise = (Math.random() - 0.5) * 3;
    this.currentAqi = Math.max(5, this.currentAqi + diff * 0.12 + noise);

    const aqi = Math.round(this.currentAqi);
    // ADC baseline 120 + mapped AQI
    const rawAdc = Math.min(1023, Math.round(120 + aqi * 2.3));

    let tier = 'Good';
    if (aqi > this.config.thresholds.unhealthyMax) tier = 'Hazardous';
    else if (aqi > this.config.thresholds.moderateMax) tier = 'Unhealthy';
    else if (aqi > this.config.thresholds.goodMax) tier = 'Moderate';

    return {
      mode: 'simulation',
      timestamp: Date.now(),
      sensorStatus: 'ok',
      readings: {
        rawAdc: rawAdc,
        airQualityIndex: aqi,
        airTier: tier,
        warmupComplete: this.warmupSeconds >= this.config.warmupTimeSeconds,
        warmupRemaining: Math.max(0, this.config.warmupTimeSeconds - this.warmupSeconds)
      }
    };
  }

  start() { this.engine.start(); }
  pause() { this.engine.pause(); }
  resume() { this.engine.resume(); }
  stop() { this.engine.stop(); }
  reset() {
    this.currentAqi = 28;
    this.targetAqi = 28;
    this.manualOverride = false;
    this.scenario = 'clean';
    this.warmupSeconds = 0;
    this.engine.reset();
  }
  setSpeed(speed) { this.engine.setSpeed(speed); }
}

if (typeof window !== 'undefined') {
  window.AirQualitySimulation = AirQualitySimulation;
}
