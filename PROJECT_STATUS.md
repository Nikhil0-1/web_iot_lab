# Tech IoT Warriors — PROJECT STATUS MATRIX

**Total Projects:** 24  
**Category A (Sensors & Monitoring):** 12 Projects (01–12)  
**Category B (Automation & Control):** 12 Projects (13–24)  
**Overall Readiness:** 100% Functional & Verified

---

## 1. Master Status Table

| # | Project Name | Category | Primary Sensor / Actuator | Web Dashboard | Offline Simulation | ESP8266 Firmware | Wiring Docs |
|:---|:---|:---|:---|:---:|:---:|:---:|:---:|
| **01** | **TERRASCAN X ELITE** | Category A | HC-SR04 Ultrasonic Radar | Ready | Ready | Ready | Ready |
| **02** | **RAINWATCH AI** | Category A | Rain Grid & LM393 Comparator | Ready | Ready | Ready | Ready |
| **03** | **TerraIQ** | Category A | Capacitive Soil Probe v1.2 | Ready | Ready | Ready | Ready |
| **04** | **ATMOS AI** | Category A | DHT22 Climate Sensor | Ready | Ready | Ready | Ready |
| **05** | **Smart Air Quality Monitor** | Category A | MQ-135 Gas / Air Quality | Ready | Ready | Ready | Ready |
| **06** | **Gas Leakage Detector** | Category A | MQ-2 / MQ-5 Transducer + Buzzer | Ready | Ready | Ready | Ready |
| **07** | **LDR Light Intensity Monitor** | Category A | Photoresistor (LDR) Voltage Divider | Ready | Ready | Ready | Ready |
| **08** | **Digital Thermometer** | Category A | DS18B20 1-Wire Precision Probe | Ready | Ready | Ready | Ready |
| **09** | **Water Level Monitor** | Category A | HC-SR04 Tank Ultrasonic Sensor | Ready | Ready | Ready | Ready |
| **10** | **Water Flow Meter** | Category A | YF-S201 Hall-Effect Flow Turbine | Ready | Ready | Ready | Ready |
| **11** | **TDS Water Quality Monitor** | Category A | Analog TDS Titanium Probe | Ready | Ready | Ready | Ready |
| **12** | **Vibration & Tilt Monitor** | Category A | MPU-6050 6-DoF IMU & SW-420 | Ready | Ready | Ready | Ready |
| **13** | **Automatic Plant Watering** | Category B | Capacitive Soil + Relay Pump | Ready | Ready | Ready | Ready |
| **14** | **Smart Water Tank Controller** | Category B | Ultrasonic + Dual Float Relay | Ready | Ready | Ready | Ready |
| **15** | **Smart Street Light** | Category B | LDR + PIR Motion + PWM LED | Ready | Ready | Ready | Ready |
| **16** | **Wi-Fi Home Automation** | Category B | 4-Channel Optoisolated Relay | Ready | Ready | Ready | Ready |
| **17** | **Fan Speed Controller** | Category B | Logic N-MOSFET + PWM + Tach | Ready | Ready | Ready | Ready |
| **18** | **Smart Exhaust Fan** | Category B | DHT22 Climate + Exhaust Relay | Ready | Ready | Ready | Ready |
| **19** | **Automatic Door Controller** | Category B | Ultrasonic Proximity + SG90 Servo | Ready | Ready | Ready | Ready |
| **20** | **Servo Motor Web Control** | Category B | Sub-Degree PWM Servo Actuator | Ready | Ready | Ready | Ready |
| **21** | **DC Motor Control Panel** | Category B | L298N / TB6612 H-Bridge Motor | Ready | Ready | Ready | Ready |
| **22** | **Stepper Motor Controller** | Category B | A4988 / DRV8825 Bipolar Stepper | Ready | Ready | Ready | Ready |
| **23** | **Relay Control Dashboard** | Category B | 4/8-Channel Load Relay Bank | Ready | Ready | Ready | Ready |
| **24** | **Smart Greenhouse Automation** | Category B | Quad-Sensor Multi-Actuator Hub | Ready | Ready | Ready | Ready |

---

## 2. Hardware Pinout & REST API Matrix

| # | Project Folder | Key Pinouts | REST Endpoints | JSON Fields |
|:---|:---|:---|:---|:---|
| **01** | `01-terrascan-x-elite` | D1 (Trig), D2 (Echo via divider) | `GET /api/readings`<br>`GET /api/status` | `distance_cm`, `echo_us`, `status` |
| **02** | `02-rainwatch-ai` | A0 (AO), D1 (DO) | `GET /api/readings`<br>`GET /api/status` | `intensity_pct`, `adc_raw`, `rate_mmh` |
| **03** | `03-terraiq` | A0 (AOUT) | `GET /api/readings`<br>`GET /api/status` | `moisture_pct`, `adc_raw`, `voltage` |
| **04** | `04-atmos-ai` | D4 (DHT Data) | `GET /api/readings`<br>`GET /api/status` | `temperature`, `humidity`, `heat_index` |
| **05** | `05-smart-air-quality-monitor` | A0 (AOUT) | `GET /readings`<br>`GET /device`<br>`GET /status` | `rawAdc`, `airQualityIndex`, `warmupComplete` |
| **06** | `06-gas-leakage-detector` | A0 (AOUT), D5 (Buzzer), D6 (LED) | `GET /readings`<br>`GET /status` | `rawAdc`, `ppm`, `alarmActive` |
| **07** | `07-ldr-light-intensity-monitor` | A0 (Divider) | `GET /readings`<br>`GET /status` | `rawAdc`, `percent`, `ambientTier` |
| **08** | `08-digital-thermometer` | D4 (DS18B20 Data) | `GET /readings`<br>`GET /status` | `temperatureC`, `temperatureF`, `sensorStatus` |
| **09** | `09-water-level-monitor` | D1 (Trig), D2 (Echo) | `GET /readings`<br>`GET /status` | `percent`, `liters`, `distanceCm` |
| **10** | `10-water-flow-meter` | D2 (Pulse Interrupt) | `GET /readings`<br>`GET /status` | `flowRateLpm`, `totalLiters`, `pulseCount` |
| **11** | `11-tds-water-quality-monitor` | A0 (TDS Out) | `GET /readings`<br>`GET /status` | `tdsPpm`, `voltage`, `waterTier` |
| **12** | `12-vibration-tilt-monitor` | D1 (SCL), D2 (SDA), D5 (Piezo) | `GET /readings`<br>`GET /status` | `totalG`, `pitchDeg`, `rollDeg`, `shock` |
| **13** | `13-automatic-plant-watering` | A0 (Soil), D1 (Pump Relay) | `GET /api/readings`<br>`POST /api/pump` | `moisture`, `pump`, `auto_mode` |
| **14** | `14-smart-water-tank-controller` | D1 (Trig), D2 (Echo), D5 (Relay) | `GET /api/readings`<br>`POST /api/pump` | `level_pct`, `pump`, `volume_liters` |
| **15** | `15-smart-street-light` | A0 (LDR), D2 (PIR), D1 (PWM) | `GET /api/readings`<br>`POST /api/light` | `light_pct`, `motion`, `lux` |
| **16** | `16-wifi-home-automation` | D1, D2, D5, D6 Relays | `GET /api/readings`<br>`POST /api/relay` | `relays[4]`, `master_power` |
| **17** | `17-fan-speed-controller` | D1 (PWM), D2 (Tach) | `GET /api/readings`<br>`POST /api/fan` | `duty_cycle`, `rpm`, `fan_state` |
| **18** | `18-smart-exhaust-fan` | D4 (DHT), D1 (Exhaust Relay) | `GET /api/readings`<br>`POST /api/fan` | `fan`, `temperature`, `humidity` |
| **19** | `19-automatic-door-controller` | D1/D2 (Echo), D5 (Servo) | `GET /api/readings`<br>`POST /api/door` | `state`, `angle`, `proximity_cm` |
| **20** | `20-servo-motor-web-control` | D5 (Servo PWM) | `GET /api/readings`<br>`POST /api/servo` | `angle`, `pulse_us`, `sweep` |
| **21** | `21-dc-motor-control-panel` | D1/D2 (Dir), D5 (PWM) | `GET /api/readings`<br>`POST /api/motor` | `running`, `direction`, `speed_pct` |
| **22** | `22-stepper-motor-controller` | D1 (Step), D2 (Dir), D5 (EN) | `GET /api/readings`<br>`POST /api/stepper` | `position`, `target`, `running` |
| **23** | `23-relay-control-dashboard` | D1, D2, D5, D6 Relays | `GET /api/readings`<br>`POST /api/relay` | `channels[4]`, `all_on`, `all_off` |
| **24** | `24-smart-greenhouse-automation` | D4 (DHT), A0 (Soil), D1 (Fan), D2 (Pump) | `GET /api/readings`<br>`POST /api/control` | `temp`, `humidity`, `soil`, `fan`, `pump` |
