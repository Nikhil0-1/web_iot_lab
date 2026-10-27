# Wiring — Project 21: DC Motor Control Panel (TB6612FNG)

| Signal | NodeMCU | GPIO | Driver Pin |
|--------|---------|------|-----------|
| PWM | D1 | GPIO5 | PWMA |
| Dir A | D2 | GPIO4 | AIN1 |
| Dir B | D5 | GPIO14 | AIN2 |
| Standby | D6 | GPIO12 | STBY |

Driver VMOT → motor supply (check motor voltage)
Driver VCC  → 3.3V
Driver GND  → common GND
Driver AO1/AO2 → motor terminals
