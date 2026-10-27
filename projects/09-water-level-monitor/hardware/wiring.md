# Project 05: Water Level Monitor — Hardware Wiring Guide

## 1. Components
- **NodeMCU ESP8266**
- **HC-SR04** (for dry test environments) or **JSN-SR04T** (for waterproof liquid tanks)
- **Resistors:** 1kΩ and 2kΩ (for 5V Echo voltage divider)
- Breadboard & wires

## 2. Voltage Divider Schematic on Echo Pin
The HC-SR04 Echo output produces a **5.0V logic pulse**. Connecting 5V directly to ESP8266 GPIO pins can cause electrostatic breakdown and degrade the chip. A simple 1kΩ / 2kΩ divider scales 5V down to a safe **3.3V**:

```
HC-SR04 ECHO (5V)
      |
    [1kΩ]
      |
      +-----> NodeMCU Pin D2 (GPIO4) (3.3V safe)
      |
    [2kΩ]
      |
     GND
```

## 3. Pin Connections Table

| Sensor Pin | ESP8266 Pin | Notes |
|:---|:---|:---|
| **VCC** | **VIN (5V)** | Ultrasonic transducers require 5V for acoustic transmission |
| **GND** | **GND** | Common ground |
| **TRIG** | **D1 (GPIO5)** | 10μs trigger pulse |
| **ECHO** | **D2 (GPIO4)** | Via 1kΩ / 2kΩ voltage divider |
