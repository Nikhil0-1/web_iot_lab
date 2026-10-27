# Tech IoT Warriors — PCB Connector Map & Wiring Guide

## ESP8266 NodeMCU v2/v3 Pinout Reference

```
                     ┌──────────────────┐
                     │   ESP8266 NodeMCU │
                     │     v2 / v3      │
              ┌──────┤                  ├──────┐
        A0 ───┤ A0   │                  │ D0   ├─── GPIO16
              ├──────┤                  ├──────┤
   RESERVED ──┤ RSV  │                  │ D1   ├─── GPIO5  (I2C SCL)
              ├──────┤                  ├──────┤
   RESERVED ──┤ RSV  │                  │ D2   ├─── GPIO4  (I2C SDA)
              ├──────┤                  ├──────┤
       SD3 ───┤ SD3  │                  │ D3   ├─── GPIO0  (FLASH)
              ├──────┤                  ├──────┤
       SD2 ───┤ SD2  │                  │ D4   ├─── GPIO2  (LED)
              ├──────┤                  ├──────┤
       SD1 ───┤ SD1  │     USB PORT     │ D5   ├─── GPIO14 (SPI SCK)
              ├──────┤    ┌───────┐     ├──────┤
       CMD ───┤ CMD  │    │       │     │ D6   ├─── GPIO12 (SPI MISO)
              ├──────┤    └───────┘     ├──────┤
       SD0 ───┤ SD0  │                  │ D7   ├─── GPIO13 (SPI MOSI)
              ├──────┤                  ├──────┤
       CLK ───┤ CLK  │                  │ D8   ├─── GPIO15 (10k PD)
              ├──────┤                  ├──────┤
       GND ───┤ GND  │                  │ RX   ├─── GPIO3
              ├──────┤                  ├──────┤
      3.3V ───┤ 3V3  │                  │ TX   ├─── GPIO1
              ├──────┤                  ├──────┤
        EN ───┤ EN   │                  │ GND  ├─── GND
              ├──────┤                  ├──────┤
       RST ───┤ RST  │                  │ 3V3  ├─── 3.3V
              ├──────┤                  ├──────┤
       GND ───┤ GND  │                  │ VIN  ├─── 5V (USB VIN)
              └──────┤                  ├──────┘
                     └──────────────────┘
```

---

## Device 1: Sensors Hub — Connection Diagram

### I²C Bus (Shared)
```
ADS1115 + MPU6050
  VCC ────── 3.3V
  GND ────── GND
  SCL ────── D1 (GPIO5)
  SDA ────── D2 (GPIO4)
```

### HC-SR04 Ultrasonic (Projects 01, 09)
```
HC-SR04 #1 (Radar)                     HC-SR04 #2 (Water Level)
  VCC ────── 5V External                 VCC ────── 5V External
  GND ────── GND Common                  GND ────── GND Common
  TRIG ───── D0 (GPIO16)                 TRIG ───── D0 (GPIO16)  [shared]
  ECHO ──┬── 1kΩ ──┬── D3 (GPIO0)        ECHO ──┬── 1kΩ ──┬── D8 (GPIO15)
         └── 2kΩ ──┘── GND                      └── 2kΩ ──┘── GND
```

### DHT22 (Project 04)
```
DHT22
  VCC ────── 3.3V
  GND ────── GND
  DATA ──┬── D7 (GPIO13)
         └── 4.7kΩ ── 3.3V (pull-up)
```

### DS18B20 (Project 08)
```
DS18B20
  VCC (Red) ──── 3.3V
  GND (Black) ── GND
  DATA (Yellow) ┬── D6 (GPIO12)
                └── 4.7kΩ ── 3.3V (pull-up)
```

### YF-S201 Flow Sensor (Project 10)
```
YF-S201
  VCC (Red) ──── 5V External
  GND (Black) ── GND Common
  SIGNAL (Yellow) ── D5 (GPIO14)  [Hardware Interrupt]
```

### LDR Voltage Divider (Project 07)
```
    3.3V ── LDR ──┬── A0
                  └── 10kΩ ── GND
```

### MQ-135 / MQ-2 Gas Sensors (Projects 05, 06)
```
MQ-135 / MQ-2
  VCC ────── 5V External (heater power)
  GND ────── GND Common
  AO ──┬── 10kΩ ──┬── ADS1115 AIN0 / AIN1
       └── 20kΩ ──┘── GND
```

---

## Device 2: Automation Hub — Connection Diagram

### PCF8574 + 8-Channel Relay Board
```
PCF8574 Module
  VCC ────── 3.3V
  GND ────── GND
  SCL ────── D1 (GPIO5)
  SDA ────── D2 (GPIO4)
  A0 ─────── 3.3V  ┐
  A1 ─────── 3.3V  ├── Address = 0x27
  A2 ─────── 3.3V  ┘

  P0 ────── Relay IN1 (Plant Pump)
  P1 ────── Relay IN2 (Tank Pump)
  P2 ────── Relay IN3 (Home Relay 1)
  P3 ────── Relay IN4 (Home Relay 2)
  P4 ────── Relay IN5 (Home Relay 3)
  P5 ────── Relay IN6 (Home Relay 4)
  P6 ────── Relay IN7 (Exhaust Fan)
  P7 ────── Relay IN8 (Greenhouse Mist)

Relay Board Power:
  JD-VCC ──── 5V External (relay coil power)
  GND ─────── GND Common
  VCC ─────── 3.3V (logic-side, remove JD-VCC jumper!)
```

### MOSFET PWM Driver (Projects 15, 17)
```
IRF520 / IRLZ44N MOSFET Module
  SIG ────── D5 (GPIO14)  [1kHz PWM]
  VCC ────── 5V/12V External (load supply)
  GND ────── GND Common
  V+ ─────── Load+ (Fan / LED strip)
  V- ─────── Load- (Fan / LED strip)
```

### L298N DC Motor Driver (Project 21)
```
L298N Module
  ENA ────── D5 (GPIO14)  [PWM speed]
  IN1 ────── D6 (GPIO12)  [Direction A]
  IN2 ────── D7 (GPIO13)  [Direction B]
  VMS ────── 12V External
  GND ────── GND Common
  5V ─────── (onboard regulator, do NOT use for ESP8266)
```

### A4988 Stepper Driver (Project 22)
```
A4988 Module
  STEP ───── D6 (GPIO12)
  DIR ────── D7 (GPIO13)
  ENABLE ─── D0 (GPIO16)  [Active LOW]
  VDD ────── 3.3V
  GND ────── GND
  VMOT ───── 12V External (motor power)
  GND ────── GND Common
```

### Servo Motors (Projects 19, 20, 24)
```
SG90 / MG996R Servo
  VCC (Red) ──── 5V External
  GND (Brown) ── GND Common
  SIGNAL (Orange) ── D8 (GPIO15)  [PWM]
```

---

## Power Supply Recommendations

### Minimum Requirements

| Supply | Voltage | Current | Devices |
|--------|---------|---------|---------|
| USB Supply 1 | 5V | 500mA | NodeMCU Device 1 |
| USB Supply 2 | 5V | 500mA | NodeMCU Device 2 |
| External Supply 1 | 5V | 2A | HC-SR04, MQ heaters, Servos, Relay coils |
| External Supply 2 | 12V | 2A | DC Motor, Stepper Motor (via L298N / A4988) |

### Common Ground Rule
**ALL power supply GND terminals MUST be connected together**, including:
- NodeMCU GND
- External 5V GND
- External 12V GND
- Sensor GND
- Motor driver GND

---

## Category C Connector Maps (Projects 25–36)

### RC522 RFID SPI Pinout (Projects 26, 27)
```
MFRC522 13.56MHz RFID Reader
  VCC (3.3V ONLY!) ── NodeMCU 3V3 (NEVER 5V!)
  RST ────────────── D3 (GPIO0)
  GND ────────────── GND Common
  MISO ───────────── D6 (GPIO12 / SPI MISO)
  MOSI ───────────── D7 (GPIO13 / SPI MOSI)
  SCK ────────────── D5 (GPIO14 / SPI SCK)
  SDA (SS) ───────── D8 (GPIO15 / SPI CS)
```

### INA219 & SSD1306 OLED I²C Shared Bus (Projects 34, 35)
```
I²C Bus (Parallel Connection)
  SCL ────────────── D1 (GPIO5)
  SDA ────────────── D2 (GPIO4)
  VCC ────────────── 3.3V NodeMCU
  GND ────────────── GND Common
Addresses: INA219 = 0x40, SSD1306 = 0x3C
```

### PZEM-004T AC Energy Monitor UART (Project 32)
```
PZEM-004T v3.0 (Optoisolated TTL Side)
  5V  ────────────── External 5V Regulated
  GND ────────────── GND Common
  TX  ────────────── D5 (NodeMCU Software RX)
  RX  ────────────── D6 (NodeMCU Software TX via 1k/2k divider)
```

### Battery Voltage Divider to A0 (Project 33)
```
High-Voltage DC Rail (e.g., 12V / 4S Li-Ion)
  Batt (+) ──[ 100kΩ 1% ]──┬── NodeMCU A0 (Max 3.3V)
                           │
                         [ 10kΩ 1% ]
                           │
                         [ 100nF Cap ]
                           │
  Batt (-) ────────────────┴── GND Common
Ratio: (10k / (100k + 10k)) = 1/11. Max Input: 3.3V * 11 = 36.3V.
```

