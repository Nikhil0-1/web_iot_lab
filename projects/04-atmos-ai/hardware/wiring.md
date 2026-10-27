# ATMOS AI — Hardware Wiring & Electrical Guide

## Hardware Specifications
- **Controller:** ESP8266 NodeMCU (ESP-12E)
- **Sensor:** DHT22 (AM2302) Digital Relative Humidity and Temperature Sensor
- **Operating Voltage:** 3.3V to 5V DC
- **Temperature Range:** -40°C to 80°C (accuracy ±0.5°C)
- **Humidity Range:** 0% to 100% RH (accuracy ±2% RH)
- **Sampling Period:** Minimum 2.0 seconds between consecutive reads

## Wiring Diagram

| DHT22 Pin | ESP8266 NodeMCU Pin | Function / Notes |
|:---|:---|:---|
| **Pin 1 (VCC)** | **3V3** | 3.3V DC Power |
| **Pin 2 (DATA)** | **D4 (GPIO 2)** | Bidirectional data line (add 4.7kΩ pull-up to 3.3V if using bare sensor) |
| **Pin 3 (NC)** | **Unconnected** | Not connected |
| **Pin 4 (GND)** | **GND** | System Ground |
