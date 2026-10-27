# Project 08: Vibration & Tilt Monitor — Hardware Wiring Guide

## 1. Components
- **NodeMCU ESP8266**
- **MPU6050 6-Axis Accelerometer & Gyroscope Breakout Board** (GY-521)
- Breadboard & wires

## 2. Wiring Connections (I2C)

| MPU6050 Pin | NodeMCU Pin | Description |
|:---|:---|:---|
| **VCC** | **3V3 (3.3V)** | Power (GY-521 has an onboard 3.3V LDO regulator) |
| **GND** | **GND** | System Ground |
| **SCL** | **D1 (GPIO5)** | I2C Clock Line |
| **SDA** | **D2 (GPIO4)** | I2C Data Line |
| **AD0** | **GND** | Sets I2C Slave Address to `0x68` (Pulling to 3.3V sets `0x69`) |
| **INT** | *Optional* | Motion interrupt pin |

## 3. Important Electrical Notes
- Wire length: Keep I2C wires under 20cm to minimize parasitic capacitance and bus clock degradation.
- Pull-ups: The GY-521 breakout board already includes onboard 4.7kΩ pull-up resistors on SDA and SCL to 3.3V.
