/*
 * IoT PROJECTS LAB — Project 05: Water Level Monitor
 * ESP8266 NodeMCU Firmware with Ultrasonic Distance Sensor & REST API
 *
 * Board: NodeMCU 1.0 (ESP-12E Module)
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* ap_ssid = "ESP8266-WaterLevel-AP";
const char* ap_password = "password123";

// Pins
#define TRIG_PIN 5 // D1 (GPIO5)
#define ECHO_PIN 4 // D2 (GPIO4)

const char* DEVICE_ID = "esp8266-level-01";
const char* PROJECT_ID = "water-level-monitor";
const char* FIRMWARE_VER = "1.0.0";

ESP8266WebServer server(80);

const float TANK_HEIGHT_CM = 100.0;
const float TANK_CAPACITY_L = 500.0;

float measuredDistanceCm = 0.0;
float waterDepthCm = 0.0;
float fillPercent = 0.0;
bool echoValid = false;
unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL_MS = 1500;

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
  json += "\"sensorType\":\"HC-SR04 Ultrasonic\"";
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
  json += "\"sensorStatus\":\"" + String(echoValid ? "ok" : "fault") + "\",";
  json += "\"readings\":{";
  if (echoValid) {
    json += "\"distanceCm\":" + String(measuredDistanceCm, 1) + ",";
    json += "\"waterDepthCm\":" + String(waterDepthCm, 1) + ",";
    json += "\"fillPercent\":" + String(fillPercent, 1);
  } else {
    json += "\"distanceCm\":null,\"waterDepthCm\":null,\"fillPercent\":null";
  }
  json += "}";
  json += "}";
  server.send(200, "application/json", json);
}

void handleConfig() {
  sendCORSHeaders();
  String json = "{\"tankHeightCm\":" + String(TANK_HEIGHT_CM) + ",\"capacityLiters\":" + String(TANK_CAPACITY_L) + "}";
  server.send(200, "application/json", json);
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);

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

    // Send 10us trigger pulse
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    // Measure echo pulse (30ms timeout = ~5 meters maximum)
    unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000);

    if (duration > 0) {
      measuredDistanceCm = (duration * 0.0343) / 2.0;
      if (measuredDistanceCm <= TANK_HEIGHT_CM + 20.0) {
        echoValid = true;
        waterDepthCm = constrain(TANK_HEIGHT_CM - measuredDistanceCm, 0.0, TANK_HEIGHT_CM);
        fillPercent = (waterDepthCm / TANK_HEIGHT_CM) * 100.0;
      } else {
        echoValid = false;
      }
    } else {
      echoValid = false;
    }
  }
}
