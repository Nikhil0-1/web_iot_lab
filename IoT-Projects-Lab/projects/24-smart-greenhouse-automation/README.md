# Project 24 — Smart Greenhouse Automation

## Purpose
Coordinated environmental monitoring and low-voltage automation demonstrating
temperature/humidity sensing, soil moisture, ambient light measurement,
and automatic fan + pump control.

## Hardware
- ESP8266 NodeMCU
- DHT22 temperature/humidity sensor
- Capacitive soil moisture sensor
- LDR (light sensor, 10kΩ divider)
- DC fan via MOSFET driver
- DC pump via relay
- Optional: water level sensor

## Features
- Greenhouse visualization with animated environment
- Temperature, humidity, soil moisture, light level
- Automated fan (temperature/humidity control)
- Automated irrigation (soil moisture)
- Configurable thresholds with hysteresis
- Environmental history charts
- Automation event log
- Water tank empty protection

## Notes
- ESP8266 has only 1 ADC. Use multiplexer (CD4051) or prioritize sensors for hardware mode.
- Simulation uses independent virtual sensors — all controllable via sliders.
