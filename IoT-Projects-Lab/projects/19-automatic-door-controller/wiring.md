# Wiring — Project 19: Automatic Door Controller

| Signal | NodeMCU | GPIO | Notes |
|--------|---------|------|-------|
| HC-SR04 Trig | D1 | GPIO5 | |
| HC-SR04 Echo | D2 | GPIO4 | Voltage divider (1kΩ/2kΩ) |
| Servo Signal | D5 | GPIO14 | PWM |

Servo VCC → external 5V supply (NOT from ESP8266 3.3V)
Servo GND → common GND
HC-SR04 VCC → VIN (5V)
