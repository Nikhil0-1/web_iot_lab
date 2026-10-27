# Wiring Guide — Project 13: Automatic Plant Watering

## Components Required
| Component | Quantity | Notes |
|-----------|----------|-------|
| NodeMCU ESP8266 (ESP-12E) | 1 | 3.3V logic, single ADC |
| Capacitive Soil Moisture Sensor v1.2 | 1 | 3.3–5V supply |
| 5V Relay Module (1-channel) | 1 | Active LOW, optocoupler-isolated |
| DC Submersible Mini Pump | 1 | 3–6V or 12V depending on model |
| External pump power supply | 1 | Match pump voltage rating |
| Jumper wires | Several | Male-to-female |
| Breadboard or PCB | 1 | For connections |

## GPIO Pin Mapping
| Signal | ESP8266 Pin | GPIO # | Notes |
|--------|-------------|--------|-------|
| Soil Sensor AOUT | A0 | ADC | Max 1.0V on NodeMCU A0 |
| Relay control | D1 | GPIO5 | Active LOW — output LOW = pump ON |
| Soil Sensor VCC | 3.3V | — | Do not use 5V on AOUT |
| Soil Sensor GND | GND | — | |
| Relay VCC | VIN | — | 5V from USB power |
| Relay GND | GND | — | |

## Wiring Diagram (Text)
```
NodeMCU            Capacitive Sensor
─────────          ─────────────────
3.3V  ──────────▶  VCC
GND   ──────────▶  GND
A0    ◀──────────  AOUT

NodeMCU            Relay Module
─────────          ─────────────
VIN   ──────────▶  VCC (5V)
GND   ──────────▶  GND
D1    ──────────▶  IN  (Active LOW)

Relay Module             Pump + Supply
───────────────          ──────────────
COM   ────────────────▶  Supply (+)
NO    ────────────────▶  Pump (+)
                         Pump (-)  ──▶  Supply (-)
```

## Power Supply Requirements
- NodeMCU: 5V USB or regulated supply
- Relay: 5V coil (use VIN pin of NodeMCU with adequate USB supply ≥1A)
- Pump: Use external supply matched to pump specs — do NOT power pump from ESP8266

## Important Safety Notes
1. **Never power the pump from ESP8266 GPIO pins.** GPIO current limit is ~12 mA.
2. Use a relay or MOSFET driver with appropriate current rating for your pump.
3. Keep pump power supply wiring separate from microcontroller wiring.
4. For capacitive sensors: supply from 3.3V. The analog output voltage must not exceed the NodeMCU A0 maximum input (1.0V on NodeMCU, 3.3V on bare ESP8266).
5. Capacitive sensors are safer for long-term soil use than resistive sensors (no electrolysis).
6. Test with a low-power pump first before scaling up.

## ADC Calibration
The firmware uses `DRY_ADC` and `WET_ADC` constants:
- Power on the sensor **in dry air** → read Serial Monitor for raw ADC value → set as `DRY_ADC`
- Dip the sensor in water to the fill line → read Serial Monitor → set as `WET_ADC`
- Typical values: DRY ≈ 780–860, WET ≈ 350–450 (varies by sensor batch)
