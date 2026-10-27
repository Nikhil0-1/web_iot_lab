# Project 07: TDS Water Quality Monitor — Hardware Wiring Guide

## 1. Components
- **NodeMCU ESP8266**
- **Analog TDS Sensor Signal Conditioning Board**
- **Waterproof Dual-Titanium Probe**
- Breadboard & wires

## 2. Wiring Connections

| Sensor Module Pin | NodeMCU Pin | Description |
|:---|:---|:---|
| **VCC (+)** | **3V3 (3.3V)** | Power to signal conditioning oscillator |
| **GND (-)** | **GND** | System Ground |
| **AOUT (Signal)** | **A0** | Analog DC voltage proportional to conductivity |

> [!TIP]
> The signal conditioning board applies high-frequency AC excitation across the titanium probe pins to prevent electrolytic polarization and oxidation of the electrodes during continuous immersion.
