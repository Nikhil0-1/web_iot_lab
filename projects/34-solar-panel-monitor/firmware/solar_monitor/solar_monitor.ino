/**
 * Project 34: Solar Panel Monitor
 * ESP8266 NodeMCU Firmware with INA219 I2C Current & Voltage Transducer
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_INA219.h>

const char* ssid = "TechIoTW_Solar";
const char* password = "password123";

ESP8266WebServer server(80);
Adafruit_INA219 ina219;

float dailyWh = 0.0;
unsigned long lastWhUpdate = 0;

void setup() {
  Serial.begin(115200);
  Wire.begin(4, 5); // SDA = D2 (GPIO 4), SCL = D1 (GPIO 5)

  if (!ina219.begin()) {
    Serial.println("Failed to find INA219 chip");
  }

  WiFi.softAP(ssid, password);
  Serial.print("Solar Monitor AP IP: ");
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
    server.send(200, "application/json", "{\"deviceId\":\"ESP8266-SolarMonitor\",\"projectId\":\"34-solar-panel-monitor\",\"supportedProjects\":[\"34-solar-panel-monitor\"]}");
  });

  server.on("/api/readings", HTTP_GET, []() {
    float busvoltage = ina219.getBusVoltage_V();
    float current_mA = ina219.getCurrent_mA();
    float power_mW = ina219.getPower_mW();

    StaticJsonDocument<256> doc;
    doc["bus_voltage_v"] = busvoltage;
    doc["current_ma"] = current_mA;
    doc["power_w"] = power_mW / 1000.0;
    doc["daily_wh"] = dailyWh;

    String out;
    serializeJson(doc, out);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", out);
  });

  
  server.on("/api/command", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
    server.send(204);
  });
  server.on("/api/command", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"success\":true}");
  });

  server.begin();
  lastWhUpdate = millis();
}

void loop() {
  server.handleClient();

  if (millis() - lastWhUpdate >= 2000) {
    float power_mW = ina219.getPower_mW();
    float hours = (millis() - lastWhUpdate) / 3600000.0;
    dailyWh += (power_mW / 1000.0) * hours;
    lastWhUpdate = millis();
  }
}
