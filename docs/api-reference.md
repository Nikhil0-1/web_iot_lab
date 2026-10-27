# IoT Projects Lab — Category B: REST API Reference
**Standardized JSON Endpoints for ESP8266 Firmware (Projects 13–24)**

---

## 1. Global Conventions & CORS
All ESP8266 firmware in Category B implements standard HTTP REST endpoints on port 80. Every endpoint includes Cross-Origin Resource Sharing (CORS) headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`
- Content-Type: `application/json`

---

## 2. API Endpoints by Project

### Project 13: Automatic Plant Watering
- `GET /api/status` &rarr; `{"project":"plant-watering", "moisture": 45.2, "pump": false, "auto": true, "threshold": 35}`
- `POST /api/pump` &rarr; Body `{"state": true|false}`
- `POST /api/threshold` &rarr; Body `{"threshold": 40}`

### Project 14: Smart Water Tank Controller
- `GET /api/status` &rarr; `{"project":"water-tank", "fill": 65, "volume": 325.0, "distance": 35.0, "pump": false, "auto": true}`
- `POST /api/pump` &rarr; Body `{"state": true|false}`
- `POST /api/thresholds` &rarr; Body `{"low": 20, "high": 85}`

### Project 15: Smart Street Light
- `GET /api/status` &rarr; `{"project":"street-light", "lux": 420, "lightOn": false, "brightness": 0, "autoMode": true}`
- `POST /api/control` &rarr; Body `{"autoMode": true|false, "lightOn": true|false, "brightness": 0-100}`

### Project 16: Wi-Fi Home Automation
- `GET /api/status` &rarr; `{"project":"home-automation", "relays":[false, false, false, false], "uptimeSec": 120}`
- `POST /api/relay` &rarr; Body `{"channel": 0-3, "state": true|false}`
- `POST /api/all` &rarr; Body `{"state": true|false}`

### Project 17: Fan Speed Controller
- `GET /api/status` &rarr; `{"project":"fan-controller", "speed": 50, "pwmDuty": 511, "rpmEstimate": 1400}`
- `POST /api/speed` &rarr; Body `{"speed": 0-100}`

### Project 18: Smart Exhaust Fan
- `GET /api/status` &rarr; `{"project":"smart-exhaust-fan", "temperature": 27.5, "humidity": 65.0, "fanOn": false}`
- `POST /api/control` &rarr; Body `{"autoMode": true|false, "fanOn": true|false, "threshTemp": 30.0}`

### Project 19: Automatic Door Controller
- `GET /api/status` &rarr; `{"project":"automatic-door", "distance": 120.0, "servoAngle": 0, "state": "CLOSED"}`
- `POST /api/door` &rarr; Body `{"command": "OPEN" | "CLOSE"}`

### Project 20: Servo Motor Web Control
- `GET /api/status` &rarr; `{"project":"servo-control", "angle": 90, "pulseWidthUs": 1500}`
- `POST /api/angle` &rarr; Body `{"angle": 0-180}`

### Project 21: DC Motor Control Panel
- `GET /api/status` &rarr; `{"project":"dc-motor-control", "direction": "FORWARD", "speed": 75}`
- `POST /api/motor` &rarr; Body `{"direction": "FORWARD" | "REVERSE" | "BRAKE", "speed": 0-100}`

### Project 22: Stepper Motor Controller
- `GET /api/status` &rarr; `{"project":"stepper-control", "currentStep": 200, "targetStep": 200, "stepRate": 400}`
- `POST /api/move` &rarr; Body `{"target": 400, "speed": 500}`

### Project 23: Relay Control Dashboard
- `GET /api/status` &rarr; `{"project":"relay-dashboard", "relays": [false, false, false, false]}`
- `POST /api/relay` &rarr; Body `{"channel": 0-3, "state": true|false}`
- `POST /api/all` &rarr; Body `{"state": true|false}`

### Project 24: Smart Greenhouse Automation
- `GET /api/status` &rarr; `{"project":"greenhouse-automation", "temperature": 24.5, "humidity": 60.0, "moisture": 48.0, "fanOn": false, "pumpOn": false, "tankEmpty": false}`
- `POST /api/actuators` &rarr; Body `{"fanOn": true|false, "pumpOn": true|false}`
