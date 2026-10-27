# Wiring — Project 22: Stepper Motor Controller (A4988)

| Signal | NodeMCU | GPIO |
|--------|---------|------|
| STEP | D1 | GPIO5 |
| DIR | D2 | GPIO4 |
| EN (active low) | D5 | GPIO14 |

A4988 VMOT → 12V supply (NEMA17) or 5V (28BYJ-48)
A4988 VDD  → 3.3V logic
A4988 GND  → common GND
Add 100µF capacitor across VMOT/GND at driver
