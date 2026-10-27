# Project 04: Digital Thermometer — Hardware Wiring Guide

## 1. Components Required
- **Microcontroller:** NodeMCU ESP8266 (ESP-12E Module)
- **Sensor:** DS18B20 1-Wire Digital Temperature Sensor (TO-92 package or waterproof probe)
- **Resistor:** 4.7kΩ (1/4W) pull-up resistor
- **Prototyping:** Half-size solderless breadboard & jumper wires
- **Power:** Micro-USB cable (5V 1A)

## 2. Schematic & Pin Connections

| DS18B20 Pin | Wire Color (Probe) | NodeMCU ESP8266 Pin | Notes |
|:---|:---|:---|:---|
| **Pin 1 (GND)** | Black | **GND** | System Ground |
| **Pin 2 (DQ / Data)** | Yellow / White | **D4 (GPIO2)** | OneWire bidirectional bus |
| **Pin 3 (VDD)** | Red | **3V3 (3.3V)** | Power Supply |

### Pull-up Resistor Connection:
Place a **4.7kΩ resistor** between:
- **DS18B20 Pin 2 (Data)** and **Pin 3 (3.3V)**.

> [!IMPORTANT]
> The OneWire bus operates as an open-drain communication line. Without the 4.7kΩ pull-up resistor, the data line cannot return to logic HIGH, causing the sensor to return `-127.00 °C` (CRC error).

## 3. ESP8266 GPIO Considerations
- **D4 (GPIO2):** NodeMCU onboard LED pin. It must be pulled HIGH at boot for proper ESP8266 bootloader execution. Since the OneWire pull-up resistor holds GPIO2 HIGH, this pin is ideal for DS18B20.
- **Safe Input Voltage:** Never power the DS18B20 data line with 5V without level shifting; use the 3.3V pin from the NodeMCU.
