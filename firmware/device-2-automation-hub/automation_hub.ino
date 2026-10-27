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
 * =============================================================================
 */

#include <Arduino.h>
#include "config.h"
#include "pin_config.h"
#include "safety_manager.h"
#include "actuator_manager.h"
#include "telemetry.h"
#include "wifi_manager.h"
#include "web_api.h"

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

  // 1. Initialize Safety Subsystem (Watchdog, Pump timers, E-Stop)
  safetyManager.begin();

  // 2. Initialize Actuator Hardware (Sets all relays OFF, PWM=0, Servo safe)
  actuatorManager.begin();

  // 3. Connect to Wi-Fi / Launch AP Fallback
  wifiManager.begin();

  // 4. Start Embedded REST Web API Server
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
}
