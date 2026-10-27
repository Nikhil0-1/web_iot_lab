# Wiring — Project 18: Smart Exhaust Fan

| Signal | NodeMCU | GPIO | Notes |
|--------|---------|------|-------|
| DHT22 DATA | D4 | GPIO2 | 10kΩ pull-up to 3.3V |
| Fan Driver | D1 | GPIO5 | MOSFET gate via 100Ω |

DHT22 VCC → 3.3V, GND → GND
Fan supply → external; MOSFET drain → fan −
