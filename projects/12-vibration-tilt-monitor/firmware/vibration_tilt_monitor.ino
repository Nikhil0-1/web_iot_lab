/*
 * IoT PROJECTS LAB — Project 08: Vibration & Tilt Monitor
 * ESP8266 NodeMCU Firmware with MPU6050 6-Axis IMU (Wire.h) & REST API
 *
 * Board: NodeMCU 1.0 (ESP-12E Module)
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <Wire.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* ap_ssid = "ESP8266-IMU-AP";
const char* ap_password = "password123";

#define MPU_ADDR 0x68
#define SDA_PIN 4 // D2 (GPIO4)
#define SCL_PIN 5 // D1 (GPIO5)

const char* DEVICE_ID = "esp8266-imu-01";
const char* PROJECT_ID = "vibration-tilt-monitor";
const char* FIRMWARE_VER = "1.0.0";

ESP8266WebServer server(80);

float pitchDeg = 0.0;
float rollDeg = 0.0;
float totalG = 1.0;
float ax = 0.0, ay = 0.0, az = 1.0;
bool mpuOk = false;
unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL_MS = 1000;

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
  String json = "{\"status\":\"ok\",\"uptimeSeconds\":" + String(millis() / 1000) + ",\"freeHeap\":" + String(ESP.getFreeHeap()) + "}";
  server.send(200, "application/json", json);
}

void handleDevice() {
  sendCORSHeaders();
  String json = "{";
  json += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  json += "\"projectId\":\"" + String(PROJECT_ID) + "\",";
  json += "\"firmwareVersion\":\"" + String(FIRMWARE_VER) + "\",";
  json += "\"sensorType\":\"MPU6050 6-DOF IMU\"";
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
  json += "\"sensorStatus\":\"" + String(mpuOk ? "ok" : "fault") + "\",";
  json += "\"readings\":{";
  if (mpuOk) {
    json += "\"pitchDeg\":" + String(pitchDeg, 1) + ",";
    json += "\"rollDeg\":" + String(rollDeg, 1) + ",";
    json += "\"totalG\":" + String(totalG, 2) + ",";
    json += "\"accelX\":" + String(ax, 2) + ",";
    json += "\"accelY\":" + String(ay, 2) + ",";
    json += "\"accelZ\":" + String(az, 2);
  } else {
    json += "\"pitchDeg\":null,\"rollDeg\":null,\"totalG\":null";
  }
  json += "}";
  json += "}";
  server.send(200, "application/json", json);
}

void handleConfig() {
  sendCORSHeaders();
  String json = "{\"i2cAddress\":\"0x68\",\"sampleRateHz\":10}";
  server.send(200, "application/json", json);
}

void setup() {
  Serial.begin(115200);
  Wire.begin(SDA_PIN, SCL_PIN);

  // Wake up MPU-6050 (clear sleep bit in PWR_MGMT_1 register 0x6B)
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);
  Wire.write(0x00);
  byte err = Wire.endTransmission();
  mpuOk = (err == 0);

  if (mpuOk) {
    Serial.println("MPU6050 detected successfully on I2C (0x68)!");
  } else {
    Serial.println("[ERROR] MPU6050 not detected. Check SDA/SCL wiring.");
  }

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 12) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi Connected: http://" + WiFi.localIP().toString());
  } else {
    WiFi.mode(WIFI_AP);
    WiFi.softAP(ap_ssid, ap_password);
    Serial.println("\nAP Started: http://" + WiFi.softAPIP().toString());
  }

  server.on("/api/health", HTTP_GET, handleHealth);
  server.on("/api/device", HTTP_GET, handleDevice);
  server.on("/api/readings", HTTP_GET, handleReadings);
  server.on("/api/config", HTTP_GET, handleConfig);

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
}

void loop() {
  server.handleClient();

  unsigned long now = millis();
  if (now - lastReadTime >= READ_INTERVAL_MS) {
    lastReadTime = now;

    Wire.beginTransmission(MPU_ADDR);
    Wire.write(0x3B); // Starting register for Accel X High Byte
    byte err = Wire.endTransmission(false);

    if (err == 0 && Wire.requestFrom(MPU_ADDR, 6, true) == 6) {
      mpuOk = true;
      int16_t rawX = (Wire.read() << 8) | Wire.read();
      int16_t rawY = (Wire.read() << 8) | Wire.read();
      int16_t rawZ = (Wire.read() << 8) | Wire.read();

      // Sensitivity at +/-2g range is 16384 LSB/g
      ax = rawX / 16384.0;
      ay = rawY / 16384.0;
      az = rawZ / 16384.0;

      totalG = sqrt(ax * ax + ay * ay + az * az);

      // Pitch & Roll in degrees
      pitchDeg = atan2(ax, sqrt(ay * ay + az * az)) * (180.0 / PI);
      rollDeg = atan2(ay, az) * (180.0 / PI);
    } else {
      mpuOk = false;
    }
  }
}
