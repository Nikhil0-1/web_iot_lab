# Wiring — Project 23: Relay Control Dashboard

## 4-Channel Example
| Channel | NodeMCU | GPIO |
|---------|---------|------|
| R1 | D1 | GPIO5 |
| R2 | D2 | GPIO4 |
| R3 | D5 | GPIO14 |
| R4 | D6 | GPIO12 |

Relay board VCC → VIN (5V), GND → GND
All relay IN pins → respective GPIO via 220Ω series resistor (optional, protection)

## Load Connection
Relay COM → supply rail
Relay NO  → load positive
Load negative → supply return
For demonstration: use only low-voltage, current-limited loads (LEDs + resistors)
