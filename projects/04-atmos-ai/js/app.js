/**
 * ATMOS AI — Dashboard Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const sim = new AtmosSimulation();
  let espClient = null;

  // DOM Elements
  const canvasTemp = document.getElementById('gaugeCanvasTemp');
  const ctxTemp = canvasTemp.getContext('2d');
  const canvasHumid = document.getElementById('gaugeCanvasHumid');
  const ctxHumid = canvasHumid.getContext('2d');
  const historyCanvas = document.getElementById('historyCanvas');
  const historyCtx = historyCanvas.getContext('2d');

  const valTemp = document.getElementById('val-temp');
  const valTempUnit = document.getElementById('val-temp-unit');
  const valHumid = document.getElementById('val-humid');
  const valHeatIndex = document.getElementById('val-heat-index');
  const valDewPoint = document.getElementById('val-dew-point');
  const comfortBanner = document.getElementById('comfort-banner');
  const comfortText = document.getElementById('comfort-text');
  const statusPill = document.getElementById('sensor-health-pill');
  const btnToggleUnit = document.getElementById('btn-toggle-unit');

  const sliderTemp = document.getElementById('slider-temp');
  const lblSliderTemp = document.getElementById('lbl-slider-temp');
  const sliderHumid = document.getElementById('slider-humid');
  const lblSliderHumid = document.getElementById('lbl-slider-humid');

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

  // Draw Circular Radial Gauge
  function drawGauge(canvas, ctx, fraction, color, trackColor = 'rgba(255, 255, 255, 0.1)') {
    const { w, h } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(cx, cy) - 10;
    const startAngle = 0.75 * Math.PI;
    const totalSweep = 1.5 * Math.PI;

    // Track arc
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, startAngle + totalSweep);
    ctx.strokeStyle = trackColor;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Value active arc
    const clampedFrac = Math.max(0, Math.min(1.0, fraction));
    const activeSweep = totalSweep * clampedFrac;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, startAngle + activeSweep);
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();
  }

  // Draw Dual Series History Chart
  function drawHistory(history) {
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
      historyCtx.fillText(`${p}`, 10, y + 3);
    });

    // 1. Humidity Series (Cyan)
    historyCtx.strokeStyle = '#0284c7';
    historyCtx.lineWidth = 2;
    historyCtx.beginPath();
    history.forEach((pt, i) => {
      const x = padLeft + (i / (history.length - 1)) * chartW;
      const y = padTop + chartH - (pt.humidity / 100) * chartH;
      if (i === 0) historyCtx.moveTo(x, y);
      else historyCtx.lineTo(x, y);
    });
    historyCtx.stroke();

    // 2. Temp Series (Orange: Scale -10°C to 50°C -> 0 to 100%)
    historyCtx.strokeStyle = '#f97316';
    historyCtx.lineWidth = 2;
    historyCtx.beginPath();
    history.forEach((pt, i) => {
      const x = padLeft + (i / (history.length - 1)) * chartW;
      const frac = (pt.temp - (-10)) / 60; // normalized
      const y = padTop + chartH - frac * chartH;
      if (i === 0) historyCtx.moveTo(x, y);
      else historyCtx.lineTo(x, y);
    });
    historyCtx.stroke();
    historyCtx.restore();
  }

  // Update UI bindings
  sim.onUpdate((state) => {
    valTemp.textContent = state.temp.toFixed(1);
    valTempUnit.textContent = `°${state.unit}`;
    valHumid.textContent = state.humidity.toFixed(1);
    valHeatIndex.textContent = `${state.heatIndex}°${state.unit}`;
    valDewPoint.textContent = `${state.dewPoint}°${state.unit}`;

    comfortBanner.className = `comfort-banner ${state.comfortClass}`;
    comfortText.textContent = state.comfort;

    // Draw Gauges
    // Temp gauge: range -10 to 50°C
    const tempFrac = (state.tempC - (-10)) / 60;
    drawGauge(canvasTemp, ctxTemp, tempFrac, '#f97316');

    // Humid gauge: range 0 to 100%
    const humidFrac = state.humidity / 100;
    drawGauge(canvasHumid, ctxHumid, humidFrac, '#0284c7');

    drawHistory(state.history);
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
  sliderTemp.addEventListener('input', (e) => {
    lblSliderTemp.textContent = `${e.target.value}°C`;
    sim.setManualTemp(e.target.value);
  });

  sliderHumid.addEventListener('input', (e) => {
    lblSliderHumid.textContent = `${e.target.value}%`;
    sim.setManualHumidity(e.target.value);
  });

  // Unit Toggle
  btnToggleUnit.addEventListener('click', () => {
    const u = sim.toggleUnit();
    btnToggleUnit.textContent = `Switch to °${u === 'C' ? 'F' : 'C'}`;
  });

  // Playback
  btnPause.addEventListener('click', () => {
    const paused = sim.togglePause();
    btnPause.innerHTML = paused ? 'Resume' : 'Pause';
  });

  btnReset.addEventListener('click', () => {
    sim.reset();
    sliderTemp.value = 23.5;
    sliderHumid.value = 48;
    lblSliderTemp.textContent = '23.5°C';
    lblSliderHumid.textContent = '48%';
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
        expectedProjectId: 'atmos-ai',
        pollIntervalMs: 2000,
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
    let csv = 'Timestamp,Temperature_C,Humidity_Pct\n';
    sim.history.forEach(r => csv += `"${r.time}",${r.temp},${r.humidity}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atmos_climate_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });
});
