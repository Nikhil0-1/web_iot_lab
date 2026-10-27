/*
 * Project 15 — Smart Street Light Controller — ESP8266 Firmware
 * LDR Ambient Sensing + PIR Motion Boost + PWM LED Dimming
 *
 * Libraries: ESP8266WiFi, ESP8266WebServer, ArduinoJson v6+
 * Board: NodeMCU 1.0 (ESP-12E)
 *
 * Wiring:
 *   LDR Divider Out → A0 (Analog 0–1V internally mapped, 0–3.3V on NodeMCU board)
 *   PIR Motion Out  → D2 (GPIO4) — Digital input
 *   LED Driver PWM  → D1 (GPIO5) — MOSFET Gate or PWM LED driver
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

const char* WIFI_SSID     = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";

const int LDR_PIN   = A0;  // Analog input
const int PIR_PIN   = 4;   // D2 (GPIO4)
const int PWM_PIN   = 5;   // D1 (GPIO5) - PWM output (0-1023 on ESP8266)

int luxThreshold    = 300; // Lux threshold below which light activates
bool autoMode       = true;
bool lightOn        = false;
int brightnessPct   = 0;   // 0-100%
int ambientLux      = 500;
bool motionDetected = false;

unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL_MS = 500;

ESP8266WebServer server(80);

void addCors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

int readAmbientLux() {
  int raw = analogRead(LDR_PIN); // 0 - 1023
  // Convert raw ADC to approximate Lux (inverse relationship: high light = high ADC on standard divider)
  float voltage = (raw / 1023.0f) * 3.3f;
  float lux = map(raw, 0, 1023, 10, 1000);
  return (int)constrain(lux, 0, 1000);
}

void updatePwmOutput() {
  if (!lightOn) {
    analogWrite(PWM_PIN, 0);
  } else {
    // ESP8266 analogWrite ranges from 0 to 1023
    int pwmVal = map(brightnessPct, 0, 100, 0, 1023);
    analogWrite(PWM_PIN, pwmVal);
  }
}

void handleOptions() {
  addCors();
  server.send(204);
}

void handleStatus() {
  addCors();
  StaticJsonDocument<256> doc;
  doc["project"]    = "street-light";
  doc["lux"]        = ambientLux;
  doc["threshold"]  = luxThreshold;
  doc["lightOn"]    = lightOn;
  doc["brightness"] = brightnessPct;
  doc["autoMode"]   = autoMode;
  doc["motion"]     = motionDetected;
  doc["uptimeSec"]  = millis() / 1000;

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void handleControl() {
  addCors();
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"Missing body\"}");
    return;
  }

  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, server.arg("plain"));
  if (err) {
    server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
    return;
  }

  if (doc.containsKey("autoMode")) {
    autoMode = doc["autoMode"].as<bool>();
  }
  if (doc.containsKey("threshold")) {
    luxThreshold = constrain(doc["threshold"].as<int>(), 50, 800);
  }
  if (doc.containsKey("lightOn")) {
    lightOn = doc["lightOn"].as<bool>();
    if (!doc.containsKey("brightness")) {
      brightnessPct = lightOn ? 100 : 0;
    }
  }
  if (doc.containsKey("brightness")) {
    brightnessPct = constrain(doc["brightness"].as<int>(), 0, 100);
    lightOn = brightnessPct > 0;
  }

  updatePwmOutput();
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
  doc["deviceId"] = "esp8266-15-smart-street-light";
  doc["projectId"] = "street-light";
  doc["projectName"] = "Smart Street Light";
  doc["firmwareVersion"] = "2.4.0";
  JsonArray projs = doc.createNestedArray("supportedProjects");
  projs.add("15-smart-street-light");
  projs.add("street-light");
  projs.add("15-smart-street-light");

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN, INPUT);
  pinMode(PWM_PIN, OUTPUT);
  analogWriteRange(1023);
  analogWrite(PWM_PIN, 0); // Safe off on boot

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
    Serial.println(F("\nWiFi connection timed out. Launching Access Point: TechIoTW_StreetLight"));
    WiFi.mode(WIFI_AP_STA);
    WiFi.softAP("TechIoTW_StreetLight", "tech123456");
    Serial.print(F("AP IP Address: "));
    Serial.println(WiFi.softAPIP());
  }

  server.on("/api/status", HTTP_OPTIONS, handleOptions);
  server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/control", HTTP_OPTIONS, handleOptions);
  server.on("/api/control", HTTP_POST, handleControl);

  
  server.on("/api/health", HTTP_OPTIONS, handleOptions);
  server.on("/api/health", HTTP_GET, handleHealth);
  server.on("/api/device", HTTP_OPTIONS, handleOptions);
  server.on("/api/device", HTTP_GET, handleDevice);
  server.on("/api/readings", HTTP_OPTIONS, handleOptions);
  server.on("/api/readings", HTTP_GET, handleStatus);
  server.on("/api/command", HTTP_OPTIONS, handleOptions);
  server.on("/api/command", HTTP_POST, handleControl);

  server.begin();
  Serial.println("HTTP REST Server started on port 80");
}

void loop() {
  server.handleClient();

  unsigned long now = millis();
  if (now - lastReadTime >= READ_INTERVAL_MS) {
    lastReadTime = now;
    ambientLux = readAmbientLux();
    motionDetected = (digitalRead(PIR_PIN) == HIGH);

    if (autoMode) {
      if (ambientLux < luxThreshold) {
        lightOn = true;
        // Boost brightness when motion detected at night
        brightnessPct = motionDetected ? 100 : 40;
      } else {
        lightOn = false;
        brightnessPct = 0;
      }
      updatePwmOutput();
    }
  }
}
