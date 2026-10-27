/**
 * TERRASCAN X ELITE — Radar Dashboard Controller
 * Canvas rendering, DOM updates, user interaction, and ESP8266 REST connectivity.
 */

document.addEventListener('DOMContentLoaded', () => {
  const sim = new TerrascanSimulation();
  let espClient = null;

  // DOM Elements
  const radarCanvas = document.getElementById('radarCanvas');
  const radarCtx = radarCanvas.getContext('2d');
  const historyCanvas = document.getElementById('historyCanvas');
  const historyCtx = historyCanvas.getContext('2d');

  const valDistance = document.getElementById('val-distance');
  const valAngle = document.getElementById('val-angle');
  const valEcho = document.getElementById('val-echo');
  const alertBanner = document.getElementById('radar-alert-banner');
  const alertText = document.getElementById('radar-alert-text');
  const statusPill = document.getElementById('sensor-health-pill');

  const sliderDistance = document.getElementById('slider-distance');
  const lblSliderDist = document.getElementById('lbl-slider-dist');
  const sliderThreshold = document.getElementById('slider-threshold');
  const lblSliderThresh = document.getElementById('lbl-slider-thresh');

  const btnPause = document.getElementById('btn-pause');
  const btnReset = document.getElementById('btn-reset');
  const btnExport = document.getElementById('btn-export-csv');

  const modeBtnSim = document.getElementById('mode-btn-sim');
  const modeBtnHw = document.getElementById('mode-btn-hw');
  const hwSection = document.getElementById('hw-connection-panel');
  const inputDeviceIp = document.getElementById('device-ip-input');
  const btnConnectHw = document.getElementById('btn-connect-hw');
  const hwStatusText = document.getElementById('hw-status-text');

  // Resize canvas for crisp Retina rendering
  function fitCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { w: rect.width, h: rect.height };
  }

  // Draw Radar Scope
  function drawRadar(state) {
    const { w, h } = fitCanvas(radarCanvas);
    radarCtx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h - 16;
    const maxRadius = Math.min(cx - 20, cy - 20);

    // 1. Radar background semi-circle
    radarCtx.save();
    radarCtx.beginPath();
    radarCtx.arc(cx, cy, maxRadius, Math.PI, 0, false);
    radarCtx.fillStyle = '#060a12';
    radarCtx.fill();
    radarCtx.lineWidth = 2;
    radarCtx.strokeStyle = 'rgba(0, 245, 155, 0.4)';
    radarCtx.stroke();
    radarCtx.restore();

    // 2. Concentric distance grid arcs (50cm, 100cm, 150cm, 200cm)
    const rings = [0.25, 0.5, 0.75, 1.0];
    const ringDistances = [50, 100, 150, 200];
    radarCtx.save();
    radarCtx.strokeStyle = 'rgba(0, 245, 155, 0.16)';
    radarCtx.lineWidth = 1;
    radarCtx.setLineDash([3, 4]);
    radarCtx.fillStyle = 'rgba(0, 245, 155, 0.65)';
    radarCtx.font = '10px Inter, sans-serif';
    radarCtx.textAlign = 'center';

    rings.forEach((f, idx) => {
      const r = maxRadius * f;
      radarCtx.beginPath();
      radarCtx.arc(cx, cy, r, Math.PI, 0, false);
      radarCtx.stroke();
      radarCtx.fillText(`${ringDistances[idx]} cm`, cx, cy - r + 12);
    });
    radarCtx.restore();

    // 3. Radial azimuth lines (0°, 30°, 60°, 90°, 120°, 150°, 180°)
    radarCtx.save();
    radarCtx.strokeStyle = 'rgba(0, 245, 155, 0.2)';
    radarCtx.lineWidth = 1;
    radarCtx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    radarCtx.font = '10px Inter, sans-serif';

    const angles = [0, 30, 60, 90, 120, 150, 180];
    angles.forEach(deg => {
      const rad = (180 - deg) * (Math.PI / 180);
      const x = cx + Math.cos(rad) * maxRadius;
      const y = cy - Math.sin(rad) * maxRadius;

      radarCtx.beginPath();
      radarCtx.moveTo(cx, cy);
      radarCtx.lineTo(x, y);
      radarCtx.stroke();

      const labelDist = maxRadius + 14;
      const lx = cx + Math.cos(rad) * labelDist;
      const ly = cy - Math.sin(rad) * labelDist;
      radarCtx.textAlign = deg === 90 ? 'center' : (deg < 90 ? 'left' : 'right');
      radarCtx.fillText(`${deg}°`, lx, ly);
    });
    radarCtx.restore();

    // 4. Threshold safety arc (warning border)
    const threshFraction = Math.min(1.0, state.threshold / 200);
    const threshR = maxRadius * threshFraction;
    radarCtx.save();
    radarCtx.beginPath();
    radarCtx.arc(cx, cy, threshR, Math.PI, 0, false);
    radarCtx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
    radarCtx.lineWidth = 2;
    radarCtx.setLineDash([4, 4]);
    radarCtx.stroke();
    radarCtx.restore();

    // 5. Radar sweep beam & phosphor trail
    const sweepRad = (180 - state.angle) * (Math.PI / 180);
    const sweepTrailAngle = 0.22; // trail width in radians

    radarCtx.save();
    const beamGrad = radarCtx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
    beamGrad.addColorStop(0, 'rgba(0, 245, 155, 0.5)');
    beamGrad.addColorStop(1, 'rgba(0, 245, 155, 0.05)');

    radarCtx.beginPath();
    radarCtx.moveTo(cx, cy);
    const trailStart = sweepRad + (sim.sweepDirection > 0 ? sweepTrailAngle : -sweepTrailAngle);
    radarCtx.arc(cx, cy, maxRadius, sweepRad, trailStart, sim.sweepDirection > 0);
    radarCtx.closePath();
    radarCtx.fillStyle = beamGrad;
    radarCtx.fill();

    // Sharp sweep line
    radarCtx.beginPath();
    radarCtx.moveTo(cx, cy);
    radarCtx.lineTo(cx + Math.cos(sweepRad) * maxRadius, cy - Math.sin(sweepRad) * maxRadius);
    radarCtx.strokeStyle = '#00f59b';
    radarCtx.lineWidth = 2;
    radarCtx.shadowColor = '#00f59b';
    radarCtx.shadowBlur = 8;
    radarCtx.stroke();
    radarCtx.restore();

    // 6. Draw Targets & Detected Obstacle
    if (state.distance <= 200) {
      const distFrac = state.distance / 200;
      const targetR = maxRadius * distFrac;
      const targetAngleRad = (180 - state.angle) * (Math.PI / 180);
      const tx = cx + Math.cos(targetAngleRad) * targetR;
      const ty = cy - Math.sin(targetAngleRad) * targetR;

      radarCtx.save();
      const isDanger = state.distance <= 15;
      const isWarn = state.distance <= state.threshold;
      const blipColor = isDanger ? '#ef4444' : (isWarn ? '#f59e0b' : '#00f59b');

      // Glowing blip
      radarCtx.beginPath();
      radarCtx.arc(tx, ty, isDanger ? 8 : 6, 0, Math.PI * 2);
      radarCtx.fillStyle = blipColor;
      radarCtx.shadowColor = blipColor;
      radarCtx.shadowBlur = 12;
      radarCtx.fill();

      // Blip pulse ring
      radarCtx.beginPath();
      radarCtx.arc(tx, ty, 14, 0, Math.PI * 2);
      radarCtx.strokeStyle = blipColor;
      radarCtx.lineWidth = 1.5;
      radarCtx.globalAlpha = 0.5;
      radarCtx.stroke();

      // Text label next to blip
      radarCtx.font = '10px Inter, sans-serif';
      radarCtx.fillStyle = '#ffffff';
      radarCtx.fillText(`${state.distance}cm`, tx + 10, ty - 6);
      radarCtx.restore();
    }
  }

  // Draw History Line Chart
  function drawHistory(history, threshold) {
    const { w, h } = fitCanvas(historyCanvas);
    historyCtx.clearRect(0, 0, w, h);

    if (history.length < 2) return;

    const padLeft = 40;
    const padBottom = 24;
    const padTop = 10;
    const chartW = w - padLeft - 16;
    const chartH = h - padBottom - padTop;
    const maxDist = 200;

    // Grid lines
    historyCtx.save();
    historyCtx.strokeStyle = '#e2e8f0';
    historyCtx.lineWidth = 1;
    historyCtx.fillStyle = '#94a3b8';
    historyCtx.font = '9px Inter, sans-serif';

    [0, 50, 100, 150, 200].forEach(d => {
      const y = padTop + chartH - (d / maxDist) * chartH;
      historyCtx.beginPath();
      historyCtx.moveTo(padLeft, y);
      historyCtx.lineTo(w - 16, y);
      historyCtx.stroke();
      historyCtx.fillText(`${d}cm`, 8, y + 3);
    });

    // Threshold line
    const threshY = padTop + chartH - (threshold / maxDist) * chartH;
    historyCtx.strokeStyle = '#f59e0b';
    historyCtx.setLineDash([4, 3]);
    historyCtx.beginPath();
    historyCtx.moveTo(padLeft, threshY);
    historyCtx.lineTo(w - 16, threshY);
    historyCtx.stroke();
    historyCtx.setLineDash([]);
    historyCtx.restore();

    // Data line
    historyCtx.save();
    historyCtx.beginPath();
    history.forEach((pt, i) => {
      const x = padLeft + (i / (history.length - 1)) * chartW;
      const clampedDist = Math.min(maxDist, pt.distance);
      const y = padTop + chartH - (clampedDist / maxDist) * chartH;
      if (i === 0) historyCtx.moveTo(x, y);
      else historyCtx.lineTo(x, y);
    });

    historyCtx.strokeStyle = '#0284c7';
    historyCtx.lineWidth = 2.2;
    historyCtx.stroke();

    // Fill gradient
    const lastX = padLeft + chartW;
    const firstX = padLeft;
    historyCtx.lineTo(lastX, padTop + chartH);
    historyCtx.lineTo(firstX, padTop + chartH);
    historyCtx.closePath();
    const grad = historyCtx.createLinearGradient(0, padTop, 0, padTop + chartH);
    grad.addColorStop(0, 'rgba(2, 132, 199, 0.25)');
    grad.addColorStop(1, 'rgba(2, 132, 199, 0.0)');
    historyCtx.fillStyle = grad;
    historyCtx.fill();
    historyCtx.restore();
  }

  // UI Event Bindings
  sim.onUpdate((state) => {
    valDistance.textContent = state.distance.toFixed(1);
    valAngle.textContent = state.angle;
    valEcho.textContent = state.echoUs;

    alertBanner.className = `radar-alert-banner ${state.statusClass}`;
    alertText.textContent = state.status;

    drawRadar(state);
    drawHistory(state.history, state.threshold);
  });

  // Animation Loop
  let lastTime = performance.now();
  function loop(now) {
    const delta = now - lastTime;
    lastTime = now;
    sim.update(delta);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Scenario Buttons
  document.querySelectorAll('.scenario-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const sc = e.target.getAttribute('data-scenario');
      sim.setScenario(sc);
    });
  });

  // Slider adjustments
  sliderDistance.addEventListener('input', (e) => {
    lblSliderDist.textContent = `${e.target.value} cm`;
    sim.setManualDistance(e.target.value);
  });

  sliderThreshold.addEventListener('input', (e) => {
    lblSliderThresh.textContent = `${e.target.value} cm`;
    sim.setThreshold(e.target.value);
  });

  // Playback actions
  btnPause.addEventListener('click', () => {
    const paused = sim.togglePause();
    btnPause.innerHTML = paused
      ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Resume'
      : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> Pause';
  });

  btnReset.addEventListener('click', () => {
    sim.reset();
    sliderDistance.value = 120;
    lblSliderDist.textContent = '120 cm';
  });

  // Mode toggles
  modeBtnSim.addEventListener('click', () => {
    sim.mode = 'sim';
    modeBtnSim.classList.add('active');
    modeBtnHw.classList.remove('active');
    hwSection.style.display = 'none';
    statusPill.className = 'status-pill status-ok';
    statusPill.innerHTML = '<span class="pulse-dot"></span><span>Simulating</span>';
  });

  modeBtnHw.addEventListener('click', () => {
    sim.mode = 'hw';
    modeBtnHw.classList.add('active');
    modeBtnSim.classList.remove('active');
    hwSection.style.display = 'block';
    statusPill.className = 'status-pill status-warn';
    statusPill.innerHTML = '<span class="pulse-dot"></span><span>Hardware Standby</span>';
  });

  // Hardware Connection with ESP8266Client
  btnConnectHw.addEventListener('click', () => {
    const ip = inputDeviceIp.value.trim();
    if (!ip) {
      alert('Please enter a valid ESP8266 IP address (e.g. 192.168.1.50)');
      return;
    }

    if (!espClient) {
      espClient = new ESP8266Client({
        baseUrl: ip,
        expectedProjectId: 'terrascan-x-elite',
        pollIntervalMs: 800,
        onData: (data) => {
          sim.applyHardwareReading(data);
          statusPill.className = 'status-pill status-ok';
          statusPill.innerHTML = '<span class="pulse-dot"></span><span>HW Connected</span>';
          hwStatusText.textContent = `Streaming data from ${ip}`;
        },
        onStateChange: (st) => {
          if (st === 'CONNECTING') {
            statusPill.className = 'status-pill status-warn';
            statusPill.innerHTML = '<span class="pulse-dot"></span><span>Connecting...</span>';
          } else if (st === 'DISCONNECTED' || st === 'ERROR') {
            statusPill.className = 'status-pill status-danger';
            statusPill.innerHTML = '<span class="pulse-dot"></span><span>HW Error</span>';
          }
        },
        onError: (err) => {
          hwStatusText.textContent = `Error: ${err.message}`;
        }
      });
      espClient.startPolling('/api/readings');
      btnConnectHw.textContent = 'Disconnect';
    } else {
      espClient.stopPolling();
      espClient = null;
      btnConnectHw.textContent = 'Connect Device';
      hwStatusText.textContent = 'Disconnected';
      statusPill.className = 'status-pill status-warn';
      statusPill.innerHTML = '<span class="pulse-dot"></span><span>Hardware Standby</span>';
    }
  });

  // CSV Export
  btnExport.addEventListener('click', () => {
    if (sim.history.length === 0) {
      alert('No history data recorded yet.');
      return;
    }
    let csv = 'Timestamp,Distance_cm,Angle_deg\n';
    sim.history.forEach(row => {
      csv += `"${row.time}",${row.distance},${row.angle}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terrascan_radar_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });
});
