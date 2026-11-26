/**
 * =============================================================================
 * TECH IOT WARRIORS — DEVICE 2: AUTOMATION & CONTROL HUB
 * IoT Projects Lab (Projects 13 to 24)
 *
 * Board: ESP8266 NodeMCU v2 / v3 (ESP-12E / ESP-12F)
 * Supported Projects:
 *   13. Automatic Plant Watering — DC Submersible Pump Relay
 *   14. Smart Water Tank Controller — Inflow Pump Relay & Float Logic
 *   15. Smart Street Light — 12V LED Array N-MOSFET PWM
 *   16. Wi-Fi Home Automation — 4-Channel Mains Isolation Relays
 *   17. Fan Speed Controller — PWM MOSFET Driver & Tachometer Telemetry
 *   18. Smart Exhaust Fan — Environmental Ventilation Relay
 *   19. Automatic Door Controller — Sliding Door Servo & Proximity Sensor
 *   20. Servo Motor Web Control — Precision Robotic Micro-Actuator
 *   21. DC Motor Control Panel — L298N / TB6612 H-Bridge Bidirectional Driver
 *   22. Stepper Motor Controller — A4988 / DRV8825 Bipolar Stepper Driver
 *   23. Relay Control Dashboard — 8-Channel Industrial Load Switching
 *   24. Smart Greenhouse Automation — Misting, Circulation Fan, Vent Actuator
 *
 * Integrated Display:
 *   0.96 inch SSD1306 I2C OLED (128x64) on D2 (SDA) and D1 (SCL)
 *   Startup IP splash screen (4 seconds) + Live multi-actuator rotating status
 *   Branding: TechIoTWarriors
 * =============================================================================
 */

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "config.h"
#include "pin_config.h"
#include "safety_manager.h"
#include "actuator_manager.h"
#include "telemetry.h"
#include "wifi_manager.h"
#include "web_api.h"

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_ADDR_1 0x3C
#define OLED_ADDR_2 0x3D

static Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
static bool oledReady = false;
static unsigned long lastOledPageSwitch = 0;
static uint8_t oledPage = 0;

void initOledDisplay() {
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  Wire.setClock(100000);

  if (display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR_1) || display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR_2)) {
    oledReady = true;
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextWrap(false);

    // Boot Banner
    display.fillRect(0, 0, 128, 14, SSD1306_WHITE);
    display.setTextColor(SSD1306_BLACK, SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(18, 3);
    display.print(F("TechIoTWarriors"));

    display.setTextColor(SSD1306_WHITE);
    display.setCursor(4, 20);
    display.print(F("DEV 2: AUTOMATION"));
    display.setCursor(4, 34);
    display.print(F("Projects: 13 to 24"));
    display.setCursor(4, 48);
    display.print(F("Connecting Wi-Fi..."));
    display.display();
  } else {
    Serial.println(F("[OLED] SSD1306 0.96\" OLED not detected on 0x3C/0x3D. Continuing headless."));
  }
}

void displayStartupIp(const String& ip, bool isSta, int holdMs) {
  if (!oledReady) return;
  display.clearDisplay();
  display.setTextWrap(false);

  // Top branding bar
  display.fillRect(0, 0, 128, 14, SSD1306_WHITE);
  display.setTextColor(SSD1306_BLACK, SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(18, 3);
  display.print(F("TechIoTWarriors"));

  // IP Address Header
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(8, 18);
  display.print(F("DEVICE IP ADDRESS:"));

  // Prominent IP Box
  display.drawRoundRect(2, 29, 124, 18, 3, SSD1306_WHITE);
  display.setCursor(8, 34);
  display.setTextSize(1);
  display.print(ip);

  // Mode footer
  display.setCursor(6, 52);
  display.print(isSta ? F("Mode: STA (WiFi Net)") : F("Mode: AP (Hotspot)"));
  display.display();

  delay(holdMs);
}

void updateOledTelemetry() {
  if (!oledReady) return;
  unsigned long now = millis();
  if (now - lastOledPageSwitch < 3500) return;
  lastOledPageSwitch = now;
  oledPage = (oledPage + 1) % 3;

  display.clearDisplay();
  display.setTextWrap(false);

  // Top branding bar
  display.fillRect(0, 0, 128, 13, SSD1306_WHITE);
  display.setTextColor(SSD1306_BLACK, SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(18, 3);
  display.print(F("TechIoTWarriors"));

  display.setTextColor(SSD1306_WHITE);

  if (oledPage == 0) {
    // Page 0: Relays & Mains Loads
    display.setCursor(0, 16);
    display.print(F("RELAYS & MAINS (P16)"));
    display.drawLine(0, 25, 128, 25, SSD1306_WHITE);

    display.setCursor(0, 29);
    display.print(F("R1:"));
    display.print(actuatorManager.state.relayState[0] ? F("ON ") : F("off"));
    display.print(F(" R2:"));
    display.print(actuatorManager.state.relayState[1] ? F("ON ") : F("off"));
    display.print(F(" R3:"));
    display.print(actuatorManager.state.relayState[2] ? F("ON") : F("off"));

    display.setCursor(0, 41);
    display.print(F("R4:"));
    display.print(actuatorManager.state.relayState[3] ? F("ON ") : F("off"));
    display.print(F(" Pump:"));
    display.print(actuatorManager.state.relayState[RELAY_CH_PLANT_PUMP] ? F("ON") : F("OFF"));
  }
  else if (oledPage == 1) {
    // Page 1: Motors & PWM
    display.setCursor(0, 16);
    display.print(F("MOTORS & PWM (P17)"));
    display.drawLine(0, 25, 128, 25, SSD1306_WHITE);

    display.setCursor(0, 29);
    display.print(F("PWM Duty: "));
    display.print(actuatorManager.state.pwmDuty);
    display.print(F("/1023"));

    display.setCursor(0, 41);
    display.print(F("Servo: "));
    display.print(actuatorManager.state.servoAngle);
    display.print(F(" deg"));
  }
  else {
    // Page 2: Safety & Interlocks
    display.setCursor(0, 16);
    display.print(F("SAFETY WATCHDOG"));
    display.drawLine(0, 25, 128, 25, SSD1306_WHITE);

    display.setCursor(0, 29);
    display.print(F("E-Stop: "));
    display.print(safetyManager.isEStopActive() ? F("[ACTIVATED!]") : F("[ARMED/SAFE]"));

    display.setCursor(0, 41);
    display.print(F("Heartbeat: "));
    display.print(safetyManager.isHeartbeatAlive() ? F("ACTIVE") : F("LOST"));
  }

  // Bottom Status Bar with live IP
  display.drawLine(0, 52, 128, 52, SSD1306_WHITE);
  display.setCursor(0, 55);
  display.print(F("IP: "));
  display.print(wifiManager.getIpAddress());

  display.display();
}

void setup() {
  Serial.begin(SERIAL_BAUD_RATE);
  delay(150);

  Serial.println();
  Serial.println(F("========================================================="));
  Serial.println(F("  TECH IOT WARRIORS — DEVICE 2: AUTOMATION & CONTROL HUB"));
  Serial.print  (F("  Firmware Version: ")); Serial.println(FIRMWARE_VERSION);
  Serial.print  (F("  Device ID:        ")); Serial.println(DEVICE_ID);
  Serial.println(F("  Projects:         13 to 24 (Category B)"));
  Serial.println(F("========================================================="));

  // 1. Initialize 0.96\" SSD1306 OLED Display & Show TechIoTWarriors Boot Screen
  initOledDisplay();

  // 2. Initialize Safety Subsystem (Watchdog, Pump timers, E-Stop)
  safetyManager.begin();

  // 3. Initialize Actuator Hardware (Sets all relays OFF, PWM=0, Servo safe)
  actuatorManager.begin();

  // 4. Connect to Wi-Fi / Launch AP Fallback
  wifiManager.begin();

  // 5. Display Device IP Address on OLED for 4 Seconds
  displayStartupIp(wifiManager.getIpAddress(), !wifiManager.isApMode(), 4000);

  // 6. Start Embedded REST Web API Server
  webApiServer.begin();

  Serial.println(F("[SYSTEM] Initialization complete. Actuator controller active with fail-safe interlocks."));
}

void loop() {
  // 1. Manage Wi-Fi connection and mDNS responder
  wifiManager.update();

  // 2. Enforce safety watchdogs (heartbeat timeout, pump max runtime)
  safetyManager.update();

  // 3. Update actuator state & read local sensor feedback
  actuatorManager.update();

  // 4. Handle HTTP client control requests
  webApiServer.update();

  // 5. Update 0.96\" OLED live actuator status with TechIoTWarriors branding & IP footer
  updateOledTelemetry();
}
