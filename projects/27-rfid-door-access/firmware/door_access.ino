/**
 * Project 27: RFID Door Access Controller
 * ESP8266 NodeMCU Firmware with Solenoid Lock Relay & Status Feedback
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

const char* ssid = "TechIoTW_DoorAccess";
const char* password = "password123";

ESP8266WebServer server(80);

const int PIN_RELAY = 5;  // D1 (GPIO 5) - Active LOW relay for 12V Solenoid
const int PIN_LED = 4;    // D2 (GPIO 4) - Green Unlock LED
const int PIN_BUZZER = 15; // D8 (GPIO 15)

bool isLocked = true;
unsigned long unlockTimestamp = 0;
const unsigned long AUTO_RELOCK_MS = 4000;

void lockDoor() {
  digitalWrite(PIN_RELAY, HIGH); // De-energize solenoid
  digitalWrite(PIN_LED, LOW);
  isLocked = true;
}

void unlockDoor() {
  digitalWrite(PIN_RELAY, LOW); // Energize solenoid
  digitalWrite(PIN_LED, HIGH);
  isLocked = false;
  unlockTimestamp = millis();

  digitalWrite(PIN_BUZZER, HIGH);
  delay(100);
  digitalWrite(PIN_BUZZER, LOW);
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_RELAY, OUTPUT);
  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  lockDoor(); // Fail-safe locked on boot

  WiFi.softAP(ssid, password);
  Serial.print("Door Access AP IP: ");
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
    server.send(200, "application/json", "{\"deviceId\":\"ESP8266-DoorLock\",\"projectId\":\"27-rfid-door-access\",\"supportedProjects\":[\"27-rfid-door-access\"]}");
  });

  server.on("/api/readings", HTTP_GET, []() {
    StaticJsonDocument<128> doc;
    doc["lock_state"] = isLocked ? "locked" : "unlocked";
    doc["auto_relock_remaining_ms"] = (!isLocked) ? (AUTO_RELOCK_MS - (millis() - unlockTimestamp)) : 0;

    String out;
    serializeJson(doc, out);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", out);
  });

  server.on("/api/unlock", HTTP_POST, []() {
    bool granted = false;
    if (server.hasArg("plain")) {
      StaticJsonDocument<128> doc;
      deserializeJson(doc, server.arg("plain"));
      String pin = doc["pin"] | "";
      if (pin == "1234") {
        unlockDoor();
        granted = true;
      }
    }
    server.sendHeader("Access-Control-Allow-Origin", "*");
    if (granted) {
      server.send(200, "application/json", "{\"success\":true,\"message\":\"Unlocked\"}");
    } else {
      server.send(403, "application/json", "{\"success\":false,\"error\":\"Invalid PIN\"}");
    }
  });

  
  server.on("/api/command", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
    server.send(204);
  });
  server.on("/api/command", HTTP_POST, []() {
    digitalWrite(PIN_RELAY_LOCK, HIGH); // Unlock solenoid
    digitalWrite(PIN_LED_GRN, HIGH);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"success\":true,\"status\":\"unlocked\"}");
    delay(3000);
    digitalWrite(PIN_RELAY_LOCK, LOW);
    digitalWrite(PIN_LED_GRN, LOW);
  });

  server.begin();
}

void loop() {
  server.handleClient();

  // Auto-relock check
  if (!isLocked && (millis() - unlockTimestamp >= AUTO_RELOCK_MS)) {
    lockDoor();
  }
}
