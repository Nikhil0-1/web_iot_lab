# Project 34 Wiring Guide — Solar Panel Monitor

## INA219 I²C Connections
- **INA219 VCC**: NodeMCU 3.3V Pin
- **INA219 GND**: Common GND
- **INA219 SCL**: NodeMCU D1 (GPIO 5)
- **INA219 SDA**: NodeMCU D2 (GPIO 4)
- **VIN+**: Connect to Solar Panel Positive Terminal (+)
- **VIN-**: Connect to Battery Charger / Inverter Positive Input (+)
- **Load / Solar Negative**: Connect to Common GND
- **Voltage Warning**: Never exceed 26V DC bus potential into the INA219 breakout.
