/*
 * IoT PROJECTS LAB — Project 02: Gas Leakage Detector
 * ESP8266 NodeMCU Firmware with MQ-2 Gas Sensor, Buzzer Alarm & REST API
 *
 * Board: NodeMCU 1.0 (ESP-12E Module)
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* ap_ssid = "ESP8266-GasDetector-AP";
const char* ap_password = "password123";

// Pins
#define MQ2_PIN A0
#define BUZZER_PIN 14 // D5 (GPIO14)
#define LED_PIN 12    // D6 (GPIO12)

const char* DEVICE_ID = "esp8266-gas-01";
const char* PROJECT_ID = "gas-leakage-detector";
const char* FIRMWARE_VER = "1.0.0";

ESP8266WebServer server(80);

int rawAdc = 0;
int estimatedPpm = 0;
bool alarmActive = false;
unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL_MS = 1000;
const int ALARM_THRESHOLD_PPM = 800;

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
  json += "\"sensorType\":\"MQ-2 Combustible Gas Sensor\"";
  json += "}";
  server.send(200, "application/json", json);
}

void handleReadings() {
  sendCORSHeaders();
  bool sensorValid = (rawAdc > 20);

  String json = "{";
  json += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  json += "\"projectId\":\"" + String(PROJECT_ID) + "\",";
  json += "\"mode\":\"hardware\",";
  json += "\"timestamp\":" + String(millis() / 1000) + ",";
  json += "\"sensorStatus\":\"" + String(sensorValid ? "ok" : "fault") + "\",";
  json += "\"readings\":{";
  if (sensorValid) {
    json += "\"gasPpm\":" + String(estimatedPpm) + ",";
    json += "\"rawAdc\":" + String(rawAdc) + ",";
    json += "\"alarmActive\":" + String(alarmActive ? "true" : "false");
  } else {
    json += "\"gasPpm\":null,\"alarmActive\":false";
  }
  json += "}";
  json += "}";
  server.send(200, "application/json", json);
}

void handleConfig() {
  sendCORSHeaders();
  String json = "{\"pollIntervalMs\":" + String(READ_INTERVAL_MS) + ",\"alarmThresholdPpm\":" + String(ALARM_THRESHOLD_PPM) + "}";
  server.send(200, "application/json", json);
}

void setup() {
  Serial.begin(115200);
  pinMode(MQ2_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);

  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

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
      sum += analogRead(MQ2_PIN);
      delay(2);
    }
    rawAdc = sum / 8;

    // Approximate PPM curve (for educational demonstration)
    estimatedPpm = map(rawAdc, 80, 1023, 50, 1000);
    if (estimatedPpm < 50) estimatedPpm = 50;

    alarmActive = (estimatedPpm >= ALARM_THRESHOLD_PPM);

    // Audio/visual hardware alarm
    if (alarmActive) {
      digitalWrite(BUZZER_PIN, HIGH);
      digitalWrite(LED_PIN, HIGH);
    } else {
      digitalWrite(BUZZER_PIN, LOW);
      digitalWrite(LED_PIN, LOW);
    }
  }
}
