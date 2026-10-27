/*
 * Project 13 — Automatic Plant Watering
 * ESP8266 NodeMCU Firmware
 * Arduino IDE compatible
 *
 * Libraries required:
 *   - ESP8266WiFi (bundled with ESP8266 Arduino core)
 *   - ESP8266WebServer (bundled)
 *   - ArduinoJson v6+ (install via Library Manager)
 *
 * Board: NodeMCU 1.0 (ESP-12E Module)
 *
 * Wiring:
 *   Soil Sensor AOUT → A0
 *   Relay IN         → D1 (GPIO5) — Active LOW relay
 *   Relay VCC        → VIN (5V), GND → GND
 *   Pump on NO contact; external supply on COM + pump+
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

// ── Wi-Fi credentials ──────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";

// ── Pin definitions ────────────────────────────────────────────
const int SOIL_PIN  = A0;    // Capacitive soil moisture sensor
const int RELAY_PIN = 5;     // D1 — GPIO5 — Active LOW relay

// ── Calibration (adjust for your sensor) ──────────────────────
const int DRY_ADC  = 820;    // Raw ADC reading in completely dry air
const int WET_ADC  = 380;    // Raw ADC reading when fully submerged

// ── Control parameters ─────────────────────────────────────────
int  moistureThreshold = 40;   // % — start pump below this
int  stopThreshold     = 50;   // % — stop pump above this (hysteresis)
int  pumpMaxSeconds    = 15;   // Maximum continuous pump runtime (safety)
int  minIntervalMs     = 30000;// Minimum ms between watering cycles

// ── State ──────────────────────────────────────────────────────
bool  pumpOn           = false;
bool  autoMode         = true;
bool  manualOverride   = false;
unsigned long pumpStartMs   = 0;
unsigned long lastWaterMs   = 0;
int           moisturePct   = 0;
int           totalEvents   = 0;

ESP8266WebServer server(80);

// ── CORS helper ────────────────────────────────────────────────
void addCors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ── Read sensor ────────────────────────────────────────────────
int readMoisture() {
  int raw = analogRead(SOIL_PIN);
  int pct = map(raw, DRY_ADC, WET_ADC, 0, 100);
  return constrain(pct, 0, 100);
}

// ── Pump control ───────────────────────────────────────────────
void setPump(bool on) {
  if (on && !pumpOn) {
    digitalWrite(RELAY_PIN, LOW);  // Active LOW
    pumpOn = true;
    pumpStartMs = millis();
    totalEvents++;
    Serial.println("[PUMP] ON");
  } else if (!on && pumpOn) {
    digitalWrite(RELAY_PIN, HIGH); // Relay open
    pumpOn = false;
    lastWaterMs = millis();
    Serial.println("[PUMP] OFF");
  }
}

// ── HTTP handlers ──────────────────────────────────────────────
void handleHealth() {
  addCors();
  StaticJsonDocument<128> doc;
  doc["status"] = "ok";
  doc["uptime"] = millis() / 1000;
  String out; serializeJson(doc, out);
  server.send(200, "application/json", out);
}

void handleDevice() {
  addCors();
  StaticJsonDocument<128> doc;
  doc["projectId"] = "plant-watering";
  doc["deviceId"]  = "ESP8266-PlantWater";
  doc["firmware"]  = "1.0.0";
  String out; serializeJson(doc, out);
  server.send(200, "application/json", out);
}

void handleReadings() {
  addCors();
  StaticJsonDocument<256> doc;
  doc["projectId"] = "plant-watering";
  doc["moisture"]  = moisturePct;
  doc["pump"]      = pumpOn;
  doc["autoMode"]  = autoMode;
  doc["threshold"] = moistureThreshold;
  doc["events"]    = totalEvents;
  doc["uptime"]    = millis() / 1000;
  String out; serializeJson(doc, out);
  server.send(200, "application/json", out);
}

void handleControl() {
  addCors();
  if (server.method() == HTTP_OPTIONS) { server.send(204); return; }

  StaticJsonDocument<256> req;
  DeserializationError err = deserializeJson(req, server.arg("plain"));
  if (err) { server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}"); return; }

  bool changed = false;

  if (req.containsKey("autoMode")) {
    autoMode = req["autoMode"].as<bool>();
    if (!autoMode) setPump(false); // Safe off on mode change
    changed = true;
  }
  if (req.containsKey("pump") && !autoMode) {
    setPump(req["pump"].as<bool>());
    changed = true;
  }
  if (req.containsKey("threshold")) {
    int t = constrain(req["threshold"].as<int>(), 5, 90);
    moistureThreshold = t;
    stopThreshold = constrain(t + 10, t + 5, 95);
    changed = true;
  }

  StaticJsonDocument<128> resp;
  resp["ok"] = changed;
  resp["autoMode"] = autoMode;
  resp["pump"] = pumpOn;
  String out; serializeJson(resp, out);
  server.send(200, "application/json", out);
}

void handleOptions() {
  addCors();
  server.send(204);
}

// ── Setup ──────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(200);

  // Safe defaults — relay OFF (HIGH = NC contact open)
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);

  Serial.print("\n[WiFi] Connecting to "); Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 20000) {
    delay(500); Serial.print(".");
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\n[WiFi] FAILED — entering AP mode");
    WiFi.softAP("PlantWater-Setup", "12345678");
    Serial.print("[AP] IP: "); Serial.println(WiFi.softAPIP());
  } else {
    Serial.print("\n[WiFi] Connected. IP: "); Serial.println(WiFi.localIP());
  }

  // Register routes
  server.on("/api/health",   HTTP_GET,     handleHealth);
  server.on("/api/device",   HTTP_GET,     handleDevice);
  server.on("/api/readings", HTTP_GET,     handleReadings);
  server.on("/api/control",  HTTP_POST,    handleControl);
  server.on("/api/control",  HTTP_OPTIONS, handleOptions);
  server.on("/api/health",   HTTP_OPTIONS, handleOptions);
  server.on("/api/readings", HTTP_OPTIONS, handleOptions);
  
  server.on("/api/command", HTTP_OPTIONS, []() {
    setCorsHeaders();
    server.send(204);
  });
  server.on("/api/command", HTTP_POST, handleControl);

  server.begin();
  Serial.println("[HTTP] Server started");
}

// ── Main Loop ──────────────────────────────────────────────────
void loop() {
  server.handleClient();

  static unsigned long lastRead = 0;
  if (millis() - lastRead > 1000) {
    lastRead = millis();
    moisturePct = readMoisture();

    // Automatic control
    if (autoMode) {
      unsigned long elapsed = millis() - lastWaterMs;
      bool cooldownOk = (elapsed >= (unsigned long)minIntervalMs);

      if (!pumpOn && moisturePct <= moistureThreshold && cooldownOk) {
        setPump(true);
      }
      if (pumpOn && (moisturePct >= stopThreshold ||
                     (millis() - pumpStartMs >= (unsigned long)pumpMaxSeconds * 1000))) {
        setPump(false);
      }
    }

    // Safety: never run pump longer than pumpMaxSeconds regardless of mode
    if (pumpOn && (millis() - pumpStartMs >= (unsigned long)pumpMaxSeconds * 1000)) {
      Serial.println("[SAFETY] Max pump runtime exceeded — forcing OFF");
      setPump(false);
    }
  }
}
