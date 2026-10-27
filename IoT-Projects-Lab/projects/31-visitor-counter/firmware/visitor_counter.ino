/**
 * Project 31: Visitor Counter
 * ESP8266 NodeMCU Firmware with Dual Break-Beam Directional Logic
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

const char* ssid = "TechIoTW_Visitor";
const char* password = "password123";

ESP8266WebServer server(80);

const int PIN_BEAM_A = 5;  // D1 (GPIO 5)
const int PIN_BEAM_B = 4;  // D2 (GPIO 4)
const int PIN_LED = 12;    // D6 (GPIO 12)

volatile int totalIn = 0;
volatile int totalOut = 0;
volatile int currentOccupancy = 0;

int state = 0; // 0=Idle, 1=A tripped first, 2=B tripped first
unsigned long lastStateChange = 0;
const unsigned long TIMEOUT_MS = 2500;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_BEAM_A, INPUT_PULLUP);
  pinMode(PIN_BEAM_B, INPUT_PULLUP);
  pinMode(PIN_LED, OUTPUT);

  digitalWrite(PIN_LED, LOW);

  WiFi.softAP(ssid, password);
  Serial.print("Visitor Counter AP IP: ");
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
    server.send(200, "application/json", "{\"deviceId\":\"ESP8266-Visitor\",\"projectId\":\"31-visitor-counter\",\"supportedProjects\":[\"31-visitor-counter\"]}");
  });

  server.on("/api/readings", HTTP_GET, []() {
    StaticJsonDocument<256> doc;
    doc["total_in"] = totalIn;
    doc["total_out"] = totalOut;
    doc["occupancy"] = currentOccupancy;
    doc["beam_a"] = (digitalRead(PIN_BEAM_A) == LOW);
    doc["beam_b"] = (digitalRead(PIN_BEAM_B) == LOW);

    String out;
    serializeJson(doc, out);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", out);
  });

  server.on("/api/reset", HTTP_POST, []() {
    totalIn = 0;
    totalOut = 0;
    currentOccupancy = 0;
    state = 0;
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
    visitorCount = 0;
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"success\":true,\"visitor_count\":0}");
  });

  server.begin();
}

void loop() {
  server.handleClient();

  bool a = (digitalRead(PIN_BEAM_A) == LOW);
  bool b = (digitalRead(PIN_BEAM_B) == LOW);

  // Directional State Machine
  if (state == 0) {
    if (a && !b) {
      state = 1; // Started entering
      lastStateChange = millis();
    } else if (b && !a) {
      state = 2; // Started exiting
      lastStateChange = millis();
    }
  } else if (state == 1) { // Waiting for Beam B
    if (b) {
      totalIn++;
      currentOccupancy++;
      state = 0;
      digitalWrite(PIN_LED, HIGH);
      delay(80);
      digitalWrite(PIN_LED, LOW);
    } else if (millis() - lastStateChange > TIMEOUT_MS) {
      state = 0; // Timed out / reversed direction
    }
  } else if (state == 2) { // Waiting for Beam A
    if (a) {
      totalOut++;
      if (currentOccupancy > 0) currentOccupancy--;
      state = 0;
      digitalWrite(PIN_LED, HIGH);
      delay(80);
      digitalWrite(PIN_LED, LOW);
    } else if (millis() - lastStateChange > TIMEOUT_MS) {
      state = 0; // Timed out / reversed direction
    }
  }
}
