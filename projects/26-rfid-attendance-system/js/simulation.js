/**
 * Project 26: RFID Attendance System - Simulation Engine
 */

const RFIDSim = {
  students: [
    { roll: 'CS-101', name: 'Aarav Patel', uid: '04A1B2C3', dept: 'Computer Science', checkInTime: '08:45 AM', present: true },
    { roll: 'CS-102', name: 'Priya Sharma', uid: '92D4E5F6', dept: 'Computer Science', checkInTime: '08:52 AM', present: true },
    { roll: 'EC-201', name: 'Rohan Verma', uid: '33F7A8B9', dept: 'Electronics', checkInTime: null, present: false },
    { roll: 'ME-305', name: 'Neha Gupta', uid: '55C1D2E3', dept: 'Mechanical', checkInTime: null, present: false }
  ],

  activeCardIndex: 0,
  isScanning: false,

  init() {
    this.updateCardDisplay(0);
  },

  updateCardDisplay(index) {
    this.activeCardIndex = index;
    const student = this.students[index];
    const numEl = document.getElementById('card-display-num');
    const holderEl = document.getElementById('card-display-holder');
    if (numEl) numEl.textContent = `UID: ${student.uid}`;
    if (holderEl) holderEl.textContent = student.name;
  },

  playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, ctx.currentTime); // High pitch RFID reader chirp
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio not supported or blocked
    }
  },

  tapCard(index, callback) {
    if (this.isScanning) return;
    this.isScanning = true;
    this.updateCardDisplay(index);

    const cardEl = document.getElementById('animated-rfid-card');
    const ledEl = document.getElementById('terminal-led');
    const screenName = document.getElementById('terminal-screen-name');
    const screenUid = document.getElementById('terminal-screen-uid');
    const badge = document.getElementById('terminal-badge');

    // Trigger tap motion animation
    if (cardEl) cardEl.classList.add('tapping');
    if (ledEl) ledEl.className = 'rfid-led-indicator scanning';
    if (badge) {
      badge.textContent = 'Reading Card…';
      badge.style.background = '#e0f2fe';
      badge.style.color = '#0284c7';
    }

    setTimeout(() => {
      this.playBeep();
      const student = this.students[index];
      const now = new Date();
      student.checkInTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      student.present = true;

      if (screenName) screenName.textContent = student.name.toUpperCase();
      if (screenUid) screenUid.textContent = `UID: ${student.uid}`;
      if (ledEl) ledEl.className = 'rfid-led-indicator success';
      if (badge) {
        badge.textContent = 'Access Verified';
        badge.style.background = '#dcfce7';
        badge.style.color = '#15803d';
      }

      setTimeout(() => {
        if (cardEl) cardEl.classList.remove('tapping');
        this.isScanning = false;
        if (ledEl) ledEl.className = 'rfid-led-indicator';
        if (badge) {
          badge.textContent = 'Scanner Idle';
          badge.style.background = '#ecfdf5';
          badge.style.color = '#059669';
        }
        if (callback) callback(student);
      }, 900);
    }, 600);
  }
};
