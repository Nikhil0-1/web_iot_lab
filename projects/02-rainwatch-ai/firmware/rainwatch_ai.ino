/**
 * RAINWATCH AI — Rain Detection & Wetness Monitor Firmware
 * Board: NodeMCU 1.0 (ESP-12E Module)
 * 
 * Pinout:
 *   LM393 AO -> ESP8266 A0 (Analog 0-1023)
 *   LM393 DO -> ESP8266 D1 (GPIO 5)
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

const int RAIN_ANALOG_PIN = A0;
const int RAIN_DIGITAL_PIN = 5; // D1

ESP8266WebServer server(80);

unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL = 500;

int rawAdc = 1023;
float rainPercentage = 0.0;
float rainRateMmH = 0.0;

void setCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
}

void handleOptions() {
  setCorsHeaders();
  server.send(204);
}

void sampleRainSensor() {
  // Read analog value multiple times to average noise
  long sum = 0;
  for (int i = 0; i < 8; i++) {
    sum += analogRead(RAIN_ANALOG_PIN);
    delay(2);
  }
  rawAdc = sum / 8;

  // Inverted mapping: 1023 (Dry) -> 0%, ~150 (Soaked) -> 100%
  int constrainedAdc = constrain(rawAdc, 150, 1023);
  rainPercentage = (float)(1023 - constrainedAdc) / (1023 - 150) * 100.0;
  rainRateMmH = (rainPercentage / 100.0) * 55.0;
}

void handleGetReadings() {
  setCorsHeaders();
  StaticJsonDocument<256> doc;
  doc["device"] = "RAINWATCH AI";
  doc["mode"] = "hardware";
  doc["intensity_pct"] = serialized(String(rainPercentage, 1));
  doc["adc_raw"] = rawAdc;
  doc["rate_mmh"] = serialized(String(rainRateMmH, 1));
  doc["digital_rain"] = digitalRead(RAIN_DIGITAL_PIN) == LOW;
  doc["status"] = (rainPercentage >= 75) ? "TORRENTIAL" : ((rainPercentage >= 40) ? "STEADY" : ((rainPercentage >= 10) ? "DRIZZLE" : "DRY"));
  doc["uptime_ms"] = millis();

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void handleGetStatus() {
  setCorsHeaders();
  StaticJsonDocument<256> doc;
  doc["device"] = "RAINWATCH AI";
  doc["sensor"] = "LM393 Rain Sensor Plate";
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
  doc["deviceId"] = "esp8266-02-rainwatch-ai";
  doc["projectId"] = "02-rainwatch-ai";
  doc["deviceName"] = "RAINWATCH AI";
  doc["firmwareVersion"] = "2.4.0";
  JsonArray projs = doc.createNestedArray("supportedProjects");
  projs.add("02-rainwatch-ai"); projs.add("rainwatch-ai"); projs.add("02");

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
  pinMode(RAIN_DIGITAL_PIN, INPUT);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 15) {
    delay(500);
    attempts++;
  }

  if (WiFi.status() != WL_CONNECTED) {
    WiFi.mode(WIFI_AP);
    WiFi.softAP("Rainwatch-AP", "12345678");
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
    sampleRainSensor();
  }
}
