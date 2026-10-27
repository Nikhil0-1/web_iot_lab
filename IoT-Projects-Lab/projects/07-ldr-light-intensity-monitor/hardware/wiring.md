# Project 03: LDR Light Intensity Monitor — Hardware Wiring Guide

## 1. Components
- **NodeMCU ESP8266**
- **Light Dependent Resistor (LDR)** (e.g. 5528)
- **10kΩ Resistor** (1/4W)
- Breadboard & Jumper wires

## 2. Voltage Divider Circuit Schematic
The LDR resistance decreases with increasing light intensity. Connected in series with a 10kΩ fixed resistor:

```
    3.3V
     |
    [LDR]
     |
     +-----> NodeMCU Pin A0 (ADC)
     |
   [10kΩ]
     |
    GND
```

## 3. NodeMCU ADC Voltage Limits
- The ESP8266 bare chip ADC input (pin 6) only tolerates **0 to 1.0V**.
- However, the **NodeMCU development board** integrates an onboard resistor divider (220kΩ to A0 pin, 100kΩ to GND), scaling external **0 to 3.3V** signals safely to 0 to 1.0V!
- Therefore, powering the LDR divider from 3.3V produces a safe 0 to 3.3V swing on the board's A0 pin.
