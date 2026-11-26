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
 *
 * Integrated Display:
 *   0.96 inch SSD1306 I2C OLED (128x64) on D2 (SDA) and D1 (SCL)
 *   Startup IP splash screen (4 seconds) + Live multi-project rotating dashboard
 *   Branding: TechIoTWarriors
 * =============================================================================
 */

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "config.h"
#include "pin_config.h"
#include "calibration.h"
#include "telemetry.h"
#include "sensor_manager.h"
#include "wifi_manager.h"
#include "web_api.h"

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_ADDR_1 0x3C
#define OLED_ADDR_2 0x3D

static Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
static bool oledReady = false;
static unsigned long lastOledPageSwitch = 0;
static uint8_t oledPage = 0;

void initOledDisplay() {
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  Wire.setClock(100000);

  if (display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR_1) || display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR_2)) {
    oledReady = true;
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextWrap(false);

    // Boot Banner with TechIoTWarriors
    display.fillRect(0, 0, 128, 14, SSD1306_WHITE);
    display.setTextColor(SSD1306_BLACK, SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(18, 3);
    display.print(F("TechIoTWarriors"));

    display.setTextColor(SSD1306_WHITE);
    display.setCursor(4, 20);
    display.print(F("DEV 1: SENSORS HUB"));
    display.setCursor(4, 34);
    display.print(F("Projects: 01 to 12"));
    display.setCursor(4, 48);
    display.print(F("Connecting Wi-Fi..."));
    display.display();
  } else {
    Serial.println(F("[OLED] SSD1306 0.96\" OLED not detected on 0x3C/0x3D. Continuing headless."));
  }
}

void displayStartupIp(const String& ip, bool isSta, int holdMs) {
  if (!oledReady) return;
  display.clearDisplay();
  display.setTextWrap(false);

  // Top branding bar
  display.fillRect(0, 0, 128, 14, SSD1306_WHITE);
  display.setTextColor(SSD1306_BLACK, SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(18, 3);
  display.print(F("TechIoTWarriors"));

  // IP Address Header
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(8, 18);
  display.print(F("DEVICE IP ADDRESS:"));

  // Prominent IP Box
  display.drawRoundRect(2, 29, 124, 18, 3, SSD1306_WHITE);
  display.setCursor(8, 34);
  display.setTextSize(1);
  display.print(ip);

  // Mode footer
  display.setCursor(6, 52);
  display.print(isSta ? F("Mode: STA (WiFi Net)") : F("Mode: AP (Hotspot)"));
  display.display();

  delay(holdMs);
}

void updateOledTelemetry() {
  if (!oledReady) return;
  unsigned long now = millis();
  if (now - lastOledPageSwitch < 3500) return;
  lastOledPageSwitch = now;
  oledPage = (oledPage + 1) % 4;

  display.clearDisplay();
  display.setTextWrap(false);

  // Top branding bar
  display.fillRect(0, 0, 128, 13, SSD1306_WHITE);
  display.setTextColor(SSD1306_BLACK, SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(18, 3);
  display.print(F("TechIoTWarriors"));

  display.setTextColor(SSD1306_WHITE);

  if (oledPage == 0) {
    // Page 0: Climate & Weather (P04 Atmos AI & P02 Rainwatch & P03 TerraIQ)
    display.setCursor(0, 16);
    display.print(F("CLIMATE & SOIL (P04)"));
    display.drawLine(0, 25, 128, 25, SSD1306_WHITE);

    display.setCursor(0, 29);
    display.print(F("T:"));
    display.print(telemetryManager.data.dhtTempC, 1);
    display.print(F("C  H:"));
    display.print(telemetryManager.data.dhtHumidityPct, 0);
    display.print(F("%"));

    display.setCursor(0, 41);
    display.print(F("Rain:"));
    display.print(telemetryManager.data.rainIntensityPct, 0);
    display.print(F("% Soil:"));
    display.print(telemetryManager.data.soilMoisturePct, 0);
    display.print(F("%"));
  }
  else if (oledPage == 1) {
    // Page 1: Gas Safety & Air Quality (P05 MQ-135 & P06 MQ-2)
    display.setCursor(0, 16);
    display.print(F("AIR & GAS (P05/P06)"));
    display.drawLine(0, 25, 128, 25, SSD1306_WHITE);

    display.setCursor(0, 29);
    display.print(F("Air CO2: "));
    display.print(telemetryManager.data.mq135Co2Ppm, 0);
    display.print(F(" ppm"));

    display.setCursor(0, 41);
    display.print(F("Gas MQ2: "));
    display.print(telemetryManager.data.mq2Ppm, 1);
    display.print(telemetryManager.data.mq2AlarmActive ? F(" [WARN]") : F(" [OK]"));
  }
  else if (oledPage == 2) {
    // Page 2: Sonar Radar & Light (P01 & P07)
    display.setCursor(0, 16);
    display.print(F("RADAR & LIGHT (P01)"));
    display.drawLine(0, 25, 128, 25, SSD1306_WHITE);

    display.setCursor(0, 29);
    display.print(F("Radar: "));
    display.print(telemetryManager.data.radarDistanceCm, 1);
    display.print(F(" cm"));

    display.setCursor(0, 41);
    display.print(F("Deg:"));
    display.print((int)telemetryManager.data.radarAngleDeg);
    display.print(F("d  LDR:"));
    display.print(telemetryManager.data.ldrPercent, 0);
    display.print(F("%"));
  }
  else {
    // Page 3: Hydro Telemetry (P09 Level & P10 Flow)
    display.setCursor(0, 16);
    display.print(F("HYDRO TANK (P09/P10)"));
    display.drawLine(0, 25, 128, 25, SSD1306_WHITE);

    display.setCursor(0, 29);
    display.print(F("Water: "));
    display.print(telemetryManager.data.waterLevelPct, 0);
    display.print(F("% ("));
    display.print(telemetryManager.data.waterDepthCm, 1);
    display.print(F("cm)"));

    display.setCursor(0, 41);
    display.print(F("Flow : "));
    display.print(telemetryManager.data.flowRateLpm, 2);
    display.print(F(" L/min"));
  }

  // Bottom Status Bar with live IP
  display.drawLine(0, 52, 128, 52, SSD1306_WHITE);
  display.setCursor(0, 55);
  display.print(F("IP: "));
  display.print(wifiManager.getIpAddress());

  display.display();
}

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

  // 2. Initialize 0.96\" SSD1306 OLED Display & Show TechIoTWarriors Boot Screen
  initOledDisplay();

  // 3. Initialize Persistent Calibration Subsystem
  calibrationManager.begin();

  // 4. Initialize Sensor Hardware Subsystem & Pins
  sensorManager.begin();

  // 5. Connect to Wi-Fi Network / Launch AP Fallback
  wifiManager.begin();

  // 6. Display Device IP Address on OLED for 4 Seconds
  displayStartupIp(wifiManager.getIpAddress(), !wifiManager.isApMode(), 4000);

  // 7. Start Embedded REST API Web Server
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

  // 4. Update 0.96\" OLED live readings with TechIoTWarriors branding & IP footer
  updateOledTelemetry();
}
