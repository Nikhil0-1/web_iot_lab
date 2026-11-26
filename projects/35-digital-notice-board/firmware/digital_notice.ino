/**
 * =============================================================================
 * TECH IOT WARRIORS — 0.96" OLED DIGITAL NOTICE BOARD & TELEMETRY NODE
 * Project 35: Error-Free Firmware for ESP8266 NodeMCU (ESP-12E / ESP-12F)
 *
 * Pin Connections for 0.96" I2C SSD1306 OLED (128x64):
 *   - OLED VCC  --> NodeMCU 3V3 (or 5V for 5V-tolerant modules)
 *   - OLED GND  --> NodeMCU GND
 *   - OLED SCL  --> NodeMCU D1 (GPIO 5)
 *   - OLED SDA  --> NodeMCU D2 (GPIO 4)
 *
 * Operational Workflow:
 *   1. Boot Splash: Displays "TechIoTWarriors" branding and Wi-Fi search animation.
 *   2. Dual-Mode Wi-Fi: Connects to your Router/Hotspot (Station Mode).
 *      If Wi-Fi fails after 15 seconds, automatically activates SoftAP Hotspot.
 *   3. IP Address Screen: Displays assigned IP prominently on OLED for 4 seconds.
 *   4. Live Operating Screen: Renders "TechIoTWarriors" header, live notice/reading,
 *      and status footer with zero text-overlap (setTextWrap=false) and smooth marquee.
 *   5. REST API: Fully compatible with ArduinoJson v6 and v7, with Private Network CORS.
 * =============================================================================
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// =============================================================================
// WI-FI CONFIGURATION
// Enter your Wi-Fi Router or Mobile Hotspot credentials below (2.4 GHz only):
// =============================================================================
const char* WIFI_SSID     = "xyz";            // Wi-Fi Network Name
const char* WIFI_PASSWORD = "22Nikhil558800"; // Wi-Fi Network Password

// Fallback SoftAP Hotspot (Activated if Router/Hotspot is unreachable)
const char* AP_SSID       = "TechIoTW_NoticeNode";
const char* AP_PASSWORD   = "tech123456";

// ---------------- OLED Display Configuration ----------------
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_I2C_ADDR_1 0x3C
#define OLED_I2C_ADDR_2 0x3D

#define PIN_OLED_SDA 4 // D2 (GPIO 4)
#define PIN_OLED_SCL 5 // D1 (GPIO 5)

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
ESP8266WebServer server(80);

// Notice & Telemetry State
String currentNotice = "TECH IOT WARRIORS: LAB ACTIVE";
int scrollSpeed = 2;       // 0 = Static, 1 = Slow, 2 = Normal, 4 = Fast
int fontSize = 2;          // 1 = Small (6x8 px font), 2 = Medium (12x16 px font)
int textX = 128;
int measuredTextWidth = 0;
bool isLongMessage = false;
unsigned long lastScrollTime = 0;
bool oledReady = false;
String activeIpAddress = "192.168.4.1";
bool isStationMode = false;

// ---------------- CORS Headers for Web Browser Access ----------------
void sendCorsHeaders() {
  server.sendHeader(F("Access-Control-Allow-Origin"), F("*"));
  server.sendHeader(F("Access-Control-Allow-Methods"), F("GET, POST, OPTIONS"));
  server.sendHeader(F("Access-Control-Allow-Headers"), F("Content-Type, Accept, Authorization, X-Requested-With"));
  server.sendHeader(F("Access-Control-Allow-Private-Network"), F("true"));
}

void handleOptions() {
  sendCorsHeaders();
  server.send(204);
}

// ---------------- Recalculate Message Width & Layout Bounds ----------------
void recalculateTextMetrics() {
  if (!oledReady) return;
  display.setTextSize(fontSize);
  display.setTextWrap(false);

  int16_t x1, y1;
  uint16_t w, h;
  display.getTextBounds(currentNotice, 0, 0, &x1, &y1, &w, &h);
  measuredTextWidth = (int)w;
  isLongMessage = (measuredTextWidth > 118);

  // If text is short, center horizontally; otherwise position at right edge for marquee
  if (!isLongMessage || scrollSpeed == 0) {
    textX = (SCREEN_WIDTH - measuredTextWidth) / 2;
    if (textX < 2) textX = 2;
  } else {
    textX = SCREEN_WIDTH;
  }
}

// ---------------- OLED Boot Screen ----------------
void displayBootScreen(const String& statusMsg) {
  if (!oledReady) return;
  display.clearDisplay();
  display.setTextWrap(false);
  display.setTextColor(SSD1306_WHITE);

  // Top Banner
  display.setTextSize(1);
  display.setCursor(16, 4);
  display.print(F("TechIoTWarriors"));
  display.drawLine(0, 15, 127, 15, SSD1306_WHITE);

  // Center Status
  display.setCursor(8, 26);
  display.print(F("Digital Notice Hub"));
  display.setCursor(8, 40);
  display.print(statusMsg);

  // Bottom Line
  display.drawLine(0, 54, 127, 54, SSD1306_WHITE);
  display.setCursor(20, 56);
  display.print(F("SSD1306 0.96\" OLED"));

  display.display();
}

// ---------------- OLED Startup IP Display Screen (Shows for 4 Seconds) ----------------
void displayIpScreen(const String& ip, bool isStation, int holdMs) {
  if (!oledReady) return;
  display.clearDisplay();
  display.setTextWrap(false);
  display.setTextColor(SSD1306_WHITE);

  // Header Branding
  display.setTextSize(1);
  display.setCursor(16, 2);
  display.print(F("TechIoTWarriors"));
  display.drawLine(0, 12, 127, 12, SSD1306_WHITE);

  // Mode Indicator
  display.setCursor(4, 16);
  if (isStation) {
    display.print(F("WI-FI: CONNECTED (STA)"));
  } else {
    display.print(F("WI-FI: HOTSPOT (AP)"));
  }

  // Prominent IP Address Display
  display.setCursor(4, 28);
  display.print(F("DEVICE IP ADDRESS:"));

  display.setTextSize(1);
  display.setCursor(4, 40);
  display.print(F(">> "));
  display.print(ip);

  // Footer Instructions
  display.drawLine(0, 52, 127, 52, SSD1306_WHITE);
  display.setCursor(4, 55);
  display.print(F("OPEN IP IN BROWSER"));

  display.display();

  // Hold screen while keeping ESP8266 background tasks alive
  unsigned long start = millis();
  while (millis() - start < (unsigned long)holdMs) {
    delay(50);
    yield();
  }
}

// ---------------- OLED Live Operating Screen ----------------
void renderNoticeFrame() {
  if (!oledReady) return;

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  // 1. FIXED HEADER REGION (Y: 0 to 12)
  display.setTextSize(1);
  display.setTextWrap(false);
  display.setCursor(16, 1);
  display.print(F("TechIoTWarriors"));
  display.drawLine(0, 11, 127, 11, SSD1306_WHITE);

  // 2. CENTRAL MESSAGE / READING REGION (Y: 14 to 50)
  display.setTextSize(fontSize);
  display.setTextWrap(false); // CRITICAL: Prevents character wrap and overlapping ghosting!

  int msgY = (fontSize == 1) ? 28 : 24;
  display.setCursor(textX, msgY);
  display.print(currentNotice);

  // 3. FIXED FOOTER REGION (Y: 52 to 63)
  display.drawLine(0, 52, 127, 52, SSD1306_WHITE);
  display.setTextSize(1);
  display.setTextWrap(false);

  display.setCursor(2, 55);
  display.print(isStationMode ? F("STA ") : F("AP "));
  display.print(activeIpAddress);

  display.setCursor(96, 55);
  if (scrollSpeed == 0) {
    display.print(F("STATIC"));
  } else {
    display.print(F("SPD:"));
    display.print(scrollSpeed);
  }

  display.display();
}

// =============================================================================
// ARDUINO SETUP
// =============================================================================
void setup() {
  Serial.begin(115200);
  delay(150);
  Serial.println();
  Serial.println(F("========================================================="));
  Serial.println(F("  TECH IOT WARRIORS — PROJECT 35: DIGITAL NOTICE BOARD"));
  Serial.println(F("  SSD1306 0.96\" I2C OLED (128x64) Live Telemetry Node"));
  Serial.println(F("========================================================="));

  // Initialize I2C Bus on GPIO 4 (SDA) and GPIO 5 (SCL)
  Wire.begin(PIN_OLED_SDA, PIN_OLED_SCL);

  // Initialize SSD1306 OLED (Auto-detect address 0x3C or 0x3D)
  if (display.begin(SSD1306_SWITCHCAPVCC, OLED_I2C_ADDR_1)) {
    oledReady = true;
    Serial.println(F("[OLED] Success: SSD1306 initialized at 0x3C"));
  } else if (display.begin(SSD1306_SWITCHCAPVCC, OLED_I2C_ADDR_2)) {
    oledReady = true;
    Serial.println(F("[OLED] Success: SSD1306 initialized at 0x3D"));
  } else {
    oledReady = false;
    Serial.println(F("[OLED] Warning: SSD1306 allocation failed. Check VCC, GND, D1(SCL), D2(SDA)."));
  }

  // Display initial search screen
  displayBootScreen("Searching Wi-Fi...");

  // ---------------- Robust Wi-Fi Connection Routine ----------------
  WiFi.persistent(false);
  WiFi.disconnect(true);
  delay(100);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print(F("[WIFI] Connecting to SSID: "));
  Serial.println(WIFI_SSID);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(400);
    Serial.print(F("."));
    attempts++;

    // Update OLED with animated dots
    String dotStr = "Connecting";
    for (int d = 0; d < (attempts % 4); d++) dotStr += ".";
    displayBootScreen(dotStr);
  }

  if (WiFi.status() == WL_CONNECTED) {
    isStationMode = true;
    activeIpAddress = WiFi.localIP().toString();
    Serial.println();
    Serial.println(F("[WIFI] Success: Connected to Wi-Fi!"));
    Serial.print(F("[WIFI] Station IP: "));
    Serial.println(activeIpAddress);
  } else {
    isStationMode = false;
    Serial.println();
    Serial.println(F("[WIFI] Notice: Station timeout. Activating SoftAP Fallback..."));
    WiFi.mode(WIFI_AP_STA);
    WiFi.softAP(AP_SSID, AP_PASSWORD);
    activeIpAddress = WiFi.softAPIP().toString();
    Serial.print(F("[WIFI] SoftAP Active! SSID: "));
    Serial.print(AP_SSID);
    Serial.print(F(" | AP IP: "));
    Serial.println(activeIpAddress);
  }

  // Start mDNS Responder (access via http://notice-board.local)
  if (MDNS.begin("notice-board")) {
    MDNS.addService("http", "tcp", 80);
    Serial.println(F("[mDNS] Responder active at http://notice-board.local"));
  }

  // ---------------- DISPLAY IP SCREEN FOR 4 SECONDS ----------------
  // (Mandatory requirement: "starting me ip bhi dekhna chahiye kuch second ke liye")
  displayIpScreen(activeIpAddress, isStationMode, 4000);

  // Recalculate and render live notice frame
  recalculateTextMetrics();
  renderNoticeFrame();

  // ---------------- REST API ROUTES ----------------

  // Handle CORS Preflight OPTIONS globally
  server.onNotFound([]() {
    if (server.method() == HTTP_OPTIONS) {
      handleOptions();
    } else {
      sendCorsHeaders();
      server.send(404, "application/json", "{\"error\":\"Endpoint not found\"}");
    }
  });

  server.on(F("/"), HTTP_OPTIONS, handleOptions);
  server.on(F("/"), HTTP_GET, []() {
    sendCorsHeaders();
    String html = F("<!DOCTYPE html><html><head><meta charset='utf-8'><title>TechIoTWarriors &middot; Digital Notice</title>"
                    "<style>body{font-family:sans-serif;padding:24px;background:#f8fafc;color:#0f172a;max-width:640px;margin:auto;}"
                    "h1{color:#0891b2;}.card{background:#fff;padding:16px 20px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:16px;}"
                    "code{background:#e2e8f0;padding:2px 6px;border-radius:4px;}</style></head><body>"
                    "<h1>TechIoTWarriors &middot; Digital Notice Board</h1>"
                    "<div class='card'><p><strong>Status:</strong> Active Online</p>"
                    "<p><strong>OLED Display:</strong> SSD1306 0.96\" Monochrome I2C (128x64)</p>"
                    "<p><strong>Active Notice:</strong> ");
    html += currentNotice;
    html += F("</p><p><strong>Device IP:</strong> ");
    html += activeIpAddress;
    html += F("</p></div><div class='card'><h3>REST API Endpoints</h3><ul>"
              "<li><a href='/api/health'>/api/health</a> &mdash; Liveness &amp; OLED readiness check</li>"
              "<li><a href='/api/device'>/api/device</a> &mdash; Device identity &amp; project validation</li>"
              "<li><a href='/api/readings'>/api/readings</a> &mdash; Live telemetry &amp; active notice</li>"
              "<li><code>/api/command</code> &mdash; POST new message, scroll speed, and font size</li>"
              "</ul></div></body></html>");
    server.send(200, "text/html", html);
  });

  server.on(F("/api/health"), HTTP_OPTIONS, handleOptions);
  server.on(F("/api/health"), HTTP_GET, []() {
    sendCorsHeaders();
    String json = "{\"status\":\"ok\",\"uptime_ms\":" + String(millis()) +
                  ",\"free_heap\":" + String(ESP.getFreeHeap()) +
                  ",\"oled_ready\":" + (oledReady ? "true" : "false") +
                  ",\"wifi_mode\":\"" + (isStationMode ? "STA" : "AP") + "\"" +
                  ",\"ip\":\"" + activeIpAddress + "\"}";
    server.send(200, "application/json", json);
  });

  server.on(F("/api/device"), HTTP_OPTIONS, handleOptions);
  server.on(F("/api/device"), HTTP_GET, []() {
    sendCorsHeaders();
    String json = "{\"deviceId\":\"esp8266-notice-board-35\","
                  "\"deviceType\":\"digital-notice-board\","
                  "\"firmwareVersion\":\"3.2.0\","
                  "\"projectId\":\"35-digital-notice-board\","
                  "\"supportedProjects\":[\"35\",\"35-digital-notice-board\"],"
                  "\"ip\":\"" + activeIpAddress + "\"}";
    server.send(200, "application/json", json);
  });

  server.on(F("/api/readings"), HTTP_OPTIONS, handleOptions);
  server.on(F("/api/readings"), HTTP_GET, []() {
    sendCorsHeaders();
    #if ARDUINOJSON_VERSION_MAJOR >= 7
      JsonDocument doc;
    #else
      StaticJsonDocument<384> doc;
    #endif
    doc["project_id"] = "35-digital-notice-board";
    doc["active_message"] = currentNotice;
    doc["scroll_speed"] = scrollSpeed;
    doc["font_size"] = fontSize;
    doc["is_long_message"] = isLongMessage;
    doc["text_width_px"] = measuredTextWidth;
    doc["oled_ready"] = oledReady;
    doc["ip"] = activeIpAddress;

    String out;
    serializeJson(doc, out);
    server.send(200, "application/json", out);
  });

  server.on(F("/api/command"), HTTP_OPTIONS, handleOptions);
  server.on(F("/api/command"), HTTP_POST, []() {
    sendCorsHeaders();
    if (server.hasArg("plain")) {
      #if ARDUINOJSON_VERSION_MAJOR >= 7
        JsonDocument doc;
      #else
        StaticJsonDocument<512> doc;
      #endif
      DeserializationError err = deserializeJson(doc, server.arg("plain"));
      if (err) {
        server.send(400, "application/json", "{\"error\":\"Malformed JSON command payload\"}");
        return;
      }

      if (doc.containsKey("message")) {
        String newMsg = doc["message"].as<String>();
        newMsg.trim();
        if (newMsg.length() > 0) {
          if (newMsg.length() > 160) {
            newMsg = newMsg.substring(0, 160);
          }
          currentNotice = newMsg;
        }
      }

      if (doc.containsKey("speed")) {
        int spd = doc["speed"].as<int>();
        if (spd >= 0 && spd <= 8) {
          scrollSpeed = spd;
        }
      }

      if (doc.containsKey("fontSize")) {
        int sz = doc["fontSize"].as<int>();
        if (sz == 1 || sz == 2) {
          fontSize = sz;
        }
      }

      // Recalculate metrics, reset scroll, and re-render frame immediately
      recalculateTextMetrics();
      renderNoticeFrame();

      server.send(200, "application/json", "{\"success\":true,\"message\":\"Notice updated\",\"active_message\":\"" + currentNotice + "\"}");
      return;
    }
    server.send(400, "application/json", "{\"error\":\"Missing JSON payload in body\"}");
  });

  server.begin();
  Serial.println(F("[HTTP] REST API Server started successfully on port 80"));
}

// =============================================================================
// ARDUINO LOOP
// =============================================================================
void loop() {
  MDNS.update();
  server.handleClient();

  // OLED Animation & Marquee Update Loop
  if (oledReady) {
    unsigned long now = millis();
    unsigned long interval = (scrollSpeed == 4) ? 25 : ((scrollSpeed == 1) ? 60 : 35);

    if (now - lastScrollTime >= interval) {
      lastScrollTime = now;

      if (isLongMessage && scrollSpeed > 0) {
        textX -= scrollSpeed;
        int minX = -(measuredTextWidth + 8);
        if (textX < minX) {
          // Reset smoothly to the right edge
          textX = SCREEN_WIDTH;
        }
        renderNoticeFrame();
      } else {
        // Static message: refresh every 2.5 seconds to keep footer/status current
        static unsigned long lastStaticRefresh = 0;
        if (now - lastStaticRefresh > 2500) {
          lastStaticRefresh = now;
          renderNoticeFrame();
        }
      }
    }
  }
}
