# Project 01: TERRASCAN X ELITE — Ultrasonic Radar

## Overview
**TERRASCAN X ELITE** is a professional ultrasonic radar instrument dashboard and ESP8266 firmware suite. It performs angular sweep tracking, obstacle detection, echo timing calculation, and collision threat analysis.

## Key Features
- **Radar Scope Display:** HTML5 Canvas rendering of 180° radial sweep, distance grid arcs (50cm to 200cm), azimuth angles, phosphor trail, and detected targets.
- **Simulation Engine:** Offline-capable simulation with realistic acoustic drift, obstacle scenarios (Clear Hallway, Approaching, Oscillating, Collision Threat), pause/resume, and speed multipliers.
- **ESP8266 REST API:** Native C++ firmware providing `/api/readings` and `/api/status` with non-blocking timing and CORS support.
- **Data Export:** Instant CSV export of distance and azimuth time-series.
- **Mobile-First Responsive Layout:** Clean single-column on mobile viewports (375px+), two-column engineering instrument panel on desktop.
