/**
 * TerraIQ — Capacitive Soil Moisture Monitor Firmware
 * Board: NodeMCU 1.0 (ESP-12E Module)
 * 
 * Pinout:
 *   Capacitive Soil Sensor AOUT -> ESP8266 A0 (Analog 0-1023)
 *   VCC -> 3.3V, GND -> GND
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

const int SOIL_PIN = A0;

// Calibration values for Capacitive Sensor v1.2
const int AIR_VALUE = 820;   // Sensor value in dry air (0% moisture)
const int WATER_VALUE = 380; // Sensor value submerged in water (100% moisture)

ESP8266WebServer server(80);

unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL = 1000;

int rawAdc = 600;
float moisturePct = 0.0;
float probeVoltage = 0.0;

void setCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
}

void handleOptions() {
  setCorsHeaders();
  server.send(204);
}

void sampleSoilSensor() {
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(SOIL_PIN);
    delay(3);
  }
  rawAdc = sum / 10;

  // Constrain within calibration envelope
  int constrainedAdc = constrain(rawAdc, WATER_VALUE, AIR_VALUE);
  moisturePct = (float)(AIR_VALUE - constrainedAdc) / (AIR_VALUE - WATER_VALUE) * 100.0;
  probeVoltage = (float)rawAdc / 1023.0 * 3.3;
}

void handleGetReadings() {
  setCorsHeaders();
  StaticJsonDocument<256> doc;
  doc["device"] = "TerraIQ";
  doc["mode"] = "hardware";
  doc["moisture_pct"] = serialized(String(moisturePct, 1));
  doc["adc_raw"] = rawAdc;
  doc["voltage"] = serialized(String(probeVoltage, 2));
  doc["status"] = (moisturePct < 30.0) ? "PARCHED" : ((moisturePct > 75.0) ? "SATURATED" : "OPTIMAL");
  doc["uptime_ms"] = millis();

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void handleGetStatus() {
  setCorsHeaders();
  StaticJsonDocument<256> doc;
  doc["device"] = "TerraIQ";
  doc["sensor"] = "Capacitive Soil Probe v1.2";
  doc["ip"] = WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : WiFi.softAPIP().toString();
  doc["status"] = "ONLINE";

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}


void handleGetHealth() {
  setCorsHeaders();
  String out = "{\"status\":\"ok\",\"uptime_ms\":" + String(millis()) +
               ",\"free_heap\":" + String(ESP.getFreeHeap()) +
               ",\"ip\":\"" + (WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : WiFi.softAPIP().toString()) + "\"}";
  server.send(200, "application/json", out);
}

void handleGetDevice() {
  setCorsHeaders();
  #if ARDUINOJSON_VERSION_MAJOR >= 7
    JsonDocument doc;
  #else
    StaticJsonDocument<512> doc;
  #endif
  doc["deviceId"] = "esp8266-03-terraiq";
  doc["projectId"] = "03-terraiq";
  doc["deviceName"] = "TerraIQ Soil Moisture";
  doc["firmwareVersion"] = "2.4.0";
  JsonArray projs = doc.createNestedArray("supportedProjects");
  projs.add("03-terraiq"); projs.add("terraiq"); projs.add("03");

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void handlePostCommand() {
  setCorsHeaders();
  server.send(200, "application/json", "{\"success\":true,\"message\":\"Command received\"}");
}

void setup() {
  Serial.begin(115200);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 15) {
    delay(500);
    attempts++;
  }

  if (WiFi.status() != WL_CONNECTED) {
    WiFi.mode(WIFI_AP);
    WiFi.softAP("TerraIQ-AP", "12345678");
  }

  server.on("/api/readings", HTTP_GET, handleGetReadings);
  server.on("/api/readings", HTTP_OPTIONS, handleOptions);
  server.on("/api/status", HTTP_GET, handleGetStatus);
  server.on("/api/status", HTTP_OPTIONS, handleOptions);

  
  server.on("/api/health", HTTP_GET, handleGetHealth);
  server.on("/api/health", HTTP_OPTIONS, handleOptions);
  server.on("/api/device", HTTP_GET, handleGetDevice);
  server.on("/api/device", HTTP_OPTIONS, handleOptions);
  server.on("/api/command", HTTP_POST, handlePostCommand);
  server.on("/api/command", HTTP_OPTIONS, handleOptions);

  server.begin();
}

void loop() {
  server.handleClient();
  if (millis() - lastReadTime >= READ_INTERVAL) {
    lastReadTime = millis();
    sampleSoilSensor();
  }
}
