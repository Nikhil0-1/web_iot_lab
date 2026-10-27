# Project 16 — Wi-Fi Home Automation

## Purpose
Control multiple low-voltage demonstration loads (LEDs/small appliances) over Wi-Fi
using a multi-channel relay board. Room-grouped interface with automation history.

## Features
- 4 independently controlled relay channels
- Room grouping (Living, Bedroom, Kitchen, Bathroom)
- All-on / all-off buttons
- Device availability indication
- Action history log with timestamps
- Animated state transitions
- Manual + optional timed auto-off

## Security Notice
This project is for local-network demonstration ONLY.
Do NOT expose relay control endpoints to the internet without:
- Strong authentication (at minimum HTTP Basic Auth over HTTPS)
- Network isolation / VLAN
- Input validation and rate limiting

## Wiring
4-channel relay board:
- IN1 → D1 (GPIO5)   — Channel 1
- IN2 → D2 (GPIO4)   — Channel 2
- IN3 → D5 (GPIO14)  — Channel 3
- IN4 → D6 (GPIO12)  — Channel 4
- VCC → VIN (5V), GND → GND
- Relay NO contacts → low-voltage demo loads (LEDs + resistors)
