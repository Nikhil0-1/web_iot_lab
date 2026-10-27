# Project 02: Gas Leakage Detector

## 1. Project Overview
The **Gas Leakage Detector** monitors combustible gases including LPG, methane, propane, butane, and hydrogen using the MQ-2 sensor module. Designed with safety education principles, it features dynamic gas cloud visualization, automatic acoustic/strobe alarm triggering, and an incident audit log.

## 2. Features
- **Gas Cloud Simulation:** Canvas particle system rendering expanding gas clouds proportional to gas PPM levels.
- **Visual Strobe & Alarm State:** Multi-tier threat classification (*Safe*, *Warning*, *Hazardous / Alarm*).
- **Incident Logger:** Automatic timestamped event logging for threshold breaches.
- **Hardware Integration:** Drives an active buzzer and warning LED via ESP8266 GPIO.

## 3. Hardware List
- 1x ESP8266 NodeMCU
- 1x MQ-2 Combustible Gas Sensor Module
- 1x Active 5V Buzzer
- 1x Red LED + 220Ω Resistor
- Breadboard & wires

## 4. Safety Warning
> [!CAUTION]
> This is an educational learning project. NEVER test this system by releasing unburned gas from lighters or gas burners indoors. Doing so creates serious fire and explosion hazards. Use the simulation slider to test alarm and strobe behavior.
