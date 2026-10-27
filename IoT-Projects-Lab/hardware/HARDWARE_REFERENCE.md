# Tech IoT Warriors — Complete Hardware Documentation

## MULTI-DEVICE UNIVERSAL HARDWARE SYSTEM (36 PROJECTS)

### Architecture Overview

This IoT Projects Lab supports all 36 projects across three hardware device roles:

| Device | Name | Projects | Role |
|--------|------|----------|------|
| **Device 1** | Sensors & Monitoring Hub | 01–12 (Category A) | Reads environmental sensors & ADC telemetry |
| **Device 2** | Automation & Control Hub | 13–24 (Category B) | Drives actuators, relays, PWM fans, motors |
| **Device 3** | Smart Systems Hub | 25–36 (Category C) | Smart infrastructure, RFID, energy, solar & presence |

For deep-dive specifications on Category C (25–36), refer to [CATEGORY_C_HARDWARE.md](file:///c:/Users/DELL/Desktop/iot%20esp8266/IoT-Projects-Lab/hardware/CATEGORY_C_HARDWARE.md).

---

## Device 1 — Sensors & Monitoring Hub

**mDNS Hostname:** `sensors-hub.local`  
**AP SSID (Fallback):** `TechIoTW_SensorsHub`  
**AP Password:** `tech123456`

### Pin Mapping

| GPIO | NodeMCU Pin | Project | Function |
|------|-------------|---------|----------|
| GPIO5 (D1) | D1 | Shared | I²C SCL (ADS1115 + MPU6050) |
| GPIO4 (D2) | D2 | Shared | I²C SDA (ADS1115 + MPU6050) |
| GPIO16 (D0) | D0 | P01, P09 | HC-SR04 Trigger (shared bus) |
| GPIO0 (D3) | D3 | P01 | HC-SR04 Echo (1k/2k divider!) |
| GPIO2 (D4) | D4 | P01 | SG90 Servo PWM (Radar sweep) |
| GPIO15 (D8) | D8 | P02, P09, P12 | Rain DO / Level Echo / SW-420 |
| GPIO13 (D7) | D7 | P04 | DHT22 Data (4.7k pull-up) |
| GPIO12 (D6) | D6 | P08 | DS18B20 OneWire (4.7k pull-up) |
| GPIO14 (D5) | D5 | P10 | YF-S201 Flow Pulse (Interrupt) |
| A0 (ADC0) | A0 | P07 | LDR Photoresistor Divider |
| ADS1115 AIN0 | I²C | P05 | MQ-135 Air Quality Analog |
| ADS1115 AIN1 | I²C | P02, P06 | Rain Intensity / MQ-2 Gas |
| ADS1115 AIN2 | I²C | P11 | TDS Water Quality Probe |
| ADS1115 AIN3 | I²C | P03 | Capacitive Soil Moisture |

### Required Components

- 1× ESP8266 NodeMCU v2/v3
- 1× ADS1115 16-bit ADC Module (I²C 0x48)
- 1× MPU-6050 6-Axis IMU (I²C 0x68)
- 1× DHT22 / AM2302 Temperature & Humidity Sensor
- 1× DS18B20 OneWire Temperature Probe
- 2× HC-SR04 Ultrasonic Range Sensors
- 1× SG90 Micro Servo Motor
- 1× MQ-135 Air Quality Sensor Module
- 1× MQ-2 Combustible Gas Sensor Module
- 1× LDR Photoresistor + 10kΩ Resistor
- 1× YF-S201 Hall-Effect Water Flow Sensor
- 1× TDS Analog Probe Module
- 1× SW-420 Vibration Sensor Module
- 1× Rain Sensor Grid + LM393 Comparator

### Power Requirements

- USB Power for NodeMCU: 5V via Micro-USB
- External 5V 2A Supply for: MQ sensor heaters, HC-SR04, servo motor
- **Common Ground** between NodeMCU and external supply is MANDATORY

---

## Device 2 — Automation & Control Hub

**mDNS Hostname:** `automation-hub.local`  
**AP SSID (Fallback):** `TechIoTW_AutomationHub`  
**AP Password:** `tech123456`

### Pin Mapping

| GPIO | NodeMCU Pin | Project | Function |
|------|-------------|---------|----------|
| GPIO5 (D1) | D1 | Shared | I²C SCL (PCF8574 Relay Driver) |
| GPIO4 (D2) | D2 | Shared | I²C SDA (PCF8574 Relay Driver) |
| GPIO14 (D5) | D5 | P15, P17, P21 | PWM Output (MOSFET/LED/Motor ENA) |
| GPIO12 (D6) | D6 | P21, P22 | DC Motor IN1 / Stepper STEP |
| GPIO13 (D7) | D7 | P21, P22 | DC Motor IN2 / Stepper DIR |
| GPIO16 (D0) | D0 | P19, P22 | Door Proximity / Stepper ENABLE |
| GPIO0 (D3) | D3 | P17 | Fan Tachometer RPM Pulse |
| GPIO2 (D4) | D4 | P24 | Greenhouse DHT22 Feedback |
| GPIO15 (D8) | D8 | P19, P20, P24 | Servo PWM (Door/Arm/Greenhouse) |
| A0 (ADC0) | A0 | P13, P15 | Soil Probe / Street Light LDR |

### PCF8574 I²C Relay Channels

| Channel | Relay | Project | Load |
|---------|-------|---------|------|
| P0 | Relay 1 | P13 | Plant Watering DC Pump |
| P1 | Relay 2 | P14 | Water Tank Inflow Pump |
| P2 | Relay 3 | P16 | Home Automation Relay 1 |
| P3 | Relay 4 | P16 | Home Automation Relay 2 |
| P4 | Relay 5 | P16 | Home Automation Relay 3 |
| P5 | Relay 6 | P16 | Home Automation Relay 4 |
| P6 | Relay 7 | P18 | Smart Exhaust Fan |
| P7 | Relay 8 | P24 | Greenhouse Misting/Heater |

### Required Components

- 1× ESP8266 NodeMCU v2/v3
- 1× PCF8574 I²C I/O Expander (Address 0x27)
- 1× 8-Channel Optocoupled Relay Board (5V, Active-LOW)
- 1× L298N DC Motor Driver Module
- 1× A4988 Stepper Motor Driver Module
- 2× SG90 / MG996R Servo Motors
- 1× IRF520 / IRLZ44N MOSFET Module (Fan PWM)
- 1× DHT22 / AM2302 Sensor (Greenhouse feedback)
- 1× Capacitive Soil Moisture Sensor
- 1× LDR Photoresistor + 10kΩ Resistor
- 1× IR Proximity Sensor Module

### Safety Features (Firmware)

| Feature | Value | Purpose |
|---------|-------|---------|
| Watchdog Timeout | 30 seconds | Auto-stop if dashboard disconnects |
| Max Pump Runtime | 60 seconds | Prevent pump overheating |
| Pump Cooldown | 15 seconds | Mandatory rest between cycles |
| Emergency Stop Debounce | 50ms | Prevent false triggers |

---

## Power & Signal Safety Rules

### Critical Level-Shifting Rules

1. **NEVER** connect 5V outputs directly to ESP8266 GPIO pins (3.3V max!)
2. Use **1kΩ / 2kΩ resistor voltage dividers** on all 5V signal lines:
   - HC-SR04 Echo → 1kΩ + 2kΩ divider → GPIO (5V × 2k/3k ≈ 3.3V)
   - MQ sensor AO → 10kΩ / 20kΩ divider → ADS1115 AIN
3. All digital sensors with open-drain outputs need **4.7kΩ pull-up to 3.3V**

### Motor & Actuator Power

1. **NEVER** power motors/servos from NodeMCU 3.3V or VIN pins
2. Use dedicated external power supply:
   - Servos: External 5V 2A supply
   - DC Motors: 12V supply via L298N VMS
   - Relay Board: External 5V via JD-VCC jumper
3. Install **1N4007 flyback diodes** across all inductive loads
4. **Common Ground** between all power supplies and NodeMCU is MANDATORY

### Wiring Best Practices

- Keep analog signal wires away from motor/relay power lines
- Use shielded cables for I²C bus runs > 30cm
- Decouple each sensor's VCC with a 100nF ceramic capacitor
- Route DHT22 and DS18B20 data lines with 4.7kΩ pull-up to 3.3V
- Never exceed 12mA source/sink current per GPIO pin
