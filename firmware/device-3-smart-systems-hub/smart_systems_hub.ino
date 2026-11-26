/**
 * =============================================================================
 * TECH IOT WARRIORS — DEVICE C: SMART SYSTEMS HUB
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
 *   35. Digital Notice Board — SSD1306 0.96" OLED Live Marquee
 *   36. Smart Room Occupancy — HLK-LD2410 24GHz mmWave Presence Radar
 * =============================================================================
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "config.h"
#include "pin_config.h"

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_I2C_ADDR_1 0x3C
#define OLED_I2C_ADDR_2 0x3D

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
ESP8266WebServer server(WEB_SERVER_PORT);

// State Variables
float batteryVolts = 12.42;
float energyKwh = 12.84;
float solarPowerW = 25.8;
bool pirMotion = false;
bool alarmArmed = true;
String noticeMessage = "TECH IOT WARRIORS: HUB ACTIVE";
int noticeScrollSpeed = 2;
int noticeFontSize = 2;
int noticeTextX = 128;
int noticeMeasuredWidth = 0;
bool noticeIsLong = false;
unsigned long lastOledScroll = 0;
bool oledReady = false;
String activeIp = "192.168.4.3";
bool isStation = false;

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
  server.sendHeader(F("Access-Control-Allow-Headers"), F("Content-Type, Accept, Authorization, X-Requested-With"));
  server.sendHeader(F("Access-Control-Allow-Private-Network"), F("true"));
}

void handleOptions() {
  addCors();
  server.send(204);
}

void recalculateNoticeMetrics() {
  if (!oledReady) return;
  display.setTextSize(noticeFontSize);
  display.setTextWrap(false);

  int16_t x1, y1;
  uint16_t w, h;
  display.getTextBounds(noticeMessage, 0, 0, &x1, &y1, &w, &h);
  noticeMeasuredWidth = (int)w;
  noticeIsLong = (noticeMeasuredWidth > 118);

  if (!noticeIsLong || noticeScrollSpeed == 0) {
    noticeTextX = (SCREEN_WIDTH - noticeMeasuredWidth) / 2;
    if (noticeTextX < 2) noticeTextX = 2;
  } else {
    noticeTextX = SCREEN_WIDTH;
  }
}

// ---------------- OLED Startup IP Display Screen (Shows for 4 Seconds) ----------------
void displayStartupIp(const String& ip, bool isSta, int holdMs) {
  if (!oledReady) return;
  display.clearDisplay();
  display.setTextWrap(false);
  display.setTextColor(SSD1306_WHITE);

  // Top Header Branding
  display.setTextSize(1);
  display.setCursor(16, 2);
  display.print(F("TechIoTWarriors"));
  display.drawLine(0, 12, 127, 12, SSD1306_WHITE);

  // Connection Mode
  display.setCursor(4, 16);
  display.print(isSta ? F("DEVICE C: CONNECTED") : F("DEVICE C: HOTSPOT"));

  display.setCursor(4, 28);
  display.print(F("HARDWARE IP:"));

  display.setCursor(4, 40);
  display.print(F(">> "));
  display.print(ip);

  display.drawLine(0, 52, 127, 52, SSD1306_WHITE);
  display.setCursor(4, 55);
  display.print(F("HUB PROJECTS: 25-36"));

  display.display();

  unsigned long start = millis();
  while (millis() - start < (unsigned long)holdMs) {
    delay(50);
    yield();
  }
}

void renderNoticeOled() {
  if (!oledReady) return;

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  // Header Region
  display.setTextSize(1);
  display.setTextWrap(false);
  display.setCursor(16, 1);
  display.print(F("TechIoTWarriors"));
  display.drawLine(0, 11, 127, 11, SSD1306_WHITE);

  // Central Announcement / Reading Region
  display.setTextSize(noticeFontSize);
  display.setTextWrap(false);
  int msgY = (noticeFontSize == 1) ? 28 : 24;
  display.setCursor(noticeTextX, msgY);
  display.print(noticeMessage);

  // Footer Region
  display.drawLine(0, 52, 127, 52, SSD1306_WHITE);
  display.setTextSize(1);
  display.setTextWrap(false);
  display.setCursor(2, 55);
  display.print(isStation ? F("STA ") : F("AP "));
  display.print(activeIp);

  display.setCursor(96, 55);
  if (noticeScrollSpeed == 0) {
    display.print(F("STATIC"));
  } else {
    display.print(F("SPD:"));
    display.print(noticeScrollSpeed);
  }

  display.display();
}

void setup() {
  Serial.begin(115200);
  delay(150);
  Serial.println();
  Serial.println(F("========================================================="));
  Serial.println(F("  TECH IOT WARRIORS — DEVICE C: SMART SYSTEMS HUB"));
  Serial.print  (F("  Firmware Version: ")); Serial.println(FIRMWARE_VERSION);
  Serial.print  (F("  Device ID:        ")); Serial.println(DEVICE_ID);
  Serial.println(F("  Projects:         25 to 36 (Category C)"));
  Serial.println(F("========================================================="));

  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);

  // Initialize SSD1306 OLED Display (try 0x3C then 0x3D)
  if (display.begin(SSD1306_SWITCHCAPVCC, OLED_I2C_ADDR_1) || display.begin(SSD1306_SWITCHCAPVCC, OLED_I2C_ADDR_2)) {
    oledReady = true;
    display.clearDisplay();
    display.setTextWrap(false);
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(16, 10);
    display.println(F("TechIoTWarriors"));
    display.drawLine(0, 22, 127, 22, SSD1306_WHITE);
    display.setCursor(10, 32);
    display.println(F("Smart Systems Hub"));
    display.setCursor(10, 46);
    display.println(F("Connecting Wi-Fi..."));
    display.display();
  } else {
    Serial.println(F("[OLED] Warning: SSD1306 display not detected on I2C bus."));
    oledReady = false;
  }

  pinMode(PIN_PIR_MOTION, INPUT);
  pinMode(PIN_PIEZO_SIREN, OUTPUT);
  pinMode(PIN_STATUS_LED, OUTPUT);

  digitalWrite(PIN_PIEZO_SIREN, LOW);
  digitalWrite(PIN_STATUS_LED, LOW);

  // Connect to Station WiFi with timeout
  WiFi.persistent(false);
  WiFi.disconnect(true);
  delay(100);

  WiFi.mode(WIFI_STA);
  WiFi.begin(DEFAULT_WIFI_SSID, DEFAULT_WIFI_PASS);
  Serial.print(F("[WIFI] Connecting to "));
  Serial.print(DEFAULT_WIFI_SSID);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(400);
    Serial.print(F("."));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    isStation = true;
    activeIp = WiFi.localIP().toString();
    Serial.println();
    Serial.print(F("[WIFI] Connected! IP Address: "));
    Serial.println(activeIp);
  } else {
    isStation = false;
    Serial.println();
    Serial.println(F("[WIFI] Station connection timed out. Starting Access Point fallback..."));
    WiFi.mode(WIFI_AP_STA);
    WiFi.softAP(AP_SSID, AP_PASSWORD);
    activeIp = WiFi.softAPIP().toString();
    Serial.print(F("[WIFI] SoftAP Active! SSID: "));
    Serial.print(AP_SSID);
    Serial.print(F(" | AP IP: "));
    Serial.println(activeIp);
  }

  if (MDNS.begin(MDNS_HOSTNAME)) {
    MDNS.addService("http", "tcp", WEB_SERVER_PORT);
    Serial.print(F("[mDNS] Responder active at http://"));
    Serial.print(MDNS_HOSTNAME);
    Serial.println(F(".local"));
  }

  // Display startup IP screen on OLED for 4 seconds
  displayStartupIp(activeIp, isStation, 4000);

  recalculateNoticeMetrics();
  renderNoticeOled();

  // Preflight CORS for all routes
  server.onNotFound([]() {
    if (server.method() == HTTP_OPTIONS) {
      handleOptions();
    } else {
      addCors();
      server.send(404, "application/json", "{\"error\":\"Endpoint not found\"}");
    }
  });

  server.on(F("/"), HTTP_OPTIONS, handleOptions);
  server.on(F("/"), HTTP_GET, []() {
    addCors();
    String html = F("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Device 3 — Smart Systems Hub</title>"
                    "<style>body{font-family:sans-serif;padding:24px;background:#f8fafc;color:#0f172a;max-width:700px;margin:auto;}"
                    "h1{color:#7c3aed;}a{color:#7c3aed;text-decoration:none;}.card{background:#fff;padding:16px 20px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:16px;}"
                    "code{background:#e2e8f0;padding:2px 6px;border-radius:4px;}</style></head><body>"
                    "<h1>TechIoTWarriors &middot; Smart Systems Hub (Device C)</h1>"
                    "<div class='card'><p><strong>Device ID:</strong> esp8266-smart-systems-hub-03</p>"
                    "<p><strong>Firmware:</strong> v3.2.0 (Smart Infrastructure & Systems)</p>"
                    "<p><strong>Projects:</strong> 25 to 36 (Category C)</p>"
                    "<p><strong>Device IP:</strong> ");
    html += activeIp;
    html += F("</p></div><div class='card'><h3>Active API Endpoints</h3><ul>"
              "<li><a href='/api/health'>/api/health</a> &mdash; Liveness check</li>"
              "<li><a href='/api/device'>/api/device</a> &mdash; Supported project list</li>"
              "<li><a href='/api/readings'>/api/readings</a> &mdash; Category C telemetry</li>"
              "<li><code>/api/command</code> &mdash; POST actuator and display control</li>"
              "</ul></div></body></html>");
    server.send(200, "text/html", html);
  });

  server.on(F("/api/health"), HTTP_OPTIONS, handleOptions);
  server.on(F("/api/health"), HTTP_GET, []() {
    addCors();
    String json = "{\"status\":\"ok\",\"uptime_ms\":" + String(millis()) +
                  ",\"free_heap\":" + String(ESP.getFreeHeap()) +
                  ",\"oled_ready\":" + (oledReady ? "true" : "false") +
                  ",\"wifi_mode\":\"" + (isStation ? "STA" : "AP") + "\"" +
                  ",\"ip\":\"" + activeIp + "\"}";
    server.send(200, "application/json", json);
  });

  server.on(F("/api/device"), HTTP_OPTIONS, handleOptions);
  server.on(F("/api/device"), HTTP_GET, []() {
    addCors();
    #if ARDUINOJSON_VERSION_MAJOR >= 7
      JsonDocument doc;
    #else
      StaticJsonDocument<768> doc;
    #endif
    doc["deviceId"] = DEVICE_ID;
    doc["deviceType"] = DEVICE_TYPE;
    doc["firmwareVersion"] = FIRMWARE_VERSION;
    doc["category"] = "C";
    doc["totalProjects"] = 12;

    JsonArray projs = doc.createNestedArray("supportedProjects");
    const char* projectSlugs[] = {
      "25-smart-parking-assistant", "26-rfid-attendance-system", "27-rfid-door-access",
      "28-smart-dustbin", "29-fire-smoke-alert", "30-intrusion-detection-alarm",
      "31-visitor-counter", "32-smart-energy-meter", "33-battery-voltage-monitor",
      "34-solar-panel-monitor", "35-digital-notice-board", "36-smart-room-occupancy"
    };

    for (size_t i = 0; i < 12; i++) {
      projs.add(projectSlugs[i]);
      projs.add(String(25 + i));
    }

    String out;
    serializeJson(doc, out);
    server.send(200, "application/json", out);
  });

  server.on(F("/api/readings"), HTTP_OPTIONS, handleOptions);
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
    doc["active_message"] = noticeMessage;
    doc["scroll_speed"] = noticeScrollSpeed;
    doc["visitor_count"] = visitorCount;
    doc["dustbin_fill_pct"] = dustbinFillPct;
    doc["dustbin_lid_open"] = dustbinLidOpen;
    doc["barrier_open"] = parkingBarrierOpen;
    doc["occupied_slots"] = parkingOccupiedSlots;
    doc["fire_detected"] = fireDetected;
    doc["smoke_ppm"] = smokePpm;
    doc["ip"] = activeIp;

    String out;
    serializeJson(doc, out);
    server.send(200, "application/json", out);
  });

  server.on(F("/api/command"), HTTP_OPTIONS, handleOptions);
  server.on(F("/api/command"), HTTP_POST, []() {
    addCors();
    if (server.hasArg("plain")) {
      #if ARDUINOJSON_VERSION_MAJOR >= 7
        JsonDocument doc;
      #else
        StaticJsonDocument<512> doc;
      #endif
      DeserializationError err = deserializeJson(doc, server.arg("plain"));
      if (err) {
        server.send(400, "application/json", "{\"error\":\"Malformed JSON syntax\"}");
        return;
      }

      if (doc.containsKey("message")) {
        String msg = doc["message"].as<String>();
        msg.trim();
        if (msg.length() > 0) {
          if (msg.length() > 160) msg = msg.substring(0, 160);
          noticeMessage = msg;
          recalculateNoticeMetrics();
          renderNoticeOled();
        }
      }
      if (doc.containsKey("speed")) {
        noticeScrollSpeed = doc["speed"].as<int>();
      }
      if (doc.containsKey("fontSize")) {
        noticeFontSize = doc["fontSize"].as<int>();
        recalculateNoticeMetrics();
        renderNoticeOled();
      }
      if (doc.containsKey("armed")) alarmArmed = doc["armed"];
      if (doc.containsKey("barrierOpen")) parkingBarrierOpen = doc["barrierOpen"];
      if (doc.containsKey("lidOpen")) dustbinLidOpen = doc["lidOpen"];
      if (doc.containsKey("siren")) {
        bool s = doc["siren"];
        digitalWrite(PIN_PIEZO_SIREN, s ? HIGH : LOW);
      }
      server.send(200, "application/json", "{\"success\":true,\"message\":\"Command processed\",\"active_message\":\"" + noticeMessage + "\"}");
      return;
    }
    server.send(400, "application/json", "{\"error\":\"Missing JSON command body\"}");
  });

  server.begin();
  Serial.println(F("[HTTP] REST API Server started on port 80"));
}

void loop() {
  MDNS.update();
  server.handleClient();

  // Animate OLED if display is ready
  if (oledReady) {
    unsigned long now = millis();
    unsigned long interval = (noticeScrollSpeed == 4) ? 25 : ((noticeScrollSpeed == 1) ? 60 : 35);

    if (now - lastOledScroll >= interval) {
      lastOledScroll = now;

      if (noticeIsLong && noticeScrollSpeed > 0) {
        noticeTextX -= noticeScrollSpeed;
        int minX = -(noticeMeasuredWidth + 8);
        if (noticeTextX < minX) {
          noticeTextX = SCREEN_WIDTH;
        }
        renderNoticeOled();
      } else {
        static unsigned long lastStaticRefresh = 0;
        if (now - lastStaticRefresh > 2500) {
          lastStaticRefresh = now;
          renderNoticeOled();
        }
      }
    }
  }
}
