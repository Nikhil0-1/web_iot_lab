# Project 06: Water Flow Meter — Hardware Wiring Guide

## 1. Components
- **NodeMCU ESP8266**
- **YF-S201 Hall-Effect Flow Sensor** (1/2" inline threaded pipe fitting)
- Breadboard & wires

## 2. Wiring Connections

| Sensor Wire | NodeMCU Pin | Description |
|:---|:---|:---|
| **Red** | **VIN (5V)** | Power to internal Hall-effect sensor IC (4.5V–18V DC) |
| **Black** | **GND** | System Ground |
| **Yellow** | **D2 (GPIO4)** | Pulse signal output (with internal `INPUT_PULLUP` enabled) |

## 3. Interrupt & GPIO Notes
- **Pin D2 (GPIO4):** Supports external edge-triggered interrupts (`FALLING` edge).
- **Safe Pulse Catching:** Pulse counting occurs within the `ICACHE_RAM_ATTR` interrupt handler, keeping main loop processing non-blocking.
