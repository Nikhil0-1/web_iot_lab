# Tech IoT Warriors — Device 3: Smart Systems Hub Firmware

## Architecture
Device 3 provides centralized hardware telemetry and REST API coordination for **Category C: Smart Systems (Projects 25–36)**.

## Supported Peripherals
- **I²C Bus**: Parallel support for INA219 (0x40) & SSD1306 OLED (0x3C).
- **ADC A0**: 4:1 Precision Voltage Divider for Battery Monitoring.
- **SoftwareSerial**: Switched multiplexed bus for PZEM-004T and LD2410 mmWave Radar.
- **Actuators**: SG90 Servo barrier arm and Piezo security siren.
