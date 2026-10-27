# Project 02: RAINWATCH AI — Rain Detection

## Overview
**RAINWATCH AI** is an intelligent precipitation detection and rainfall rate monitoring dashboard with native ESP8266 firmware integration.

## Key Features
- **Dynamic Weather Simulation:** HTML5 Canvas animation with rainfall particles, angle drift, and splash ripples responsive to simulated precipitation intensity.
- **Dual Sensing Metrics:** Simultaneous monitoring of calibrated precipitation intensity (0–100%), rainfall accumulation rate (mm/h), and raw ADC levels.
- **Scenario Presets:** Instant simulation of Sunny & Dry, Morning Dew, Passing Shower, and Monsoon Storm conditions.
- **ESP8266 REST API:** Native C++ firmware providing `/api/readings` and `/api/status` with non-blocking timing and CORS support.
- **Mobile-First Responsive Layout:** Clean single-column on mobile viewports (375px+), two-column engineering instrument panel on desktop.
