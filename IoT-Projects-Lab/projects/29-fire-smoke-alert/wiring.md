# Project 29 Wiring Guide — Fire & Smoke Alert

## Sensor & Buzzer Pinouts
- **MQ-2 VCC**: 5V External Power Supply (Heater coil draws ~150mA continuous!)
- **MQ-2 GND**: Common GND
- **MQ-2 AO**: Connect to 10kΩ resistor, junction to NodeMCU A0, and 20kΩ from junction to GND (stepped down to 0–3.3V).
- **Flame Sensor DO**: NodeMCU D1 (GPIO 5)
- **Flame Sensor VCC/GND**: 3.3V NodeMCU & Common GND
- **Piezo Siren**: NodeMCU D6 (GPIO 12) driving 2N2222 NPN base through 1kΩ resistor.
- **Red Alert LED**: NodeMCU D7 (GPIO 13) via 220Ω current-limiting resistor.
