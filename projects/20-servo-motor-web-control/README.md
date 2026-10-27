# Project 20 — Servo Motor Web Control

## Purpose
Control a hobby servo position 0-180° from a web dashboard with animated arm visualization.

## Hardware
- ESP8266 NodeMCU
- SG90 or compatible hobby servo
- External 5V servo power supply

## Features
- Large angle indicator display
- Position slider (0-180°)
- Preset position buttons (0°, 45°, 90°, 135°, 180°)
- Animated SVG servo arm
- Movement history log
- Smooth animation with configurable speed

## Notes
- Do NOT power servo from ESP8266 3.3V pin — servo stall current exceeds GPIO capability
- Use separate 5V supply; share GND with ESP8266
- Validate all angle inputs in firmware (clamp 0-180)
