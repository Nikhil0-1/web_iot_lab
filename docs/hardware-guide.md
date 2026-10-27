# IoT Projects Lab — Category B: Hardware & Component Guide
**Automation & Actuator Architecture for ESP8266 NodeMCU**

---

## 1. Overview of Actuator & Power Architecture

Unlike Category A (Sensor Dashboards), Category B projects interface directly with physical loads: motors, solenoids, pumps, and multi-channel relay coils. 

> [!CAUTION]
> **Power Isolation Rule:** Never power an inductive load (DC pump, motor, servo, solenoid) directly from the NodeMCU 3.3V pin. The onboard AMS1117-3.3 regulator is rated for a maximum of 800mA, of which the ESP8266 Wi-Fi radio alone draws up to 250mA during transmit bursts. Always use dedicated external supplies with common ground.

---

## 2. Master Component Matrix (Projects 13–24)

| Project | Name | Primary Actuator / Driver | Voltage / Current | GPIO Mapping |
|:---|:---|:---|:---|:---|
| **P13** | Automatic Plant Watering | 5V Optocoupled Relay + DC Submersible Pump | 5–12V DC / 350mA | Relay IN &rarr; D1 (GPIO 5), Soil &rarr; A0 |
| **P14** | Smart Water Tank Controller | 5V Relay + High-Capacity Water Pump | 12V–230V via Contactor | Relay IN &rarr; D5 (GPIO 14), Trig &rarr; D1, Echo &rarr; D2 |
| **P15** | Smart Street Light | Logic N-MOSFET (IRLZ44N) PWM Driver | 12V DC / 500mA | PWM Gate &rarr; D1 (GPIO 5), PIR &rarr; D2, LDR &rarr; A0 |
| **P16** | Wi-Fi Home Automation | 4-Channel 5V Optocoupled Relay Module | 5V Coil / Load 10A 250V AC | Ch 1–4 &rarr; D1, D2, D5, D6 |
| **P17** | Fan Speed Controller | Logic-Level MOSFET PWM Driver | 12V DC / 600mA | Gate &rarr; D1 (GPIO 5), 1 kHz PWM |
| **P18** | Smart Exhaust Fan | 5V Optocoupled Relay + 12V Duct Fan | 12V DC / 450mA | Relay IN &rarr; D1 (GPIO 5), DHT &rarr; D4 (GPIO 2) |
| **P19** | Automatic Door Controller | SG90 / MG996R Servo Motor Mechanism | 5V DC / 1.5A Peak | Servo PWM &rarr; D5 (GPIO 14), Trig &rarr; D1, Echo &rarr; D2 |
| **P20** | Servo Motor Web Control | SG90 / MG996R Micro Hobby Servo | 5V DC / 1.0A Peak | Servo PWM &rarr; D5 (GPIO 14) |
| **P21** | DC Motor Control Panel | TB6612FNG / L298N Dual H-Bridge | VM 12V DC / 1.2A | IN1 &rarr; D1, IN2 &rarr; D2, PWM &rarr; D5 |
| **P22** | Stepper Motor Controller | A4988 / DRV8825 Bipolar Stepper Carrier | VMOT 12V DC / 1.5A | STEP &rarr; D1, DIR &rarr; D2, EN &rarr; D5 |
| **P23** | Relay Control Dashboard | 4-Channel Industrial Relay Module | 5V Coil / 72mA per coil | Ch 1–4 &rarr; D1, D2, D5, D6 |
| **P24** | Smart Greenhouse | Dual Relays (Exhaust Fan + Irrigation Pump)| 5–12V DC Loads | Fan &rarr; D1, Pump &rarr; D2, Float &rarr; D5, DHT &rarr; D4 |

---

## 3. Inductive Flyback Protection
When de-energizing inductive loads (DC motors, solenoid valves, mechanical relay coils), a collapsing magnetic field induces a high-voltage reverse EMF spike that can destroy switching transistors or reset the ESP8266.
- **Relay Boards:** Use boards with onboard flyback diodes across each coil.
- **Bare DC Motors & Solenoids:** Place a **1N4007 diode** in reverse-bias directly across the motor/solenoid positive and negative terminals (cathode to positive, anode to negative).

---

## 4. Voltage Level Shifting on Inputs
The ESP8266 NodeMCU runs at **3.3V logic** and is **not 5V tolerant** on digital inputs.
- When using 5V ultrasonic sensors (HC-SR04), use a 2-resistor voltage divider (1kΩ and 2kΩ) on the Echo pin to scale 5V down to safe 3.3V.
