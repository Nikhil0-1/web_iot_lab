/*
 * IoT PROJECTS LAB — Project 03: LDR Light Intensity Monitor
 * ESP8266 NodeMCU Firmware with LDR Voltage Divider & REST API
 *
 * Board: NodeMCU 1.0 (ESP-12E Module)
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* ap_ssid = "ESP8266-LDR-AP";
const char* ap_password = "password123";

#define LDR_PIN A0

const char* DEVICE_ID = "esp8266-ldr-01";
const char* PROJECT_ID = "ldr-light-intensity-monitor";
const char* FIRMWARE_VER = "1.0.0";

ESP8266WebServer server(80);

int rawAdc = 0;
float lightPercent = 0.0;
unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL_MS = 1000;

void sendCORSHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
}

void handleOptions() {
  sendCORSHeaders();
  server.send(204);
}

void handleHealth() {
  sendCORSHeaders();
  String json = "{\"status\":\"ok\",\"uptimeSeconds\":" + String(millis() / 1000) + ",\"freeHeap\":" + String(ESP.getFreeHeap()) + "}";
  server.send(200, "application/json", json);
}

void handleDevice() {
  sendCORSHeaders();
  String json = "{";
  json += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  json += "\"projectId\":\"" + String(PROJECT_ID) + "\",";
  json += "\"firmwareVersion\":\"" + String(FIRMWARE_VER) + "\",";
  json += "\"sensorType\":\"LDR Light Sensor Divider\"";
  json += "}";
  server.send(200, "application/json", json);
}

void handleReadings() {
  sendCORSHeaders();
  String json = "{";
  json += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  json += "\"projectId\":\"" + String(PROJECT_ID) + "\",";
  json += "\"mode\":\"hardware\",";
  json += "\"timestamp\":" + String(millis() / 1000) + ",";
  json += "\"sensorStatus\":\"ok\",";
  json += "\"readings\":{";
  json += "\"rawAdc\":" + String(rawAdc) + ",";
  json += "\"lightPercent\":" + String(lightPercent, 1);
  json += "}";
  json += "}";
  server.send(200, "application/json", json);
}

void handleConfig() {
  sendCORSHeaders();
  String json = "{\"pollIntervalMs\":" + String(READ_INTERVAL_MS) + "}";
  server.send(200, "application/json", json);
}

void setup() {
  Serial.begin(115200);
  pinMode(LDR_PIN, INPUT);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 12) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi Connected: http://" + WiFi.localIP().toString());
  } else {
    WiFi.mode(WIFI_AP);
    WiFi.softAP(ap_ssid, ap_password);
    Serial.println("\nAP Started: http://" + WiFi.softAPIP().toString());
  }

  server.on("/api/health", HTTP_GET, handleHealth);
  server.on("/api/device", HTTP_GET, handleDevice);
  server.on("/api/readings", HTTP_GET, handleReadings);
  server.on("/api/config", HTTP_GET, handleConfig);

  server.on("/api/health", HTTP_OPTIONS, handleOptions);
  server.on("/api/device", HTTP_OPTIONS, handleOptions);
  server.on("/api/readings", HTTP_OPTIONS, handleOptions);
  server.on("/api/config", HTTP_OPTIONS, handleOptions);

  
  server.on("/api/command", HTTP_OPTIONS, []() {
    setCorsHeaders();
    server.send(204);
  });
  server.on("/api/command", HTTP_POST, []() {
    setCorsHeaders();
    server.send(200, "application/json", "{\"success\":true,\"message\":\"Command acknowledged\"}");
  });

  server.begin();
}

void loop() {
  server.handleClient();

  unsigned long now = millis();
  if (now - lastReadTime >= READ_INTERVAL_MS) {
    lastReadTime = now;

    long sum = 0;
    for (int i = 0; i < 8; i++) {
      sum += analogRead(LDR_PIN);
      delay(2);
    }
    rawAdc = sum / 8;
    lightPercent = constrain((rawAdc / 1023.0) * 100.0, 0.0, 100.0);
  }
}
