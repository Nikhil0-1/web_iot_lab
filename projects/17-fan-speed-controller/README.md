# Project 17 — Fan Speed Controller

## Purpose
Control a compatible DC fan speed via PWM using a MOSFET driver, with optional
tachometer feedback and temperature-triggered automation.

## Hardware
- ESP8266 NodeMCU
- N-Ch MOSFET (IRLZ44N or equivalent) — PWM fan driver
- DC fan (5V or 12V with external supply)
- Optional: DS18B20 or NTC thermistor for temperature
- Optional: Fan tach signal → GPIO interrupt

## Features
- Animated fan blade SVG (speed-reactive)
- Speed control slider (0-100%)
- Speed presets (Off/Low/Medium/High/Max)
- Simulated RPM (labeled as estimated)
- Spin-up and spin-down inertia model
- Speed history chart

## Safety
- Never drive fan directly from GPIO (max ~12mA)
- Use appropriate MOSFET with gate resistor
- External supply rated for fan voltage/current
