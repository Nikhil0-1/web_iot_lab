/*
 * IoT PROJECTS LAB — Project 06: Water Flow Meter
 * ESP8266 NodeMCU Firmware with Hall-Effect Flow Sensor & REST API
 *
 * Board: NodeMCU 1.0 (ESP-12E Module)
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* ap_ssid = "ESP8266-FlowMeter-AP";
const char* ap_password = "password123";

#define FLOW_SENSOR_PIN 4 // D2 (GPIO4)

const char* DEVICE_ID = "esp8266-flow-01";
const char* PROJECT_ID = "water-flow-meter";
const char* FIRMWARE_VER = "1.0.0";

ESP8266WebServer server(80);

volatile unsigned long pulseCounter = 0;
unsigned long totalPulses = 0;
float flowRateLpm = 0.0;
float totalLiters = 0.0;
unsigned long lastCalcTime = 0;
const float CALIBRATION_FACTOR = 7.5; // pulses per second per L/min

// Interrupt service routine
void ICACHE_RAM_ATTR onFlowPulse() {
  pulseCounter++;
}

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
  json += "\"sensorType\":\"YF-S201 Hall Flow Sensor\"";
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
  json += "\"flowRateLpm\":" + String(flowRateLpm, 2) + ",";
  json += "\"totalLiters\":" + String(totalLiters, 2) + ",";
  json += "\"pulseCount\":" + String(totalPulses);
  json += "}";
  json += "}";
  server.send(200, "application/json", json);
}

void handleConfig() {
  sendCORSHeaders();
  String json = "{\"calibrationFactor\":7.5}";
  server.send(200, "application/json", json);
}

void setup() {
  Serial.begin(115200);
  pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), onFlowPulse, FALLING);

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
  lastCalcTime = millis();
}

void loop() {
  server.handleClient();

  unsigned long now = millis();
  unsigned long elapsed = now - lastCalcTime;
  if (elapsed >= 1000) {
    // Atomically read and reset pulse counter
    noInterrupts();
    unsigned long pulses = pulseCounter;
    pulseCounter = 0;
    interrupts();

    totalPulses += pulses;

    // Flow Rate (L/min) = (pulses / duration_sec) / CALIBRATION_FACTOR
    float seconds = elapsed / 1000.0;
    flowRateLpm = (pulses / seconds) / CALIBRATION_FACTOR;

    // Cumulative Volume = pulses / 450 (since 7.5 * 60 = 450 pulses per liter)
    totalLiters += (pulses / (CALIBRATION_FACTOR * 60.0));

    lastCalcTime = now;
  }
}
