# Project 33 Wiring Guide — Battery Voltage Monitor

## Voltage Divider Schematic
- **Battery (+) Terminal**: Connect to High-Side 100kΩ 1% precision resistor.
- **NodeMCU A0 Pin**: Connect to junction between 100kΩ and 10kΩ resistors.
- **Battery (-) Terminal**: Common GND with NodeMCU GND.
- **Filter Capacitor**: 100nF ceramic capacitor across NodeMCU A0 and GND to stabilize ADC readings.
- **Input Limit**: Voltage at NodeMCU A0 must never exceed 3.3V. With a 10kΩ / (100kΩ + 10kΩ) = 1/11 divider, maximum measured battery potential is 36.3V DC.
