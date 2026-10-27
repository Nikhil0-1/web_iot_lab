# Project 04: ATMOS AI — Temperature & Humidity

## Overview
**ATMOS AI** is an atmospheric climate instrumentation dashboard with dual circular gauges, biometeorological calculations (Apparent Heat Index, Condensation Dew Point), ASHRAE comfort index classifications, and ESP8266 REST firmware.

## Key Features
- **Dual Radial Instrument Gauges:** High-DPI canvas meters for dry-bulb temperature and relative humidity with active glow arcs.
- **Biometeorology Math:** Real-time computation of Heat Index (Rothfusz equation) and Dew Point (Magnus-Tetens formula).
- **Unit Flexibility:** Instant live toggle between Celsius (°C) and Fahrenheit (°F).
- **Climate Scenarios:** Presets for Temperate Office, Tropical Nursery, Winter Freeze, and Arid Desert.
- **ESP8266 REST API:** Native C++ firmware with Adafruit DHT support, `/api/readings` and `/api/status` endpoints, and CORS headers.
- **Mobile-First Responsive Layout:** Clean single-column on mobile viewports (375px+), two-column engineering instrument panel on desktop.
