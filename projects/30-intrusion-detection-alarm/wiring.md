# Project 30 Wiring Guide — Intrusion Detection Alarm

## Sensor & Siren Pinouts
- **HC-SR501 VCC**: 5V External Supply (Board contains internal 3.3V regulator)
- **HC-SR501 GND**: Common GND
- **HC-SR501 OUT**: NodeMCU D5 (GPIO 14) [Outputs 3.3V TTL signal]
- **Piezo Alarm Siren**: NodeMCU D1 (GPIO 5) driving 2N2222 NPN transistor base through 1kΩ resistor.
- **Arm/Disarm Status LED**: NodeMCU D2 (GPIO 4) via 220Ω resistor.
