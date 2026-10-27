#ifndef PIN_CONFIG_H
#define PIN_CONFIG_H

#include <Arduino.h>

// =============================================================================
// DEVICE 1: SENSORS & MONITORING HUB — PIN MAPPING & ELECTRICAL SPECIFICATION
// Board: ESP8266 NodeMCU v2 / v3 (ESP-12E / ESP-12F Module)
// =============================================================================
//
// ESP8266 NODEMCU PIN TRANSLATION TABLE:
// D0  = GPIO16  (High at boot, no interrupt, wake-up from deep sleep)
// D1  = GPIO5   (Safe I/O, I2C SCL)
// D2  = GPIO4   (Safe I/O, I2C SDA)
// D3  = GPIO0   (FLASH BUTTON: Boot-strap MUST be HIGH at power-up. Output/Input ok post-boot)
// D4  = GPIO2   (ONBOARD BLUE LED: Boot-strap MUST be HIGH at power-up. Output ok)
// D5  = GPIO14  (Safe I/O, SPI SCK, Interrupt capable)
// D6  = GPIO12  (Safe I/O, SPI MISO)
// D7  = GPIO13  (Safe I/O, SPI MOSI)
// D8  = GPIO15  (Boot-strap MUST be LOW at power-up. 10k pulldown onboard. Never pull HIGH at boot)
// A0  = ADC0    (Analog input, 0 to 1.0V chip / 0 to 3.3V on NodeMCU board with 220k/100k divider)
// =============================================================================

// --- I2C BUS (Shared by ADS1115 ADC + MPU6050 IMU) ---
#define PIN_I2C_SCL             5   // D1 (GPIO5)
#define PIN_I2C_SDA             4   // D2 (GPIO4)

// --- PROJECT 01: TERRASCAN X ELITE (Ultrasonic Radar + Azimuth Servo) ---
#define PIN_RADAR_TRIG         16   // D0 (GPIO16): Trigger pulse output (10us TTL)
#define PIN_RADAR_ECHO          0   // D3 (GPIO0) : Echo input. MUST use 1k/2k voltage divider from 5V HC-SR04!
#define PIN_RADAR_SERVO         2   // D4 (GPIO2) : SG90 Azimuth Radar Sweep Servo PWM

// --- PROJECT 02: RAINWATCH AI (Rain Grid Sensor & LM393) ---
// Digital threshold trigger on GPIO; Analog intensity routed via ADS1115 AIN1 or A0
#define PIN_RAIN_DIGITAL       15   // D8 (GPIO15): Active LOW rain trigger (comparator DO)
#define ADS_CH_RAIN             1   // ADS1115 AIN1 (or direct A0 in single-ADC mode)

// --- PROJECT 03: TerraIQ (Capacitive Soil Moisture Probe v1.2) ---
// High-impedance analog output 1.2V - 3.0V (Inverted: Dry ~2.8V, Wet ~1.2V)
#define ADS_CH_SOIL             3   // ADS1115 AIN3

// --- PROJECT 04: ATMOS AI (DHT22 / AM2302 Environmental Sensor) ---
// Precision digital 1-wire communication (Temp: -40 to 80C, Humidity: 0-100%)
#define PIN_DHT_DATA           13   // D7 (GPIO13) with 4.7k - 10k pull-up to 3.3V

// --- PROJECT 05: Smart Air Quality Monitor (MQ-135 Gas Sensor) ---
// 5V Heater requires external power. AO signal routed via 10k/20k divider or ADS1115
#define ADS_CH_MQ135            0   // ADS1115 AIN0

// --- PROJECT 06: Gas Leakage Detector (MQ-2 Flammable Gas Sensor) ---
// 5V Heater. Sensitive to LPG, Propane, Methane, Hydrogen, Smoke
#define ADS_CH_MQ2              1   // ADS1115 AIN1 (multiplexed/shared or calibrated)

// --- PROJECT 07: LDR Light Intensity Monitor (Photoresistor Divider) ---
// Standard 10k pull-down voltage divider on NodeMCU internal ADC
#define PIN_LDR_ANALOG         A0   // NodeMCU A0 (ADC0, 0–3.3V range)

// --- PROJECT 08: Digital Thermometer (DS18B20 OneWire Sensor) ---
// Dallas 1-Wire protocol with 4.7k pull-up resistor to 3.3V
#define PIN_ONEWIRE_BUS        12   // D6 (GPIO12)

// --- PROJECT 09: Water Level Monitor (HC-SR04 Overhead Ultrasonic) ---
// Measures empty headspace distance in reservoir/tank.
#define PIN_LEVEL_TRIG         16   // D0 (GPIO16): Shared Trig bus (triggered sequentially, not concurrently)
#define PIN_LEVEL_ECHO         15   // D8 (GPIO15): Echo input via 1k/2k level-divider

// --- PROJECT 10: Water Flow Meter (YF-S201 Hall-Effect Flow Sensor) ---
// Pulse output: ~450 pulses per liter (7.5 Hz per L/min). Requires hardware interrupt pin.
#define PIN_FLOW_PULSE         14   // D5 (GPIO14, Interrupt enabled)

// --- PROJECT 11: TDS Water Quality Monitor (Analog TDS Probe) ---
// 0–2.3V Analog excitation signal. 0–1000+ PPM dissolved solids.
#define ADS_CH_TDS              2   // ADS1115 AIN2

// --- PROJECT 12: Vibration & Tilt Monitor (MPU-6050 6-DOF IMU + SW-420) ---
// MPU-6050 communicates on I2C (Addr 0x68). SW-420 provides digital shock trigger.
#define PIN_VIB_SW420          15   // D8 (GPIO15): Digital vibration trigger input

// =============================================================================
// ELECTRICAL LEVEL SAFETY RULES:
// 1. NEVER connect 5V output of HC-SR04, MQ sensors, or Flow meter directly to
//    ESP8266 GPIO. Always use 1k/2k resistor dividers (5V * 2k / 3k = 3.3V).
// 2. Power all MQ heaters from an external 5V 2A regulator; do not pull high
//    heater current from the NodeMCU onboard 3.3V LDO.
// 3. Connect external 5V supply GND directly to NodeMCU GND (Common Ground).
// =============================================================================

#endif // PIN_CONFIG_H
