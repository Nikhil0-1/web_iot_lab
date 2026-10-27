# Project 03: LDR Light Intensity Monitor

## 1. Project Overview
The **LDR Light Intensity Monitor** measures ambient illumination using a photoresistor (LDR) arranged in a voltage divider. The dashboard features an animated glowing sun with rotating corona rays that expands and dims with light levels, categorizing the environment into *Pitch Dark*, *Dim*, *Indoor Lighting*, and *Bright Sunlight*.

## 2. Features
- **Dynamic Solar Glow Animation:** Corona size, glow intensity, and ray rotation respond to photometric lux and percentage.
- **Calibrated Tiers:** Classification into Dark (<15%), Dim (15-40%), Indoor (40-75%), and Sunlight (>75%).
- **Raw ADC Inspection:** Direct view of the 10-bit analog conversion values (0 to 1023).
- **Time-Series Charting & CSV Logging:** Export illumination trends over time.

## 3. Hardware Requirements
- 1x ESP8266 NodeMCU
- 1x LDR (5mm Cadmium Sulfide cell)
- 1x 10kΩ resistor
- Breadboard & jumper wires
