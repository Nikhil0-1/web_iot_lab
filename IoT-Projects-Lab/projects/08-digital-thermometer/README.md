# Project 04: Digital Thermometer

## 1. Project Overview
The **Digital Thermometer** is an educational IoT temperature monitoring system designed for the ESP8266 NodeMCU and DS18B20 1-Wire digital temperature sensor. It offers an animated mercury thermometer visualization, high-resolution time-series charting, statistical analysis (min, max, average), and a dual-mode engine capable of running both local physical hardware and browser-based physics simulation.

## 2. Features
- **Fluid Mercury Animation:** Fluid column height dynamically responds to temperature changes with thermal inertia modeling.
- **Dual Units:** Real-time conversion between Celsius (°C) and Fahrenheit (°F).
- **Time-Series Charting:** Zero-dependency canvas time-series trend line with live statistical summaries.
- **CSV Data Export:** One-click download of all collected data samples.
- **Robust REST API:** ESP8266 HTTP server exposing `/api/health`, `/api/device`, `/api/readings`, and `/api/config` with CORS support.
- **Fault Detection:** Immediate visual notification when sensor disconnection or CRC faults occur.

## 3. Hardware List
- 1x ESP8266 NodeMCU v2 or v3
- 1x DS18B20 Digital Temperature Sensor (TO-92 or waterproof probe)
- 1x 4.7kΩ resistor (1/4W)
- 1x Solderless breadboard
- 3x Male-to-Male jumper wires
- 1x Micro-USB cable

## 4. Wiring and Pin Mapping
- **GND** -> ESP8266 GND
- **DQ (Data)** -> ESP8266 Pin D4 (GPIO2)
- **VDD** -> ESP8266 3.3V
- **Pull-up Resistor:** Place 4.7kΩ between Data (Pin 2) and 3.3V (Pin 3).

## 5. Required Arduino Libraries
- **OneWire** (by Jim Studt, Tom Pollard, Paul Stoffregen)
- **DallasTemperature** (by Miles Burton)
- **ESP8266WiFi** & **ESP8266WebServer** (included with ESP8266 Arduino Core)

## 6. Firmware Upload Instructions
1. Install Arduino IDE (version 1.8.19+ or 2.x).
2. Add ESP8266 board support via Preferences URL: `http://arduino.esp8266.com/stable/package_esp8266com_index.json`.
3. Select **Tools > Board > ESP8266 Boards > NodeMCU 1.0 (ESP-12E Module)**.
4. Select **Tools > Port** corresponding to your USB COM port.
5. Open `firmware/digital_thermometer.ino`.
6. Click **Upload**.

## 7. Wi-Fi Configuration
In `digital_thermometer.ino`, update:
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```
If connection to your router fails, the device automatically launches an Access Point named `ESP8266-Thermometer-AP` with password `password123`.

## 8. Finding the ESP8266 IP
Open the Arduino IDE **Serial Monitor** at **115200 baud**. When the board boots, it outputs:
```
Wi-Fi Connected!
IP Address: http://192.168.1.150
```

## 9. Opening the Dashboard
Open `index.html` in any modern web browser or serve via:
```bash
python -m http.server 8000
```
Then navigate to: `http://localhost:8000/projects/04-digital-thermometer/`

## 10. Connecting Hardware
1. In the dashboard top bar, click the **Hardware** toggle.
2. In the right panel, confirm or enter your ESP8266 IP (e.g., `http://192.168.1.150`).
3. Click **Test Link**. Once verified, click **Connect**.
4. Live measurements from the DS18B20 will immediately update the column and chart.

## 11. Running Simulation
1. Switch toggle to **Simulation**.
2. Select scenarios: *Normal Ambient*, *Cold Storage*, *High Heat Alert*, or *Sensor Fault*.
3. Use the **Manual Test Slider** to smoothly inject arbitrary temperatures from -10°C to 60°C.
4. Adjust the speed multiplier (0.5x to 5.0x) to test fast transitions.

## 12. Calibration
The DS18B20 is factory laser-trimmed and calibrated to ±0.5°C accuracy from -10°C to +85°C. For precision laboratory work, compare readings against a certified reference probe at 0°C (ice bath) and 100°C (boiling point).

## 13. Troubleshooting
- **Dashboard reports `-127.00 °C` or Fault State:** The sensor is either disconnected or missing the 4.7kΩ pull-up resistor.
- **Connection Timed Out:** Ensure your computer and ESP8266 are on the same Wi-Fi subnet.
- **CORS Error on Chrome:** When accessing via `file:///`, browsers block cross-origin requests to local IP. Serve via `python -m http.server 8000`.

## 14. Known Limitations
- The DS18B20 conversion time at 12-bit resolution is 750ms; reading faster than 1 second yields duplicate values.
- Parasite power mode is not enabled in this sketch; 3-wire connection is required.

## 15. Safety Notes
- Do not expose the bare TO-92 plastic transistor casing directly to conductive liquids; use the waterproof stainless steel probe variant for liquid immersion.
- Keep operational temperatures within -55°C to +125°C.
