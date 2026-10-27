/*
 * IoT PROJECTS LAB — Project 04: Digital Thermometer
 * ESP8266 NodeMCU Firmware with OneWire DS18B20 & REST API
 *
 * Board: NodeMCU 1.0 (ESP-12E Module)
 * Libraries Required:
 *   - OneWire by Jim Studt, Tom Pollard, Robin Bliss, Paul Stoffregen
 *   - DallasTemperature by Miles Burton
 *   - ESP8266WiFi & ESP8266WebServer (built into ESP8266 core)
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// Wi-Fi Credentials (replace or use fallback AP)
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* ap_ssid = "ESP8266-Thermometer-AP";
const char* ap_password = "password123";

// Hardware Pin Definitions
#define ONE_WIRE_BUS 2 // NodeMCU D4 is GPIO2

// Project Identity
const char* DEVICE_ID = "esp8266-thermometer-01";
const char* PROJECT_ID = "digital-thermometer";
const char* FIRMWARE_VER = "1.0.0";

// Sensor & Server instances
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
ESP8266WebServer server(80);

// State variables
float lastTemperatureC = 0.0;
bool sensorHealthy = false;
unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL_MS = 1500;

// Helper to send CORS response
void sendCORSHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
}

void handleOptions() {
  sendCORSHeaders();
  server.send(204);
}

void handleHealth() {
  sendCORSHeaders();
  String json = "{";
  json += "\"status\":\"ok\",";
  json += "\"uptimeSeconds\":" + String(millis() / 1000) + ",";
  json += "\"freeHeap\":" + String(ESP.getFreeHeap());
  json += "}";
  server.send(200, "application/json", json);
}

void handleDevice() {
  sendCORSHeaders();
  String json = "{";
  json += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  json += "\"projectId\":\"" + String(PROJECT_ID) + "\",";
  json += "\"firmwareVersion\":\"" + String(FIRMWARE_VER) + "\",";
  json += "\"sensorType\":\"DS18B20 OneWire\"";
  json += "}";
  server.send(200, "application/json", json);
}

void handleReadings() {
  sendCORSHeaders();
  String json = "{";
  json += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  json += "\"projectId\":\"" + String(PROJECT_ID) + "\",";
  json += "\"mode\":\"hardware\",";
  json += "\"timestamp\":" + String(millis() / 1000) + ",";
  json += "\"sensorStatus\":\"" + String(sensorHealthy ? "ok" : "fault") + "\",";
  json += "\"readings\":{";
  if (sensorHealthy) {
    json += "\"temperatureC\":" + String(lastTemperatureC, 2);
  } else {
    json += "\"temperatureC\":null";
  }
  json += "}";
  json += "}";
  server.send(200, "application/json", json);
}

void handleConfig() {
  sendCORSHeaders();
  String json = "{";
  json += "\"pollIntervalMs\":" + String(READ_INTERVAL_MS) + ",";
  json += "\"thresholds\":{\"criticalLow\":0.0,\"warningLow\":15.0,\"warningHigh\":32.0,\"criticalHigh\":40.0}";
  json += "}";
  server.send(200, "application/json", json);
}

void handleNotFound() {
  sendCORSHeaders();
  server.send(404, "application/json", "{\"error\":\"Endpoint not found\"}");
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\n--- IoT Projects Lab: Digital Thermometer ---");

  // Initialize DS18B20 OneWire bus
  sensors.begin();
  sensors.setWaitForConversion(false); // Non-blocking conversion

  // Connect to Wi-Fi or create AP
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(ssid);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 15) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi Connected!");
    Serial.print("IP Address: http://");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWi-Fi connection failed. Starting Soft-AP mode...");
    WiFi.mode(WIFI_AP);
    WiFi.softAP(ap_ssid, ap_password);
    Serial.print("Soft-AP IP Address: http://");
    Serial.println(WiFi.softAPIP());
  }

  // Register REST API endpoints
  server.on("/api/health", HTTP_GET, handleHealth);
  server.on("/api/device", HTTP_GET, handleDevice);
  server.on("/api/readings", HTTP_GET, handleReadings);
  server.on("/api/config", HTTP_GET, handleConfig);
  server.onNotFound(handleNotFound);

  // OPTIONS handler for CORS preflight
  server.on("/api/health", HTTP_OPTIONS, handleOptions);
  server.on("/api/device", HTTP_OPTIONS, handleOptions);
  server.on("/api/readings", HTTP_OPTIONS, handleOptions);
  server.on("/api/config", HTTP_OPTIONS, handleOptions);

  
  server.on("/api/command", HTTP_OPTIONS, []() {
    setCorsHeaders();
    server.send(204);
  });
  server.on("/api/command", HTTP_POST, []() {
    setCorsHeaders();
    server.send(200, "application/json", "{\"success\":true,\"message\":\"Command acknowledged\"}");
  });

  server.begin();
  Serial.println("HTTP REST API server started on port 80.");
}

void loop() {
  server.handleClient();

  // Non-blocking sensor polling
  unsigned long now = millis();
  if (now - lastReadTime >= READ_INTERVAL_MS) {
    lastReadTime = now;

    sensors.requestTemperatures();
    float temp = sensors.getTempCByIndex(0);

    // DS18B20 returns -127.00 C if disconnected or CRC failed
    if (temp <= -120.0 || temp >= 125.0) {
      sensorHealthy = false;
      Serial.println("[WARN] DS18B20 sensor reading error (-127°C or disconnected). Check pullup.");
    } else {
      sensorHealthy = true;
      lastTemperatureC = temp;
      Serial.print("Temp: ");
      Serial.print(lastTemperatureC, 2);
      Serial.println(" °C");
    }
  }
}
