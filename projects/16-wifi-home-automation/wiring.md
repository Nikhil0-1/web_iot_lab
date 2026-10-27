# Wiring — Project 16: Wi-Fi Home Automation

## Components
4-channel relay module, NodeMCU ESP8266, 4× demonstration LED + 220Ω resistors, 5V supply.

## Pin Map
| Channel | NodeMCU | GPIO | Label |
|---------|---------|------|-------|
| CH1 | D1 | GPIO5 | Living Room Light |
| CH2 | D2 | GPIO4 | Bedroom Light |
| CH3 | D5 | GPIO14 | Kitchen Fan |
| CH4 | D6 | GPIO12 | Bathroom Exhaust |

## Safety
Use relay NO (Normally Open) contact for all loads.
For mains-voltage loads: use proper isolation, rated enclosure, and qualified installer.
For demonstration: use only low-voltage LED loads.
