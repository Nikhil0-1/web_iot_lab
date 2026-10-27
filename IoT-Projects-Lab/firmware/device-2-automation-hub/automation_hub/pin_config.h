#ifndef PIN_CONFIG_H
#define PIN_CONFIG_H

#include <Arduino.h>

// =============================================================================
// DEVICE 2: AUTOMATION & CONTROL HUB — PIN MAPPING & ELECTRICAL SPECIFICATION
// Board: ESP8266 NodeMCU v2 / v3 (ESP-12E / ESP-12F Module)
// =============================================================================
//
// ESP8266 NODEMCU PIN TRANSLATION TABLE:
// D0  = GPIO16  (High at boot, wake-up from deep sleep)
// D1  = GPIO5   (Safe I/O, I2C SCL)
// D2  = GPIO4   (Safe I/O, I2C SDA)
// D3  = GPIO0   (FLASH BUTTON: Boot-strap MUST be HIGH at power-up)
// D4  = GPIO2   (ONBOARD BLUE LED: Boot-strap MUST be HIGH at power-up)
// D5  = GPIO14  (Safe I/O, Hardware PWM, SPI SCK)
// D6  = GPIO12  (Safe I/O, Hardware PWM, SPI MISO)
// D7  = GPIO13  (Safe I/O, Hardware PWM, SPI MOSI)
// D8  = GPIO15  (Boot-strap MUST be LOW at power-up. 10k pulldown onboard. Never pull HIGH at boot)
// A0  = ADC0    (Analog input, 0 to 3.3V on NodeMCU board)
// =============================================================================

// --- I2C BUS (PCF8574 8-Channel Relay Driver / Sensors) ---
#define PIN_I2C_SCL             5   // D1 (GPIO5)
#define PIN_I2C_SDA             4   // D2 (GPIO4)

// --- PCF8574 RELAY CHANNELS (P0 to P7, Active-LOW Optocoupled) ---
#define RELAY_CH_PLANT_PUMP     0   // P0: Project 13 Plant Watering DC Pump
#define RELAY_CH_TANK_PUMP      1   // P1: Project 14 Water Tank Inflow Pump
#define RELAY_CH_HOME_LIVING    2   // P2: Project 16 Home Automation Relay 1
#define RELAY_CH_HOME_KITCHEN   3   // P3: Project 16 Home Automation Relay 2
#define RELAY_CH_HOME_BEDROOM   4   // P4: Project 16 Home Automation Relay 3
#define RELAY_CH_HOME_APPLIANCE 5   // P5: Project 16 Home Automation Relay 4
#define RELAY_CH_EXHAUST_FAN    6   // P6: Project 18 Smart Exhaust Fan
#define RELAY_CH_GREENHOUSE_MIST 7  // P7: Project 24 Greenhouse Misting Pump / Heater

// --- DIRECT ACTUATOR PWM & MOTOR DRIVER INTERFACES ---
// High-Speed PWM Output (1 kHz Hardware PWM, 0–1023 duty cycle)
#define PIN_ACTUATOR_PWM       14   // D5 (GPIO14): Fan Speed MOSFET PWM / DC Motor ENA / Street Light LED PWM

// Motor Direction & Stepper Control Lines
#define PIN_MOTOR_IN1_STEP     12   // D6 (GPIO12): DC Motor IN1 / Stepper A4988 STEP pulse
#define PIN_MOTOR_IN2_DIR      13   // D7 (GPIO13): DC Motor IN2 / Stepper A4988 DIR direction
#define PIN_STEPPER_ENABLE     16   // D0 (GPIO16): Stepper Driver ENABLE line (Active LOW)

// Servo Motor Micro-Actuator PWM
#define PIN_SERVO_PWM          15   // D8 (GPIO15): SG90 / MG996R Servo (Projects 19, 20, 24). Pulled LOW at boot.

// --- SENSORY FEEDBACK & INTERRUPT INPUTS FOR AUTOMATION ---
#define PIN_DOOR_PROXIMITY     16   // D0 (GPIO16): Project 19 Door Proximity / Obstacle IR Sensor
#define PIN_FAN_TACH_PULSE      0   // D3 (GPIO0) : Project 17 Fan Tachometer RPM pulse (Interrupt)
#define PIN_GREENHOUSE_DHT      2   // D4 (GPIO2) : Project 24 Greenhouse DHT22 Climate feedback
#define PIN_LOCAL_ANALOG       A0   // A0 (ADC0)  : Soil probe feedback / Street light LDR

// =============================================================================
// ELECTRICAL POWER & ACTUATOR SAFETY RULES:
// 1. NEVER power servos or DC motors directly from ESP8266 3.3V or VIN pins!
//    Motors draw inductive spikes (1A - 3A stall current) that cause immediate
//    brownout, reset, or silicon destruction. Use an external 5V/12V power supply.
// 2. Connect the external DC power supply GND directly to NodeMCU GND (Common Ground).
// 3. Ensure flyback diodes (1N4007 or Schottky) are installed across all inductive
//    DC motor coils and solenoids to quench reverse EMF voltage spikes.
// 4. Optocoupled relay boards must be powered via JD-VCC jumper using external 5V.
// =============================================================================

#endif // PIN_CONFIG_H
