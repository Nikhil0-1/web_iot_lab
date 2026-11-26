/**
 * Project 35: Digital Notice Board - Application Controller
 * Handles user interactions, Simulation/Hardware mode coordination, and verified hardware communication.
 */

let currentMode = 'sim';
let espClient = null;
let noticeHistory = [];

document.addEventListener('DOMContentLoaded', () => {
  OledSim.init();

  // Load saved Device C / Notice Board IP from storage
  const ipInput = document.getElementById('hw-ip-input');
  if (ipInput && window.UniversalHubManager) {
    ipInput.value = UniversalHubManager.getDeviceCIp();
  }
});

function setMode(mode) {
  currentMode = mode;
  const btnSim = document.getElementById('mode-btn-sim');
  const btnHw = document.getElementById('mode-btn-hw');
  const statusPill = document.getElementById('status-pill');
  const statusText = document.getElementById('status-text');

  btnSim.classList.toggle('active', mode === 'sim');
  btnHw.classList.toggle('active', mode === 'hw');

  if (mode === 'sim') {
    if (statusPill) statusPill.className = 'status-pill status-ok';
    if (statusText) statusText.textContent = 'Simulating';
    if (espClient) espClient.stopPolling();
  } else {
    const isConnected = espClient && espClient.state === 'CONNECTED';
    if (statusPill) {
      statusPill.className = isConnected ? 'status-pill status-ok' : 'status-pill status-warn';
    }
    if (statusText) {
      statusText.textContent = isConnected ? 'HW Connected' : 'Hardware Standby';
    }
    if (espClient && !isConnected) {
      espClient.startPolling();
    }
  }
}

async function broadcastMessage() {
  const input = document.getElementById('notice-input');
  const text = input ? input.value.trim() : '';

  if (!text) {
    if (window.CommonUI) CommonUI.toast('Please enter a notice message before broadcasting.', 'warning');
    return;
  }

  if (currentMode === 'sim') {
    OledSim.setMessage(text);
    logNoticeEvent(text, 'Simulated Dispatch');
    if (window.CommonUI) CommonUI.toast('Broadcasted announcement to virtual OLED board!', 'success');
    return;
  }

  // Hardware Mode Execution
  if (!espClient || espClient.state !== 'CONNECTED') {
    if (window.CommonUI) {
      CommonUI.toast('Device Offline: Connect your ESP8266 or switch to Simulation mode to test.', 'error');
    }
    return;
  }

  try {
    const sendBtn = document.querySelector('.input-with-action button');
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.textContent = 'Transmitting…';
    }

    const res = await espClient.sendCommand({
      message: text,
      speed: OledSim.scrollSpeed,
      fontSize: OledSim.fontSize
    });

    if (res && res.success) {
      OledSim.setMessage(text);
      logNoticeEvent(text, 'Hardware Acknowledged');
      if (window.CommonUI) CommonUI.toast('Announcement acknowledged and rendered by physical OLED!', 'success');
    } else {
      throw new Error((res && res.error) || 'Failed to acknowledge message');
    }
  } catch (err) {
    if (window.CommonUI) CommonUI.toast(`Hardware Transmission Failed: ${err.message}`, 'error');
  } finally {
    const sendBtn = document.querySelector('.input-with-action button');
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send to Board';
    }
  }
}

function updateDisplaySettings() {
  const sizeSelect = document.getElementById('font-size-select');
  const speedSelect = document.getElementById('scroll-speed-select');
  const badge = document.getElementById('marquee-badge');

  if (sizeSelect) {
    OledSim.fontSize = parseInt(sizeSelect.value, 10);
  }
  if (speedSelect) {
    OledSim.scrollSpeed = parseInt(speedSelect.value, 10);
    if (badge) {
      badge.textContent = (OledSim.scrollSpeed === 0) ? 'Static Display' : 'Marquee Active';
    }
  }

  OledSim.recalculateMetrics();

  // If connected in hardware mode, synchronize physical display settings
  if (currentMode === 'hw' && espClient && espClient.state === 'CONNECTED') {
    espClient.sendCommand({
      speed: OledSim.scrollSpeed,
      fontSize: OledSim.fontSize
    }).catch(err => {
      console.warn('Could not sync display settings to hardware:', err.message);
    });
  }
}

function applyPreset(text) {
  const input = document.getElementById('notice-input');
  if (input) input.value = text;
  broadcastMessage();
}

function logNoticeEvent(text, channel = 'Dispatched') {
  const time = new Date().toLocaleTimeString();
  noticeHistory.unshift({ time, text, channel });
  if (noticeHistory.length > 20) noticeHistory.pop();

  const container = document.getElementById('notice-history-list');
  if (!container) return;

  container.innerHTML = noticeHistory.map(e => `
    <div class="event-item" style="padding:6px 0;border-bottom:1px solid var(--border-subtle);font-size:0.8rem;">
      <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
        <span class="meta-text" style="font-family:monospace;font-size:0.75rem;">[${e.time}]</span>
        <span class="badge" style="font-size:0.68rem;padding:1px 6px;">${e.channel}</span>
      </div>
      <strong>Message:</strong> <span>${e.text}</span>
    </div>
  `).join('');
}

function clearNoticeHistory() {
  noticeHistory = [];
  const container = document.getElementById('notice-history-list');
  if (container) container.innerHTML = '<div class="event-empty">No previous announcements.</div>';
}

// Hardware Connection Manager
async function hwConnect() {
  const ipInput = document.getElementById('hw-ip-input');
  const connectBtn = document.querySelector('.hw-controls-group button');
  const errMsg = document.getElementById('hw-error-msg');
  const lastSeen = document.getElementById('hw-last-seen');
  const statusPill = document.getElementById('status-pill');
  const statusText = document.getElementById('status-text');

  // If already connected or polling, handle disconnect
  if (espClient && (espClient.state === 'CONNECTED' || espClient.state === 'CONNECTING' || espClient.isPolling)) {
    espClient.stopPolling();
    espClient = null;
    if (connectBtn) connectBtn.textContent = 'Connect';
    if (lastSeen) lastSeen.textContent = 'Disconnected by user';
    if (statusPill && currentMode === 'hw') {
      statusPill.className = 'status-pill status-warn';
      statusText.textContent = 'Hardware Standby';
    }
    if (window.CommonUI) CommonUI.toast('Disconnected from hardware node.', 'info');
    return;
  }

  const rawIp = ipInput ? ipInput.value.trim() : '192.168.4.1';
  if (!rawIp) {
    if (window.CommonUI) CommonUI.toast('Please enter a valid IP address or hostname', 'warning');
    return;
  }

  // Save for future visits
  if (window.UniversalHubManager) {
    UniversalHubManager.setDeviceCIp(rawIp);
  }

  if (errMsg) errMsg.style.display = 'none';
  if (connectBtn) {
    connectBtn.disabled = true;
    connectBtn.textContent = 'Connecting…';
  }
  if (lastSeen) lastSeen.textContent = `Connecting to ${rawIp}…`;

  espClient = new ESP8266Client({
    baseUrl: rawIp,
    expectedProjectId: '35',
    pollIntervalMs: 2000,
    timeoutMs: 4000,
    onData: (data) => {
      const nowStr = new Date().toLocaleTimeString();
      if (lastSeen) lastSeen.textContent = `Live Telemetry: ${nowStr}`;

      if (data && data.active_message) {
        OledSim.setMessage(data.active_message);
      }
      if (data && data.scroll_speed !== undefined) {
        OledSim.scrollSpeed = data.scroll_speed;
      }
    },
    onStateChange: (state, detail) => {
      if (currentMode === 'hw') {
        if (state === 'CONNECTED') {
          if (statusPill) statusPill.className = 'status-pill status-ok';
          if (statusText) statusText.textContent = 'HW Connected';
        } else if (state === 'CONNECTING' || state === 'RECONNECTING') {
          if (statusPill) statusPill.className = 'status-pill status-warn';
          if (statusText) statusText.textContent = state;
        } else {
          if (statusPill) statusPill.className = 'status-pill status-danger';
          if (statusText) statusText.textContent = 'HW Error';
        }
      }
    },
    onError: (err) => {
      if (errMsg) {
        errMsg.textContent = err.message;
        errMsg.style.display = 'block';
      }
    }
  });

  const res = await espClient.testConnection();
  if (connectBtn) connectBtn.disabled = false;

  if (res.success) {
    if (connectBtn) connectBtn.textContent = 'Disconnect';
    if (errMsg) errMsg.style.display = 'none';

    const devInfo = res.device || {};
    const ip = devInfo.ip || rawIp;
    OledSim.setDeviceStatus('LIVE', ip);

    if (window.CommonUI) {
      CommonUI.toast(`Connected to ${devInfo.deviceId || 'ESP8266 OLED Node'}!`, 'success');
    }

    if (currentMode === 'hw') {
      if (statusPill) statusPill.className = 'status-pill status-ok';
      if (statusText) statusText.textContent = 'HW Connected';
    }

    espClient.startPolling();
  } else {
    if (connectBtn) connectBtn.textContent = 'Connect';
    if (errMsg) {
      errMsg.textContent = `Hardware Connection Failed: ${res.error}`;
      errMsg.style.display = 'block';
    }
  }
}
