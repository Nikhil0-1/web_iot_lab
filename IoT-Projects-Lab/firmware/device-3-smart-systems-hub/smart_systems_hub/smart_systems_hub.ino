/**
 * =============================================================================
 * TECH IOT WARRIORS — DEVICE 3: SMART SYSTEMS HUB
 * IoT Projects Lab (Projects 25 to 36)
 *
 * Board: ESP8266 NodeMCU v2 / v3 (ESP-12E / ESP-12F)
 * Supported Projects:
 *   25. Smart Parking Assistant — Ultrasonic Bay Sonar & Servo Barrier
 *   26. RFID Attendance System — MFRC522 13.56MHz Contactless Card Reader
 *   27. RFID Door Access — RC522 / Keypad Solenoid Lock Controller
 *   28. Smart Dustbin — HC-SR04 Fill Depth & Proximity Servo Lid
 *   29. Fire & Smoke Alert — MQ-2 Flammable Gas & Flame Warning
 *   30. Intrusion Detection Alarm — HC-SR501 PIR Motion & Piezo Siren
 *   31. Visitor Counter — Dual IR Break-Beam Bidirectional Passage Tracker
 *   32. Smart Energy Meter — Peacefair PZEM-004T v3.0 AC Power Telemetry
 *   33. Battery Voltage Monitor — Precision Voltage Divider & State-of-Charge
 *   34. Solar Panel Monitor — Texas Instruments INA219 I2C High-Side Power
 *   35. Digital Notice Board — SSD1306 128x64 OLED Live Marquee
 *   36. Smart Room Occupancy — HLK-LD2410 24GHz mmWave Presence Radar
 * =============================================================================
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include "config.h"
#include "pin_config.h"

ESP8266WebServer server(WEB_SERVER_PORT);

// State Variables
float batteryVolts = 12.42;
float energyKwh = 12.84;
float solarPowerW = 25.8;
bool pirMotion = false;
bool alarmArmed = true;
String noticeMessage = "TECH IOT WARRIORS: HUB ACTIVE";
int visitorCount = 42;
int dustbinFillPct = 35;
bool dustbinLidOpen = false;
bool parkingBarrierOpen = false;
int parkingOccupiedSlots = 2;
bool fireDetected = false;
int smokePpm = 45;

void addCors() {
  server.sendHeader(F("Access-Control-Allow-Origin"), F("*"));
  server.sendHeader(F("Access-Control-Allow-Methods"), F("GET, POST, OPTIONS"));
  server.sendHeader(F("Access-Control-Allow-Headers"), F("Content-Type, Accept, Authorization"));
}

void handleOptions() {
  addCors();
  server.send(204);
}

void setup() {
  Serial.begin(115200);
  delay(150);
  Serial.println();
  Serial.println(F("========================================================="));
  Serial.println(F("  TECH IOT WARRIORS — DEVICE 3: SMART SYSTEMS HUB"));
  Serial.print  (F("  Firmware Version: ")); Serial.println(FIRMWARE_VERSION);
  Serial.print  (F("  Device ID:        ")); Serial.println(DEVICE_ID);
  Serial.println(F("  Projects:         25 to 36 (Category C)"));
  Serial.println(F("========================================================="));

  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);

  pinMode(PIN_PIR_MOTION, INPUT);
  pinMode(PIN_PIEZO_SIREN, OUTPUT);
  pinMode(PIN_STATUS_LED, OUTPUT);

  digitalWrite(PIN_PIEZO_SIREN, LOW);
  digitalWrite(PIN_STATUS_LED, LOW);

  // Connect to Station WiFi with timeout
  WiFi.mode(WIFI_STA);
  WiFi.begin(DEFAULT_WIFI_SSID, DEFAULT_WIFI_PASS);
  Serial.print(F("[WIFI] Connecting to "));
  Serial.print(DEFAULT_WIFI_SSID);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(F("."));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print(F("[WIFI] Connected! IP Address: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println(F("[WIFI] Station connection timed out. Starting Access Point fallback..."));
    WiFi.mode(WIFI_AP_STA);
    WiFi.softAP(AP_SSID, AP_PASSWORD);
    Serial.print(F("[WIFI] SoftAP Active! SSID: "));
    Serial.print(AP_SSID);
    Serial.print(F(" | AP IP: "));
    Serial.println(WiFi.softAPIP());
  }

  if (MDNS.begin(MDNS_HOSTNAME)) {
    MDNS.addService("http", "tcp", WEB_SERVER_PORT);
    Serial.print(F("[mDNS] Responder active at http://"));
    Serial.print(MDNS_HOSTNAME);
    Serial.println(F(".local"));
  }

  // Preflight CORS for all routes
  server.onNotFound([]() {
    if (server.method() == HTTP_OPTIONS) {
      handleOptions();
    } else {
      addCors();
      server.send(404, "application/json", "{\"error\":\"Endpoint not found\"}");
    }
  });

  server.on(F("/"), HTTP_GET, []() {
    addCors();
    String html = F("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Device 3 — Smart Systems Hub</title>"
                    "<style>body{font-family:sans-serif;padding:24px;background:#f8fafc;color:#0f172a;max-width:700px;margin:auto;}"
                    "h1{color:#7c3aed;}a{color:#7c3aed;text-decoration:none;}.card{background:#fff;padding:16px 20px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:16px;}"
                    "code{background:#e2e8f0;padding:2px 6px;border-radius:4px;}</style></head><body>"
                    "<h1>Tech IoT Warriors &middot; Smart Systems Hub (Device 3)</h1>"
                    "<div class='card'><p><strong>Device ID:</strong> esp8266-smart-systems-hub-03</p>"
                    "<p><strong>Firmware:</strong> v3.0.0 (Smart Infrastructure & Systems)</p>"
                    "<p><strong>Projects:</strong> 25 to 36 (Category C)</p></div>"
                    "<div class='card'><h3>Active API Endpoints</h3><ul>"
                    "<li><a href='/api/health'>/api/health</a> &mdash; Liveness check</li>"
                    "<li><a href='/api/device'>/api/device</a> &mdash; Supported project list</li>"
                    "<li><a href='/api/readings'>/api/readings</a> &mdash; Category C telemetry</li>"
                    "<li><code>/api/command</code> &mdash; POST actuator and display control</li>"
                    "</ul></div></body></html>");
    server.send(200, "text/html", html);
  });

  server.on(F("/api/health"), HTTP_GET, []() {
    addCors();
    String json = "{\"status\":\"ok\",\"uptime_ms\":" + String(millis()) +
                  ",\"free_heap\":" + String(ESP.getFreeHeap()) +
                  ",\"ip\":\"" + (WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : WiFi.softAPIP().toString()) + "\"}";
    server.send(200, "application/json", json);
  });

  server.on(F("/api/device"), HTTP_GET, []() {
    addCors();
    #if ARDUINOJSON_VERSION_MAJOR >= 7
      JsonDocument doc;
    #else
      StaticJsonDocument<512> doc;
    #endif
    doc["deviceId"] = DEVICE_ID;
    doc["deviceType"] = DEVICE_TYPE;
    doc["firmwareVersion"] = FIRMWARE_VERSION;

    JsonArray projs = doc.createNestedArray("supportedProjects");
    for (int i = 25; i <= 36; i++) {
      projs.add(String(i));
    }

    String out;
    serializeJson(doc, out);
    server.send(200, "application/json", out);
  });

  server.on(F("/api/readings"), HTTP_GET, []() {
    int raw = analogRead(PIN_ADC_BATT);
    batteryVolts = (raw / 1023.0) * ADC_REF_VOLTAGE * BATTERY_DIVIDER_RATIO;
    pirMotion = (digitalRead(PIN_PIR_MOTION) == HIGH);

    addCors();
    #if ARDUINOJSON_VERSION_MAJOR >= 7
      JsonDocument doc;
    #else
      StaticJsonDocument<512> doc;
    #endif
    doc["battery_volts"] = batteryVolts;
    doc["motion_detected"] = pirMotion;
    doc["armed"] = alarmArmed;
    doc["energy_kwh"] = energyKwh;
    doc["solar_power_w"] = solarPowerW;
    doc["notice_message"] = noticeMessage;
    doc["visitor_count"] = visitorCount;
    doc["dustbin_fill_pct"] = dustbinFillPct;
    doc["dustbin_lid_open"] = dustbinLidOpen;
    doc["barrier_open"] = parkingBarrierOpen;
    doc["occupied_slots"] = parkingOccupiedSlots;
    doc["fire_detected"] = fireDetected;
    doc["smoke_ppm"] = smokePpm;

    String out;
    serializeJson(doc, out);
    server.send(200, "application/json", out);
  });

  server.on(F("/api/command"), HTTP_POST, []() {
    addCors();
    if (server.hasArg("plain")) {
      #if ARDUINOJSON_VERSION_MAJOR >= 7
        JsonDocument doc;
      #else
        StaticJsonDocument<384> doc;
      #endif
      deserializeJson(doc, server.arg("plain"));
      if (doc.containsKey("message")) noticeMessage = doc["message"].as<String>();
      if (doc.containsKey("armed")) alarmArmed = doc["armed"];
      if (doc.containsKey("barrierOpen")) parkingBarrierOpen = doc["barrierOpen"];
      if (doc.containsKey("lidOpen")) dustbinLidOpen = doc["lidOpen"];
      if (doc.containsKey("siren")) {
        bool s = doc["siren"];
        digitalWrite(PIN_PIEZO_SIREN, s ? HIGH : LOW);
      }
    }
    server.send(200, "application/json", "{\"success\":true}");
  });

  server.begin();
  Serial.println(F("[HTTP] REST API Server started on port 80"));
}

void loop() {
  MDNS.update();
  server.handleClient();
}
