/*
 * IoT PROJECTS LAB — Project 07: TDS Water Quality Monitor
 * ESP8266 NodeMCU Firmware with Analog TDS Probe & REST API
 *
 * Board: NodeMCU 1.0 (ESP-12E Module)
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* ap_ssid = "ESP8266-TDS-AP";
const char* ap_password = "password123";

#define TDS_PIN A0
#define VREF 3.3

const char* DEVICE_ID = "esp8266-tds-01";
const char* PROJECT_ID = "tds-water-quality-monitor";
const char* FIRMWARE_VER = "1.0.0";

ESP8266WebServer server(80);

int rawAdc = 0;
float voltage = 0.0;
int tdsPpm = 0;
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
  json += "\"sensorType\":\"Analog TDS Sensor Probe\"";
  json += "}";
  server.send(200, "application/json", json);
}

void handleReadings() {
  sendCORSHeaders();
  bool probeImmersed = (rawAdc > 15); // ADC < 15 indicates probe in air (open circuit)

  String json = "{";
  json += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  json += "\"projectId\":\"" + String(PROJECT_ID) + "\",";
  json += "\"mode\":\"hardware\",";
  json += "\"timestamp\":" + String(millis() / 1000) + ",";
  json += "\"sensorStatus\":\"" + String(probeImmersed ? "ok" : "fault") + "\",";
  json += "\"readings\":{";
  if (probeImmersed) {
    json += "\"tdsPpm\":" + String(tdsPpm) + ",";
    json += "\"voltage\":" + String(voltage, 2) + ",";
    json += "\"rawAdc\":" + String(rawAdc);
  } else {
    json += "\"tdsPpm\":null,\"voltage\":null,\"rawAdc\":0";
  }
  json += "}";
  json += "}";
  server.send(200, "application/json", json);
}

void handleConfig() {
  sendCORSHeaders();
  String json = "{\"vRef\":3.3,\"tempBaselineC\":25.0}";
  server.send(200, "application/json", json);
}

void setup() {
  Serial.begin(115200);
  pinMode(TDS_PIN, INPUT);

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
    for (int i = 0; i < 16; i++) {
      sum += analogRead(TDS_PIN);
      delay(2);
    }
    rawAdc = sum / 16;

    voltage = (rawAdc / 1023.0) * VREF;

    // Standard TDS polynomial compensation curve (at 25°C)
    float compensationCoefficient = 1.0;
    float compensationVoltage = voltage / compensationCoefficient;
    float calculatedTds = (133.42 * pow(compensationVoltage, 3) - 255.86 * pow(compensationVoltage, 2) + 857.39 * compensationVoltage) * 0.5;

    tdsPpm = max(0, (int)calculatedTds);
  }
}
