/**
 * TERRASCAN X ELITE — Radar Simulation Engine
 * Simulates HC-SR04 ultrasonic echo pulse width, obstacle distance, and azimuth radar sweep.
 */

class TerrascanSimulation {
  constructor() {
    this.angle = 90;            // Current sweep angle: 0 to 180 degrees
    this.sweepDirection = 1;    // +1 (clockwise) or -1 (counter-clockwise)
    this.sweepSpeed = 2;        // Degrees per tick
    this.distance = 120.0;      // Current echo distance in cm (2 - 400 cm)
    this.targetDistance = 120.0;
    this.echoMicroseconds = 7000;
    this.threshold = 30.0;      // Warning threshold in cm
    this.criticalThreshold = 15.0;

    this.mode = 'sim';          // 'sim' | 'hw'
    this.isPaused = false;
    this.speedMultiplier = 1.0;
    this.scenario = 'oscillating'; // 'clear' | 'approaching' | 'oscillating' | 'collision'

    // Blips memory for radar display: [{ angle, distance, intensity, timestamp }]
    this.targets = [
      { angle: 45, distance: 85, intensity: 1.0 },
      { angle: 120, distance: 140, intensity: 0.8 },
      { angle: 90, distance: 55, intensity: 1.0 }
    ];

    this.history = [];          // Last 30 readings: { time, distance, angle }
    this.listeners = [];
  }

  setScenario(name) {
    this.scenario = name;
    switch (name) {
      case 'clear':
        this.targetDistance = 320.0;
        this.targets = [];
        break;
      case 'approaching':
        this.targetDistance = 75.0;
        this.targets = [{ angle: 90, distance: 75, intensity: 1.0 }];
        break;
      case 'oscillating':
        this.targetDistance = 110.0;
        this.targets = [
          { angle: 45, distance: 85, intensity: 0.9 },
          { angle: 135, distance: 120, intensity: 0.7 }
        ];
        break;
      case 'collision':
        this.targetDistance = 12.0;
        this.targets = [{ angle: 88, distance: 12, intensity: 1.0 }];
        break;
    }
  }

  setManualDistance(dist) {
    this.targetDistance = Math.max(2, Math.min(400, parseFloat(dist)));
  }

  setThreshold(th) {
    this.threshold = Math.max(5, Math.min(150, parseFloat(th)));
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  setSpeed(multiplier) {
    this.speedMultiplier = Math.max(0.25, Math.min(4.0, parseFloat(multiplier)));
  }

  reset() {
    this.angle = 90;
    this.sweepDirection = 1;
    this.distance = 120.0;
    this.targetDistance = 120.0;
    this.isPaused = false;
    this.scenario = 'oscillating';
    this.history = [];
    this.targets = [
      { angle: 45, distance: 85, intensity: 0.9 },
      { angle: 135, distance: 120, intensity: 0.7 }
    ];
  }

  // Called on each frame or timer tick
  update(deltaMs = 50) {
    if (this.isPaused && this.mode === 'sim') return this.getState();

    if (this.mode === 'sim') {
      // 1. Advance sweep angle (0 to 180 degrees back and forth)
      const step = this.sweepSpeed * this.speedMultiplier * (deltaMs / 50);
      this.angle += this.sweepDirection * step;
      if (this.angle >= 180) {
        this.angle = 180;
        this.sweepDirection = -1;
      } else if (this.angle <= 0) {
        this.angle = 0;
        this.sweepDirection = 1;
      }

      // 2. Scenario specific dynamics
      if (this.scenario === 'approaching') {
        this.targetDistance -= 0.6 * this.speedMultiplier;
        if (this.targetDistance < 8.0) this.targetDistance = 160.0;
      } else if (this.scenario === 'oscillating') {
        const time = Date.now() / 1500;
        this.targetDistance = 90.0 + Math.sin(time) * 45.0;
      }

      // 3. Smooth drift towards target distance + small acoustic jitter
      const jitter = (Math.random() - 0.5) * 1.2;
      this.distance += (this.targetDistance - this.distance) * 0.12 + jitter;
      this.distance = Math.max(2.0, Math.min(400.0, this.distance));

      // Calculate ultrasound round-trip echo time (speed of sound ~343 m/s = 29.1 µs/cm)
      this.echoMicroseconds = Math.round(this.distance * 58.2);

      // Check if current beam intersects any target blip
      for (const t of this.targets) {
        if (Math.abs(this.angle - t.angle) < 6) {
          t.intensity = 1.0;
          this.distance = Math.min(this.distance, t.distance + (Math.random() - 0.5) * 0.8);
        } else {
          t.intensity = Math.max(0.1, t.intensity - 0.02);
        }
      }

      // Record history
      if (!this.lastHistoryPush || Date.now() - this.lastHistoryPush > 250) {
        this.history.push({
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          distance: parseFloat(this.distance.toFixed(1)),
          angle: Math.round(this.angle)
        });
        if (this.history.length > 40) this.history.shift();
        this.lastHistoryPush = Date.now();
      }
    }

    const state = this.getState();
    this.listeners.forEach(cb => cb(state));
    return state;
  }

  // Update with real hardware readings
  applyHardwareReading(data) {
    if (!data) return;
    this.distance = parseFloat(data.distance_cm || data.distance || 0);
    this.echoMicroseconds = parseInt(data.echo_us || (this.distance * 58.2), 10);
    if (data.angle !== undefined) this.angle = parseFloat(data.angle);

    this.history.push({
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      distance: parseFloat(this.distance.toFixed(1)),
      angle: Math.round(this.angle)
    });
    if (this.history.length > 40) this.history.shift();

    const state = this.getState();
    this.listeners.forEach(cb => cb(state));
  }

  getState() {
    let status = 'CLEAR';
    let statusClass = 'clear';

    if (this.distance <= this.criticalThreshold) {
      status = 'COLLISION THREAT';
      statusClass = 'danger';
    } else if (this.distance <= this.threshold) {
      status = 'TARGET ACQUIRED';
      statusClass = 'warning';
    }

    return {
      angle: Math.round(this.angle),
      distance: parseFloat(this.distance.toFixed(1)),
      echoUs: this.echoMicroseconds,
      threshold: this.threshold,
      status: status,
      statusClass: statusClass,
      isPaused: this.isPaused,
      speedMultiplier: this.speedMultiplier,
      scenario: this.scenario,
      targets: this.targets,
      history: this.history
    };
  }

  onUpdate(cb) {
    this.listeners.push(cb);
  }
}

if (typeof window !== 'undefined') {
  window.TerrascanSimulation = TerrascanSimulation;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TerrascanSimulation;
}
