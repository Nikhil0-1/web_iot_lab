# Wiring Guide — Project 14: Smart Water Tank Controller

## Components Required
| Component | Quantity | Notes |
|-----------|----------|-------|
| NodeMCU ESP8266 (ESP-12E) | 1 | 3.3V logic microcontroller |
| HC-SR04 Ultrasonic Distance Sensor | 1 | Or waterproof JSN-SR04T |
| 5V 1-Channel Relay Module | 1 | Opto-isolated, Active-LOW trigger |
| Resistors (1kΩ and 2kΩ) | 1 each | Voltage divider for 5V HC-SR04 Echo pin |
| DC / AC Water Pump | 1 | Sized according to head & reservoir |
| External Power Supply for Pump | 1 | Sized according to pump voltage/current |
| 5V DC Power Supply for ESP8266 | 1 | Via USB or VIN pin |

---

## GPIO Mapping
| ESP8266 Pin | Function / Sensor Pin | Description |
|-------------|-----------------------|-------------|
| **D1 (GPIO 5)** | HC-SR04 `Trig` | Trigger pulse output (3.3V TTL) |
| **D2 (GPIO 4)** | HC-SR04 `Echo` (divided) | Echo pulse input via 1kΩ / 2kΩ divider |
| **D5 (GPIO 14)**| Relay Module `IN` | Active-LOW relay trigger control |
| **3V3** | Unused for 5V sensor | Do not power 5V HC-SR04 from 3.3V |
| **VIN (5V)** | HC-SR04 `VCC` & Relay `VCC` | 5V supply input from USB / External supply |
| **GND** | System Ground | Common ground rail between all modules |

---

## Echo Pin Voltage Divider (CRITICAL)
HC-SR04 operates at 5V, so its `Echo` pin outputs a 5V signal. Connecting 5V directly to ESP8266 GPIO pins can permanently damage the chip.
Use a simple two-resistor voltage divider:
```
HC-SR04 Echo (5V) ──────[ 1kΩ ]──────┬──────> ESP8266 D2 (GPIO 4, ~3.3V)
                                     │
                                   [ 2kΩ ]
                                     │
                                    GND
```
Formula: `Vout = 5V * (2kΩ / (1kΩ + 2kΩ)) = 3.33V` (Safe for ESP8266).

---

## Schematic / Breadboard Connections
```
                     +----------------------------+
                     |   NodeMCU ESP8266 (12-E)   |
                     |                            |
                     |  VIN (5V)        D1 (GPIO5)|-------> HC-SR04 Trig
                     |    GND           D2 (GPIO4)|<------- 1kΩ/2kΩ Divider <--- HC-SR04 Echo
                     |                  D5 (GPIO14)|-------> Relay Module IN
                     +----------------------------+
                           |
      +--------------------+---------------------+
      | 5V Rail                                  | GND Rail
      v                                          v
+------------------+                       +------------------+
| HC-SR04 VCC (5V) |                       | HC-SR04 GND      |
| Relay VCC (5V)   |                       | Relay GND        |
+------------------+                       +------------------+

                              Relay Switch Contacts
                            +-----------------------+
External Pump Supply (+) -> | COM              NO   | ----> Pump (+)
External Pump Supply (-) ---------------------------------> Pump (-)
```

---

## Safety & Operational Notes
1. **Never drive pumps directly from GPIO**: The ESP8266 GPIO pins can supply a maximum of 12mA. Pumps draw hundreds of milliamps to several amps. Always use a relay or optocoupled contactor.
2. **Flyback Diode**: If using an inductive DC pump without a built-in snubber, place a 1N4007 diode in reverse bias across the pump DC terminals to suppress inductive voltage spikes.
3. **Firmware Timeout**: The firmware incorporates a 5-minute maximum continuous run timeout to prevent tank overflow or dry running if the sensor becomes disconnected.
