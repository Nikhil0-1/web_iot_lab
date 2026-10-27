/**
 * Project 28: Smart Dustbin - Simulation Engine
 */

const DustbinSim = {
  lidOpen: false,
  lidAngle: 0,
  fillPercent: 35,
  binHeightCm: 40,
  autoCloseTimer: null,
  isAnimating: false,

  init() {
    this.updateVisuals();
  },

  waveHand(callback) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const eye = document.getElementById('ir-eye');
    const hand = document.getElementById('hand-graphic');

    if (eye) eye.classList.add('active');
    if (hand) hand.classList.add('waving');

    setTimeout(() => {
      this.openLid();
      if (hand) hand.classList.remove('waving');
      if (eye) eye.classList.remove('active');
      this.isAnimating = false;
      if (callback) callback({ action: 'Lid Opened by IR Proximity Trigger' });

      // Auto close after 3.5 seconds
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = setTimeout(() => {
        this.closeLid();
        if (callback) callback({ action: 'Lid Auto-Closed after timeout' });
      }, 3500);
    }, 450);
  },

  openLid() {
    this.lidOpen = true;
    this.lidAngle = 80;
    this.updateVisuals();
  },

  closeLid() {
    this.lidOpen = false;
    this.lidAngle = 0;
    this.updateVisuals();
  },

  toggleLid() {
    if (this.lidOpen) this.closeLid();
    else this.openLid();
  },

  depositWaste(pct = 20) {
    this.fillPercent = Math.min(100, this.fillPercent + pct);
    this.openLid();
    clearTimeout(this.autoCloseTimer);
    this.autoCloseTimer = setTimeout(() => this.closeLid(), 2500);
    this.updateVisuals();
  },

  emptyBin() {
    this.fillPercent = 0;
    this.updateVisuals();
  },

  getHeadroomDepthCm() {
    // Ultrasonic sensor at top lid measures distance to waste surface
    return Math.max(4, Math.round(this.binHeightCm * (1 - this.fillPercent / 100)));
  },

  updateVisuals() {
    const lid = document.getElementById('bin-lid');
    const fill = document.getElementById('waste-fill');
    const badge = document.getElementById('bin-status-badge');
    const warning = document.getElementById('capacity-warning-card');

    if (lid) lid.classList.toggle('opened', this.lidOpen);

    if (fill) {
      fill.style.height = `${this.fillPercent}%`;
      fill.className = 'waste-fill';
      if (this.fillPercent > 85) fill.classList.add('overflow');
      else if (this.fillPercent > 60) fill.classList.add('high');
    }

    if (badge) {
      badge.textContent = this.lidOpen ? 'Lid Open (Servo 80°)' : 'Lid Closed';
      badge.style.background = this.lidOpen ? '#e0f2fe' : '#ccfbf1';
      badge.style.color = this.lidOpen ? '#0284c7' : '#0f766e';
    }

    if (warning) {
      warning.style.display = (this.fillPercent > 85) ? 'block' : 'none';
    }

    // Numbers
    const valFill = document.getElementById('val-fill-pct');
    const valDepth = document.getElementById('val-depth-cm');
    const valAngle = document.getElementById('val-lid-angle');
    const valLidText = document.getElementById('val-lid-text');
    const valStatus = document.getElementById('val-fill-status');

    if (valFill) valFill.textContent = this.fillPercent;
    if (valDepth) valDepth.textContent = this.getHeadroomDepthCm();
    if (valAngle) valAngle.textContent = this.lidAngle;
    if (valLidText) valLidText.textContent = this.lidOpen ? 'Dispensing Access' : 'Closed (Odor Sealed)';
    if (valStatus) {
      if (this.fillPercent > 85) valStatus.textContent = 'Critical Overflow';
      else if (this.fillPercent > 60) valStatus.textContent = 'High Fill Level';
      else valStatus.textContent = 'Normal Capacity';
    }
  }
};
