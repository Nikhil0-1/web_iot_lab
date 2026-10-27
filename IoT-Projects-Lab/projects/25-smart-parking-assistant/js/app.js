/**
 * Project 25: Smart Parking Assistant - Application Controller
 */

let currentMode = 'sim';
let espClient = null;
let parkingEvents = [];

document.addEventListener('DOMContentLoaded', () => {
  ParkingSim.init();
  updateUI();

  window.onParkingStateChange = () => {
    updateUI();
    logEvent(
      ParkingSim.enteringCar && ParkingSim.enteringCar.state === 'driving-out' ? 'Departure' : 'Arrival',
      `Bay ${ParkingSim.selectedBay + 1} status updated: ${ParkingSim.bays[ParkingSim.selectedBay].occupied ? 'Occupied' : 'Vacant'}`
    );
  };
});

function setMode(mode) {
  currentMode = mode;
  document.getElementById('mode-btn-sim').classList.toggle('active', mode === 'sim');
  document.getElementById('mode-btn-hw').classList.toggle('active', mode === 'hw');

  const statusText = document.getElementById('status-text');
  const simControls = document.getElementById('sim-controls');

  if (mode === 'sim') {
    statusText.textContent = 'Simulating';
    simControls.style.display = 'flex';
    if (espClient) espClient.stopPolling();
  } else {
    statusText.textContent = 'Hardware Mode';
    simControls.style.display = 'none';
    if (espClient) espClient.startPolling();
  }
}

function updateUI() {
  const bays = ParkingSim.bays;
  const availCount = bays.filter(b => !b.occupied).length;

  // Counter Badges
  const badge = document.getElementById('avail-counter-badge');
  if (badge) badge.textContent = `${availCount} Available`;

  const summary = document.getElementById('bay-status-summary');
  if (summary) summary.textContent = `Zone A · ${availCount} of 4 bays vacant`;

  // Update Individual Bays
  bays.forEach((bay, idx) => {
    const distEl = document.getElementById(`bay-dist-${idx}`);
    const pillEl = document.getElementById(`bay-pill-${idx}`);
    const barEl = document.getElementById(`bay-bar-${idx}`);
    const itemEl = document.getElementById(`bay-ui-${idx}`);

    if (distEl) distEl.textContent = bay.distCm;
    if (pillEl) {
      pillEl.className = `bay-pill ${bay.occupied ? 'occ' : 'free'}`;
      pillEl.textContent = bay.occupied ? 'Occupied' : 'Vacant';
    }
    if (barEl) {
      barEl.className = `bay-bar ${bay.occupied ? 'occ' : ''}`;
      barEl.style.width = `${Math.min(100, Math.round((1 - bay.distCm / 150) * 100))}%`;
    }
    if (itemEl) {
      itemEl.classList.toggle('selected', ParkingSim.selectedBay === idx);
    }
  });

  // Selected Bay Inspector
  const sel = bays[ParkingSim.selectedBay];
  const inspName = document.getElementById('inspect-bay-name');
  const inspDist = document.getElementById('inspect-dist');
  const inspStatus = document.getElementById('inspect-status');

  if (inspName) inspName.textContent = `Bay 0${sel.id + 1}`;
  if (inspDist) inspDist.textContent = `${sel.distCm} cm`;
  if (inspStatus) {
    inspStatus.textContent = sel.occupied ? 'Occupied' : 'Vacant';
    inspStatus.style.background = sel.occupied ? '#ffe4e6' : '#ecfdf5';
    inspStatus.style.color = sel.occupied ? '#be123c' : '#047857';
  }
}

function selectBay(idx) {
  ParkingSim.selectedBay = idx;
  updateUI();
}

function triggerVehicleEntry() {
  ParkingSim.parkCarInBay();
  updateUI();
}

function triggerVehicleExit() {
  ParkingSim.exitCarFromBay();
  updateUI();
}

function toggleBarrierGate() {
  ParkingSim.setBarrier(!ParkingSim.barrierOpen);
  logEvent('Gate', ParkingSim.barrierOpen ? 'Barrier manually opened (Servo 90°)' : 'Barrier closed (Servo 0°)');
}

function resetParkingLot() {
  ParkingSim.reset();
  updateUI();
  logEvent('System', 'Parking lot occupancy reset to default');
}

function logEvent(type, message) {
  const time = new Date().toLocaleTimeString();
  parkingEvents.unshift({ time, type, message });
  if (parkingEvents.length > 25) parkingEvents.pop();

  const container = document.getElementById('event-list');
  if (!container) return;

  container.innerHTML = parkingEvents.map(e => `
    <div class="event-item" style="padding:6px 0;border-bottom:1px solid var(--border-subtle);font-size:0.8rem;">
      <span class="meta-text" style="font-family:monospace;margin-right:6px;">[${e.time}]</span>
      <strong style="margin-right:6px;">${e.type}:</strong>
      <span>${e.message}</span>
    </div>
  `).join('');
}

function clearEventLog() {
  parkingEvents = [];
  const container = document.getElementById('event-list');
  if (container) container.innerHTML = '<div class="event-empty">No parking events logged yet.</div>';
}

// Hardware Mode Connection
function hwConnect() {
  const ip = document.getElementById('hw-ip-input').value.trim();
  const errMsg = document.getElementById('hw-error-msg');
  const lastSeen = document.getElementById('hw-last-seen');

  if (errMsg) errMsg.style.display = 'none';

  espClient = new ESP8266Client({
    baseUrl: ip,
    expectedProjectId: '25-smart-parking-assistant',
    pollIntervalMs: 1500,
    onData: (data) => {
      if (lastSeen) lastSeen.textContent = `Live Telemetry: ${new Date().toLocaleTimeString()}`;
      if (data.bays && Array.isArray(data.bays)) {
        data.bays.forEach((b, i) => {
          if (ParkingSim.bays[i]) {
            ParkingSim.bays[i].distCm = b.distance_cm || ParkingSim.bays[i].distCm;
            ParkingSim.bays[i].occupied = (b.distance_cm < 25);
          }
        });
        updateUI();
      }
    },
    onError: (err) => {
      if (errMsg) {
        errMsg.textContent = `Hardware Error: ${err.message}`;
        errMsg.style.display = 'block';
      }
    }
  });

  espClient.testConnection().then(res => {
    if (res.success) {
      if (window.CommonUI) CommonUI.toast('Connected to ESP8266 Smart Parking Station!', 'success');
      espClient.startPolling();
    }
  });
}
