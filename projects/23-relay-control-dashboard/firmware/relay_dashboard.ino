/*
 * Project 23 — Relay Control Dashboard — ESP8266 Firmware
 * Multi-Channel Optocoupled Relay Bank with Pulse Timers & REST API
 *
 * Board: NodeMCU 1.0 (ESP-12E)
 * Libraries: ESP8266WiFi, ESP8266WebServer, ArduinoJson v6+
 *
 * Wiring (Active LOW Relays):
 *   Relay 1 -> D1 (GPIO 5)
 *   Relay 2 -> D2 (GPIO 4)
 *   Relay 3 -> D5 (GPIO 14)
 *   Relay 4 -> D6 (GPIO 12)
 *   Relay JD-VCC -> External 5V Power Supply (+)
 *   Relay GND    -> Common Ground
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

const char* WIFI_SSID     = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";

const int RELAY_PINS[4] = { 5, 4, 14, 12 };
bool relayStates[4]     = { false, false, false, false };

ESP8266WebServer server(80);

void addCors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void applyRelays() {
  for (int i = 0; i < 4; i++) {
    // Active LOW logic: LOW = energized (ON), HIGH = de-energized (OFF)
    digitalWrite(RELAY_PINS[i], relayStates[i] ? LOW : HIGH);
  }
}

void handleOptions() {
  addCors();
  server.send(204);
}

void handleStatus() {
  addCors();
  StaticJsonDocument<256> doc;
  doc["project"]   = "relay-dashboard";
  JsonArray relays = doc.createNestedArray("relays");
  for (int i = 0; i < 4; i++) {
    relays.add(relayStates[i]);
  }
  doc["uptimeSec"] = millis() / 1000;

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void handleRelay() {
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

  int ch = doc["channel"] | -1;
  bool state = doc["state"] | false;

  if (ch >= 0 && ch < 4) {
    relayStates[ch] = state;
    applyRelays();
    handleStatus();
  } else {
    server.send(400, "application/json", "{\"error\":\"Channel out of bounds\"}");
  }
}

void handleAll() {
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

  bool state = doc["state"] | false;
  for (int i = 0; i < 4; i++) {
    relayStates[i] = state;
  }
  applyRelays();
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
  doc["deviceId"] = "esp8266-23-relay-control-dashboard";
  doc["projectId"] = "relay-dashboard";
  doc["projectName"] = "Relay Control Dashboard";
  doc["firmwareVersion"] = "2.4.0";
  JsonArray projs = doc.createNestedArray("supportedProjects");
  projs.add("23-relay-control-dashboard");
  projs.add("relay-dashboard");
  projs.add("23-relay-control-dashboard");

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void setup() {
  Serial.begin(115200);

  // Initialize all outputs to safe HIGH (OFF) before setting as OUTPUT
  for (int i = 0; i < 4; i++) {
    digitalWrite(RELAY_PINS[i], HIGH);
    pinMode(RELAY_PINS[i], OUTPUT);
  }

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
  server.on("/api/relay", HTTP_OPTIONS, handleOptions);
  server.on("/api/relay", HTTP_POST, handleRelay);
  server.on("/api/all", HTTP_OPTIONS, handleOptions);
  server.on("/api/all", HTTP_POST, handleAll);

  
  server.on("/api/health", HTTP_OPTIONS, handleOptions);
  server.on("/api/health", HTTP_GET, handleHealth);
  server.on("/api/device", HTTP_OPTIONS, handleOptions);
  server.on("/api/device", HTTP_GET, handleDevice);
  server.on("/api/readings", HTTP_OPTIONS, handleOptions);
  server.on("/api/readings", HTTP_GET, handleStatus);
  server.on("/api/command", HTTP_OPTIONS, handleOptions);
  server.on("/api/command", HTTP_POST, handleRelay);

  server.begin();
  Serial.println("Relay dashboard HTTP server started on port 80");
}

void loop() {
  server.handleClient();
}
