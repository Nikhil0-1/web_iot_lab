/**
 * ATMOS AI — Temperature & Humidity Monitoring Firmware
 * Board: NodeMCU 1.0 (ESP-12E Module)
 * 
 * Pinout:
 *   DHT22 Data -> ESP8266 D4 (GPIO 2)
 *   VCC -> 3.3V, GND -> GND
 * 
 * Required Libraries:
 *   - DHT sensor library (by Adafruit)
 *   - Adafruit Unified Sensor
 *   - ESP8266WebServer
 *   - ArduinoJson
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>
#include <DHT.h>

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

#define DHTPIN 2     // D4 (GPIO 2)
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);
ESP8266WebServer server(80);

unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL = 2000; // DHT22 requires min 2 sec between samples

float temperatureC = 22.0;
float humidity = 50.0;
float heatIndexC = 22.0;

void setCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
}

void handleOptions() {
  setCorsHeaders();
  server.send(204);
}

void readDHTSensor() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (!isnan(h) && !isnan(t)) {
    humidity = h;
    temperatureC = t;
    heatIndexC = dht.computeHeatIndex(t, h, false);
  }
}

void handleGetReadings() {
  setCorsHeaders();
  StaticJsonDocument<256> doc;
  doc["device"] = "ATMOS AI";
  doc["mode"] = "hardware";
  doc["temperature"] = serialized(String(temperatureC, 1));
  doc["humidity"] = serialized(String(humidity, 1));
  doc["heat_index"] = serialized(String(heatIndexC, 1));
  doc["unit"] = "C";
  doc["status"] = (temperatureC > 34.0 || heatIndexC > 38.0) ? "HAZARD_HEAT" : ((temperatureC > 27.0 && humidity > 65.0) ? "MUGGY" : ((temperatureC < 16.0) ? "COLD" : "COMFORT"));
  doc["uptime_ms"] = millis();

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void handleGetStatus() {
  setCorsHeaders();
  StaticJsonDocument<256> doc;
  doc["device"] = "ATMOS AI";
  doc["sensor"] = "DHT22 Digital Climate Sensor";
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
  doc["deviceId"] = "esp8266-04-atmos-ai";
  doc["projectId"] = "04-atmos-ai";
  doc["deviceName"] = "ATMOS AI Climate";
  doc["firmwareVersion"] = "2.4.0";
  JsonArray projs = doc.createNestedArray("supportedProjects");
  projs.add("04-atmos-ai"); projs.add("atmos-ai"); projs.add("04");

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
  dht.begin();

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 15) {
    delay(500);
    attempts++;
  }

  if (WiFi.status() != WL_CONNECTED) {
    WiFi.mode(WIFI_AP);
    WiFi.softAP("ATMOS-AI-AP", "12345678");
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
    readDHTSensor();
  }
}
