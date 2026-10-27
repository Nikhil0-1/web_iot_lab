/**
 * Project 25: Smart Parking Assistant
 * ESP8266 NodeMCU Firmware with HC-SR04 Ultrasonic Sensor & SG90 Servo Barrier
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>
#include <Servo.h>

const char* ssid = "TechIoTW_Parking";
const char* password = "password123";

ESP8266WebServer server(80);
Servo barrierServo;

// Pin Definitions
const int PIN_TRIG = 5;   // D1 (GPIO 5)
const int PIN_ECHO = 4;   // D2 (GPIO 4) - Use 1k/2k divider!
const int PIN_SERVO = 14; // D5 (GPIO 14)
const int PIN_LED_RED = 12; // D6 (GPIO 12)
const int PIN_LED_GRN = 13; // D7 (GPIO 13)

long readDistanceCm() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  long duration = pulseIn(PIN_ECHO, HIGH, 30000); // 30ms timeout (~500cm)
  if (duration == 0) return 150; // Timeout default
  return duration / 58;
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_LED_GRN, OUTPUT);

  barrierServo.attach(PIN_SERVO);
  barrierServo.write(0); // Barrier closed

  WiFi.softAP(ssid, password);
  Serial.print("Smart Parking AP IP: ");
  Serial.println(WiFi.softAPIP());

  // CORS handler
  server.onNotFound([]() {
    if (server.method() == HTTP_OPTIONS) {
      server.sendHeader("Access-Control-Allow-Origin", "*");
      server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
      server.send(204);
    } else {
      server.send(404, "text/plain", "Not Found");
    }
  });

  server.on("/api/health", HTTP_GET, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"status\":\"ok\",\"uptime_ms\":" + String(millis()) + "}");
  });

  server.on("/api/device", HTTP_GET, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"deviceId\":\"ESP8266-Parking\",\"projectId\":\"25-smart-parking-assistant\",\"supportedProjects\":[\"25-smart-parking-assistant\"]}");
  });

  server.on("/api/readings", HTTP_GET, []() {
    long dist = readDistanceCm();
    bool occupied = (dist < 25);

    digitalWrite(PIN_LED_RED, occupied ? HIGH : LOW);
    digitalWrite(PIN_LED_GRN, occupied ? LOW : HIGH);

    StaticJsonDocument<256> doc;
    doc["distance_cm"] = dist;
    doc["occupied"] = occupied;
    doc["available"] = occupied ? 0 : 1;
    doc["barrier_open"] = (barrierServo.read() > 45);

    String out;
    serializeJson(doc, out);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", out);
  });

  server.on("/api/barrier", HTTP_POST, []() {
    if (server.hasArg("plain")) {
      StaticJsonDocument<128> doc;
      deserializeJson(doc, server.arg("plain"));
      String action = doc["action"] | "toggle";
      if (action == "open") barrierServo.write(90);
      else if (action == "close") barrierServo.write(0);
    }
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"success\":true}");
  });

  
  server.on("/api/command", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
    server.send(204);
  });
  server.on("/api/command", HTTP_POST, []() {
    if (server.hasArg("plain")) {
      StaticJsonDocument<128> doc;
      deserializeJson(doc, server.arg("plain"));
      String action = doc["action"] | (doc["barrierOpen"] ? "open" : "close");
      if (action == "open" || doc["barrierOpen"] == true) barrierServo.write(90);
      else barrierServo.write(0);
    }
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"success\":true}");
  });

  server.begin();
}

void loop() {
  server.handleClient();
}
