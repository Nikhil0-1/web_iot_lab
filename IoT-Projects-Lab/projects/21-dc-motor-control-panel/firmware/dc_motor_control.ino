/*
 * Project 21 — DC Motor Control Panel — ESP8266 Firmware
 * H-Bridge Bidirectional Motor Control (TB6612FNG / L298N) with REST API
 *
 * Board: NodeMCU 1.0 (ESP-12E)
 * Libraries: ESP8266WiFi, ESP8266WebServer, ArduinoJson v6+
 *
 * Wiring:
 *   IN1 (Dir A)  -> D1 (GPIO 5)
 *   IN2 (Dir B)  -> D2 (GPIO 4)
 *   PWM (Speed)  -> D5 (GPIO 14)
 *   Motor Supply -> VM (12V) and Common GND
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

const char* WIFI_SSID     = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";

const int IN1_PIN = 5;  // D1
const int IN2_PIN = 4;  // D2
const int PWM_PIN = 14; // D5

String currentDir = "BRAKE"; // FORWARD, REVERSE, BRAKE
int currentSpeed  = 0;       // 0 - 100%

ESP8266WebServer server(80);

void addCors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void applyMotorOutputs() {
  int pwmVal = map(currentSpeed, 0, 100, 0, 1023);

  if (currentDir == "FORWARD") {
    digitalWrite(IN1_PIN, HIGH);
    digitalWrite(IN2_PIN, LOW);
    analogWrite(PWM_PIN, pwmVal);
  } else if (currentDir == "REVERSE") {
    digitalWrite(IN1_PIN, LOW);
    digitalWrite(IN2_PIN, HIGH);
    analogWrite(PWM_PIN, pwmVal);
  } else {
    // Active BRAKE: both inputs shorted to ground or brake high
    digitalWrite(IN1_PIN, LOW);
    digitalWrite(IN2_PIN, LOW);
    analogWrite(PWM_PIN, 0);
  }
}

void handleOptions() {
  addCors();
  server.send(204);
}

void handleStatus() {
  addCors();
  StaticJsonDocument<256> doc;
  doc["project"]   = "dc-motor-control";
  doc["direction"] = currentDir;
  doc["speed"]     = currentSpeed;
  doc["pwmDuty"]   = map(currentSpeed, 0, 100, 0, 1023);
  doc["uptimeSec"] = millis() / 1000;

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void handleMotor() {
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

  if (doc.containsKey("direction")) {
    currentDir = doc["direction"].as<String>();
  }
  if (doc.containsKey("speed")) {
    currentSpeed = constrain(doc["speed"].as<int>(), 0, 100);
  }

  applyMotorOutputs();
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
  doc["deviceId"] = "esp8266-21-dc-motor-control-panel";
  doc["projectId"] = "dc-motor";
  doc["projectName"] = "DC Motor Control Panel";
  doc["firmwareVersion"] = "2.4.0";
  JsonArray projs = doc.createNestedArray("supportedProjects");
  projs.add("21-dc-motor-control-panel");
  projs.add("dc-motor");
  projs.add("21-dc-motor-control-panel");

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void setup() {
  Serial.begin(115200);

  pinMode(IN1_PIN, OUTPUT);
  pinMode(IN2_PIN, OUTPUT);
  pinMode(PWM_PIN, OUTPUT);

  analogWriteRange(1023);
  analogWriteFreq(1000); // 1 kHz PWM frequency

  // Boot in safe stopped state
  currentDir = "BRAKE";
  currentSpeed = 0;
  applyMotorOutputs();

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
  server.on("/api/motor", HTTP_OPTIONS, handleOptions);
  server.on("/api/motor", HTTP_POST, handleMotor);

  
  server.on("/api/health", HTTP_OPTIONS, handleOptions);
  server.on("/api/health", HTTP_GET, handleHealth);
  server.on("/api/device", HTTP_OPTIONS, handleOptions);
  server.on("/api/device", HTTP_GET, handleDevice);
  server.on("/api/readings", HTTP_OPTIONS, handleOptions);
  server.on("/api/readings", HTTP_GET, handleStatus);
  server.on("/api/command", HTTP_OPTIONS, handleOptions);
  server.on("/api/command", HTTP_POST, handleMotor);

  server.begin();
  Serial.println("DC Motor Controller server active on port 80");
}

void loop() {
  server.handleClient();
}
