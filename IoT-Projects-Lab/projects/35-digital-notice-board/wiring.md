# Project 35 Wiring Guide — Digital Notice Board

## SSD1306 OLED I²C Connections
- **OLED VCC**: NodeMCU 3.3V Pin
- **OLED GND**: Common GND
- **OLED SCL**: NodeMCU D1 (GPIO 5)
- **OLED SDA**: NodeMCU D2 (GPIO 4)
- **Optional Piezo Chime**: NodeMCU D5 (GPIO 14) via 2N2222 NPN buffer
- **I²C Address**: Default hardware address is `0x3C` (selectable to `0x3D` via back resistor jumper on some boards).
