# PROJECT HARDWARE REFERENCE
## Tech IoT Warriors — Universal IoT Projects Lab (Projects 01–36)
**Document Revision:** 3.0.0  
**Target Hardware:** ESP8266 NodeMCU v2 / v3 (ESP-12E / ESP-12F Module)  
**Standard Logic Voltage:** 3.3V DC (5.0V I/O without level shifting will permanently damage GPIOs)

---

## 1. ESP8266 NODEMCU HARDWARE PIN MAPPING & SYSTEM CONSTRAINTS

| Silkscreen Label | ESP8266 GPIO | Boot-Time State / Requirement | Peripheral Capability | Critical Hardware Notes |
|:---:|:---:|:---|:---|:---|
| **D0** | GPIO 16 | HIGH at boot | Deep-Sleep Wakeup (`WAKE`) | No hardware PWM; No interrupt support. Safe digital output. |
| **D1** | GPIO 5 | Floating / High-Z | Standard I/O, I²C SCL | **Primary I²C Clock line**. Fully safe for inputs, outputs, PWM. |
| **D2** | GPIO 4 | Floating / High-Z | Standard I/O, I²C SDA | **Primary I²C Data line**. Fully safe for inputs, outputs, PWM. |
| **D3** | GPIO 0 | **MUST BE HIGH AT BOOT** | Flash Mode / Boot Select | Connected to onboard `FLASH` tactile button. 10kΩ pull-up. Pulling LOW at boot halts startup into bootloader mode. |
| **D4** | GPIO 2 | **MUST BE HIGH AT BOOT** | Onboard Blue LED, TXD1 | Connected to internal pull-up and NodeMCU onboard LED (active-LOW). Pin drives LOW when onboard LED turns ON. |
| **D5** | GPIO 14 | Floating / High-Z | HSPI SCK, Hardware Interrupt | High-speed SPI clock. Fully safe general-purpose input/output. Supports external hardware interrupts. |
| **D6** | GPIO 12 | Floating / High-Z | HSPI MISO, Hardware Interrupt | High-speed SPI MISO. Fully safe general-purpose input/output. |
| **D7** | GPIO 13 | Floating / High-Z | HSPI MOSI, UART0 CTS | High-speed SPI MOSI. Fully safe general-purpose input/output. |
| **D8** | GPIO 15 | **MUST BE LOW AT BOOT** | HSPI CS / SS, Boot Select | **Hardware pull-down 10kΩ required**. Pulling HIGH at boot prevents flash bootloader from launching. |
| **A0** | ADC0 / TOUT | Dedicated Analog Input | 10-Bit Successive Approximation ADC | Internal bare chip reference: 0 to 1.0V. NodeMCU board features onboard 220kΩ/100kΩ divider mapping 0 to 3.3V. |

---

## 2. MULTI-DEVICE PHYSICAL LAB HARDWARE HUBS

To eliminate electrical pin collisions and bus contention, the 36 projects deploy onto physical hardware using three dedicated device hub architectures:

### Device A: Sensors & Monitoring Hub (Projects 01–12)
- **Primary Controller:** 1× ESP8266 NodeMCU v2/v3
- **Bus Architecture:** 
  - Shared Hardware I²C Bus: `D1` (SCL) and `D2` (SDA) serving ADS1115 16-Bit ADC (`0x48`) and MPU-6050 6-Axis IMU (`0x68`).
  - Analog Expansion: ADS1115 handles MQ-135 (`AIN0`), Rain Intensity / MQ-2 (`AIN1`), TDS Probe (`AIN2`), and Soil Moisture (`AIN3`). NodeMCU `A0` handles LDR divider.
  - Dedicated Pulse & Timing Channels: `D0` (Radar Trig), `D3` (Echo via 1kΩ/2kΩ divider), `D4` (Servo PWM), `D5` (Flow Meter interrupt), `D6` (DS18B20 OneWire with 4.7kΩ pull-up), `D7` (DHT22 with 4.7kΩ pull-up), `D8` (Rain digital comparator DO / SW-420 tilt).
- **Power Requirements:** Dual power rails: 5V 2A external for MQ heaters and servo, 3.3V logic. Common ground mandatory.

### Device B: Automation & Control Hub (Projects 13–24)
- **Primary Controller:** 1× ESP8266 NodeMCU v2/v3
- **Actuator Expansion:** PCF8574 I²C 8-Bit I/O expander at address `0x27` driving an 8-channel optocoupled relay module. Direct PWM from `D5` for fan MOSFET / motor speed control.
- **Dedicated Driver Channels:** `D6` (Motor IN1 / Stepper STEP), `D7` (Motor IN2 / Stepper DIR), `D0` (Stepper ENABLE), `D8` (Micro-servo gate/valve).
- **Safety Features:** Hardcoded 30-second watchdog heartbeat, 60-second pump auto-shutdown, 15-second mandatory cooldown timer.

### Device C: Smart Systems Hub (Projects 25–36)
- **Primary Controller:** 1× ESP8266 NodeMCU v2/v3
- **Bus Architecture:** 
  - I²C Bus: `D1` (SCL) and `D2` (SDA) shared between INA219 Power Monitor (`0x40`) and SSD1306 128×64 OLED (`0x3C`).
  - Switched SoftwareSerial: `D5` (RX) and `D6` (TX) for PZEM-004T AC meter, LD2410 mmWave presence, or RC522 RFID card scanner.
  - Dedicated GPIOs: `D7` (Barrier/Lock Servo), `D8` (PIR Motion / LD2410 Out), `D3` (Siren Piezo via 2N2222 NPN buffer), `A0` (Battery 4:1 divider).

---

## 3. MASTER COMPONENT, PIN & WIRING MATRIX (PROJECTS 01–36)

*Status Legend:*  
- **Verified:** Fully implemented in dedicated firmware `.ino` and verified against dashboard REST API client.  
- **Provisional:** Alternative pin mapping supported by firmware `#define` configuration for modular hardware variations.

| Project ID & Name | Primary Sensor / Actuator | Signal Type | NodeMCU Pin & GPIO | Supply Voltage & Current | Driver / Protection Circuitry | Mapping Status |
|:---|:---|:---|:---|:---|:---|:---:|
| **01. TERRASCAN X ELITE** | HC-SR04 Ultrasonic + SG90 Servo | Digital Pulse + 50Hz PWM | Trig: D1 (GPIO5), Echo: D2 (GPIO4), Servo: D4 (GPIO2) | 5.0V Ext (Servo: 500mA peak, Sensor: 15mA) | 1kΩ + 2kΩ Echo voltage divider (5V &rarr; 3.3V); Separate 5V servo rail | **Verified** |
| **02. RAINWATCH AI** | Resistive Rain Grid + LM393 Comparator | Analog ADC + Digital DO | DO: D8 (GPIO15), AO: A0 / ADS1115 AIN1 | 3.3V VCC (15mA) | Onboard LM393 comparator with sensitivity potentiometer | **Verified** |
| **03. TerraIQ** | Capacitive Soil Moisture Sensor v1.2 | Analog Voltage (1.2V–3.0V) | AO: A0 (ADC0) or ADS1115 AIN3 | 3.3V VCC (5mA) | Corrosion-resistant capacitive PCB tracks (NE555 timer oscillator) | **Verified** |
| **04. ATMOS AI** | DHT22 / AM2302 Environmental Sensor | Single-Bus Proprietary Digital | Data: D4 (GPIO2) or D7 (GPIO13) | 3.3V–5.0V VCC (1.5mA reading) | 4.7kΩ to 10kΩ metal-film pull-up resistor to 3.3V | **Verified** |
| **05. Smart Air Quality** | MQ-135 Gas / Air Quality Sensor | Analog Voltage | AO: A0 (ADC0) or ADS1115 AIN0 | 5.0V VCC (Heater draws 150mA continuous) | Separate 5V regulated rail; 24h burn-in stabilization required | **Verified** |
| **06. Gas Leakage Detector** | MQ-2 Flammable Gas (LPG/Propane) | Analog Voltage + Digital DO | AO: A0 / ADS1115 AIN1, DO: D8 (GPIO15) | 5.0V VCC (Heater draws 150mA continuous) | Dedicated 5V supply; NPN transistor buffer for alarm buzzer | **Verified** |
| **07. LDR Light Monitor** | GL5528 Photoresistor (LDR) | Analog Voltage Divider | AO: A0 (ADC0) | 3.3V VCC (<1mA) | 10kΩ metal-film resistor in voltage divider configuration | **Verified** |
| **08. Digital Thermometer** | Maxim DS18B20 OneWire Sensor | Maxim 1-Wire Digital Bus | Data: D6 (GPIO12) | 3.0V–5.5V VCC (1.5mA active) | 4.7kΩ pull-up resistor between Data and 3.3V; Waterproof probe | **Verified** |
| **09. Water Level Monitor** | HC-SR04 Ultrasonic Transducer | Digital Pulse Duration | Trig: D1 (GPIO5), Echo: D2 (GPIO4) | 5.0V VCC (15mA) | 1kΩ / 2kΩ resistor divider on Echo pin to protect 3.3V GPIO | **Verified** |
| **10. Water Flow Meter** | YF-S201 Hall-Effect Turbine | Digital Frequency Square Wave | Pulse: D5 (GPIO14 - Interrupt) | 5.0V VCC (15mA) | 4.7kΩ pull-up resistor; 1kΩ series resistor to GPIO14 | **Verified** |
| **11. TDS Water Quality** | Analog Total Dissolved Solids Probe | Analog AC Inverted Signal | AO: A0 (ADC0) or ADS1115 AIN2 | 3.3V–5.5V VCC (6mA) | Signal transmitter board generates high-frequency AC to stop electrolysis | **Verified** |
| **12. Vibration & Tilt** | SW-420 Switch + MPU-6050 6-Axis IMU | Digital DO + I²C Bus | SW-420: D8 (GPIO15), I²C: D1 (SCL), D2 (SDA) | 3.3V VCC (4mA) | 4.7kΩ pull-up resistors on I²C lines; LM393 sensitivity trimmer | **Verified** |
| **13. Plant Watering** | Capacitive Soil Probe + Submersible DC Pump | Analog Input + Relay Output | Soil: A0, Pump Relay: D1 (GPIO5) | 5.0V VCC (Pump: 500mA peak, 3.3V logic) | 1-Channel optoisolated relay (Active-LOW); 1N4007 flyback diode on motor | **Verified** |
| **14. Water Tank Controller** | HC-SR04 + Dual Relays + Float Switch | Ultrasonic Pulse + Relays + Switch | Trig: D1, Echo: D2, Relay: D5, Float: D6 | 5.0V VCC (Relays: 140mA, Sensor: 15mA) | 1kΩ/2kΩ divider on Echo; Optoisolated dual relay driver | **Verified** |
| **15. Smart Street Light** | LDR Photoresistor + PIR + N-MOSFET | Analog In + Digital In + PWM Out | LDR: A0, PIR: D2 (GPIO4), MOSFET: D1 (GPIO5) | 12V DC for LED Array; 5V/3.3V logic | IRLZ44N Logic-Level N-Channel MOSFET with 100Ω gate resistor & 10kΩ pulldown | **Verified** |
| **16. Home Automation** | 4-Channel Optocoupled Relay Board | Active-LOW Digital Outputs | Relay 1: D1, Relay 2: D2, Relay 3: D5, Relay 4: D6 | 5.0V VCC external via JD-VCC (300mA all active) | Optoisolators provide 2500V isolation between ESP8266 and relay coils | **Verified** |
| **17. Fan Speed Controller** | IRLZ44N MOSFET + Tachometer Pulse | 1kHz PWM Out + Interrupt Pulse In | PWM Gate: D1 (GPIO5), Tach: D3 (GPIO0) | 12V DC Fan (1A max); 3.3V logic | MOSFET driver with 1N4007 clamp diode; 10kΩ pull-up on tachometer line | **Verified** |
| **18. Smart Exhaust Fan** | DHT22 Climate + 1-Channel 10A Relay | Single-Bus Digital + Relay Output | DHT22: D7 (GPIO13), Relay: D1 (GPIO5) | 5.0V VCC (Relay: 70mA); 12V/230V fan load | Active-LOW relay driver with optocoupler; 4.7kΩ pull-up on DHT22 | **Verified** |
| **19. Automatic Door** | Sharp IR Proximity + SG90 Servo | Digital Proximity + 50Hz PWM | IR DO: D2 (GPIO4), Servo: D1 (GPIO5) | 5.0V VCC external (Servo peak 500mA) | Dedicated 5V servo supply with 220µF buffer capacitor; Common GND | **Verified** |
| **20. Servo Web Control** | TowerPro SG90 / MG996R Servo | 50Hz PWM Pulse (500µs–2500µs) | PWM: D1 (GPIO5) | 5.0V–6.0V external (MG996R up to 1.5A stall) | Signal wire direct to D1; External 5V 2A regulator; Shared GND | **Verified** |
| **21. DC Motor Panel** | L298N Dual H-Bridge Motor Driver | PWM Speed + 2× Direction GPIOs | ENA: D1 (GPIO5), IN1: D6 (GPIO12), IN2: D7 (GPIO13) | 7.0V–15.0V motor supply via VMS; 5V logic | Internal clamp diodes on L298N; Remove 5V onboard jumper if VMS > 12V | **Verified** |
| **22. Stepper Controller** | A4988 / DRV8825 Bipolar Stepper Driver | Step Pulse + Direction + Enable | STEP: D6 (GPIO12), DIR: D7 (GPIO13), EN: D0 (GPIO16) | 8.0V–35.0V motor rail; 3.3V logic | 100µF electrolytic capacitor across VMOT/GND; Current limit set via VREF | **Verified** |
| **23. Relay Dashboard** | PCF8574 I²C Expander or 8-Ch Relays | I²C Bus (0x27) / 8× Digital Out | SCL: D1 (GPIO5), SDA: D2 (GPIO4) | 5.0V VCC external (560mA with all coils on) | PCF8574 open-drain outputs sink current to optocoupled relay inputs | **Verified** |
| **24. Smart Greenhouse** | DHT22 + Soil + LDR + Fan + Pump + Vent | Quad-Sensor + Dual Relay + Servo | SCL: D1, SDA: D2, DHT: D4, Soil: A0, Vent: D8 | 5.0V VCC (1.2A all systems active); 12V pump/fan | Multi-rail external supply (12V & 5V); Optoisolated relay bank | **Verified** |
| **25. Smart Parking** | HC-SR04 Sonar + SG90 Servo Barrier | Digital Pulse Duration + 50Hz PWM | Trig: D1 (GPIO5), Echo: D2 (GPIO4), Servo: D5 (GPIO14) | 5.0V VCC external (Servo: 500mA) | 1kΩ/2kΩ divider on Echo; Separate 5V servo rail | **Verified** |
| **26. RFID Attendance** | MFRC522 13.56MHz Contactless Reader | High-Speed SPI (10MHz max) | SCK: D5, MISO: D6, MOSI: D7, SS: D8, RST: D3 | **3.3V VCC STRICT** (Max 30mA; 5V burns chip!) | Direct 3.3V SPI lines; NPN transistor (2N2222) buffer for 5V buzzer chime | **Verified** |
| **27. RFID Door Access** | 4×4 Matrix Keypad / RC522 + Solenoid | Digital Scan / SPI + Solenoid Relay | Relay: D1 (GPIO5), LED: D2 (GPIO4), Buzzer: D8 (GPIO15) | 12V 1.0A for Solenoid Lock; 5V/3.3V logic | 1-Channel optocoupled relay with 1N4007 flyback diode across solenoid coil | **Verified** |
| **28. Smart Dustbin** | HC-SR04 (Depth) + IR Proximity + Servo | Ultrasonic Pulse + Digital DO + PWM | Trig: D1 (GPIO5), Echo: D2 (GPIO4), IR: D6, Servo: D5 | 5.0V VCC external (Servo 500mA) | 1kΩ/2kΩ divider on Echo; 100µF capacitor across 5V servo rail | **Verified** |
| **29. Fire & Smoke Alert** | MQ-2 Gas/Smoke + Flame Sensor + Siren | Analog Voltage + Digital DO + Siren | MQ-2: A0 (via divider), Flame DO: D1, Siren: D6 (GPIO12) | 5.0V VCC (MQ-2 heater 150mA continuous) | Dedicated 5V heater rail; 2N2222 transistor buffer for 5V high-decibel siren | **Verified** |
| **30. Intrusion Alarm** | HC-SR501 PIR Motion + Piezo Siren | 3.3V TTL Digital In + Digital Out | PIR OUT: D5 (GPIO14), Siren: D1 (GPIO5), LED: D2 (GPIO4) | 5.0V VCC (HC-SR501 internal 3.3V reg; 65µA quiescent) | Direct 3.3V TTL to D5; 2N2222 transistor driver for piezo siren | **Verified** |
| **31. Visitor Counter** | Dual IR Break-Beam Sensors (Beams A & B) | Active-LOW Digital Interrupts | Beam A: D1 (GPIO5), Beam B: D2 (GPIO4), LED: D6 (GPIO12) | 3.3V–5.0V VCC (15mA per sensor pair) | 10kΩ pull-up on open-collector outputs; 100nF hardware de-glitch capacitor | **Verified** |
| **32. Smart Energy Meter** | Peacefair PZEM-004T v3.0 AC Power | Optoisolated TTL UART (9600 baud) | RX: D5 (GPIO14), TX: D6 (GPIO12) via SoftwareSerial | 5.0V VCC (PZEM logic); 80V–260VAC high-voltage | Built-in 2.5kV galvanic optoisolation; Current Transformer clamped on LIVE only | **Verified** |
| **33. Battery Monitor** | Precision Metal-Film Resistor Divider | Analog Voltage (Scaled 0–3.3V) | Divider Out: A0 (ADC0) | Battery rail (3.0V to 16.8V max under test) | 100kΩ (top) + 33kΩ (bottom) 1% metal-film divider; 100nF filter capacitor | **Verified** |
| **34. Solar Panel Monitor** | TI INA219 High-Side Power Sensor | I²C Bus (Address 0x40) | SCL: D1 (GPIO5), SDA: D2 (GPIO4) | 3.3V–5.0V logic; 0–26V DC bus, ±3.2A max current | Onboard 0.1Ω 1% current shunt resistor; Direct 3.3V I²C connection | **Verified** |
| **35. Digital Notice Board** | SSD1306 0.96" 128×64 Monochrome OLED | I²C Bus (Address 0x3C) | SCL: D1 (GPIO5), SDA: D2 (GPIO4), Buzzer: D5 (GPIO14) | 3.3V VCC (20mA all pixels lit) | Direct 3.3V I²C connection; Onboard SSD1306 charge pump | **Verified** |
| **36. Room Occupancy** | HLK-LD2410 24GHz FMCW mmWave Radar | UART (256000 baud) or Digital DO | RX: D7 (GPIO13), TX: D8 (GPIO15) or Out: D5 (GPIO14) | 5.0V VCC (79mA average, 120mA peak) | Logic level compatible (3.3V TTL UART); Dedicated 5V external power rail | **Verified** |

---

## 4. POWER DISTRIBUTION & ELECTRICAL SAFETY RULES

1. **Common Ground Mandate:** Whenever external power supplies (e.g. 5V 2A for servos, 12V for motors/LEDs) are used, connect all DC ground (-) lines directly to the ESP8266 `GND` pin. Without a shared common reference ground, digital control signals float, causing jitter, misfires, or non-responsive circuits.
2. **Inductive Flyback Clamping:** All inductive loads (relays, DC motors, solenoids) MUST have a **1N4007 silicon diode placed in reverse-bias across their terminals** (Cathode/stripe to Positive, Anode to Ground). When power disconnects, collapsing magnetic fields induce reverse voltages exceeding 100V that will instantly destroy microcontroller GPIOs and driver MOSFETs.
3. **5V Signal Level Shifting:** The ESP8266 is strictly a 3.3V logic device. When interfacing 5V sensors with digital pulse outputs (such as HC-SR04 Echo), construct a simple **resistor voltage divider (1kΩ in series from Echo to GPIO, and 2kΩ from GPIO to GND)** to drop 5.0V to an electrically safe 3.33V ($5.0 \times \frac{2}{3} \approx 3.33\text{V}$).
4. **Mains High-Voltage Caution (Project 32):** The PZEM-004T measures 110V/230V AC lines. Ensure all AC screw terminals are enclosed in an insulated junction box. Never touch bare copper wiring while energized. Clamp the Current Transformer (CT) around the **Phase (Live) conductor only**, never around both Live and Neutral simultaneously.
