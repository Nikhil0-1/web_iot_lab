# Project 01: Smart Air Quality Monitor

## 1. Project Overview
The **Smart Air Quality Monitor** utilizes the MQ-135 electrochemical sensor to detect air pollutants including ammonia, nitrogen oxides, alcohol, benzene, smoke, and CO2. Features real-time particle visualization, preheating status detection, and relative air quality index (AQI) estimation.

## 2. Features
- **Atmospheric Particle Canvas:** Dynamic floating particle simulation where particle velocity, density, and color reflect current air purity.
- **Air Quality Tiers:** Automatic categorization into *Good*, *Moderate*, *Unhealthy*, and *Hazardous*.
- **Preheating Status:** Visual timer monitoring sensor heater warm-up state.
- **Dual Mode:** Seamless switching between physics simulation and live ESP8266 REST API data.
- **CSV Logging:** Export historical time-series logs.

## 3. Hardware List
- 1x ESP8266 NodeMCU Module
- 1x MQ-135 Gas & Air Sensor Module
- Jumper wires & Breadboard

## 4. Wiring and Pin Mapping
- **VCC** -> NodeMCU VIN (5V)
- **GND** -> NodeMCU GND
- **AOUT** -> NodeMCU A0

## 5. Arduino Libraries
- `ESP8266WiFi` & `ESP8266WebServer` (included in ESP8266 core).

## 6. Firmware Upload
1. Open `firmware/air_quality_monitor.ino` in Arduino IDE.
2. Configure your Wi-Fi SSID and Password.
3. Select board **NodeMCU 1.0 (ESP-12E Module)** and hit **Upload**.

## 7. Connecting Hardware
1. Connect ESP8266 and PC to the same Wi-Fi.
2. In the dashboard top bar, select **Hardware**.
3. Enter the device IP printed in Serial Monitor (default `http://192.168.4.1` on AP) and click **Connect**.

## 8. Simulation Mode
Switch to **Simulation** to test Good, Moderate, Unhealthy, Hazardous, or Fault states with interactive sliders.

## 9. Calibration & Limitations Note
> [!IMPORTANT]
> The MQ-135 provides relative resistance changes ($R_s/R_0$) sensitive to multiple cross-reacting gas species. Without precision laboratory calibration chambers and controlled gas references, readings represent an estimated air quality index rather than certified ppm or regulatory AQI.
