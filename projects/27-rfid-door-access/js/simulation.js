/**
 * Project 27: RFID Door Access - Simulation Engine
 */

const DoorSim = {
  validPin: '1234',
  currentInput: '',
  isLocked: true,
  failedAttempts: 0,
  maxAttempts: 3,
  isLockedOut: false,
  lockoutTimer: null,
  relockTimeout: null,

  init() {
    this.updateKeypadDisplay();
  },

  pressKey(digit) {
    if (this.isLockedOut) return;
    if (this.currentInput.length < 4) {
      this.currentInput += digit;
      this.playTone(800, 0.05);
      this.updateKeypadDisplay();
    }
  },

  clearPin() {
    if (this.isLockedOut) return;
    this.currentInput = '';
    this.updateKeypadDisplay();
  },

  submitPin(callback) {
    if (this.isLockedOut) return;
    if (this.currentInput.length !== 4) {
      this.setFeedback('ENTER 4 DIGITS', '#f59e0b');
      return;
    }

    if (this.currentInput === this.validPin) {
      this.grantAccess(callback);
    } else {
      this.denyAccess(callback);
    }
  },

  grantAccess(callback) {
    this.failedAttempts = 0;
    this.currentInput = '';
    this.isLocked = false;
    this.playTone(1200, 0.15, 0.1);
    setTimeout(() => this.playTone(1800, 0.25), 120);

    this.setFeedback('ACCESS GRANTED', '#22c55e');
    this.updateVisualState(true);

    if (callback) callback({ success: true, message: 'Access Granted · Solenoid Retracted' });

    // Auto-relock after 4 seconds
    clearTimeout(this.relockTimeout);
    this.relockTimeout = setTimeout(() => {
      this.lockDoor();
      if (callback) callback({ success: true, message: 'Auto-Relock Engaged · Solenoid Extended' });
    }, 4000);
  },

  denyAccess(callback) {
    this.failedAttempts++;
    this.currentInput = '';
    this.updateKeypadDisplay();
    this.playTone(250, 0.35); // Low error buzz

    if (this.failedAttempts >= this.maxAttempts) {
      this.triggerLockout(callback);
    } else {
      this.setFeedback(`WRONG PIN (${this.failedAttempts}/${this.maxAttempts})`, '#ef4444');
      if (callback) callback({ success: false, message: `Access Denied · Invalid PIN (Attempt ${this.failedAttempts})` });
    }
  },

  triggerLockout(callback) {
    this.isLockedOut = true;
    let secondsLeft = 30;
    this.setFeedback(`LOCKOUT: ${secondsLeft}s`, '#ef4444');
    if (callback) callback({ success: false, message: 'SECURITY LOCKOUT: 3 Consecutive Failed Attempts' });

    this.lockoutTimer = setInterval(() => {
      secondsLeft--;
      if (secondsLeft <= 0) {
        clearInterval(this.lockoutTimer);
        this.isLockedOut = false;
        this.failedAttempts = 0;
        this.setFeedback('ENTER 4-DIGIT PIN', '#94a3b8');
        if (callback) callback({ success: true, message: 'Lockout Expired · Keypad Ready' });
      } else {
        this.setFeedback(`LOCKOUT: ${secondsLeft}s`, '#ef4444');
      }
    }, 1000);
  },

  lockDoor() {
    this.isLocked = true;
    this.updateVisualState(false);
    this.setFeedback('ENTER 4-DIGIT PIN', '#94a3b8');
  },

  updateVisualState(unlocked) {
    const door = document.getElementById('door-panel');
    const bolt = document.getElementById('solenoid-bolt');
    const lamp = document.getElementById('lock-lamp');
    const badge = document.getElementById('lock-status-badge');

    if (door) door.classList.toggle('unlocked', unlocked);
    if (bolt) bolt.classList.toggle('retracted', unlocked);
    if (lamp) lamp.classList.toggle('unlocked', unlocked);
    if (badge) {
      badge.textContent = unlocked ? 'Unlocked' : 'Locked';
      badge.style.background = unlocked ? '#dcfce7' : '#ffe4e6';
      badge.style.color = unlocked ? '#15803d' : '#be123c';
    }
  },

  updateKeypadDisplay() {
    const dotsContainer = document.getElementById('pin-dots');
    if (!dotsContainer) return;

    const dots = dotsContainer.querySelectorAll('.dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('filled', idx < this.currentInput.length);
    });
  },

  setFeedback(text, color) {
    const fb = document.getElementById('pin-feedback');
    if (fb) {
      fb.textContent = text;
      fb.style.color = color;
    }
  },

  playTone(freq, duration) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }
};
