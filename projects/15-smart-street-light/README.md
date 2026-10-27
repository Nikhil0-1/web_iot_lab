# Project 15 — Smart Street Light

## Purpose
Automatically adjust street-light behavior based on ambient light and time-of-day schedule.
LED brightness can be dimmed via PWM; detection of motion (PIR) can boost brightness.

## Features
- Night scene with animated street light glow
- Ambient light level display (LDR/ADC)
- Automatic/manual mode
- Light ON/OFF with brightness control
- Configurable light threshold
- Motion detection simulation
- Energy estimate display (illustrative — see firmware assumptions)
- Day/night transition animation

## Simulation Scenarios
- Drag Ambient Light slider to simulate day/night
- Toggle Motion to see brightness boost
- Use scenario presets: Day, Dusk, Night
- Switch to Manual mode to override the light directly

## Hardware
- ESP8266 NodeMCU
- LDR + 10kΩ voltage divider → A0
- N-Channel MOSFET (e.g., IRLZ44N) gate via 100Ω → D1 (GPIO5) for PWM dimming
- Low-voltage LED or LED strip (appropriate resistor/driver)
- Optional: PIR sensor → D5 (GPIO14)

## Important
- Do NOT use a plain relay for dimming — relays are ON/OFF only
- Use a PWM-capable MOSFET driver rated for your LED current
- Energy estimates assume 5W LED — adjust in firmware for your actual load
