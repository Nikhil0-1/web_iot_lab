/**
 * Project 28: Smart Dustbin
 * ESP8266 NodeMCU Firmware with IR Proximity & Ultrasonic Fill Telemetry
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>
#include <Servo.h>

const char* ssid = "TechIoTW_Dustbin";
const char* password = "password123";

ESP8266WebServer server(80);
Servo lidServo;

const int PIN_TRIG = 5;  // D1 (GPIO 5) - Ultrasonic Trig
const int PIN_ECHO = 4;  // D2 (GPIO 4) - Ultrasonic Echo (via 1k/2k divider)
const int PIN_SERVO = 14; // D5 (GPIO 14) - SG90 Servo
const int PIN_IR_DO = 12; // D6 (GPIO 12) - TCRT5000 IR Sensor (Active LOW)

bool lidOpen = false;
unsigned long openTimestamp = 0;
const unsigned long AUTO_CLOSE_MS = 3500;
const int BIN_HEIGHT_CM = 40;

long readUltrasonicCm() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  long duration = pulseIn(PIN_ECHO, HIGH, 25000);
  if (duration == 0) return BIN_HEIGHT_CM;
  return duration / 58;
}

void openLid() {
  lidServo.write(85);
  lidOpen = true;
  openTimestamp = millis();
}

void closeLid() {
  lidServo.write(0);
  lidOpen = false;
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_IR_DO, INPUT);

  lidServo.attach(PIN_SERVO);
  closeLid();

  WiFi.softAP(ssid, password);
  Serial.print("Dustbin AP IP: ");
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
    server.send(200, "application/json", "{\"deviceId\":\"ESP8266-Dustbin\",\"projectId\":\"28-smart-dustbin\",\"supportedProjects\":[\"28-smart-dustbin\"]}");
  });

  server.on("/api/readings", HTTP_GET, []() {
    long depth = readUltrasonicCm();
    int fillPct = constrain(map(depth, BIN_HEIGHT_CM, 5, 0, 100), 0, 100);

    StaticJsonDocument<256> doc;
    doc["distance_cm"] = depth;
    doc["fill_percent"] = fillPct;
    doc["lid_open"] = lidOpen;
    doc["ir_motion"] = (digitalRead(PIN_IR_DO) == LOW);

    String out;
    serializeJson(doc, out);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", out);
  });

  server.on("/api/lid", HTTP_POST, []() {
    if (server.hasArg("plain")) {
      StaticJsonDocument<128> doc;
      deserializeJson(doc, server.arg("plain"));
      String action = doc["action"] | "open";
      if (action == "open") openLid();
      else if (action == "close") closeLid();
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
      String action = doc["action"] | (doc["lidOpen"] ? "open" : "close");
      if (action == "open" || doc["lidOpen"] == true) lidServo.write(90);
      else lidServo.write(0);
    }
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"success\":true}");
  });

  server.begin();
}

void loop() {
  server.handleClient();

  // Check IR proximity sensor for touchless hand wave
  if (digitalRead(PIN_IR_DO) == LOW) {
    if (!lidOpen) {
      openLid();
    } else {
      openTimestamp = millis(); // Prolong open window while hand is detected
    }
  }

  // Auto-close lid after timer expires
  if (lidOpen && (millis() - openTimestamp >= AUTO_CLOSE_MS)) {
    closeLid();
  }
}
