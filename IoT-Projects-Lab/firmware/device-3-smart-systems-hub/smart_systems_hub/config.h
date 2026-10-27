#ifndef CONFIG_H
#define CONFIG_H

// Tech IoT Warriors — Device 3: Smart Systems Hub Configuration
#define FIRMWARE_NAME "Tech IoT Warriors Smart Systems Hub"
#define FIRMWARE_VERSION "3.0.0"
#define DEVICE_ID "esp8266-smart-systems-hub-03"
#define DEVICE_TYPE "smart-systems-hub"
#define MDNS_HOSTNAME "smart-systems"

// Wi-Fi Station Mode (Default credentials)
#define DEFAULT_WIFI_SSID "TechIoT_Lab_2G"
#define DEFAULT_WIFI_PASS "IoTLab2026Secure"

// Wi-Fi Access Point Fallback (Activated when station connection fails)
#define AP_SSID "TechIoTW_SmartSystemsHub"
#define AP_PASSWORD "tech123456"

// Network & Web API
#define WEB_SERVER_PORT 80
#define TELEMETRY_INTERVAL_MS 1500

// Battery & Power Calibration
#define BATTERY_DIVIDER_RATIO 4.18
#define ADC_REF_VOLTAGE 3.30

#endif // CONFIG_H
