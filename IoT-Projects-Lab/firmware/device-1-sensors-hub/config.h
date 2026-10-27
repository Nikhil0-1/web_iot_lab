#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// =============================================================================
// DEVICE 1: SENSORS & MONITORING HUB — CONFIGURATION
// Tech IoT Warriors — IoT Projects Lab (Projects 01–12)
// =============================================================================

#define FIRMWARE_NAME       "Tech IoT Warriors Sensors Hub"
#define FIRMWARE_VERSION    "2.4.0"
#define DEVICE_ID           "esp8266-sensors-hub-01"
#define DEVICE_TYPE         "sensors-hub"
#define MDNS_HOSTNAME       "sensors-hub"

// Serial Baud Rate
#define SERIAL_BAUD_RATE    115200

// Wi-Fi Station Credentials (Configure for your network)
#define DEFAULT_WIFI_SSID   "TechIoT_Lab_2G"
#define DEFAULT_WIFI_PASS   "IoTLab2026Secure"

// Access Point Fallback (Activated when station connection fails)
#define AP_SSID             "TechIoTW_SensorsHub"
#define AP_PASS             "tech123456"
#define AP_CHANNEL          1
#define AP_MAX_CONN         4

// Server Port
#define WEB_SERVER_PORT     80

// ADC Mode Configuration
// Option 1: USE_ADS1115 (Recommended): 16-bit 4-channel external ADC at 0x48 + A0
// Option 2: USE_CD74HC4051_MUX: 8-channel analog multiplexer on internal A0
// Option 3: USE_INTERNAL_ADC_ONLY: Samples A0 directly (switched or single-sensor)
#define USE_ADS1115         1
#define USE_CD74HC4051_MUX  0

// I2C Bus Addresses
#define ADS1115_I2C_ADDR    0x48
#define MPU6050_I2C_ADDR    0x68

// Sampling Intervals (Milliseconds, Non-Blocking)
#define INTERVAL_RADAR_SWEEP_MS   30    // Servo step & echo timing
#define INTERVAL_ANALOG_MS       200    // Smooth ADC polling
#define INTERVAL_FLOW_MS        1000    // Flow meter frequency window
#define INTERVAL_DHT_MS         2000    // DHT22 thermal settling time
#define INTERVAL_ONEWIRE_MS     1000    // DS18B20 conversion
#define INTERVAL_TELEMETRY_MS   1000    // Serial & broadcast update
#define INTERVAL_WIFI_CHECK_MS  5000    // Auto-reconnect watchdog

// MQ Sensor Warmup Timers (Seconds)
#define MQ_WARMUP_SECONDS         20    // Minimum baseline stabilization

// EEPROM / Preferences storage address
#define EEPROM_CONFIG_ADDR         0
#define EEPROM_MAGIC_BYTE       0x54    // 'T' for Tech IoT Warriors

#endif // CONFIG_H
