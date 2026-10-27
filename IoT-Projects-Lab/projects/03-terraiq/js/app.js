/**
 * TerraIQ — Dashboard Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const sim = new TerraIQSimulation();
  let espClient = null;

  // DOM Elements
  const soilMoistureLevel = document.getElementById('soilMoistureLevel');
  const historyCanvas = document.getElementById('historyCanvas');
  const historyCtx = historyCanvas.getContext('2d');

  const valMoisture = document.getElementById('val-moisture');
  const valAdc = document.getElementById('val-adc');
  const valVoltage = document.getElementById('val-voltage');
  const hydrationPill = document.getElementById('hydration-pill');
  const statusPill = document.getElementById('sensor-health-pill');

  const sliderMoisture = document.getElementById('slider-moisture');
  const lblSliderMoisture = document.getElementById('lbl-slider-moisture');
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

    // Alert threshold line
    const threshY = padTop + chartH - (threshold / 100) * chartH;
    historyCtx.strokeStyle = '#d97706';
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
      const y = padTop + chartH - (pt.moisture / 100) * chartH;
      if (i === 0) historyCtx.moveTo(x, y);
      else historyCtx.lineTo(x, y);
    });

    historyCtx.strokeStyle = '#059669';
    historyCtx.lineWidth = 2.2;
    historyCtx.stroke();

    // Gradient fill
    historyCtx.lineTo(padLeft + chartW, padTop + chartH);
    historyCtx.lineTo(padLeft, padTop + chartH);
    historyCtx.closePath();
    const grad = historyCtx.createLinearGradient(0, padTop, 0, padTop + chartH);
    grad.addColorStop(0, 'rgba(5, 150, 105, 0.25)');
    grad.addColorStop(1, 'rgba(5, 150, 105, 0.0)');
    historyCtx.fillStyle = grad;
    historyCtx.fill();
    historyCtx.restore();
  }

  // Update UI bindings
  sim.onUpdate((state) => {
    valMoisture.textContent = state.moisture.toFixed(1);
    valAdc.textContent = state.rawAdc;
    valVoltage.textContent = state.voltage.toFixed(2);

    soilMoistureLevel.style.height = `${state.moisture}%`;
    if (state.statusClass === 'arid') {
      soilMoistureLevel.style.background = 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)';
    } else if (state.statusClass === 'saturated') {
      soilMoistureLevel.style.background = 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)';
    } else {
      soilMoistureLevel.style.background = 'linear-gradient(180deg, #10b981 0%, #059669 100%)';
    }

    hydrationPill.className = `hydration-pill ${state.statusClass}`;
    hydrationPill.textContent = state.status;

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

  // Scenarios
  document.querySelectorAll('.scenario-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const sc = e.target.getAttribute('data-scenario');
      sim.setScenario(sc);
    });
  });

  // Sliders
  sliderMoisture.addEventListener('input', (e) => {
    lblSliderMoisture.textContent = `${e.target.value}%`;
    sim.setManualMoisture(e.target.value);
  });

  sliderThreshold.addEventListener('input', (e) => {
    lblSliderThresh.textContent = `${e.target.value}%`;
    sim.setThreshold(e.target.value);
  });

  // Controls
  btnPause.addEventListener('click', () => {
    const paused = sim.togglePause();
    btnPause.innerHTML = paused ? 'Resume' : 'Pause';
  });

  btnReset.addEventListener('click', () => {
    sim.reset();
    sliderMoisture.value = 52;
    lblSliderMoisture.textContent = '52%';
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
        expectedProjectId: 'terraiq',
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
    let csv = 'Timestamp,Moisture_Pct,Raw_ADC\n';
    sim.history.forEach(r => csv += `"${r.time}",${r.moisture},${r.adc}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terraiq_soil_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });
});
