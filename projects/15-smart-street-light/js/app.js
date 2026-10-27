/**
 * Project 15 — Smart Street Light — App Controller
 */
'use strict';
let appMode = 'sim'; let hwClient = null;
function setMode(mode) {
  appMode = mode;
  document.getElementById('mode-btn-sim').classList.toggle('active', mode === 'sim');
  document.getElementById('mode-btn-hw').classList.toggle('active', mode === 'hw');
  document.getElementById('sim-controls-card').style.display = mode === 'sim' ? '' : 'none';
  document.getElementById('hw-controls-card').style.display = mode === 'hw' ? '' : 'none';
  if (mode === 'sim') {
    if (hwClient) { hwClient.stopPolling(); hwClient = null; }
    setStatusPill('Simulating', 'ok');
    lightState.paused = false; clearTimeout(lightState.simTimer); simTick();
  } else {
    lightState.paused = true; clearTimeout(lightState.simTimer); setStatusPill('Disconnected', 'idle');
  }
}
function setStatusPill(text, type) {
  document.getElementById('status-pill').className = 'status-pill status-' + type;
  document.getElementById('status-text').textContent = text;
}
function hwConnect() {
  const ip = document.getElementById('hw-ip').value.trim(); if (!ip) return;
  if (hwClient) hwClient.stopPolling();
  hwClient = new ESP8266Client({ baseUrl:'http://'+ip, expectedProjectId:'street-light', pollIntervalMs:2000,
    onData: d => { if (typeof d.lux==='number') { lightState.history.push(d.lux); if (lightState.history.length>60) lightState.history.shift(); renderChart(); } document.getElementById('hw-last-seen').textContent='Last: '+new Date().toLocaleTimeString(); },
    onStateChange: (s,detail) => { const map={CONNECTED:['Connected','ok'],CONNECTING:['Connecting…','warn'],ERROR:['Error','danger'],DISCONNECTED:['Disconnected','idle']}; const [l,c]=map[s]||['Unknown','idle']; setStatusPill(l,c); if(s==='ERROR'&&detail){document.getElementById('hw-error-msg').textContent=detail;document.getElementById('hw-error-msg').style.display='';} else document.getElementById('hw-error-msg').style.display='none'; },
    onError: err => { document.getElementById('hw-error-msg').textContent=err.message; document.getElementById('hw-error-msg').style.display=''; }
  });
  hwClient.startPolling();
}
window.addEventListener('DOMContentLoaded', () => {
  initSimulation();
  document.getElementById('hw-modal').addEventListener('click', function(e){ if(e.target===this) this.classList.remove('open'); });
});
