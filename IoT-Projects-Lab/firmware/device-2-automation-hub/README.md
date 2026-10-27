# Device 2: Automation & Control Hub — Firmware Guide
**Tech IoT Warriors &middot; IoT Projects Lab (Projects 13 to 24)**

---

## 1. Overview
This firmware runs on a second dedicated **ESP8266 NodeMCU (ESP-12E/F)** and coordinates safe, optocoupled actuator control, motor drivers, and automated relays across all **12 Category B automation projects**:

| Project | Name | Actuator / Driver | Interface |
|---|---|---|---|
| **13** | Automatic Plant Watering | Submersible DC Pump via Relay 0 | PCF8574 P0 / Active-LOW Optocoupled |
| **14** | Smart Water Tank | Inflow Pump via Relay 1 | PCF8574 P1 / Active-LOW Optocoupled |
| **15** | Smart Street Light | 12V LED Array via IRLZ44N N-MOSFET | D5 (GPIO14, 1 kHz Hardware PWM) |
| **16** | Wi-Fi Home Automation | 4-Channel Mains Isolation Relays | PCF8574 P2, P3, P4, P5 |
| **17** | Fan Speed Controller | 12V Fan via Logic N-MOSFET + Tach | D5 (PWM) + D3 (Tachometer Interrupt) |
| **18** | Smart Exhaust Fan | High-Airflow Ventilation Fan Relay | PCF8574 P6 |
| **19** | Automatic Door Controller | Sliding Door Servo SG90 + Proximity IR | D8 (PWM Servo) + D0 (Proximity DO) |
| **20** | Servo Motor Web Control | Precision Robotic Micro-Actuator | D8 (GPIO15, 0°–180° Microsecond PWM) |
| **21** | DC Motor Control Panel | L298N / TB6612 Dual H-Bridge Driver | D5 (ENA PWM), D6 (IN1), D7 (IN2) |
| **22** | Stepper Motor Controller| A4988 / DRV8825 Bipolar Stepper Driver | D6 (STEP), D7 (DIR), D0 (ENABLE) |
| **23** | Relay Control Dashboard | 8-Channel Industrial Relay Bank | PCF8574 I2C (Address 0x27) |
| **24** | Smart Greenhouse | Misting Pump, Vent Servo, Heater | Hybrid: Relays P6/P7 + Servo D8 |

---

## 2. Electrical Safety & Power Isolation Rules

> **[CAUTION] NEVER POWER MOTORS OR RELAY COILS FROM ESP8266 GPIO OR 3.3V!**
> 1. Servos and DC motors draw stall currents between **1A and 3A**. Powering them from the ESP8266 silicon destroys the onboard regulator instantly.
> 2. Always connect an **external 5V / 12V regulated power supply** to the motor and driver power inputs.
> 3. Connect the external DC supply ground directly to the NodeMCU GND pin to ensure a **Common Ground reference**.
> 4. For inductive loads (DC motors, solenoids, mechanical pumps), install a **flyback diode** (e.g. 1N4007 or Schottky) across the terminals with cathode facing positive voltage.
> 5. Relay boards must be optocoupled with the `JD-VCC` jumper removed and powered by external 5V.

---

## 3. Upload Instructions

### Option A: Arduino IDE 2.x
1. Select **Board**: `NodeMCU 1.0 (ESP-12E Module)`.
2. Install `ArduinoJson` (v6.21.3+) via Library Manager.
3. Configure your Wi-Fi credentials in `config.h`:
   ```cpp
   #define DEFAULT_WIFI_SSID "YourNetworkName"
   #define DEFAULT_WIFI_PASS "YourNetworkPassword"
   ```
4. Click **Upload** and open Serial Monitor at **115200 baud**.

### Option B: PlatformIO
```bash
cd firmware/device-2-automation-hub
pio run --target upload
pio device monitor -b 115200
```

---

## 4. REST API & Actuator Commands

All commands are submitted via `POST /api/command` with JSON payload:

### Emergency Stop & Heartbeat
```json
// Trigger Emergency Stop (instantly shuts down all relays, PWM, motors):
POST /api/command
{"command": "estop_trigger", "reason": "Operator Emergency Stop"}

// Clear Emergency Stop:
POST /api/command
{"command": "estop_clear"}

// Keepalive Heartbeat (prevents 30s communication timeout):
POST /api/command
{"command": "heartbeat"}
```

### Relay Control (Projects 13, 14, 16, 18, 23, 24)
```json
// Turn ON Relay Channel 0 (Plant Pump):
POST /api/command
{"command": "relay_set", "channel": 0, "state": true}
```

### DC Motor Control (Project 21)
```json
// Run DC motor forward at 80% speed (819 / 1023):
POST /api/command
{"command": "dc_motor_set", "speed": 819, "direction": 1}
```

### Servo Control (Projects 19, 20, 24)
```json
// Set servo to 45 degrees:
POST /api/command
{"command": "servo_set", "angle": 45}
```

### Stepper Motor (Project 22)
```json
// Step 200 steps clockwise:
POST /api/command
{"command": "stepper_step", "steps": 200, "delayUs": 800}
```
