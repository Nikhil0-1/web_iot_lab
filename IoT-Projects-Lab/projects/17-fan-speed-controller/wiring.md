# Wiring — Project 17: Fan Speed Controller

| Signal | NodeMCU | GPIO | Notes |
|--------|---------|------|-------|
| MOSFET Gate (PWM) | D1 | GPIO5 | Via 100Ω gate resistor |
| Fan Tach (optional) | D5 | GPIO14 | INPUT_PULLUP, interrupt |
| Temp Sensor (optional) | D4 | GPIO2 | DS18B20 with 4.7kΩ |

Fan + → External supply +
Fan − → MOSFET Drain
MOSFET Source → GND (shared with ESP8266 GND)
