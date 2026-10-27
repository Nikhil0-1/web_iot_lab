/**
 * Project 33: Battery Voltage Monitor
 * ESP8266 NodeMCU Firmware with Analog Voltage Divider Telemetry
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

const char* ssid = "TechIoTW_Battery";
const char* password = "password123";

ESP8266WebServer server(80);

const int PIN_ADC = A0;
float dividerRatio = 4.18; // (R1 + R2) / R2
float vRef = 3.30;

float readBatteryVoltage() {
  int raw = 0;
  for (int i = 0; i < 10; i++) {
    raw += analogRead(PIN_ADC);
    delay(5);
  }
  raw /= 10;
  float pinVoltage = (raw / 1023.0) * vRef;
  return pinVoltage * dividerRatio;
}

void setup() {
  Serial.begin(115200);

  WiFi.softAP(ssid, password);
  Serial.print("Battery Monitor AP IP: ");
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
    server.send(200, "application/json", "{\"deviceId\":\"ESP8266-BatteryMonitor\",\"projectId\":\"33-battery-voltage-monitor\",\"supportedProjects\":[\"33-battery-voltage-monitor\"]}");
  });

  server.on("/api/readings", HTTP_GET, []() {
    float v = readBatteryVoltage();
    int raw = analogRead(PIN_ADC);

    StaticJsonDocument<256> doc;
    doc["voltage"] = v;
    doc["raw_adc"] = raw;
    doc["divider_ratio"] = dividerRatio;
    doc["status"] = (v < 10.5) ? "low" : "normal";

    String out;
    serializeJson(doc, out);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", out);
  });

  server.on("/api/calibrate", HTTP_POST, []() {
    if (server.hasArg("plain")) {
      StaticJsonDocument<128> doc;
      deserializeJson(doc, server.arg("plain"));
      if (doc.containsKey("dividerRatio")) dividerRatio = doc["dividerRatio"];
      if (doc.containsKey("vRef")) vRef = doc["vRef"];
    }
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"success\":true,\"dividerRatio\":" + String(dividerRatio) + "}");
  });

  
  server.on("/api/command", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
    server.send(204);
  });
  server.on("/api/command", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"success\":true,\"message\":\"Calibration stored\"}");
  });

  server.begin();
}

void loop() {
  server.handleClient();
}
