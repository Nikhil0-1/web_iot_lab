# Tech IoT Warriors — Control Center & Monitoring Suite

**Tech IoT Warriors** is an interactive, commercial-grade engineering telemetry and automation laboratory platform containing **24 independently functional projects** built for the **ESP8266 NodeMCU** microcontroller.

Each project contains a standalone HTML5/CSS3/Vanilla JavaScript dashboard equipped with realistic browser-based physics simulation, responsive instrument visualizations, time-series charting, and direct REST API connectivity for physical hardware.

---

## 🚀 The 24 Projects Directory

### CATEGORY A — SENSORS & MONITORING (01–12)

| # | Project Name | Hardware Sensor | Primary Telemetry | Folder |
|:---:|:---|:---|:---|:---|
| **01** | **TERRASCAN X ELITE** | HC-SR04 Ultrasonic Radar | Distance (2–400 cm) / 180° Radar Sweep | `projects/01-terrascan-x-elite/` |
| **02** | **RAINWATCH AI** | Rain Sensor Plate & LM393 | Rain Intensity (0–100%) & Rate (mm/h) | `projects/02-rainwatch-ai/` |
| **03** | **TerraIQ** | Capacitive Soil Probe v1.2 | Soil Moisture % & Dielectric Voltage | `projects/03-terraiq/` |
| **04** | **ATMOS AI** | DHT22 Climate Sensor | Temperature (°C/°F), Humidity, Heat Index | `projects/04-atmos-ai/` |
| **05** | **Smart Air Quality Monitor** | MQ-135 Gas / Air Quality | Air Quality Index & Baseline ADC | `projects/05-smart-air-quality-monitor/` |
| **06** | **Gas Leakage Detector** | MQ-2 / MQ-5 Gas Transducer | Combustible Gas PPM & Alarm Cutoff | `projects/06-gas-leakage-detector/` |
| **07** | **LDR Light Intensity Monitor** | Photoresistor (LDR) Divider | Relative Illuminance & Day/Night Status | `projects/07-ldr-light-intensity-monitor/` |
| **08** | **Digital Thermometer** | DS18B20 1-Wire Digital Probe | Temperature (-55°C to +125°C), Min/Max/Avg | `projects/08-digital-thermometer/` |
| **09** | **Water Level Monitor** | HC-SR04 Ultrasonic Sensor | Tank Fill %, Depth (cm), Volume (Liters) | `projects/09-water-level-monitor/` |
| **10** | **Water Flow Meter** | YF-S201 Hall-Effect Turbine | Flow Rate (L/min) & Cumulative Volume (L) | `projects/10-water-flow-meter/` |
| **11** | **TDS Water Quality Monitor** | Analog TDS Titanium Probe | Dissolved Solids (ppm) & Water Purity Class | `projects/11-tds-water-quality-monitor/` |
| **12** | **Vibration & Tilt Monitor** | MPU-6050 6-DoF IMU & SW-420 | 3-Axis Accel (g), Pitch/Roll (°), Shock Alert | `projects/12-vibration-tilt-monitor/` |

---

### CATEGORY B — AUTOMATION & CONTROL (13–24)

| # | Project Name | Hardware Actuators | Control Capabilities | Folder |
|:---:|:---|:---|:---|:---|
| **13** | **Automatic Plant Watering** | Capacitive Soil + 5V Relay Pump | Closed-loop irrigation & auto watering | `projects/13-automatic-plant-watering/` |
| **14** | **Smart Water Tank Controller** | Ultrasonic + Submersible Pump Relay | Auto reservoir fill & dry-run protection | `projects/14-smart-water-tank-controller/` |
| **15** | **Smart Street Light** | LDR + PIR Motion + PWM MOSFET LED | Ambient dusk/dawn sensing & motion boost | `projects/15-smart-street-light/` |
| **16** | **Wi-Fi Home Automation** | 4-Channel Optoisolated Relay Board | Multi-channel load toggle & master safety | `projects/16-wifi-home-automation/` |
| **17** | **Fan Speed Controller** | Logic N-MOSFET + PWM + Tachometer | 1kHz PWM throttling & RPM feedback | `projects/17-fan-speed-controller/` |
| **18** | **Smart Exhaust Fan** | DHT22 Climate + 5V Exhaust Relay | Automatic humidity/thermal extraction | `projects/18-smart-exhaust-fan/` |
| **19** | **Automatic Door Controller** | Proximity Sensor + SG90 Servo | Contactless entry, obstruction & auto-timer | `projects/19-automatic-door-controller/` |
| **20** | **Servo Motor Web Control** | SG90 / MG996R PWM Servo Motor | Sub-degree angular positioning (0–180°) | `projects/20-servo-motor-web-control/` |
| **21** | **DC Motor Control Panel** | L298N / TB6612 H-Bridge Motor Driver | Bi-directional CW/CCW speed & braking | `projects/21-dc-motor-control-panel/` |
| **22** | **Stepper Motor Controller** | A4988 / DRV8825 Bipolar Stepper | Precision step indexing, homing, coordinate jog | `projects/22-stepper-motor-controller/` |
| **23** | **Relay Control Dashboard** | 4/8-Channel Load Relay Bank | Multi-channel inching & cycle testing | `projects/23-relay-control-dashboard/` |
| **24** | **Smart Greenhouse Automation** | Quad Sensors + Dual Relay Actuators | Unified climate, irrigation & ventilation | `projects/24-smart-greenhouse-automation/` |

---

## 💻 How to Run the Dashboards

### Option 1: Direct File Launch (Zero Dependencies)
Double-click `IoT-Projects-Lab/index.html` in your file explorer to open the master launcher directly in any modern web browser (Chrome, Edge, Firefox, Safari).

### Option 2: Local HTTP Server (Recommended for Hardware Mode)
Run a local static server to enable seamless cross-origin requests to ESP8266 devices on your LAN:
```bash
# Using Python
cd IoT-Projects-Lab
python -m http.server 8000

# Open in browser:
http://localhost:8000/
```

---

## ⚡ Connecting Physical ESP8266 Hardware

1. Open the project's firmware file located at `projects/<folder>/firmware/<name>.ino` in the Arduino IDE.
2. Enter your 2.4GHz Wi-Fi credentials in `WIFI_SSID` and `WIFI_PASS`.
3. Connect your ESP8266 NodeMCU via micro-USB and click **Upload**.
4. Open the Serial Monitor at **115200 baud** to view the assigned local IP address (e.g. `http://192.168.1.50`).
5. Open the project dashboard in your browser, switch the mode toggle to **Hardware**, enter the IP address, and click **Connect**.

---

## 🧪 Automated Testing & Verification

The suite includes comprehensive automated test runners:
```bash
# Run full 24-project infrastructure verification (486 tests)
node tests/verify_all_24_projects.js

# Run Category B automation verification (219 tests)
node tests/verify_category_b.js

# Run mathematical & calculation unit tests (29 tests)
node tests/node_test_runner.js
```
Total: **734 tests, 100% pass rate**.
