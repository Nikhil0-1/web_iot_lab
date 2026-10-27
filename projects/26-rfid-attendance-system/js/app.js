/**
 * Project 26: RFID Attendance System - Application Controller
 */

let currentMode = 'sim';
let espClient = null;
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  RFIDSim.init();
  renderAttendanceTable();
  updateStats();
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

function tapCard(index) {
  RFIDSim.tapCard(index, (student) => {
    renderAttendanceTable();
    updateStats();
    if (window.CommonUI) CommonUI.toast(`Checked in: ${student.name} (${student.roll})`, 'success');
  });
}

function renderAttendanceTable() {
  const tbody = document.getElementById('attendance-tbody');
  if (!tbody) return;

  const filtered = RFIDSim.students.filter(s => {
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q) || s.uid.toLowerCase().includes(q);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);padding:16px;">No matching records found.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(s => `
    <tr>
      <td><strong>${s.roll}</strong></td>
      <td>${s.name}</td>
      <td><code style="font-size:0.75rem;background:var(--bg-main);padding:2px 6px;border-radius:4px;">${s.uid}</code></td>
      <td>${s.checkInTime || '<span style="color:var(--text-muted);">--:--</span>'}</td>
      <td>
        <span class="badge" style="background:${s.present ? '#dcfce7' : '#ffe4e6'};color:${s.present ? '#15803d' : '#be123c'};font-size:0.72rem;">
          ${s.present ? 'Present' : 'Absent'}
        </span>
      </td>
    </tr>
  `).join('');
}

function filterAttendanceTable(query) {
  searchQuery = query;
  renderAttendanceTable();
}

function updateStats() {
  const total = RFIDSim.students.length;
  const present = RFIDSim.students.filter(s => s.present).length;
  const absent = total - present;
  const rate = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';

  const presentEl = document.getElementById('stat-present-count');
  const absentEl = document.getElementById('stat-absent-count');
  const rateEl = document.getElementById('stat-rate');
  const regSub = document.getElementById('registry-count-sub');

  if (presentEl) presentEl.textContent = present;
  if (absentEl) absentEl.textContent = absent;
  if (rateEl) rateEl.textContent = `${rate}%`;
  if (regSub) regSub.textContent = `${present} of ${total} present · Roll Call Active`;
}

function exportAttendanceCSV() {
  const headers = ['Roll No', 'Name', 'Department', 'Card UID', 'Check-In Time', 'Status'];
  const rows = RFIDSim.students.map(s => [
    s.roll,
    `"${s.name}"`,
    `"${s.dept}"`,
    s.uid,
    s.checkInTime || 'N/A',
    s.present ? 'Present' : 'Absent'
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (window.CommonUI) CommonUI.toast('Exported attendance registry to CSV!', 'info');
}

function clearAttendanceLog() {
  RFIDSim.students.forEach(s => {
    s.present = false;
    s.checkInTime = null;
  });
  renderAttendanceTable();
  updateStats();
  if (window.CommonUI) CommonUI.toast('Cleared today\'s attendance log.', 'info');
}

// Hardware Link
function hwConnect() {
  const ip = document.getElementById('hw-ip-input').value.trim();
  const errMsg = document.getElementById('hw-error-msg');
  const lastSeen = document.getElementById('hw-last-seen');

  if (errMsg) errMsg.style.display = 'none';

  espClient = new ESP8266Client({
    baseUrl: ip,
    expectedProjectId: '26-rfid-attendance-system',
    pollIntervalMs: 1200,
    onData: (data) => {
      if (lastSeen) lastSeen.textContent = `Live Telemetry: ${new Date().toLocaleTimeString()}`;
      if (data.last_card_uid) {
        const found = RFIDSim.students.find(s => s.uid.toUpperCase() === data.last_card_uid.toUpperCase());
        if (found && !found.present) {
          found.present = true;
          found.checkInTime = new Date().toLocaleTimeString();
          renderAttendanceTable();
          updateStats();
          if (window.CommonUI) CommonUI.toast(`Hardware card scan: ${found.name}`, 'success');
        }
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
      if (window.CommonUI) CommonUI.toast('Connected to ESP8266 RFID Attendance Hub!', 'success');
      espClient.startPolling();
    }
  });
}
