# Project 19 — Automatic Door Controller

## Purpose
Demonstration proximity-triggered door opener using HC-SR04 and a servo motor.
This is a demonstration project — not a certified safety system.

## Hardware
- ESP8266 NodeMCU
- HC-SR04 ultrasonic distance sensor
- SG90 or MG996R servo motor (with external 5V supply)
- Optional: micro-switch limit switches

## Features
- Animated door SVG (open/close state)
- Distance reading and configurable activation threshold
- Auto/manual modes
- Open-hold-close sequence simulation
- Obstruction detection (door held open if obstruction present)
- Door event history

## Safety Disclaimer
This project uses a small hobby servo for a physical model demonstration only.
It is NOT suitable for real automatic entrance doors without:
- Certified safety edges and sensors
- Emergency stop and manual release
- Compliance with local building and safety codes
