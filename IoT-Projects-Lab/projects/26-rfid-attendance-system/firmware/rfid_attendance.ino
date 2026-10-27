/**
 * Project 26: RFID Attendance System
 * ESP8266 NodeMCU Firmware with MFRC522 13.56MHz SPI RFID Reader
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>

const char* ssid = "TechIoTW_RFID";
const char* password = "password123";

ESP8266WebServer server(80);

// MFRC522 Pins
#define SS_PIN 15   // D8 (GPIO 15)
#define RST_PIN 0   // D3 (GPIO 0)
#define BUZZER_PIN 5 // D1 (GPIO 5)

MFRC522 mfrc522(SS_PIN, RST_PIN);

String lastCardUid = "";
unsigned long lastScanTime = 0;
int totalScannedToday = 0;

void beepSuccess() {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(120);
  digitalWrite(BUZZER_PIN, LOW);
}

void setup() {
  Serial.begin(115200);
  SPI.begin();
  mfrc522.PCD_Init();
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  WiFi.softAP(ssid, password);
  Serial.print("RFID Hub AP IP: ");
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
    server.send(200, "application/json", "{\"deviceId\":\"ESP8266-RFID\",\"projectId\":\"26-rfid-attendance-system\",\"supportedProjects\":[\"26-rfid-attendance-system\"]}");
  });

  server.on("/api/readings", HTTP_GET, []() {
    StaticJsonDocument<256> doc;
    doc["last_card_uid"] = lastCardUid;
    doc["last_scan_age_ms"] = (lastScanTime > 0) ? (millis() - lastScanTime) : 0;
    doc["total_scanned"] = totalScannedToday;

    String out;
    serializeJson(doc, out);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", out);
  });

  
  server.on("/api/command", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
    server.send(204);
  });
  server.on("/api/command", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"success\":true,\"message\":\"Attendance mode active\"}");
  });

  server.begin();
}

void loop() {
  server.handleClient();

  // Look for new RFID card
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    String uidStr = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      if (mfrc522.uid.uidByte[i] < 0x10) uidStr += "0";
      uidStr += String(mfrc522.uid.uidByte[i], HEX);
    }
    uidStr.toUpperCase();

    if (uidStr != lastCardUid || (millis() - lastScanTime > 4000)) {
      lastCardUid = uidStr;
      lastScanTime = millis();
      totalScannedToday++;
      beepSuccess();
      Serial.print("Card Scanned: ");
      Serial.println(lastCardUid);
    }

    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
  }
}
