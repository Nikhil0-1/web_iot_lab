/**
 * Project 08 — Vibration & Tilt Monitor Simulation
 */

class VibrationTiltSimulation {
  constructor(config, onDataCallback) {
    this.config = config || window.VibrationTiltConfig;
    this.onData = onDataCallback || (() => {});

    this.currentPitch = 0.0;
    this.currentRoll = 0.0;
    this.targetPitch = 0.0;
    this.targetRoll = 0.0;
    this.scenario = 'flat';
    this.manualOverride = false;

    this.engine = new SimulationEngine({
      name: 'Vibration & Tilt Sim',
      intervalMs: 1000,
      generator: (scenario, tick) => this.generateStep(scenario, tick),
      onTick: (data) => this.onData(data)
    });
  }

  setScenario(name, snap = false) {
    this.scenario = name;
    this.manualOverride = false;

    if (name === 'flat') { this.targetPitch = 0.0; this.targetRoll = 0.0; }
    else if (name === 'tilted') { this.targetPitch = 28.0; this.targetRoll = -18.0; }
    else if (name === 'vibrating') { this.targetPitch = 5.0; this.targetRoll = 5.0; }
    else if (name === 'shock') { this.targetPitch = 45.0; this.targetRoll = -35.0; }
    else if (name === 'fault') { this.targetPitch = -999; }

    if (snap && name !== 'fault') {
      this.currentPitch = this.targetPitch;
      this.currentRoll = this.targetRoll;
    }
  }

  setManualOrientation(pitch, roll) {
    this.manualOverride = true;
    this.targetPitch = Number(pitch);
    this.targetRoll = Number(roll);
    this.currentPitch = Number(pitch);
    this.currentRoll = Number(roll);
  }

  generateStep(scenario, tick) {
    if (this.scenario === 'fault') {
      return {
        mode: 'simulation',
        timestamp: Date.now(),
        sensorStatus: 'fault',
        errorMessage: 'MPU6050 I2C bus NACK / device address 0x68 not responding',
        readings: {
          pitchDeg: null,
          rollDeg: null,
          totalG: null,
          accelX: null,
          accelY: null,
          accelZ: null,
          motionState: 'Fault'
        }
      };
    }

    let gForce = 1.0; // 1g gravity default
    let noiseP = (Math.random() - 0.5) * 1.5;
    let noiseR = (Math.random() - 0.5) * 1.5;

    if (this.scenario === 'vibrating') {
      noiseP = (Math.random() - 0.5) * 12.0;
      noiseR = (Math.random() - 0.5) * 12.0;
      gForce = 1.45 + Math.random() * 0.4;
    } else if (this.scenario === 'shock') {
      gForce = 2.85 + Math.random() * 0.5;
    }

    const diffP = this.targetPitch - this.currentPitch;
    const diffR = this.targetRoll - this.currentRoll;
    this.currentPitch += diffP * 0.15 + noiseP;
    this.currentRoll += diffR * 0.15 + noiseR;

    const p = Math.round(this.currentPitch * 10) / 10;
    const r = Math.round(this.currentRoll * 10) / 10;
    const totalG = Math.round(gForce * 100) / 100;

    let state = 'Stationary';
    if (totalG >= this.config.thresholds.shockThresholdG) state = 'Shock / Impact Impact';
    else if (totalG >= this.config.thresholds.vibrationThresholdG) state = 'Active Vibration';
    else if (Math.abs(p) > this.config.thresholds.tiltWarningDeg || Math.abs(r) > this.config.thresholds.tiltWarningDeg) state = 'Excessive Tilt';
    else if (Math.abs(p) > 5.0 || Math.abs(r) > 5.0) state = 'Inclined';

    return {
      mode: 'simulation',
      timestamp: Date.now(),
      sensorStatus: 'ok',
      readings: {
        pitchDeg: p,
        rollDeg: r,
        totalG: totalG,
        accelX: Math.round(Math.sin(p * Math.PI / 180) * 100) / 100,
        accelY: Math.round(Math.sin(r * Math.PI / 180) * 100) / 100,
        accelZ: Math.round(Math.cos(p * Math.PI / 180) * Math.cos(r * Math.PI / 180) * 100) / 100,
        motionState: state
      }
    };
  }

  start() { this.engine.start(); }
  pause() { this.engine.pause(); }
  resume() { this.engine.resume(); }
  stop() { this.engine.stop(); }
  reset() {
    this.currentPitch = 0.0;
    this.currentRoll = 0.0;
    this.targetPitch = 0.0;
    this.targetRoll = 0.0;
    this.scenario = 'flat';
    this.manualOverride = false;
    this.engine.reset();
  }
  setSpeed(speed) { this.engine.setSpeed(speed); }
}

if (typeof window !== 'undefined') {
  window.VibrationTiltSimulation = VibrationTiltSimulation;
}
