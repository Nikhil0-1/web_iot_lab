# Project 13 — Automatic Plant Watering

## Purpose
Monitor soil moisture and automatically control a small irrigation pump. Supports configurable thresholds, hysteresis, manual override and watering history.

## Features
- Animated plant visualization reacting to moisture level
- Semicircular moisture gauge
- Auto/manual pump modes
- Configurable moisture threshold and watering duration
- Hysteresis to prevent repeated cycling
- Cooldown timer between watering events
- Real-time moisture trend chart
- Watering event log with timestamps
- ESP8266 REST API in hardware mode
- Mobile-first responsive layout

## Simulation Scenarios
- Drag **Soil Moisture** slider to set target moisture — model dries slowly over time
- Lower **Threshold** to force earlier watering
- Switch to **Manual** mode and use the **Pump Toggle** for direct control
- Increase **Simulation Speed** to 5× to observe full cycles quickly
- Watch the plant illustration respond (green/healthy vs wilted)

## Hardware Mode
1. Flash `firmware/plant_watering.ino` to your NodeMCU
2. Set your Wi-Fi SSID and password in the firmware
3. Note the IP address shown on Serial Monitor
4. Open the dashboard, click **Hardware** mode
5. Enter the device IP and click **Connect**

## Required Software
- Arduino IDE 2.x with ESP8266 Arduino Core 3.x
- ArduinoJson library v6+ (Library Manager)

## How to Open the Dashboard
Serve from a local HTTP server to avoid CORS issues:
```bash
cd IoT-Projects-Lab
python -m http.server 8000
```
Then open: `http://localhost:8000/projects/13-automatic-plant-watering/`

## Known Limitations
- ADC calibration values (DRY_ADC / WET_ADC) must be adjusted for your specific sensor
- ESP8266 has a single ADC pin; only one analog sensor at a time
- Pump relay and pump supply must be appropriately rated for the pump motor
- Simulation moisture model is illustrative, not a physical soil model
