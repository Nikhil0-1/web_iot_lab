/**
 * Project 30: Intrusion Detection Alarm
 * ESP8266 NodeMCU Firmware with HC-SR501 PIR Sensor & Piezo Siren Driver
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

const char* ssid = "TechIoTW_Intrusion";
const char* password = "password123";

ESP8266WebServer server(80);

const int PIN_PIR = 14;   // D5 (GPIO 14) - HC-SR501 Motion Out
const int PIN_SIREN = 5;  // D1 (GPIO 5) - Piezo Siren Buffer
const int PIN_LED = 4;    // D2 (GPIO 4) - Armed LED

bool isArmed = true;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_PIR, INPUT);
  pinMode(PIN_SIREN, OUTPUT);
  pinMode(PIN_LED, OUTPUT);

  digitalWrite(PIN_SIREN, LOW);
  digitalWrite(PIN_LED, isArmed ? HIGH : LOW);

  WiFi.softAP(ssid, password);
  Serial.print("Intrusion AP IP: ");
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
    server.send(200, "application/json", "{\"deviceId\":\"ESP8266-Intrusion\",\"projectId\":\"30-intrusion-detection-alarm\",\"supportedProjects\":[\"30-intrusion-detection-alarm\"]}");
  });

  server.on("/api/readings", HTTP_GET, []() {
    bool motion = (digitalRead(PIN_PIR) == HIGH);
    bool sirenActive = isArmed && motion;

    digitalWrite(PIN_SIREN, sirenActive ? HIGH : LOW);

    StaticJsonDocument<256> doc;
    doc["armed"] = isArmed;
    doc["motion_detected"] = motion;
    doc["siren_active"] = sirenActive;
    doc["zone"] = motion ? "Zone 1 (PIR Sensor)" : "Clear";

    String out;
    serializeJson(doc, out);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", out);
  });

  server.on("/api/arm", HTTP_POST, []() {
    if (server.hasArg("plain")) {
      StaticJsonDocument<128> doc;
      deserializeJson(doc, server.arg("plain"));
      if (doc.containsKey("armed")) {
        isArmed = doc["armed"];
        digitalWrite(PIN_LED, isArmed ? HIGH : LOW);
        if (!isArmed) digitalWrite(PIN_SIREN, LOW);
      }
    }
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"success\":true,\"armed\":" + String(isArmed ? "true" : "false") + "}");
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
      if (doc.containsKey("armed")) armed = doc["armed"].as<bool>();
      if (doc.containsKey("siren")) digitalWrite(PIN_SIREN, doc["siren"] ? HIGH : LOW);
    }
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"success\":true}");
  });

  server.begin();
}

void loop() {
  server.handleClient();
}
