# Wiring — Project 24: Smart Greenhouse Automation

| Sensor/Actuator | NodeMCU | GPIO | Notes |
|-----------------|---------|------|-------|
| DHT22 DATA | D4 | GPIO2 | 10kΩ to 3.3V |
| LDR divider | A0 | ADC | 10kΩ to GND |
| Soil sensor AOUT | A0* | ADC | *Multiplexed with LDR |
| Fan MOSFET gate | D1 | GPIO5 | Via 100Ω |
| Pump relay IN | D5 | GPIO14 | Active LOW |

*Hardware: Use CD4051 8:1 analog multiplexer to read multiple analog sensors on A0.
LDR and soil sensor are read alternately via multiplexer select pins.

Fan: N-CH MOSFET + external supply
Pump: Relay NO contact + external supply
