/**
 * TERRASCAN X ELITE — Ultrasonic Radar Scanner Firmware
 * Board: NodeMCU 1.0 (ESP-12E Module) / ESP8266 Generic
 * 
 * Pin Configuration:
 *   TRIG_PIN: D1 (GPIO 5) -> HC-SR04 Trig
 *   ECHO_PIN: D2 (GPIO 4) -> HC-SR04 Echo (via 1k/2k voltage divider to 3.3V)
 * 
 * Required Libraries:
 *   - ESP8266WiFi
 *   - ESP8266WebServer
 *   - ArduinoJson (v6 or v7)
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

// Wi-Fi Credentials (or connect to fallback AP)
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// Pinout Definitions
const int TRIG_PIN = 5; // D1 / GPIO5
const int ECHO_PIN = 4; // D2 / GPIO4

ESP8266WebServer server(80);

unsigned long lastMeasureTime = 0;
const unsigned long MEASURE_INTERVAL = 100; // 100ms sample rate

float currentDistance = 0.0;
unsigned long currentEchoUs = 0;

void setCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
}

void handleOptions() {
  setCorsHeaders();
  server.send(204);
}

// Measure distance using HC-SR04
void measureUltrasonic() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Measure echo pulse width (timeout ~30000us = ~5 meters)
  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  currentEchoUs = duration;

  if (duration == 0) {
    currentDistance = 400.0; // Out of range or no echo
  } else {
    // Speed of sound: 343 m/s = 0.0343 cm/µs. Round trip = duration * 0.0343 / 2 = duration / 58.2
    currentDistance = (float)duration / 58.2;
    if (currentDistance > 400.0) currentDistance = 400.0;
  }
}

void handleGetReadings() {
  setCorsHeaders();
  StaticJsonDocument<256> doc;
  doc["device"] = "TERRASCAN X ELITE";
  doc["mode"] = "hardware";
  doc["distance_cm"] = serialized(String(currentDistance, 1));
  doc["echo_us"] = currentEchoUs;
  doc["status"] = (currentDistance <= 15.0) ? "COLLISION_RISK" : ((currentDistance <= 30.0) ? "TARGET_ACQUIRED" : "SECTOR_CLEAR");
  doc["uptime_ms"] = millis();

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void handleGetStatus() {
  setCorsHeaders();
  StaticJsonDocument<256> doc;
  doc["device"] = "TERRASCAN X ELITE";
  doc["sensor"] = "HC-SR04 Ultrasonic";
  doc["ip"] = WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : WiFi.softAPIP().toString();
  doc["rssi"] = WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : 0;
  doc["status"] = "ONLINE";

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}


void handleGetHealth() {
  setCorsHeaders();
  String out = "{\"status\":\"ok\",\"uptime_ms\":" + String(millis()) +
               ",\"free_heap\":" + String(ESP.getFreeHeap()) +
               ",\"ip\":\"" + (WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : WiFi.softAPIP().toString()) + "\"}";
  server.send(200, "application/json", out);
}

void handleGetDevice() {
  setCorsHeaders();
  #if ARDUINOJSON_VERSION_MAJOR >= 7
    JsonDocument doc;
  #else
    StaticJsonDocument<512> doc;
  #endif
  doc["deviceId"] = "esp8266-01-terrascan-x-elite";
  doc["projectId"] = "01-terrascan-x-elite";
  doc["deviceName"] = "TERRASCAN X ELITE";
  doc["firmwareVersion"] = "2.4.0";
  JsonArray projs = doc.createNestedArray("supportedProjects");
  projs.add("01-terrascan-x-elite"); projs.add("terrascan-x-elite"); projs.add("01");

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void handlePostCommand() {
  setCorsHeaders();
  server.send(200, "application/json", "{\"success\":true,\"message\":\"Command received\"}");
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\n--- TERRASCAN X ELITE INITIALIZING ---");

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);

  // Connect to Wi-Fi with AP fallback
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED && attempts < 15) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("\nWi-Fi Connected! IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWi-Fi connection timed out. Launching Access Point: Terrascan-Radar-AP");
    WiFi.mode(WIFI_AP);
    WiFi.softAP("Terrascan-Radar-AP", "12345678");
    Serial.print("AP IP Address: ");
    Serial.println(WiFi.softAPIP());
  }

  // REST API Routes
  server.on("/api/readings", HTTP_GET, handleGetReadings);
  server.on("/api/readings", HTTP_OPTIONS, handleOptions);
  server.on("/api/status", HTTP_GET, handleGetStatus);
  server.on("/api/status", HTTP_OPTIONS, handleOptions);

  
  server.on("/api/health", HTTP_GET, handleGetHealth);
  server.on("/api/health", HTTP_OPTIONS, handleOptions);
  server.on("/api/device", HTTP_GET, handleGetDevice);
  server.on("/api/device", HTTP_OPTIONS, handleOptions);
  server.on("/api/command", HTTP_POST, handlePostCommand);
  server.on("/api/command", HTTP_OPTIONS, handleOptions);

  server.begin();
  Serial.println("HTTP REST API Server Ready on port 80.");
}

void loop() {
  server.handleClient();

  if (millis() - lastMeasureTime >= MEASURE_INTERVAL) {
    lastMeasureTime = millis();
    measureUltrasonic();
  }
}
