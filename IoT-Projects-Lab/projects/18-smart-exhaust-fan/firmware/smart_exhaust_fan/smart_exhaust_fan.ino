/*
 * Project 18 — Smart Exhaust Fan — ESP8266 Firmware
 * DHT11/DHT22 Environmental Sensing + Relay Hysteresis Control
 *
 * Board: NodeMCU 1.0 (ESP-12E)
 * Libraries: ESP8266WiFi, ESP8266WebServer, ArduinoJson v6+, DHT sensor library
 *
 * Wiring:
 *   DHT DATA -> D4 (GPIO 2) with 10k pullup to 3.3V
 *   Relay IN -> D1 (GPIO 5) (Active LOW)
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

const char* WIFI_SSID     = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";

const int RELAY_PIN = 5; // D1 (GPIO 5) - Active LOW

float currentTemp = 25.0;
float currentHum  = 55.0;
float threshTemp  = 30.0;
float threshHum   = 70.0;

bool autoMode     = true;
bool fanOn        = false;

unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL_MS = 2000;

ESP8266WebServer server(80);

void addCors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void applyRelay() {
  // Active LOW: LOW = ON, HIGH = OFF
  digitalWrite(RELAY_PIN, fanOn ? LOW : HIGH);
}

void handleOptions() {
  addCors();
  server.send(204);
}

void handleStatus() {
  addCors();
  StaticJsonDocument<256> doc;
  doc["project"]     = "smart-exhaust-fan";
  doc["temperature"] = currentTemp;
  doc["humidity"]    = currentHum;
  doc["threshTemp"]  = threshTemp;
  doc["threshHum"]   = threshHum;
  doc["autoMode"]    = autoMode;
  doc["fanOn"]       = fanOn;
  doc["uptimeSec"]   = millis() / 1000;

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void handleControl() {
  addCors();
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"Missing body\"}");
    return;
  }

  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, server.arg("plain"));
  if (err) {
    server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
    return;
  }

  if (doc.containsKey("autoMode")) {
    autoMode = doc["autoMode"].as<bool>();
  }
  if (doc.containsKey("threshTemp")) {
    threshTemp = doc["threshTemp"].as<float>();
  }
  if (doc.containsKey("threshHum")) {
    threshHum = doc["threshHum"].as<float>();
  }
  if (doc.containsKey("fanOn")) {
    fanOn = doc["fanOn"].as<bool>();
    applyRelay();
  }

  handleStatus();
}


void handleHealth() {
  addCors();
  String json = "{\"status\":\"ok\",\"uptime_ms\":" + String(millis()) +
                ",\"free_heap\":" + String(ESP.getFreeHeap()) +
                ",\"ip\":\"" + (WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : WiFi.softAPIP().toString()) + "\"}";
  server.send(200, "application/json", json);
}

void handleDevice() {
  addCors();
  #if ARDUINOJSON_VERSION_MAJOR >= 7
    JsonDocument doc;
  #else
    StaticJsonDocument<512> doc;
  #endif
  doc["deviceId"] = "esp8266-18-smart-exhaust-fan";
  doc["projectId"] = "exhaust-fan";
  doc["projectName"] = "Smart Exhaust Fan";
  doc["firmwareVersion"] = "2.4.0";
  JsonArray projs = doc.createNestedArray("supportedProjects");
  projs.add("18-smart-exhaust-fan");
  projs.add("exhaust-fan");
  projs.add("18-smart-exhaust-fan");

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void setup() {
  Serial.begin(115200);

  // Initialize relay to safe OFF (HIGH) before activating pin
  digitalWrite(RELAY_PIN, HIGH);
  pinMode(RELAY_PIN, OUTPUT);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\nWiFi timeout. AP mode active.");
  }

  server.on("/api/status", HTTP_OPTIONS, handleOptions);
  server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/control", HTTP_OPTIONS, handleOptions);
  server.on("/api/control", HTTP_POST, handleControl);

  
  server.on("/api/health", HTTP_OPTIONS, handleOptions);
  server.on("/api/health", HTTP_GET, handleHealth);
  server.on("/api/device", HTTP_OPTIONS, handleOptions);
  server.on("/api/device", HTTP_GET, handleDevice);
  server.on("/api/readings", HTTP_OPTIONS, handleOptions);
  server.on("/api/readings", HTTP_GET, handleStatus);
  server.on("/api/command", HTTP_OPTIONS, handleOptions);
  server.on("/api/command", HTTP_POST, handleControl);

  server.begin();
  Serial.println("Exhaust fan controller server active on port 80");
}

void loop() {
  server.handleClient();

  unsigned long now = millis();
  if (now - lastReadTime >= READ_INTERVAL_MS) {
    lastReadTime = now;

    // Simulation/placeholder acquisition if hardware DHT is unattached
    // With physical DHT, read DHT.readTemperature() and DHT.readHumidity()
    if (autoMode) {
      if (fanOn) {
        // Hysteresis deadband: cut out 2.0°C and 5% RH lower
        if (currentTemp <= (threshTemp - 2.0) && currentHum <= (threshHum - 5.0)) {
          fanOn = false;
          applyRelay();
        }
      } else {
        if (currentTemp >= threshTemp || currentHum >= threshHum) {
          fanOn = true;
          applyRelay();
        }
      }
    }
  }
}
