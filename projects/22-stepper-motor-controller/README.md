# Project 22 — Stepper Motor Controller

## Purpose
Control stepper motor position and speed via a driver (A4988/DRV8825) from a web dashboard.

## Hardware
- ESP8266 NodeMCU
- A4988 or DRV8825 stepper driver
- NEMA 17 or 28BYJ-48 stepper motor
- External 12V supply for NEMA17 (or 5V for 28BYJ)
- Optional: limit switches

## Features
- Target and current position display
- Step count and direction
- Move to position / relative move / stop
- Speed adjustment
- Limit switch status (simulated)
- Position history

## Notes
- Position tracking is based on commanded steps only (no feedback encoder)
- Physical position is approximate without homing or limit switches
