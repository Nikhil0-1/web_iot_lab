# Wiring — Project 15: Smart Street Light

## Components
| Component | Notes |
|-----------|-------|
| NodeMCU ESP8266 | 3.3V logic |
| LDR (Photoresistor) | 10kΩ pull-down divider |
| N-CH MOSFET (IRLZ44N) | 3.3V gate-compatible |
| LED module (5V, low-current demo) | Max within MOSFET rating |
| PIR sensor HC-SR501 (optional) | 3.3V or 5V supply |

## Pin Map
| Signal | NodeMCU Pin | GPIO |
|--------|-------------|------|
| LDR divider output | A0 | ADC |
| MOSFET gate (PWM) | D1 | GPIO5 |
| PIR output | D5 | GPIO14 |

## Wiring
```
3.3V ──┬─── LDR ──┬── A0
       │           └── 10kΩ ─── GND
D1 ─── 100Ω ─── MOSFET Gate
MOSFET Source ─── GND
MOSFET Drain ─── LED(−) ─── LED(+) ─── 5V
D5 ◀── PIR OUT (with 3.3V supply)
```

## Notes
- MOSFET must be logic-level (3.3V gate drive sufficient)
- Never connect LED directly to GPIO — use driver
- PIR output may need voltage divider if 5V module
