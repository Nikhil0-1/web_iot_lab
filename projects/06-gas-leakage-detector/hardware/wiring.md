# Project 02: Gas Leakage Detector — Hardware Wiring Guide

## 1. Components
- **NodeMCU ESP8266** (ESP-12E)
- **MQ-2 / MQ-5 Gas Sensor Module**
- **5V Active Buzzer**
- **Red Warning LED & 220Ω Resistor**
- Breadboard & Jumper wires

## 2. Pin Connections

| Module Pin | NodeMCU Pin | Description |
|:---|:---|:---|
| **MQ-2 VCC** | **VIN (5V)** | Power to internal heater |
| **MQ-2 GND** | **GND** | System Ground |
| **MQ-2 AOUT** | **A0** | Analog concentration signal |
| **Buzzer (+)** | **D5 (GPIO14)** | Active Buzzer trigger |
| **Buzzer (-)** | **GND** | Ground |
| **Red LED Anode**| **D6 (GPIO12)** | Via 220Ω current-limiting resistor |
| **Red LED Cathode**| **GND** | Ground |

> [!CAUTION]
> The MQ-2 heater draws roughly 150-180mA at 5V. Ensure your USB port or external power supply provides at least 1A to avoid brownout resets on the ESP8266 Wi-Fi radio.
