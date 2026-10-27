/**
 * Project 36: Smart Room Occupancy
 * ESP8266 NodeMCU Firmware with Hi-Link HLK-LD2410 24GHz mmWave Radar
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>
#include <SoftwareSerial.h>

const char* ssid = "TechIoTW_Occupancy";
const char* password = "password123";

ESP8266WebServer server(80);

// LD2410 SoftwareSerial Pins
SoftwareSerial radarSerial(13, 15); // RX = D7 (GPIO 13), TX = D8 (GPIO 15)
const int PIN_RADAR_OUT = 14;      // D5 (GPIO 14) - Hardware Out Pin

bool isOccupied = true;
String targetState = "stationary"; // "stationary", "moving", "vacant"
float targetDistM = 1.8;
unsigned long dwellStart = 0;

void setup() {
  Serial.begin(115200);
  radarSerial.begin(256000); // LD2410 default baud
  pinMode(PIN_RADAR_OUT, INPUT);

  WiFi.softAP(ssid, password);
  Serial.print("Room Occupancy AP IP: ");
  Serial.println(WiFi.softAPIP());

  dwellStart = millis();

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
    server.send(200, "application/json", "{\"deviceId\":\"ESP8266-RoomRadar\",\"projectId\":\"36-smart-room-occupancy\",\"supportedProjects\":[\"36-smart-room-occupancy\"]}");
  });

  server.on("/api/readings", HTTP_GET, []() {
    bool outPin = (digitalRead(PIN_RADAR_OUT) == HIGH);

    StaticJsonDocument<256> doc;
    doc["occupied"] = outPin || isOccupied;
    doc["target_state"] = targetState;
    doc["target_distance_m"] = targetDistM;
    doc["dwell_seconds"] = (millis() - dwellStart) / 1000;

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
}

void loop() {
  server.handleClient();
}
