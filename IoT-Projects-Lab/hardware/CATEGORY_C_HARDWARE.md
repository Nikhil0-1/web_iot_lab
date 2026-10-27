# Tech IoT Warriors — Category C (Smart Systems 25–36) Hardware Specification

## Architecture Overview & Hardware Compatibility Plan

Category C incorporates **12 Smart Systems (Projects 25–36)** into the Tech IoT Warriors platform.
Because the ESP8266 NodeMCU microcontroller features a limited set of exposed GPIOs (9 general-purpose digital pins: D0–D8, and 1 single 10-bit analog input A0 with 0–1.0V internal reference, 0–3.3V on NodeMCU module with onboard 220k/100k divider), these 12 complex systems **cannot physically run simultaneously on a single ESP8266 without electrical, bus, and timing conflicts**.

### Hardware Deployment Models:
1. **Model A: Standalone Bench Station (Default for Education / Prototyping)**
   - Each project has its dedicated firmware `.ino` inside its `firmware/` directory.
   - A single NodeMCU is flashed with that project's firmware and wired to the project-specific module.
   - Full hardware telemetry and bidirectional REST API control work on port 80 / IP address.
2. **Model B: Device 3 — Multi-System Smart Hub (`firmware/device-3-smart-systems-hub/`)**
   - Incorporates non-conflicting shared buses:
     - **I²C Bus (GPIO5 / D1 = SCL, GPIO4 / D2 = SDA)**: Shared safely between INA219 Power Monitor (0x40) and SSD1306 128x64 OLED (0x3C).
     - **Analog ADC (A0)**: Battery Voltage Monitor with 4:1 precision divider (max 16.8V 4S Li-Ion or 12V Lead-Acid).
     - **Digital GPIO Inputs**: HC-SR501 PIR Motion (`D5`), Break-Beam Sensors (`D6`, `D7`), IR Proximity (`D8`).
     - **Actuator Outputs**: Micro Servo / Solenoid driver (`D3`), Alarm Piezo (`D0`).
     - **SoftwareSerial Bus (`D3`/`D4`)**: Switched dynamically for PZEM-004T AC meter, LD2410 mmWave radar, or RC522 RFID (when configured for UART/SPI).

---

## Detailed Project-by-Project Hardware Matrix (25–36)

| # | Project Name | Primary Hardware Sensor / Module | Signal Type | NodeMCU Pin & GPIO | Operating Voltage & Current | Driver / Interface Circuitry | Required Libraries |
|---|---|---|---|---|---|---|---|
| **25** | **Smart Parking Assistant** | HC-SR04 Ultrasonic + TowerPro SG90 Servo | Digital Pulse + 50Hz PWM | D1 (Trig - GPIO5), D2 (Echo - GPIO4 via 1k/2k divider), D5 (Servo - GPIO14) | 5.0V External (Servo: 500mA peak, Sensor: 15mA) | 5V to 3.3V Echo divider (1kΩ / 2kΩ); Separate 5V rail for Servo | `<Servo.h>`, `<ESP8266WebServer.h>` |
| **26** | **RFID Attendance System** | MFRC522 13.56MHz Contactless Reader | SPI (Clock, MOSI, MISO, SS) | D5 (SCK - GPIO14), D7 (MOSI - GPIO13), D6 (MISO - GPIO12), D8 (SS/SDA - GPIO15), D3 (RST - GPIO0), D1 (Buzzer - GPIO5) | 3.3V VCC ONLY (Never 5V! 30mA max) | Direct 3.3V SPI; NPN transistor (2N2222) buffer for 5V Piezo | `<SPI.h>`, `<MFRC522.h>`, `<ArduinoJson.h>` |
| **27** | **RFID Door Access** | 4x4 Matrix Keypad OR RC522 + 12V Solenoid Lock | Digital I/O / SPI + Relay Out | D1 (Relay Driver - GPIO5), D2 (Status Green LED - GPIO4), D8 (Buzzer - GPIO15), D5-D7 (Keypad/SPI) | 3.3V Logic; 12V 1A External for Solenoid Lock | 1-Channel Optoisolated Relay or TIP120 Darlington with 1N4007 Flyback Diode | `<Keypad.h>` or `<MFRC522.h>`, `<ESP8266WebServer.h>` |
| **28** | **Smart Dustbin** | HC-SR04 (Fill Level) + TCRT5000 / Sharp IR (Hand Proximity) + SG90 Servo | Analog/Digital Proximity + 50Hz PWM | D1 (Trig - GPIO5), D2 (Echo - GPIO4), D6 (IR DO - GPIO12), D5 (Servo - GPIO14) | 5.0V VCC (Servo 500mA, Sensors 35mA) | 1k/2k Echo divider; Decoupling 100µF electrolytic cap on 5V servo rail | `<Servo.h>`, `<ESP8266WebServer.h>` |
| **29** | **Fire & Smoke Alert** | MQ-2 Gas/Smoke Transducer + Optical Flame Sensor + Active Buzzer | Analog ADC + Digital DO | A0 (MQ-2 AO via divider or ADS1115), D1 (Flame DO - GPIO5), D6 (Buzzer - GPIO12), D7 (Alert LED - GPIO13) | 5.0V VCC (MQ-2 heater requires 150mA continuous!) | 5V Heater rail (dedicated); 20-minute heater burn-in warmup; Piezo driver | `<ESP8266WebServer.h>`, `<ArduinoJson.h>` |
| **30** | **Intrusion Detection Alarm** | HC-SR501 Passive Infrared (PIR) + Piezo Siren | 3.3V Digital Output | D5 (PIR OUT - GPIO14), D1 (Siren Output - GPIO5), D2 (Arm/Disarm LED - GPIO4) | 5.0V VCC (Internal 3.3V regulator on HC-SR501); 65µA quiescent | Direct connection to D5 (HC-SR501 output is 3.3V TTL); 2N2222 for Siren | `<ESP8266WebServer.h>`, `<ArduinoJson.h>` |
| **31** | **Visitor Counter** | Dual IR Optical Break-Beam Sensors (Sensors A & B) | Active-LOW Digital Interrupts | D1 (Sensor A - GPIO5), D2 (Sensor B - GPIO4), D6 (Status Indicator - GPIO12) | 3.3V–5.0V VCC; 15mA per sensor pair | Pull-up 10kΩ on open-collector outputs; Hardware de-glitch RC filter (100nF) | `<ESP8266WebServer.h>`, `<ArduinoJson.h>` |
| **32** | **Smart Energy Meter** | Peacefair PZEM-004T v3.0 AC Multi-Function Power Sensor | TTL UART (Optoisolated) | D5 (RX - GPIO14), D6 (TX - GPIO12) via SoftwareSerial | 5.0V VCC for PZEM logic; 80–260VAC for AC High-Voltage Side | Galvanic optoisolation built into PZEM-004T; CT clamp around LIVE wire ONLY | `<SoftwareSerial.h>`, `<PZEM004Tv30.h>` |
| **33** | **Battery Voltage Monitor** | Precision Metal-Film Resistor Voltage Divider (e.g. 30kΩ / 7.5kΩ or 100kΩ / 10kΩ) | Analog Voltage (0–1.0V to ADC) | A0 (ADC0 - 0 to 1.0V internal, 0 to 3.3V board input) | Battery power under test (3.0V to 15.0V DC) | 1% tolerance metal film resistors + 100nF ceramic cap for ADC stabilization | `<ESP8266WebServer.h>`, `<ArduinoJson.h>` |
| **34** | **Solar Panel Monitor** | Texas Instruments INA219 High-Side I²C Power Monitor + PV Solar Cell | I²C Bus (0x40) | D1 (SCL - GPIO5), D2 (SDA - GPIO4) | 3.3V–5.0V Logic; Panel DC voltage 0–26V max, current ±3.2A max | INA219 Breakout with 0.1Ω shunt resistor; Direct I²C 3.3V logic | `<Wire.h>`, `<Adafruit_INA219.h>` |
| **35** | **Digital Notice Board** | SSD1306 0.96" 128x64 Monochrome OLED Display | I²C Bus (0x3C) | D1 (SCL - GPIO5), D2 (SDA - GPIO4), D5 (Buzzer chime - GPIO14) | 3.3V VCC (20mA with all pixels lit) | Direct 3.3V I²C connection; Onboard display charge pump | `<Wire.h>`, `<Adafruit_GFX.h>`, `<Adafruit_SSD1306.h>` |
| **36** | **Smart Room Occupancy** | Hi-Link HLK-LD2410 mmWave 24GHz FMCW Human Presence Sensor | UART / Digital GPIO Out | D7 (RX - GPIO13), D8 (TX - GPIO15 via SoftwareSerial) or D5 (Out - GPIO14) | 5.0V VCC (79mA average, 120mA peak) | Logic level compatible (3.3V TTL UART); Dedicated 5V power supply | `<SoftwareSerial.h>`, `<ld2410.h>` |

---

## Critical Safety, High-Voltage & Electrical Warnings

> [!CAUTION]
> **Mains AC High-Voltage Hazard (Project 32 — Smart Energy Meter):**
> 1. The PZEM-004T high-voltage terminals connect directly to 110V/230V AC mains electricity. **Contact with live terminals can cause severe electric shock or death.**
> 2. Installation must be performed by a qualified individual with the mains circuit breaker locked out (LOTO).
> 3. The current transformer (CT) must be clamped around the **Phase/Live conductor only**, never around both Live and Neutral simultaneously.
> 4. Ensure the optocoupled low-voltage TTL side (5V, GND, TX, RX) maintains physical galvanic air-gap isolation (>6mm) from high-voltage lines.

> [!WARNING]
> **Heater Thermal Load & Calibration (Project 29 — Fire & Smoke Alert):**
> 1. MQ-2 internal heater coil draws ~150mA continuous at 5V and gets noticeably hot to the touch during normal operation. Never power it directly from the ESP8266 3.3V pin; power it exclusively from the 5V VIN or external 5V regulated rail.
> 2. The MQ-2 sensor requires at least **24 to 48 hours of initial burn-in stabilization** before sensor calibration resistance ($R_0$) becomes reliable.
> 3. MQ-2 sensors are educational transducers and **MUST NEVER be used as life-safety certified fire alarms** in commercial or residential buildings.

> [!IMPORTANT]
> **ESP8266 Analog Pin Voltage Limit (Project 33 — Battery Monitor):**
> The bare ESP8266 chip ADC pin can tolerate a maximum of **1.0V DC**. NodeMCU breakout boards contain an onboard 220kΩ/100kΩ voltage divider that expands the input range to **0–3.3V**. Connecting voltages above 3.3V directly to the NodeMCU A0 pin will permanently destroy the ESP8266 ADC module. Always use an external divider sized according to battery pack chemistry (e.g. 100kΩ / 10kΩ for 12V systems).
