/*
 * Project 24 — Smart Greenhouse Automation — ESP8266 Firmware
 * Multi-Sensor Acquisition + Coordinated Fan & Pump Actuation with Dry-Run Lockout
 *
 * Board: NodeMCU 1.0 (ESP-12E)
 * Libraries: ESP8266WiFi, ESP8266WebServer, ArduinoJson v6+
 *
 * Wiring:
 *   DHT22 Data    -> D4 (GPIO 2) with 10k pullup to 3.3V
 *   Soil Sensor   -> A0 (Analog 0–3.3V via NodeMCU divider)
 *   Fan Relay     -> D1 (GPIO 5) (Active LOW)
 *   Pump Relay    -> D2 (GPIO 4) (Active LOW)
 *   Float Switch  -> D5 (GPIO 14) with internal pull-up (LOW = Water present, HIGH = Empty)
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

const char* WIFI_SSID     = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";

const int FAN_RELAY_PIN  = 5;  // D1
const int PUMP_RELAY_PIN = 4;  // D2
const int FLOAT_SW_PIN   = 14; // D5
const int SOIL_ADC_PIN   = A0;

float currentTemp   = 24.5;
float currentHum    = 60.0;
float currentMoist  = 48.0;
int   currentLux    = 850;
bool  tankEmpty     = false;

bool autoMode       = true;
bool fanOn          = false;
bool pumpOn         = false;

unsigned long lastSenseTime = 0;
const unsigned long SENSE_INTERVAL_MS = 2000;

ESP8266WebServer server(80);

void addCors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void applyActuators() {
  // If reservoir is empty, force pump off immediately
  if (tankEmpty) {
    pumpOn = false;
  }
  // Active LOW relays: LOW = Relay ON, HIGH = Relay OFF
  digitalWrite(FAN_RELAY_PIN, fanOn ? LOW : HIGH);
  digitalWrite(PUMP_RELAY_PIN, pumpOn ? LOW : HIGH);
}

void handleOptions() {
  addCors();
  server.send(204);
}

void handleStatus() {
  addCors();
  StaticJsonDocument<256> doc;
  doc["project"]     = "greenhouse-automation";
  doc["temperature"] = currentTemp;
  doc["humidity"]    = currentHum;
  doc["moisture"]    = currentMoist;
  doc["lux"]         = currentLux;
  doc["fanOn"]       = fanOn;
  doc["pumpOn"]      = pumpOn;
  doc["tankEmpty"]   = tankEmpty;
  doc["autoMode"]    = autoMode;
  doc["uptimeSec"]   = millis() / 1000;

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void handleActuators() {
  addCors();
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"Missing body\"}");
    return;
  }

  StaticJsonDocument<128> doc;
  DeserializationError err = deserializeJson(doc, server.arg("plain"));
  if (err) {
    server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
    return;
  }

  if (doc.containsKey("fanOn")) fanOn = doc["fanOn"].as<bool>();
  if (doc.containsKey("pumpOn")) pumpOn = doc["pumpOn"].as<bool>();

  applyActuators();
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
  doc["deviceId"] = "esp8266-24-smart-greenhouse-automation";
  doc["projectId"] = "greenhouse";
  doc["projectName"] = "Smart Greenhouse Automation";
  doc["firmwareVersion"] = "2.4.0";
  JsonArray projs = doc.createNestedArray("supportedProjects");
  projs.add("24-smart-greenhouse-automation");
  projs.add("greenhouse");
  projs.add("24-smart-greenhouse-automation");

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void setup() {
  Serial.begin(115200);

  // Safe boot defaults: relays high (OFF)
  digitalWrite(FAN_RELAY_PIN, HIGH);
  digitalWrite(PUMP_RELAY_PIN, HIGH);
  pinMode(FAN_RELAY_PIN, OUTPUT);
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  pinMode(FLOAT_SW_PIN, INPUT_PULLUP);

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
    Serial.println("\nWiFi timeout. AP mode running.");
  }

  server.on("/api/status", HTTP_OPTIONS, handleOptions);
  server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/actuators", HTTP_OPTIONS, handleOptions);
  server.on("/api/actuators", HTTP_POST, handleActuators);

  
  server.on("/api/health", HTTP_OPTIONS, handleOptions);
  server.on("/api/health", HTTP_GET, handleHealth);
  server.on("/api/device", HTTP_OPTIONS, handleOptions);
  server.on("/api/device", HTTP_GET, handleDevice);
  server.on("/api/readings", HTTP_OPTIONS, handleOptions);
  server.on("/api/readings", HTTP_GET, handleStatus);
  server.on("/api/command", HTTP_OPTIONS, handleOptions);
  server.on("/api/command", HTTP_POST, handleActuators);

  server.begin();
  Serial.println("Greenhouse Automation HTTP server running on port 80");
}

void loop() {
  server.handleClient();

  unsigned long now = millis();
  if (now - lastSenseTime >= SENSE_INTERVAL_MS) {
    lastSenseTime = now;

    // Check float switch (HIGH = open circuit / dry tank)
    tankEmpty = (digitalRead(FLOAT_SW_PIN) == HIGH);

    // Read analog soil moisture
    int rawSoil = analogRead(SOIL_ADC_PIN);
    currentMoist = map(rawSoil, 1023, 300, 0, 100);
    currentMoist = constrain(currentMoist, 0, 100);

    if (autoMode) {
      // Ventilation Fan logic
      if (fanOn) {
        if (currentTemp <= 26.0 && currentHum <= 70.0) fanOn = false;
      } else {
        if (currentTemp >= 28.0 || currentHum >= 75.0) fanOn = true;
      }

      // Irrigation Pump logic
      if (!tankEmpty) {
        if (pumpOn) {
          if (currentMoist >= 60.0) pumpOn = false;
        } else {
          if (currentMoist <= 35.0) pumpOn = true;
        }
      } else {
        pumpOn = false; // Interlock
      }

      applyActuators();
    }
  }
}
