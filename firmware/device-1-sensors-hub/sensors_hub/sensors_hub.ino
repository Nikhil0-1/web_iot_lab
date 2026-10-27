/**
 * =============================================================================
 * TECH IOT WARRIORS — DEVICE 1: SENSORS & MONITORING HUB
 * IoT Projects Lab (Projects 01 to 12)
 *
 * Board: ESP8266 NodeMCU v2 / v3 (ESP-12E / ESP-12F)
 * Supported Projects:
 *   01. TERRASCAN X ELITE — HC-SR04 Ultrasonic Radar with Azimuth Servo
 *   02. RAINWATCH AI — Rain Detection & Intensity Gauging
 *   03. TerraIQ — Capacitive Soil Moisture Monitoring
 *   04. ATMOS AI — DHT22 Environmental Climate Station
 *   05. Smart Air Quality Monitor — MQ-135 Gas Telemetry
 *   06. Gas Leakage Detector — MQ-2 Flammable Gas Warning
 *   07. LDR Light Intensity Monitor — Photoresistor Sensing
 *   08. Digital Thermometer — DS18B20 OneWire Sensor
 *   09. Water Level Monitor — Overhead Ultrasonic Headspace
 *   10. Water Flow Meter — YF-S201 Hall-Effect Pulse Meter
 *   11. TDS Water Quality Monitor — Analog TDS Dissolved Solids
 *   12. Vibration & Tilt Monitor — MPU-6050 6-Axis IMU & SW-420
 * =============================================================================
 */

#include <Arduino.h>
#include "config.h"
#include "pin_config.h"
#include "calibration.h"
#include "telemetry.h"
#include "sensor_manager.h"
#include "wifi_manager.h"
#include "web_api.h"

void setup() {
  // 1. Initialize Serial Telemetry Port
  Serial.begin(SERIAL_BAUD_RATE);
  delay(150);

  Serial.println();
  Serial.println(F("========================================================="));
  Serial.println(F("  TECH IOT WARRIORS — DEVICE 1: SENSORS & MONITORING HUB"));
  Serial.print  (F("  Firmware Version: ")); Serial.println(FIRMWARE_VERSION);
  Serial.print  (F("  Device ID:        ")); Serial.println(DEVICE_ID);
  Serial.println(F("  Projects:         01 to 12 (Category A)"));
  Serial.println(F("========================================================="));

  // 2. Initialize Persistent Calibration Subsystem
  calibrationManager.begin();

  // 3. Initialize Sensor Hardware Subsystem & Pins
  sensorManager.begin();

  // 4. Connect to Wi-Fi Network / Launch AP Fallback
  wifiManager.begin();

  // 5. Start Embedded REST API Web Server
  webApiServer.begin();

  Serial.println(F("[SYSTEM] Initialization complete. Entering non-blocking telemetry loop."));
}

void loop() {
  // 1. Keep network connection and mDNS alive
  wifiManager.update();

  // 2. Poll non-blocking sensor acquisition schedules
  sensorManager.update();

  // 3. Process incoming HTTP client requests
  webApiServer.update();
}
