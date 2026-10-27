/**
 * Project 35: Digital Notice Board - Application Controller
 */

let currentMode = 'sim';
let espClient = null;
let noticeHistory = [];

document.addEventListener('DOMContentLoaded', () => {
  OledSim.init();
});

function setMode(mode) {
  currentMode = mode;
  document.getElementById('mode-btn-sim').classList.toggle('active', mode === 'sim');
  document.getElementById('mode-btn-hw').classList.toggle('active', mode === 'hw');

  const statusText = document.getElementById('status-text');

  if (mode === 'sim') {
    statusText.textContent = 'Simulating';
    if (espClient) espClient.stopPolling();
  } else {
    statusText.textContent = 'Hardware Mode';
    if (espClient) espClient.startPolling();
  }
}

function broadcastMessage() {
  const text = document.getElementById('notice-input').value.trim();
  if (!text) return;

  OledSim.setMessage(text);
  logNoticeEvent(text);

  if (currentMode === 'hw' && espClient) {
    espClient.sendCommand({ message: text, speed: OledSim.scrollSpeed });
  }

  if (window.CommonUI) CommonUI.toast('Broadcasted announcement to OLED board!', 'success');
}

function updateDisplaySettings() {
  const sizeSelect = document.getElementById('font-size-select');
  const speedSelect = document.getElementById('scroll-speed-select');
  const badge = document.getElementById('marquee-badge');

  if (sizeSelect) OledSim.fontSize = parseInt(sizeSelect.value, 10);
  if (speedSelect) {
    OledSim.scrollSpeed = parseInt(speedSelect.value, 10);
    if (badge) {
      badge.textContent = OledSim.scrollSpeed === 0 ? 'Static Display' : 'Marquee Active';
    }
  }
}

function applyPreset(text) {
  const input = document.getElementById('notice-input');
  if (input) input.value = text;
  broadcastMessage();
}

function logNoticeEvent(text) {
  const time = new Date().toLocaleTimeString();
  noticeHistory.unshift({ time, text });
  if (noticeHistory.length > 20) noticeHistory.pop();

  const container = document.getElementById('notice-history-list');
  if (!container) return;

  container.innerHTML = noticeHistory.map(e => `
    <div class="event-item" style="padding:6px 0;border-bottom:1px solid var(--border-subtle);font-size:0.8rem;">
      <span class="meta-text" style="font-family:monospace;margin-right:6px;">[${e.time}]</span>
      <strong>Dispatched:</strong> <span>${e.text}</span>
    </div>
  `).join('');
}

function clearNoticeHistory() {
  noticeHistory = [];
  const container = document.getElementById('notice-history-list');
  if (container) container.innerHTML = '<div class="event-empty">No previous announcements.</div>';
}

// Hardware Link
function hwConnect() {
  const ip = document.getElementById('hw-ip-input').value.trim();
  const errMsg = document.getElementById('hw-error-msg');
  const lastSeen = document.getElementById('hw-last-seen');

  if (errMsg) errMsg.style.display = 'none';

  espClient = new ESP8266Client({
    baseUrl: ip,
    expectedProjectId: '35-digital-notice-board',
    pollIntervalMs: 2000,
    onData: (data) => {
      if (lastSeen) lastSeen.textContent = `Live Telemetry: ${new Date().toLocaleTimeString()}`;
      if (data.active_message) {
        OledSim.setMessage(data.active_message);
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
      if (window.CommonUI) CommonUI.toast('Connected to ESP8266 OLED Notice Node!', 'success');
      espClient.startPolling();
    }
  });
}
