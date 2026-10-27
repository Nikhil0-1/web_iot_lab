# Project 14 — Smart Water Tank Controller

## Purpose
Monitor overhead or underground water tank level and automatically control water pump filling based on configurable low and high hysteresis thresholds. Features dry-run protection, overflow prevention, and manual override.

## Features
- Real-time animated SVG water tank visualization with dynamic fluid wave
- Fill percentage (0–100%), water volume (Liters), and air gap distance (cm)
- Configurable start (low) and stop (high) hysteresis thresholds with validation
- Automatic and manual pump control with safety runtime cutoff
- Live water-level trend chart and historical pump activation log
- Sensor failure / timeout handling and dry-run safety alerts
- Dual operating modes: Interactive Simulation and Real ESP8266 REST API

## Simulation Scenarios
- **Fill Slider**: Drag water level to test automatic threshold detection.
- **Auto Mode Test**: When water level falls below the low threshold, pump turns ON and fills to the high threshold.
- **Manual Mode**: Directly toggle the pump regardless of current level.
- **Threshold Tuning**: Adjust low and high thresholds with real-time range guardrails.
- **Scenarios**: Quick presets for Empty (10%), Half (50%), and Full (90%) tank conditions.

## Hardware Setup
- **Microcontroller**: NodeMCU ESP8266 (ESP-12E)
- **Sensor**: HC-SR04 Ultrasonic Distance Sensor mounted on tank ceiling
- **Actuator**: 5V Active-LOW Relay Module driving pump contactor
- **Power**: External dedicated power supply for water pump (never draw pump power from ESP8266 GPIO)

## REST API Endpoints (ESP8266)
- `GET /api/status` — Returns JSON with `project: "water-tank"`, `fill`, `volume`, `distance`, `pump`, `auto`, `lowThresh`, `highThresh`
- `POST /api/pump` — Payload `{"state": true|false}` (manual override)
- `POST /api/mode` — Payload `{"auto": true|false}`
- `POST /api/thresholds` — Payload `{"low": 20, "high": 85}`

## Known Limitations
- The HC-SR04 ultrasonic sensor requires a minimum blind distance of ~2–3 cm from the transducer.
- In enclosed tanks with high humidity or condensation, waterproof ultrasonic transducers (such as JSN-SR04T) are strongly recommended over bare HC-SR04 modules.
