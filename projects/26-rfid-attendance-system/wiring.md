# Project 26 Wiring Guide — RFID Attendance System

## SPI Bus Pin Connections
- **MFRC522 VCC**: NodeMCU 3.3V Pin (**CRITICAL**: Never connect 5V to RC522!)
- **MFRC522 GND**: Common GND
- **MFRC522 RST**: NodeMCU D3 (GPIO 0)
- **MFRC522 MISO**: NodeMCU D6 (GPIO 12)
- **MFRC522 MOSI**: NodeMCU D7 (GPIO 13)
- **MFRC522 SCK**: NodeMCU D5 (GPIO 14)
- **MFRC522 SDA (SS)**: NodeMCU D8 (GPIO 15)
- **Buzzer Chime**: NodeMCU D1 (GPIO 5) driving base of 2N2222 NPN transistor through 1kΩ resistor.
