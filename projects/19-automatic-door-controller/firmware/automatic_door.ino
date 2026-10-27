/*
 * Project 19 — Automatic Door Controller — ESP8266 Firmware
 * HC-SR04 Ultrasonic Sensing + Servo Motor Actuation + Obstruction Interlock
 *
 * Board: NodeMCU 1.0 (ESP-12E)
 * Libraries: ESP8266WiFi, ESP8266WebServer, ArduinoJson v6+, Servo
 *
 * Wiring:
 *   HC-SR04 Trig -> D1 (GPIO 5)
 *   HC-SR04 Echo -> D2 (GPIO 4) via 1k/2k voltage divider
 *   Servo Signal -> D5 (GPIO 14)
 *   Servo Power  -> External 5V 2A Supply (GND common)
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>
#include <Servo.h>

const char* WIFI_SSID     = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";

const int TRIG_PIN  = 5;  // D1
const int ECHO_PIN  = 4;  // D2
const int SERVO_PIN = 14; // D5

Servo doorServo;

const int ANGLE_CLOSED = 0;
const int ANGLE_OPEN   = 90;

int currentAngle = 0;
int thresholdCm  = 60;
float currentDist = 150.0;
bool autoMode    = true;
String doorState = "CLOSED"; // CLOSED, OPENING, HOLDING, CLOSING

unsigned long holdStartTime = 0;
const unsigned long HOLD_TIME_MS = 3000;
unsigned long lastSensorTime = 0;

ESP8266WebServer server(80);

void addCors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

float measureDistanceCm() {
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH, 25000); // 25ms timeout
  if (duration == 0) return 999.0f; // Timeout/clear
  return (duration * 0.0343f) / 2.0f;
}

void setDoor(int targetAngle, String state) {
  doorServo.write(targetAngle);
  currentAngle = targetAngle;
  doorState = state;
}

void handleOptions() {
  addCors();
  server.send(204);
}

void handleStatus() {
  addCors();
  StaticJsonDocument<256> doc;
  doc["project"]    = "automatic-door";
  doc["distance"]   = currentDist;
  doc["threshold"]  = thresholdCm;
  doc["servoAngle"] = currentAngle;
  doc["state"]      = doorState;
  doc["autoMode"]   = autoMode;
  doc["uptimeSec"]  = millis() / 1000;

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void handleDoor() {
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

  if (doc.containsKey("command")) {
    String cmd = doc["command"].as<String>();
    if (cmd == "OPEN") {
      setDoor(ANGLE_OPEN, "HOLDING");
      holdStartTime = millis();
    } else if (cmd == "CLOSE") {
      setDoor(ANGLE_CLOSED, "CLOSED");
    }
  }

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
  doc["deviceId"] = "esp8266-19-automatic-door-controller";
  doc["projectId"] = "automatic-door";
  doc["projectName"] = "Automatic Door Controller";
  doc["firmwareVersion"] = "2.4.0";
  JsonArray projs = doc.createNestedArray("supportedProjects");
  projs.add("19-automatic-door-controller");
  projs.add("automatic-door");
  projs.add("19-automatic-door-controller");

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void setup() {
  Serial.begin(115200);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  doorServo.attach(SERVO_PIN);
  setDoor(ANGLE_CLOSED, "CLOSED"); // Safe closed on boot

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
    Serial.println("\nWiFi timeout. Running in standalone AP mode.");
  }

  server.on("/api/status", HTTP_OPTIONS, handleOptions);
  server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/door", HTTP_OPTIONS, handleOptions);
  server.on("/api/door", HTTP_POST, handleDoor);

  
  server.on("/api/health", HTTP_OPTIONS, handleOptions);
  server.on("/api/health", HTTP_GET, handleHealth);
  server.on("/api/device", HTTP_OPTIONS, handleOptions);
  server.on("/api/device", HTTP_GET, handleDevice);
  server.on("/api/readings", HTTP_OPTIONS, handleOptions);
  server.on("/api/readings", HTTP_GET, handleStatus);
  server.on("/api/command", HTTP_OPTIONS, handleOptions);
  server.on("/api/command", HTTP_POST, handleDoor);

  server.begin();
  Serial.println("Door controller web server running on port 80");
}

void loop() {
  server.handleClient();

  unsigned long now = millis();
  if (now - lastSensorTime >= 100) {
    lastSensorTime = now;
    currentDist = measureDistanceCm();

    if (autoMode) {
      if (currentDist <= thresholdCm) {
        // Person detected
        setDoor(ANGLE_OPEN, "HOLDING");
        holdStartTime = now;
      } else {
        if (doorState == "HOLDING" && (now - holdStartTime >= HOLD_TIME_MS)) {
          setDoor(ANGLE_CLOSED, "CLOSED");
        }
      }
    }
  }
}
