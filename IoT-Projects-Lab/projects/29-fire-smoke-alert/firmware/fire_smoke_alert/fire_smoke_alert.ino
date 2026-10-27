/**
 * Project 29: Fire & Smoke Alert
 * ESP8266 NodeMCU Firmware with MQ-2 Smoke Sensor & Optical Flame Detector
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

const char* ssid = "TechIoTW_FireAlert";
const char* password = "password123";

ESP8266WebServer server(80);

const int PIN_MQ2_AO = A0;   // Analog Input via voltage divider
const int PIN_FLAME_DO = 5;  // D1 (GPIO 5) - Active LOW on flame
const int PIN_BUZZER = 12;   // D6 (GPIO 12)
const int PIN_LED_ALERT = 13;// D7 (GPIO 13)

int smokeThreshold = 300;

int readSmokePpm() {
  int rawAdc = analogRead(PIN_MQ2_AO);
  // Estimate PPM relative to clean air baseline
  int ppm = map(rawAdc, 80, 950, 40, 1000);
  return constrain(ppm, 20, 2000);
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_FLAME_DO, INPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_LED_ALERT, OUTPUT);

  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_LED_ALERT, LOW);

  WiFi.softAP(ssid, password);
  Serial.print("Fire Alert AP IP: ");
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
    server.send(200, "application/json", "{\"deviceId\":\"ESP8266-FireAlert\",\"projectId\":\"29-fire-smoke-alert\",\"supportedProjects\":[\"29-fire-smoke-alert\"]}");
  });

  server.on("/api/readings", HTTP_GET, []() {
    int ppm = readSmokePpm();
    bool flame = (digitalRead(PIN_FLAME_DO) == LOW);
    bool alarm = (ppm >= smokeThreshold) || flame;

    digitalWrite(PIN_BUZZER, alarm ? HIGH : LOW);
    digitalWrite(PIN_LED_ALERT, alarm ? HIGH : LOW);

    StaticJsonDocument<256> doc;
    doc["smoke_ppm"] = ppm;
    doc["flame_detected"] = flame;
    doc["threshold_ppm"] = smokeThreshold;
    doc["alarm_active"] = alarm;

    String out;
    serializeJson(doc, out);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", out);
  });

  server.on("/api/threshold", HTTP_POST, []() {
    if (server.hasArg("plain")) {
      StaticJsonDocument<128> doc;
      deserializeJson(doc, server.arg("plain"));
      smokeThreshold = doc["threshold"] | smokeThreshold;
    }
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"success\":true,\"threshold\":" + String(smokeThreshold) + "}");
  });

  
  server.on("/api/command", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
    server.send(204);
  });
  server.on("/api/command", HTTP_POST, []() {
    if (server.hasArg("plain")) {
      StaticJsonDocument<128> doc;
      deserializeJson(doc, server.arg("plain"));
      if (doc.containsKey("threshold")) smokeThreshold = doc["threshold"].as<int>();
      if (doc.containsKey("siren")) digitalWrite(PIN_BUZZER, doc["siren"] ? HIGH : LOW);
    }
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"success\":true}");
  });

  server.begin();
}

void loop() {
  server.handleClient();
}
