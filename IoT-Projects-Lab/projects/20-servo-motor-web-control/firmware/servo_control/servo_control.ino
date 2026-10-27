/*
 * Project 20 — Servo Motor Web Control — ESP8266 Firmware
 * Precision Angular Positioning & Sweep with REST API
 *
 * Board: NodeMCU 1.0 (ESP-12E)
 * Libraries: ESP8266WiFi, ESP8266WebServer, ArduinoJson v6+, Servo
 *
 * Wiring:
 *   Servo PWM Signal -> D5 (GPIO 14)
 *   Servo VCC        -> External 5V 2A Power Supply (+)
 *   Servo GND        -> External Power Supply (-) and ESP8266 GND (Common Ground)
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>
#include <Servo.h>

const char* WIFI_SSID     = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";

const int SERVO_PIN = 14; // D5 (GPIO 14)

Servo myServo;
int currentAngle = 90;

ESP8266WebServer server(80);

void addCors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void applyAngle(int angle) {
  currentAngle = constrain(angle, 0, 180);
  myServo.write(currentAngle);
}

void handleOptions() {
  addCors();
  server.send(204);
}

void handleStatus() {
  addCors();
  StaticJsonDocument<256> doc;
  doc["project"]      = "servo-control";
  doc["angle"]        = currentAngle;
  doc["pulseWidthUs"] = map(currentAngle, 0, 180, 1000, 2000);
  doc["dutyCyclePct"] = ((float)map(currentAngle, 0, 180, 1000, 2000) / 20000.0f) * 100.0f;
  doc["uptimeSec"]    = millis() / 1000;

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void handleAngle() {
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

  if (doc.containsKey("angle")) {
    int ang = doc["angle"].as<int>();
    applyAngle(ang);
    handleStatus();
  } else {
    server.send(400, "application/json", "{\"error\":\"Missing angle parameter\"}");
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
  doc["deviceId"] = "esp8266-20-servo-motor-web-control";
  doc["projectId"] = "servo-control";
  doc["projectName"] = "Servo Motor Web Control";
  doc["firmwareVersion"] = "2.4.0";
  JsonArray projs = doc.createNestedArray("supportedProjects");
  projs.add("20-servo-motor-web-control");
  projs.add("servo-control");
  projs.add("20-servo-motor-web-control");

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void setup() {
  Serial.begin(115200);

  myServo.attach(SERVO_PIN, 1000, 2000); // Attach with standard 1ms - 2ms pulse width
  applyAngle(90); // Center safe position on boot

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
    Serial.println("\nWiFi timeout. Operating standalone AP mode.");
  }

  server.on("/api/status", HTTP_OPTIONS, handleOptions);
  server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/angle", HTTP_OPTIONS, handleOptions);
  server.on("/api/angle", HTTP_POST, handleAngle);

  
  server.on("/api/health", HTTP_OPTIONS, handleOptions);
  server.on("/api/health", HTTP_GET, handleHealth);
  server.on("/api/device", HTTP_OPTIONS, handleOptions);
  server.on("/api/device", HTTP_GET, handleDevice);
  server.on("/api/readings", HTTP_OPTIONS, handleOptions);
  server.on("/api/readings", HTTP_GET, handleStatus);
  server.on("/api/command", HTTP_OPTIONS, handleOptions);
  server.on("/api/command", HTTP_POST, handleAngle);

  server.begin();
  Serial.println("Servo controller web server active on port 80");
}

void loop() {
  server.handleClient();
}
