# Project 27 Wiring Guide — RFID Door Access

## Connections & Protection
- **Relay IN**: NodeMCU D1 (GPIO 5)
- **Relay VCC/GND**: 5V External Power & Common GND
- **Solenoid Bolt Power**: External 12V 1A DC adapter switched across Relay COM and NO terminals.
- **Flyback Diode**: Solder a 1N4007 rectifier diode in reverse parallel across the solenoid coil terminals (Cathode stripe to +12V, Anode to Relay/GND) to suppress back-EMF spikes.
- **Status LED**: NodeMCU D2 (GPIO 4) via 220Ω resistor.
- **Buzzer Alert**: NodeMCU D8 (GPIO 15) via 2N2222 transistor buffer.
