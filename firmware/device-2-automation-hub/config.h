#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// =============================================================================
// DEVICE 2: AUTOMATION & CONTROL HUB — CONFIGURATION
// Tech IoT Warriors — IoT Projects Lab (Projects 13–24)
// =============================================================================

#define FIRMWARE_NAME       "Tech IoT Warriors Automation Hub"
#define FIRMWARE_VERSION    "2.4.0"
#define DEVICE_ID           "esp8266-automation-hub-02"
#define DEVICE_TYPE         "automation-hub"
#define MDNS_HOSTNAME       "automation-hub"

// Serial Baud Rate
#define SERIAL_BAUD_RATE    115200

// Wi-Fi Station Credentials
#define DEFAULT_WIFI_SSID   "TechIoT_Lab_2G"
#define DEFAULT_WIFI_PASS   "IoTLab2026Secure"

// Access Point Fallback
#define AP_SSID             "TechIoTW_AutomationHub"
#define AP_PASS             "tech123456"
#define AP_CHANNEL          2
#define AP_MAX_CONN         4

// Server Port
#define WEB_SERVER_PORT     80

// Relay Architecture Mode
// Option 1: USE_PCF8574_RELAYS (1): 8-channel optocoupled relay board on I2C (0x20 or 0x27)
// Option 2: USE_DIRECT_GPIO_RELAYS (0): Direct GPIO pin mapping for standalone bench tests
#define USE_PCF8574_RELAYS      1
#define PCF8574_I2C_ADDR        0x27

// Active Logic for Relays (Standard optocoupled relay modules are active-LOW)
#define RELAY_ACTIVE_LEVEL      LOW
#define RELAY_INACTIVE_LEVEL    HIGH

// Safety Timers (Milliseconds)
#define WATCHDOG_TIMEOUT_MS     30000   // Auto-stop pumps/motors if dashboard disconnects > 30s
#define MAX_PUMP_RUNTIME_MS     60000   // Mandatory pump cooldown after 60s continuous run
#define PUMP_COOLDOWN_MS        15000   // 15 seconds cooldown before next pump cycle
#define EMERGENCY_STOP_DEBOUNCE 50      // 50ms mechanical debounce

// Servo PWM Range
#define SERVO_MIN_US            544     // 0 degrees
#define SERVO_MAX_US            2400    // 180 degrees

// EEPROM Storage
#define EEPROM_CONFIG_ADDR      0
#define EEPROM_MAGIC_BYTE       0x41    // 'A' for Automation Hub

#endif // CONFIG_H
