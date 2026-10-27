# RAINWATCH AI — Hardware Wiring & Electrical Guide

## Hardware Specifications
- **Controller:** ESP8266 NodeMCU (ESP-12E)
- **Sensor:** Rain Sensor Module (Interleaved Nickel Track Plate + LM393 Comparator)
- **Supply Voltage:** 3.3V DC
- **Output:**
  - **Analog (AO):** Variable voltage (0 to 3.3V) indicating droplet density on traces.
  - **Digital (DO):** Active-LOW digital threshold trigger via onboard potentiometer.

## Wiring Diagram

| Sensor Module Pin | ESP8266 NodeMCU Pin | Function |
|:---|:---|:---|
| **VCC** | **3V3** | 3.3V Power |
| **GND** | **GND** | Ground |
| **AO** | **A0** | Analog input to ADC (TOUT) |
| **DO** | **D1 (GPIO 5)** | Digital rain trigger alert |
