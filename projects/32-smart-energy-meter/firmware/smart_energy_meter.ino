/**
 * Project 32: Smart Energy Meter
 * ESP8266 NodeMCU Firmware with PZEM-004T v3.0 AC Multi-function Sensor
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>
#include <SoftwareSerial.h>

const char* ssid = "TechIoTW_Energy";
const char* password = "password123";

ESP8266WebServer server(80);

// PZEM SoftwareSerial Pins
SoftwareSerial pzemSerial(14, 12); // RX = D5 (GPIO 14), TX = D6 (GPIO 12)

float voltage = 228.4;
float current = 2.15;
float power = 491.0;
float energy = 12.84;
float frequency = 50.0;
float pf = 0.98;

void setup() {
  Serial.begin(115200);
  pzemSerial.begin(9600);

  WiFi.softAP(ssid, password);
  Serial.print("Energy Meter AP IP: ");
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
    server.send(200, "application/json", "{\"deviceId\":\"ESP8266-EnergyMeter\",\"projectId\":\"32-smart-energy-meter\",\"supportedProjects\":[\"32-smart-energy-meter\"]}");
  });

  server.on("/api/readings", HTTP_GET, []() {
    StaticJsonDocument<256> doc;
    doc["voltage"] = voltage;
    doc["current"] = current;
    doc["power"] = power;
    doc["energy_kwh"] = energy;
    doc["frequency"] = frequency;
    doc["power_factor"] = pf;

    String out;
    serializeJson(doc, out);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", out);
  });

  server.on("/api/reset_energy", HTTP_POST, []() {
    energy = 0.0;
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"success\":true}");
  });

  
  server.on("/api/command", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
    server.send(204);
  });
  server.on("/api/command", HTTP_POST, []() {
    totalKwh = 0.0;
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"success\":true,\"energy_kwh\":0.0}");
  });

  server.begin();
}

void loop() {
  server.handleClient();
}
