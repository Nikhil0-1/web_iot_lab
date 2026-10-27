# Project 36 Wiring Guide — Smart Room Occupancy

## LD2410 mmWave Radar Pinouts
- **LD2410 VCC**: 5V External Power (Draws ~80mA average during active RF transmit)
- **LD2410 GND**: Common GND
- **LD2410 TX**: NodeMCU D7 (GPIO 13 / Software RX)
- **LD2410 RX**: NodeMCU D8 (GPIO 15 / Software TX via 1kΩ / 2kΩ divider)
- **LD2410 OUT (Target Detected)**: Optional connection to NodeMCU D5 (GPIO 14) for fast interrupt-driven presence wake.
- **Physical Placement**: Mount sensor on wall or ceiling corner at 1.5m–2.0m height, angled downwards at 15° for optimal FMCW gate coverage.
