# Project 03: TerraIQ — Soil Moisture Monitor

## Overview
**TerraIQ** is an agricultural soil moisture monitoring system with interactive stratum column visualizer, dry/saturated threshold alerting, capacitive probe calibration, and ESP8266 REST firmware.

## Key Features
- **Soil Hydration Column:** Live visual cross-section of subterranean moisture depth and saturation status.
- **Capacitive Calibration:** Support for Air dry (0%) vs Submerged in water (100%) ADC calibration curves.
- **Scenario Presets:** Simulation of Parched/Arid, Optimal Nursery, Saturated Bog, and Evaporation cycles.
- **ESP8266 REST API:** Native C++ firmware providing `/api/readings` and `/api/status` with non-blocking timing and CORS support.
- **Mobile-First Responsive Layout:** Clean single-column on mobile viewports (375px+), two-column engineering instrument panel on desktop.
