/*
 * Project 16 — Wi-Fi Home Automation Controller — ESP8266 Firmware
 * 4-Channel Relay Control with Safe Boot Defaults & JSON REST API
 *
 * Board: NodeMCU 1.0 (ESP-12E)
 * Libraries: ESP8266WiFi, ESP8266WebServer, ArduinoJson v6+
 *
 * GPIO Mapping (Active LOW Relays):
 *   Relay 1 (Living Room Light) -> D1 (GPIO 5)
 *   Relay 2 (Ceiling Fan)       -> D2 (GPIO 4)
 *   Relay 3 (AC Unit)           -> D5 (GPIO 14)
 *   Relay 4 (Kitchen Outlet)    -> D6 (GPIO 12)
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
    // Active LOW: LOW = Relay energised / ON, HIGH = Relay de-energised / OFF
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
  doc["project"]   = "home-automation";
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
    server.send(400, "application/json", "{\"error\":\"Channel out of range (0-3)\"}");
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
  doc["deviceId"] = "esp8266-16-wifi-home-automation";
  doc["projectId"] = "home-automation";
  doc["projectName"] = "Wi-Fi Home Automation";
  doc["firmwareVersion"] = "2.4.0";
  JsonArray projs = doc.createNestedArray("supportedProjects");
  projs.add("16-wifi-home-automation");
  projs.add("home-automation");
  projs.add("16-wifi-home-automation");

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void setup() {
  Serial.begin(115200);

  // Initialize relays to safe OFF (HIGH for active LOW relays) before enabling outputs
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
    Serial.println(F("\nWiFi connection timed out. Launching Access Point: TechIoTW_HomeAuto"));
    WiFi.mode(WIFI_AP_STA);
    WiFi.softAP("TechIoTW_HomeAuto", "tech123456");
    Serial.print(F("AP IP Address: "));
    Serial.println(WiFi.softAPIP());
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
  Serial.println("HTTP server started on port 80");
}

void loop() {
  server.handleClient();
}
