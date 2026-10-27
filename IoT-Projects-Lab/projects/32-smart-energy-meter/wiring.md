# Project 32 Wiring Guide — Smart Energy Meter

## PZEM-004T Optocoupled TTL Side
- **PZEM 5V**: 5V External Regulated Power
- **PZEM GND**: Common Ground
- **PZEM TX**: NodeMCU D5 (GPIO 14 / Software RX)
- **PZEM RX**: NodeMCU D6 (GPIO 12 / Software TX via 1kΩ / 2kΩ voltage divider)

## AC High-Voltage Side (Lethal 110V/230V Mains!)
- **Terminal L & N**: Connect to AC Live and Neutral lines through a 1A fast-blow protective inline fuse.
- **Current Transformer (CT)**: Clamp around the **Phase/Live conductor only**. Clamping around both Live and Neutral simultaneously will cancel out magnetic flux and read zero.
- **Physical Isolation**: Keep high-voltage cables strictly separated by >6mm clearance from all low-voltage ESP8266 logic lines.
