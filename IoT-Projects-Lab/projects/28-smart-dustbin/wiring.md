# Project 28 Wiring Guide — Smart Dustbin

## Sensor & Servo Pinouts
- **HC-SR04 VCC**: 5V External
- **HC-SR04 GND**: Common GND
- **HC-SR04 Trig**: NodeMCU D1 (GPIO 5)
- **HC-SR04 Echo**: Connect to 1kΩ resistor, junction to NodeMCU D2 (GPIO 4), and 2kΩ from junction to GND.
- **SG90 Servo PWM**: NodeMCU D5 (GPIO 14)
- **SG90 Servo Power**: External 5V rail (add 100µF electrolytic decoupling capacitor)
- **TCRT5000 IR Sensor DO**: NodeMCU D6 (GPIO 12)
- **TCRT5000 VCC/GND**: 3.3V or 5V Power & Common GND
