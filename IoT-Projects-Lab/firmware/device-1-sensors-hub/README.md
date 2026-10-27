# Device 1: Sensors & Monitoring Hub — Firmware Guide
**Tech IoT Warriors &middot; IoT Projects Lab (Projects 01 to 12)**

---

## 1. Overview
This firmware runs on a single **ESP8266 NodeMCU (ESP-12E/F)** and coordinates simultaneous or sequential telemetry acquisition across all **12 Category A sensor projects**:

| Project | Name | Hardware Sensor | Interface |
|---|---|---|---|
| **01** | TERRASCAN X ELITE | HC-SR04 Ultrasonic + SG90 Servo | D0 (Trig), D3 (Echo via 1k/2k), D4 (Servo PWM) |
| **02** | RAINWATCH AI | Rain Grid + LM393 Comparator | D8 (DO Digital) + ADS1115 AIN1 / A0 |
| **03** | TerraIQ | Capacitive Soil Moisture v1.2 | ADS1115 AIN3 (0–3.0V Analog) |
| **04** | ATMOS AI | DHT22 / AM2302 Climate Sensor | D7 (1-Wire Digital, 4.7k pull-up) |
| **05** | Smart Air Quality | MQ-135 Hazardous Gas Sensor | ADS1115 AIN0 + External 5V 150mA Heater |
| **06** | Gas Leakage Detector| MQ-2 Flammable Gas Sensor | ADS1115 AIN1 + External 5V 150mA Heater |
| **07** | LDR Light Monitor | Photoresistor Voltage Divider | A0 (Internal ADC0, 0–3.3V) |
| **08** | Digital Thermometer | DS18B20 OneWire Probe | D6 (1-Wire Digital, 4.7k pull-up) |
| **09** | Water Level Monitor | Overhead HC-SR04 Ultrasonic | D0 (Trig shared) + D8 (Echo via 1k/2k) |
| **10** | Water Flow Meter | YF-S201 Hall-Effect Flow Sensor | D5 (GPIO14, Hardware Interrupt) |
| **11** | TDS Water Quality | Titanium Probe TDS Module | ADS1115 AIN2 (0–2.3V Analog) |
| **12** | Vibration & Tilt | MPU-6050 6-Axis IMU + SW-420 | I2C (D1 SCL, D2 SDA) + D8 (Shock DO) |

---

## 2. Hardware Architecture & ADC Strategy
The ESP8266 has only **one internal analog input (A0)**. To monitor multiple analog sensors (Soil, Rain, MQ-135, MQ-2, TDS) with 16-bit precision without signal degradation, Device 1 employs an **ADS1115 16-Bit I2C ADC** on address `0x48`:
- **AIN0**: MQ-135 Air Quality Sensor
- **AIN1**: MQ-2 Gas / Rain Sensor Analog Grid
- **AIN2**: TDS Water Quality Sensor
- **AIN3**: Capacitive Soil Moisture Sensor
- **NodeMCU A0**: LDR Photoresistor (10k pull-down divider)
- **I2C Bus (D1 = SCL, D2 = SDA)**: Shared by ADS1115 (`0x48`) and MPU-6050 IMU (`0x68`)

> **[IMPORTANT] Electrical Level Shifting**:
> The ESP8266 GPIO inputs are 3.3V tolerant. Outputs from 5V devices (such as the HC-SR04 Echo pin and YF-S201 Flow pulse) **MUST pass through a voltage divider** (1kΩ in series, 2kΩ to GND: $5\text{V} \times \frac{2}{3} = 3.33\text{V}$).

---

## 3. Upload Instructions

### Option A: Arduino IDE 2.x
1. Open Arduino IDE and add the ESP8266 Board Manager URL:
   `http://arduino.esp8266.com/stable/package_esp8266com_index.json`
2. Select **Board**: `NodeMCU 1.0 (ESP-12E Module)`.
3. Install required libraries listed in `libraries.txt`.
4. Edit `config.h` to enter your 2.4 GHz Wi-Fi SSID and password:
   ```cpp
   #define DEFAULT_WIFI_SSID "YourNetworkName"
   #define DEFAULT_WIFI_PASS "YourNetworkPassword"
   ```
5. Connect your NodeMCU via Micro-USB and click **Upload**.
6. Open **Serial Monitor** at **115200 baud** to see IP address allocation.

### Option B: PlatformIO (VS Code / CLI)
```bash
cd firmware/device-1-sensors-hub
pio run --target upload
pio device monitor -b 115200
```

---

## 4. REST API Contract

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Liveness and uptime check |
| `/api/device` | GET | Hardware metadata and supported project list |
| `/api/telemetry` | GET | Snapshot of all 12 projects' live readings |
| `/api/sensors` | GET | Diagnostic health status for all 12 sensors |
| `/api/readings?project=01` | GET | Single project reading (compatible with project dashboards) |
| `/api/config` | GET / POST | Read or update persistent calibration parameters |
| `/api/command` | POST | Execute sensor control commands |

### Example Command Payloads:
```json
// Reset flow meter totalizer:
POST /api/command
{"command": "flow_reset_total"}

// Enable radar sweep:
POST /api/command
{"command": "radar_sweep_enable"}
```
