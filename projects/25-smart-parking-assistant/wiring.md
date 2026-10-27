# Project 25 Wiring Guide — Smart Parking Assistant

## Schematic & Connections
- **HC-SR04 VCC**: 5V External Rail
- **HC-SR04 GND**: Common GND
- **HC-SR04 Trig**: NodeMCU D1 (GPIO 5)
- **HC-SR04 Echo**: Connect to 1kΩ resistor, then junction to NodeMCU D2 (GPIO 4), and 2kΩ from junction to GND.
- **SG90 Servo Signal**: NodeMCU D5 (GPIO 14)
- **SG90 Servo VCC/GND**: 5V External Power & GND
- **Red LED (Occupied)**: NodeMCU D6 (GPIO 12) via 220Ω resistor
- **Green LED (Vacant)**: NodeMCU D7 (GPIO 13) via 220Ω resistor
