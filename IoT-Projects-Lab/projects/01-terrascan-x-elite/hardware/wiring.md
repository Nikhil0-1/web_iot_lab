# TERRASCAN X ELITE — Hardware Wiring & Electrical Guide

## Hardware Specifications
- **Controller:** ESP8266 NodeMCU (ESP-12E)
- **Primary Sensor:** HC-SR04 Ultrasonic Ranging Transceiver
- **Operating Voltage:** 5.0V for HC-SR04, 3.3V logic for ESP8266
- **Measurement Range:** 2 cm to 400 cm (accuracy ~3 mm)
- **Pulse Timing:** 10µs TTL Trigger Pulse, Echo duration proportional to distance ($t \times 0.0343 / 2$)

## Wiring Diagram

| HC-SR04 Pin | ESP8266 NodeMCU Pin | Voltage / Notes |
|:---|:---|:---|
| **VCC** | **VIN (5V)** | Connect to 5V external rail or ESP8266 VIN pin |
| **GND** | **GND** | Common system ground |
| **TRIG** | **D1 (GPIO 5)** | 3.3V trigger signal from ESP8266 |
| **ECHO** | **D2 (GPIO 4)** | **CRITICAL: Level shift via 1kΩ / 2kΩ voltage divider** |

### Voltage Divider for 5V Echo Pin
The HC-SR04 output pin emits a 5V logic pulse which can damage the ESP8266 3.3V inputs:
```
HC-SR04 ECHO (5V)
      │
     [1kΩ Resistor]
      │
      ├──────> ESP8266 D2 (GPIO 4) (Safe ~3.3V input)
      │
     [2kΩ Resistor]
      │
     GND
```
