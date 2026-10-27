/*
 * IoT PROJECTS LAB — Project 01: Smart Air Quality Monitor
 * ESP8266 NodeMCU Firmware with MQ-135 Gas Sensor & REST API
 *
 * Board: NodeMCU 1.0 (ESP-12E Module)
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

// Wi-Fi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* ap_ssid = "ESP8266-AirQuality-AP";
const char* ap_password = "password123";

// Pin Definitions
#define MQ135_PIN A0

// Project Identity
const char* DEVICE_ID = "esp8266-air-01";
const char* PROJECT_ID = "smart-air-quality-monitor";
const char* FIRMWARE_VER = "1.0.0";

ESP8266WebServer server(80);

// State variables
int lastRawAdc = 0;
int estimatedAqi = 0;
bool warmupComplete = false;
unsigned long bootTime = 0;
unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL_MS = 1500;
const unsigned long WARMUP_DURATION_MS = 20000; // 20 seconds warmup

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
  json += "\"sensorType\":\"MQ-135 Air Quality Sensor\"";
  json += "}";
  server.send(200, "application/json", json);
}

void handleReadings() {
  sendCORSHeaders();
  bool sensorValid = (lastRawAdc > 20); // ADC < 20 indicates disconnected or short to ground

  String json = "{";
  json += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  json += "\"projectId\":\"" + String(PROJECT_ID) + "\",";
  json += "\"mode\":\"hardware\",";
  json += "\"timestamp\":" + String(millis() / 1000) + ",";
  json += "\"sensorStatus\":\"" + String(sensorValid ? "ok" : "fault") + "\",";
  json += "\"readings\":{";
  if (sensorValid) {
    json += "\"rawAdc\":" + String(lastRawAdc) + ",";
    json += "\"airQualityIndex\":" + String(estimatedAqi) + ",";
    json += "\"warmupComplete\":" + String(warmupComplete ? "true" : "false");
  } else {
    json += "\"rawAdc\":0,\"airQualityIndex\":null,\"warmupComplete\":false";
  }
  json += "}";
  json += "}";
  server.send(200, "application/json", json);
}

void handleConfig() {
  sendCORSHeaders();
  String json = "{\"pollIntervalMs\":" + String(READ_INTERVAL_MS) + ",\"baselineAdc\":120,\"warmupMs\":20000}";
  server.send(200, "application/json", json);
}

void setup() {
  Serial.begin(115200);
  bootTime = millis();

  Serial.println("\n--- IoT Projects Lab: Smart Air Quality Monitor ---");
  pinMode(MQ135_PIN, INPUT);

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
  Serial.println("REST API server running.");
}

void loop() {
  server.handleClient();

  unsigned long now = millis();
  if (now - bootTime >= WARMUP_DURATION_MS) {
    warmupComplete = true;
  }

  if (now - lastReadTime >= READ_INTERVAL_MS) {
    lastReadTime = now;

    // Oversample 8 readings for analog noise reduction
    long sum = 0;
    for (int i = 0; i < 8; i++) {
      sum += analogRead(MQ135_PIN);
      delay(2);
    }
    lastRawAdc = sum / 8;

    // Relative Air Quality Index estimation
    estimatedAqi = max(0, (int)((lastRawAdc - 120) / 2.3));

    Serial.print("MQ-135 ADC: ");
    Serial.print(lastRawAdc);
    Serial.print(" | AQI: ");
    Serial.println(estimatedAqi);
  }
}
