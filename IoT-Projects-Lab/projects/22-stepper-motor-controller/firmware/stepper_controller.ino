/*
 * Project 22 — Stepper Motor Controller — ESP8266 Firmware
 * Step & Direction (A4988 / DRV8825) Interface with REST API
 *
 * Board: NodeMCU 1.0 (ESP-12E)
 * Libraries: ESP8266WiFi, ESP8266WebServer, ArduinoJson v6+
 *
 * Wiring:
 *   STEP Pin   -> D1 (GPIO 5)
 *   DIR Pin    -> D2 (GPIO 4)
 *   ENABLE Pin -> D5 (GPIO 14) (Active LOW)
 *   VMOT       -> 12V Supply with 100uF decoupling capacitor
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

const char* WIFI_SSID     = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";

const int STEP_PIN   = 5;  // D1
const int DIR_PIN    = 4;  // D2
const int ENABLE_PIN = 14; // D5 (Active LOW)

long currentStep = 0;
long targetStep  = 0;
int  stepRate    = 400; // Pulses per second
bool motorActive = false;

ESP8266WebServer server(80);

void addCors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void handleOptions() {
  addCors();
  server.send(204);
}

void handleStatus() {
  addCors();
  StaticJsonDocument<256> doc;
  doc["project"]     = "stepper-control";
  doc["currentStep"] = currentStep;
  doc["targetStep"]  = targetStep;
  doc["stepRate"]    = stepRate;
  doc["enabled"]     = motorActive;
  doc["uptimeSec"]   = millis() / 1000;

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void handleMove() {
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

  if (doc.containsKey("target")) {
    targetStep = doc["target"].as<long>();
  }
  if (doc.containsKey("speed")) {
    stepRate = constrain(doc["speed"].as<int>(), 50, 1000);
  }

  // Enable driver
  digitalWrite(ENABLE_PIN, LOW); // Active LOW enable
  motorActive = true;

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
  doc["deviceId"] = "esp8266-22-stepper-motor-controller";
  doc["projectId"] = "stepper-controller";
  doc["projectName"] = "Stepper Motor Controller";
  doc["firmwareVersion"] = "2.4.0";
  JsonArray projs = doc.createNestedArray("supportedProjects");
  projs.add("22-stepper-motor-controller");
  projs.add("stepper-controller");
  projs.add("22-stepper-motor-controller");

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void setup() {
  Serial.begin(115200);

  pinMode(STEP_PIN, OUTPUT);
  pinMode(DIR_PIN, OUTPUT);
  pinMode(ENABLE_PIN, OUTPUT);

  digitalWrite(STEP_PIN, LOW);
  digitalWrite(DIR_PIN, LOW);
  digitalWrite(ENABLE_PIN, HIGH); // Disabled on boot for safety

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
  server.on("/api/move", HTTP_OPTIONS, handleOptions);
  server.on("/api/move", HTTP_POST, handleMove);

  
  server.on("/api/health", HTTP_OPTIONS, handleOptions);
  server.on("/api/health", HTTP_GET, handleHealth);
  server.on("/api/device", HTTP_OPTIONS, handleOptions);
  server.on("/api/device", HTTP_GET, handleDevice);
  server.on("/api/readings", HTTP_OPTIONS, handleOptions);
  server.on("/api/readings", HTTP_GET, handleStatus);
  server.on("/api/command", HTTP_OPTIONS, handleOptions);
  server.on("/api/command", HTTP_POST, handleMove);

  server.begin();
  Serial.println("Stepper controller server running on port 80");
}

void loop() {
  server.handleClient();

  if (currentStep != targetStep) {
    bool dir = (targetStep > currentStep);
    digitalWrite(DIR_PIN, dir ? HIGH : LOW);

    digitalWrite(STEP_PIN, HIGH);
    delayMicroseconds(20);
    digitalWrite(STEP_PIN, LOW);

    currentStep += (dir ? 1 : -1);

    // Speed pacing
    int delayUs = 1000000 / stepRate;
    delayMicroseconds(constrain(delayUs - 20, 50, 20000));
  }
}
