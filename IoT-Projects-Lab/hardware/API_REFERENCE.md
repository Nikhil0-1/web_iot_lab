# Tech IoT Warriors — REST API Reference

## Dual Device API Architecture

Both ESP8266 devices expose identical REST API structures. The web dashboards auto-detect the active project and route requests accordingly.

---

## Common Endpoints (Both Devices)

### `GET /api/health`
Health check endpoint for connection testing.

**Response:**
```json
{
  "status": "ok",
  "uptime_ms": 125000,
  "free_heap": 34520,
  "wifi_rssi": -45
}
```

### `GET /api/device`
Device identity and capability verification.

**Response:**
```json
{
  "device_id": "esp8266-sensors-hub-01",
  "device_type": "sensors-hub",
  "firmware": "Tech IoT Warriors Sensors Hub",
  "version": "2.4.0",
  "projects": ["01","02","03","04","05","06","07","08","09","10","11","12"],
  "mdns": "sensors-hub",
  "ip": "192.168.1.100"
}
```

### `GET /api/readings`
Retrieve the latest sensor readings for the currently active project.

**Response (example for Project 01 — Ultrasonic Radar):**
```json
{
  "project_id": "01",
  "timestamp": 125000,
  "data": {
    "distance_cm": 42.5,
    "angle_deg": 90,
    "sweep_active": true,
    "echo_quality": "strong"
  }
}
```

### `GET /api/telemetry`
Bulk telemetry dump of all available sensor data.

**Response:**
```json
{
  "device_id": "esp8266-sensors-hub-01",
  "uptime_ms": 125000,
  "active_project": "01",
  "sensors": {
    "radar": { "distance_cm": 42.5, "angle_deg": 90 },
    "rain": { "digital": 0, "analog": 512, "intensity_pct": 25.0 },
    "soil": { "raw": 1024, "moisture_pct": 65.0 },
    "dht22": { "temp_c": 25.5, "humidity_pct": 60.0, "heat_index": 26.2 },
    "mq135": { "raw": 300, "ppm": 150.0, "quality": "Good" },
    "mq2": { "raw": 200, "ppm": 100.0, "alarm": false },
    "ldr": { "raw": 680, "lux": 450.0, "label": "Daylight" },
    "ds18b20": { "temp_c": 24.8 },
    "water_level": { "distance_cm": 15.0, "level_pct": 75.0 },
    "flow": { "rate_lpm": 2.5, "total_liters": 125.0, "pulse_count": 56250 },
    "tds": { "raw": 450, "ppm": 320.0, "quality": "Acceptable" },
    "imu": { "ax": 0.02, "ay": -0.01, "az": 9.78, "gx": 0.5, "gy": -0.3, "gz": 0.1, "tilt_deg": 2.1, "vibration": false }
  }
}
```

### `GET /api/config`
Retrieve current device configuration.

### `POST /api/config`
Update device configuration (Wi-Fi credentials, sampling intervals, etc.).

**Request Body:**
```json
{
  "wifi_ssid": "MyNetwork",
  "wifi_pass": "MyPassword",
  "poll_interval_ms": 1500
}
```

### `POST /api/command`
Send control commands to the device.

**Request Body:**
```json
{
  "cmd": "set_active_project",
  "value": "01"
}
```

---

## Device 2 — Automation Hub Specific Endpoints

### `POST /api/relay`
Control individual relay channels.

**Request Body:**
```json
{
  "channel": 0,
  "state": true
}
```

### `POST /api/pwm`
Set PWM duty cycle for motor/LED control.

**Request Body:**
```json
{
  "pin": "D5",
  "duty": 512,
  "frequency": 1000
}
```

### `POST /api/servo`
Set servo motor angle.

**Request Body:**
```json
{
  "angle": 90,
  "speed": 50
}
```

### `POST /api/motor`
Control DC motor direction and speed.

**Request Body:**
```json
{
  "direction": "forward",
  "speed": 75,
  "duration_ms": 0
}
```

### `POST /api/stepper`
Control stepper motor position.

**Request Body:**
```json
{
  "steps": 200,
  "direction": "cw",
  "rpm": 60
}
```

### `POST /api/emergency-stop`
Immediately stop all actuators and reset all relays.

**Response:**
```json
{
  "status": "stopped",
  "relays_reset": 8,
  "pwm_reset": true,
  "servo_reset": true
}
```

---

## Dashboard → Device Communication Flow

```
┌─────────────────┐     HTTP GET /api/readings     ┌────────────────┐
│   Web Dashboard  │ ◄──────────────────────────── │  ESP8266 Device │
│  (Browser Tab)   │ ────────────────────────────► │  (REST Server)  │
│                  │     HTTP POST /api/command     │                │
└─────────────────┘                                └────────────────┘
        │                                                 │
        │  1. Dashboard opens in Simulation mode          │
        │  2. User clicks "Hardware" mode toggle          │
        │  3. Dashboard prompts for ESP8266 IP address    │
        │  4. GET /api/health → verify connection         │
        │  5. GET /api/device → verify project identity   │
        │  6. Start polling GET /api/readings (1.5s)      │
        │  7. Display live data on dashboard              │
        │  8. User sends commands → POST /api/command     │
        └─────────────────────────────────────────────────┘
```

## CORS Headers

All endpoints return these CORS headers for cross-origin browser access:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Accept
```

## Error Responses

All errors follow this format:
```json
{
  "error": true,
  "code": 404,
  "message": "Endpoint not found"
}
```

| HTTP Code | Meaning |
|-----------|---------|
| 200 | Success |
| 400 | Bad Request (invalid JSON or parameters) |
| 404 | Endpoint not found |
| 500 | Internal sensor error |
| 503 | Device busy (sensor warmup / calibration in progress) |

---

## Category C — Smart Systems Endpoints (Projects 25–36)

### Project 25 · Smart Parking Assistant
- `GET /api/parking` — Returns bay occupancy states, available spaces, and gate barrier angle.
- `POST /api/barrier` — Payload: `{"action": "open" | "close" | "auto"}`.

### Project 26 · RFID Attendance System
- `GET /api/attendance` — Returns recent RFID card scans, student registry mapping, and daily count.
- `POST /api/scan` — Simulates or logs an RFID UID payload `{"uid": "04A1B2C3"}`.

### Project 27 · RFID Door Access
- `GET /api/access` — Returns solenoid lock status (`locked`/`unlocked`), attempts count, lockout timer.
- `POST /api/unlock` — Payload: `{"pin": "1234"}` or `{"cardUid": "A4B5C6"}`.

### Project 28 · Smart Dustbin
- `GET /api/dustbin` — Returns lid position, ultrasonic fill level percentage, and IR proximity status.
- `POST /api/lid` — Payload: `{"action": "open" | "close" | "auto"}`.

### Project 29 · Fire & Smoke Alert
- `GET /api/fire` — Returns MQ-2 smoke PPM, flame detector status, threshold, and alarm state.
- `POST /api/threshold` — Payload: `{"smokeThreshold": 350}`.

### Project 30 · Intrusion Detection Alarm
- `GET /api/alarm` — Returns PIR motion state, armed status, siren state, and zone telemetry.
- `POST /api/arm` — Payload: `{"armed": true | false}`.

### Project 31 · Visitor Counter
- `GET /api/visitor` — Returns count of total entries, exits, real-time occupancy, and beam statuses.
- `POST /api/reset` — Resets visitor counters to zero.

### Project 32 · Smart Energy Meter
- `GET /api/energy` — Returns PZEM-004T AC voltage (V), current (A), active power (W), energy (kWh), power factor, frequency (Hz).
- `POST /api/reset_energy` — Clears the cumulative energy accumulator.

### Project 33 · Battery Voltage Monitor
- `GET /api/battery` — Returns measured DC voltage, estimated state of charge %, health tier, min/max cutoff.
- `POST /api/calibrate` — Payload: `{"vRef": 3.30, "dividerRatio": 4.0}`.

### Project 34 · Solar Panel Monitor
- `GET /api/solar` — Returns INA219 bus voltage (V), shunt current (mA), power (W), cumulative Wh, irradiance tier.

### Project 35 · Digital Notice Board
- `GET /api/notice` — Returns current active announcement text, scroll speed, and display orientation.
- `POST /api/notice` — Payload: `{"message": "Notice text here", "speed": 3}`.

### Project 36 · Smart Room Occupancy
- `GET /api/occupancy` — Returns mmWave LD2410 target state (`moving`, `stationary`, `empty`), dwell time, target distance.

