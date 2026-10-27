#ifndef PIN_CONFIG_H
#define PIN_CONFIG_H

// Tech IoT Warriors — Device 3: Smart Systems Pin Allocations
// Shared I2C Bus (INA219 0x40 + SSD1306 OLED 0x3C)
#define PIN_I2C_SCL 5  // D1 (GPIO 5)
#define PIN_I2C_SDA 4  // D2 (GPIO 4)

// Analog Battery Input
#define PIN_ADC_BATT A0 // A0 (0-1.0V chip, 0-3.3V NodeMCU)

// SoftwareSerial Switched Bus (PZEM-004T / LD2410 mmWave)
#define PIN_SW_RX 14   // D5 (GPIO 14)
#define PIN_SW_TX 12   // D6 (GPIO 12)

// Actuator & Sensor GPIOs
#define PIN_SERVO_BARRIER 13 // D7 (GPIO 13)
#define PIN_PIR_MOTION    15 // D8 (GPIO 15)
#define PIN_PIEZO_SIREN   0  // D3 (GPIO 0 via NPN)
#define PIN_STATUS_LED    2  // D4 (GPIO 2 Onboard LED)

#endif // PIN_CONFIG_H
