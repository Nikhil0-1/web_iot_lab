/**
 * RAINWATCH AI — Dashboard Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const sim = new RainwatchSimulation();
  let espClient = null;

  // DOM Elements
  const rainCanvas = document.getElementById('rainCanvas');
  const rainCtx = rainCanvas.getContext('2d');
  const historyCanvas = document.getElementById('historyCanvas');
  const historyCtx = historyCanvas.getContext('2d');

  const valIntensity = document.getElementById('val-intensity');
  const valAdc = document.getElementById('val-adc');
  const valRate = document.getElementById('val-rate');
  const valAccum = document.getElementById('val-accum');
  const alertBanner = document.getElementById('rain-alert-banner');
  const alertText = document.getElementById('rain-alert-text');
  const statusPill = document.getElementById('sensor-health-pill');

  const sliderIntensity = document.getElementById('slider-intensity');
  const lblSliderIntensity = document.getElementById('lbl-slider-intensity');
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

  function fitCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { w: rect.width, h: rect.height };
  }

  // Draw Rain Animation
  function drawRainScene(state) {
    const { w, h } = fitCanvas(rainCanvas);
    rainCtx.clearRect(0, 0, w, h);

    // Weather sky background
    const skyGrad = rainCtx.createLinearGradient(0, 0, 0, h);
    if (state.intensity > 60) {
      skyGrad.addColorStop(0, '#090d16');
      skyGrad.addColorStop(1, '#1e293b');
    } else if (state.intensity > 15) {
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(1, '#334155');
    } else {
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(1, '#38bdf8');
    }
    rainCtx.fillStyle = skyGrad;
    rainCtx.fillRect(0, 0, w, h);

    // Ground / Water Surface
    const groundY = h - 24;
    rainCtx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    rainCtx.fillRect(0, groundY, w, 24);

    // Rain Streaks
    const activeDropCount = Math.floor((state.intensity / 100) * state.drops.length);
    rainCtx.strokeStyle = 'rgba(186, 230, 253, 0.7)';
    rainCtx.lineWidth = 1.6;
    rainCtx.lineCap = 'round';

    for (let i = 0; i < activeDropCount; i++) {
      const d = state.drops[i];
      const scaleX = w / 600;
      const scaleY = h / 400;
      const dx = d.x * scaleX;
      const dy = d.y * scaleY;

      rainCtx.beginPath();
      rainCtx.moveTo(dx, dy);
      rainCtx.lineTo(dx + 2, dy + d.l);
      rainCtx.stroke();
    }

    // Splash Ripples
    state.ripples.forEach(r => {
      const scaleX = w / 600;
      const scaleY = h / 400;
      rainCtx.save();
      rainCtx.beginPath();
      rainCtx.ellipse(r.x * scaleX, r.y * scaleY, r.r * 2, r.r, 0, 0, Math.PI * 2);
      rainCtx.strokeStyle = `rgba(186, 230, 253, ${r.o})`;
      rainCtx.lineWidth = 1.2;
      rainCtx.stroke();
      rainCtx.restore();
    });

    // Cloud Overcast Indicator
    if (state.intensity > 5) {
      rainCtx.fillStyle = `rgba(15, 23, 42, ${Math.min(0.75, state.intensity / 120)})`;
      rainCtx.fillRect(0, 0, w, 40);
    }
  }

  // Draw History Chart
  function drawHistory(history, threshold) {
    const { w, h } = fitCanvas(historyCanvas);
    historyCtx.clearRect(0, 0, w, h);

    if (history.length < 2) return;

    const padLeft = 36;
    const padBottom = 22;
    const padTop = 10;
    const chartW = w - padLeft - 16;
    const chartH = h - padBottom - padTop;

    // Grid lines
    historyCtx.save();
    historyCtx.strokeStyle = '#e2e8f0';
    historyCtx.lineWidth = 1;
    historyCtx.fillStyle = '#94a3b8';
    historyCtx.font = '9px Inter, sans-serif';

    [0, 25, 50, 75, 100].forEach(p => {
      const y = padTop + chartH - (p / 100) * chartH;
      historyCtx.beginPath();
      historyCtx.moveTo(padLeft, y);
      historyCtx.lineTo(w - 16, y);
      historyCtx.stroke();
      historyCtx.fillText(`${p}%`, 6, y + 3);
    });

    // Threshold line
    const threshY = padTop + chartH - (threshold / 100) * chartH;
    historyCtx.strokeStyle = '#ef4444';
    historyCtx.setLineDash([4, 3]);
    historyCtx.beginPath();
    historyCtx.moveTo(padLeft, threshY);
    historyCtx.lineTo(w - 16, threshY);
    historyCtx.stroke();
    historyCtx.setLineDash([]);
    historyCtx.restore();

    // Data Line
    historyCtx.save();
    historyCtx.beginPath();
    history.forEach((pt, i) => {
      const x = padLeft + (i / (history.length - 1)) * chartW;
      const y = padTop + chartH - (pt.intensity / 100) * chartH;
      if (i === 0) historyCtx.moveTo(x, y);
      else historyCtx.lineTo(x, y);
    });

    historyCtx.strokeStyle = '#0284c7';
    historyCtx.lineWidth = 2.2;
    historyCtx.stroke();

    // Gradient fill
    historyCtx.lineTo(padLeft + chartW, padTop + chartH);
    historyCtx.lineTo(padLeft, padTop + chartH);
    historyCtx.closePath();
    const grad = historyCtx.createLinearGradient(0, padTop, 0, padTop + chartH);
    grad.addColorStop(0, 'rgba(2, 132, 199, 0.25)');
    grad.addColorStop(1, 'rgba(2, 132, 199, 0.0)');
    historyCtx.fillStyle = grad;
    historyCtx.fill();
    historyCtx.restore();
  }

  // Update Bindings
  sim.onUpdate((state) => {
    valIntensity.textContent = state.intensity.toFixed(1);
    valAdc.textContent = state.adcRaw;
    valRate.textContent = state.rainRate.toFixed(1);
    if (valAccum) valAccum.textContent = state.accumulation.toFixed(2);

    alertBanner.className = `rain-alert-banner ${state.statusClass}`;
    alertText.textContent = state.status;

    drawRainScene(state);
    drawHistory(state.history, state.threshold);
  });

  // Loop
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

  // Sliders
  sliderIntensity.addEventListener('input', (e) => {
    lblSliderIntensity.textContent = `${e.target.value}%`;
    sim.setManualIntensity(e.target.value);
  });

  sliderThreshold.addEventListener('input', (e) => {
    lblSliderThresh.textContent = `${e.target.value}%`;
    sim.setThreshold(e.target.value);
  });

  // Playback
  btnPause.addEventListener('click', () => {
    const paused = sim.togglePause();
    btnPause.innerHTML = paused ? 'Resume' : 'Pause';
  });

  btnReset.addEventListener('click', () => {
    sim.reset();
    sliderIntensity.value = 58;
    lblSliderIntensity.textContent = '58%';
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

  // Connect
  btnConnectHw.addEventListener('click', () => {
    const ip = inputDeviceIp.value.trim();
    if (!ip) {
      alert('Enter a valid ESP8266 IP');
      return;
    }
    if (!espClient) {
      espClient = new ESP8266Client({
        baseUrl: ip,
        expectedProjectId: 'rainwatch-ai',
        pollIntervalMs: 1000,
        onData: (data) => {
          sim.applyHardwareReading(data);
          statusPill.className = 'status-pill status-ok';
          statusPill.innerHTML = '<span class="pulse-dot"></span><span>HW Connected</span>';
          hwStatusText.textContent = `Streaming from ${ip}`;
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
      btnConnectHw.textContent = 'Connect';
      hwStatusText.textContent = 'Disconnected';
    }
  });

  // CSV
  btnExport.addEventListener('click', () => {
    if (sim.history.length === 0) return;
    let csv = 'Timestamp,Intensity_Pct,Rate_mmh\n';
    sim.history.forEach(r => csv += `"${r.time}",${r.intensity},${r.rate}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rainwatch_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });
});
