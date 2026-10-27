/**
 * Project 35: Digital Notice Board
 * ESP8266 NodeMCU Firmware with SSD1306 128x64 I2C OLED Display
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

const char* ssid = "TechIoTW_Notice";
const char* password = "password123";

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

ESP8266WebServer server(80);

String currentNotice = "TECH IOT WARRIORS: LAB ACTIVE";
int scrollSpeed = 2;
int textX = 128;

void setup() {
  Serial.begin(115200);
  Wire.begin(4, 5); // SDA = D2 (GPIO 4), SCL = D1 (GPIO 5)

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("SSD1306 allocation failed");
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("NOTICE BOARD READY");
  display.display();

  WiFi.softAP(ssid, password);
  Serial.print("Notice Board AP IP: ");
  Serial.println(WiFi.softAPIP());

  // CORS handler
  server.onNotFound([]() {
    if (server.method() == HTTP_OPTIONS) {
      server.sendHeader("Access-Control-Allow-Origin", "*");
      server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
      server.send(204);
    } else {
      server.send(404, "text/plain", "Not Found");
    }
  });

  server.on("/api/health", HTTP_GET, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"status\":\"ok\",\"uptime_ms\":" + String(millis()) + "}");
  });

  server.on("/api/device", HTTP_GET, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"deviceId\":\"ESP8266-NoticeBoard\",\"projectId\":\"35-digital-notice-board\",\"supportedProjects\":[\"35-digital-notice-board\"]}");
  });

  server.on("/api/readings", HTTP_GET, []() {
    StaticJsonDocument<256> doc;
    doc["active_message"] = currentNotice;
    doc["scroll_speed"] = scrollSpeed;

    String out;
    serializeJson(doc, out);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", out);
  });

  server.on("/api/command", HTTP_POST, []() {
    if (server.hasArg("plain")) {
      StaticJsonDocument<256> doc;
      deserializeJson(doc, server.arg("plain"));
      if (doc.containsKey("message")) {
        currentNotice = doc["message"].as<String>();
        textX = 128;
      }
      if (doc.containsKey("speed")) {
        scrollSpeed = doc["speed"];
      }
    }
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"success\":true}");
  });

  server.begin();
}

void loop() {
  server.handleClient();

  // Scroll Marquee on OLED
  static unsigned long lastDraw = 0;
  if (millis() - lastDraw > 40) {
    lastDraw = millis();
    display.clearDisplay();

    // Header
    display.setTextSize(1);
    display.setCursor(14, 0);
    display.print("== NOTICE HUB ==");
    display.drawLine(0, 10, 128, 10, SSD1306_WHITE);

    // Marquee Text
    display.setTextSize(2);
    display.setCursor(textX, 26);
    display.print(currentNotice);

    display.display();

    if (scrollSpeed > 0) {
      textX -= scrollSpeed;
      int minX = -((int)currentNotice.length() * 12);
      if (textX < minX) textX = 128;
    }
  }
}
