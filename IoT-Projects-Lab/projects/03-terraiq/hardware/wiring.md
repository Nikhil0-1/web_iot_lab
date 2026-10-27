# TerraIQ — Hardware Wiring & Calibration Guide

## Hardware Specifications
- **Controller:** ESP8266 NodeMCU (ESP-12E)
- **Sensor:** Corrosion-resistant Capacitive Soil Moisture Sensor v1.2
- **Operating Voltage:** 3.3V DC (avoids over-volting the ESP8266 TOUT ADC pin)
- **Calibration Protocol:**
  1. Record ADC reading in dry air (`AIR_VALUE ~820-880`).
  2. Record ADC reading in clean water up to white line (`WATER_VALUE ~350-420`).
  3. Linear interpolation yields calibrated soil moisture percentage.

## Wiring Diagram

| Sensor Pin | ESP8266 NodeMCU Pin | Function |
|:---|:---|:---|
| **VCC** | **3V3** | 3.3V Power |
| **GND** | **GND** | Ground |
| **AOUT** | **A0 (TOUT)** | Analog voltage input (0 to 1.0V internal / 0 to 3.3V on NodeMCU board) |
