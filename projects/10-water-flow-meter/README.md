# Project 06: Water Flow Meter

## 1. Project Overview
The **Water Flow Meter** measures instantaneous fluid velocity (L/min) and cumulative water volume consumption (Litres) using an inline YF-S201 Hall-effect turbine flow sensor. The interactive dashboard animates flowing fluid bubbles and turbine rotor rotation at speeds synchronized with the measurements.

## 2. Features
- **Hydrodynamic Pipe Visualizer:** Canvas animation showing fluid streams, bubbles, and spinning turbine blades.
- **Interrupt Pulse Counter:** Atomic pulse sampling ensuring zero lost cycles during Wi-Fi or REST transmissions.
- **Volumetric Tracking:** Cumulative volume meter with pulse-to-liter integration ($450\text{ pulses} \approx 1\text{ Liter}$).
- **CSV Logging:** Export flow rates and volumetric totals.

## 3. Calibration Instructions
To calibrate against a known volume:
1. Dispense exactly 1.00 Liter into a calibrated measuring container.
2. Note the total pulse count recorded on the dashboard.
3. Update `calibrationFactor = pulses / 60.0` in `config/config.js` and firmware.
