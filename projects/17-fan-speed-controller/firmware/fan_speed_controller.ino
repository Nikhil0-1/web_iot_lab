/*
 * Project 17 — Fan Speed Controller — ESP8266 Firmware
 * PWM-based DC Fan MOSFET Control with REST API
 *
 * Board: NodeMCU 1.0 (ESP-12E)
 * Libraries: ESP8266WiFi, ESP8266WebServer, ArduinoJson v6+
 *
 * Wiring:
 *   MOSFET Gate (PWM) -> D1 (GPIO 5)
 *   MOSFET Source     -> GND
 *   MOSFET Drain      -> Fan (-)
 *   Fan (+)           -> External 12V Supply (+)
 *   External Supply (-)-> Common GND
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

const char* WIFI_SSID     = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";

const int PWM_PIN = 5; // D1 (GPIO 5)

int fanSpeedPct   = 0; // 0 - 100%
const int MAX_RPM = 2800;

ESP8266WebServer server(80);

void addCors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void applyPwm() {
  // ESP8266 PWM duty cycle: 0 to 1023
  int pwmVal = map(fanSpeedPct, 0, 100, 0, 1023);
  analogWrite(PWM_PIN, pwmVal);
}

void handleOptions() {
  addCors();
  server.send(204);
}

void handleStatus() {
  addCors();
  StaticJsonDocument<256> doc;
  doc["project"]     = "fan-controller";
  doc["speed"]       = fanSpeedPct;
  doc["pwmDuty"]     = map(fanSpeedPct, 0, 100, 0, 1023);
  doc["rpmEstimate"] = (fanSpeedPct * MAX_RPM) / 100;
  doc["uptimeSec"]   = millis() / 1000;

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void handleSpeed() {
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

  if (doc.containsKey("speed")) {
    int spd = doc["speed"].as<int>();
    fanSpeedPct = constrain(spd, 0, 100);
    applyPwm();
    handleStatus();
  } else {
    server.send(400, "application/json", "{\"error\":\"Missing speed parameter\"}");
  }
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
  doc["deviceId"] = "esp8266-17-fan-speed-controller";
  doc["projectId"] = "fan-controller";
  doc["projectName"] = "Fan Speed Controller";
  doc["firmwareVersion"] = "2.4.0";
  JsonArray projs = doc.createNestedArray("supportedProjects");
  projs.add("17-fan-speed-controller");
  projs.add("fan-controller");
  projs.add("17-fan-speed-controller");

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void setup() {
  Serial.begin(115200);

  pinMode(PWM_PIN, OUTPUT);
  analogWriteRange(1023);
  analogWriteFreq(1000); // 1 kHz PWM frequency
  analogWrite(PWM_PIN, 0); // Boot with fan stopped for safety

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
    Serial.println("\nWiFi timeout. Starting fallback AP.");
  }

  server.on("/api/status", HTTP_OPTIONS, handleOptions);
  server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/speed", HTTP_OPTIONS, handleOptions);
  server.on("/api/speed", HTTP_POST, handleSpeed);

  
  server.on("/api/health", HTTP_OPTIONS, handleOptions);
  server.on("/api/health", HTTP_GET, handleHealth);
  server.on("/api/device", HTTP_OPTIONS, handleOptions);
  server.on("/api/device", HTTP_GET, handleDevice);
  server.on("/api/readings", HTTP_OPTIONS, handleOptions);
  server.on("/api/readings", HTTP_GET, handleStatus);
  server.on("/api/command", HTTP_OPTIONS, handleOptions);
  server.on("/api/command", HTTP_POST, handleSpeed);

  server.begin();
  Serial.println("Fan Speed Controller server running on port 80");
}

void loop() {
  server.handleClient();
}
