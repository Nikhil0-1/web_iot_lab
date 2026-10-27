# Project 01: Smart Air Quality Monitor — Hardware Wiring Guide

## 1. Components
- **NodeMCU ESP8266** (ESP-12E)
- **MQ-135 Gas & Air Quality Sensor Module**
- Breadboard & Jumper wires
- Micro-USB cable

## 2. Wiring Connections

| MQ-135 Pin | NodeMCU ESP8266 Pin | Notes |
|:---|:---|:---|
| **VCC** | **VIN (5V)** | MQ-135 heating coil requires 5V to maintain 400°C internal reaction chamber |
| **GND** | **GND** | Ground reference |
| **AOUT** | **A0** | Analog Output (0V to 3.3V safe through NodeMCU onboard 220k/100k divider) |
| **DOUT** | *Not Connected* | Digital comparator output (optional) |

> [!NOTE]
> The NodeMCU board contains an onboard voltage divider (220kΩ / 100kΩ) connected to the ESP8266's internal 0–1.0V ADC pin, allowing direct 0–3.3V analog input on the A0 header pin.

## 3. Preheating & Burn-In Note
- Initial new sensor burn-in: 24–48 hours for stable chemical absorption baseline.
- Daily power-up warm-up: 20–60 seconds before readings stabilize.
