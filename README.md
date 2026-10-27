# web_iot_lab

# Tech IoT Warriors — IoT Projects Lab (01–36)

Universal Interactive IoT Engineering Lab Suite featuring 36 complete projects, browser-based simulation engines, ESP8266 REST API integration, and multi-hub firmware.

## Architecture & Project Categories

### Category A — Sensors & Monitoring (01–12)
- **01. TERRASCAN X ELITE**: HC-SR04 Ultrasonic Radar Scanner with Azimuth Sweep
- **02. RAINWATCH AI**: Resistive Rain Grid Detection & Precipitation Gauging
- **03. TerraIQ**: Capacitive Soil Moisture Monitoring (v1.2)
- **04. ATMOS AI**: DHT22 Environmental Climate Station & Thermal Comfort
- **05. Smart Air Quality Monitor**: MQ-135 Hazardous Gas Telemetry
- **06. Gas Leakage Detector**: MQ-2 / MQ-5 Flammable Gas Warning
- **07. LDR Light Intensity Monitor**: Photoresistor Ambient Illuminance
- **08. Digital Thermometer**: DS18B20 OneWire High-Precision Temperature
- **09. Water Level Monitor**: Overhead Ultrasonic Headspace Sensing
- **10. Water Flow Meter**: YF-S201 Hall-Effect Pulse Meter
- **11. TDS Water Quality Monitor**: Analog Total Dissolved Solids Analysis
- **12. Vibration & Tilt Monitor**: MPU-6050 6-Axis IMU & SW-420 Sensor

### Category B — Automation & Control (13–24)
- **13. Automatic Plant Watering**: DC Submersible Pump Relay Interlock
- **14. Smart Water Tank Controller**: Inflow Pump Relay & Float Logic
- **15. Smart Street Light**: 12V LED Array N-MOSFET PWM Dimmer
- **16. Wi-Fi Home Automation**: 4-Channel Isolated Appliance Relays
- **17. Fan Speed Controller**: PWM MOSFET Driver & Tachometer Telemetry
- **18. Smart Exhaust Fan**: Environmental Ventilation Trigger
- **19. Automatic Door Controller**: Sliding Door Servo & Proximity Sensor
- **20. Servo Motor Web Control**: Precision Robotic Micro-Actuator
- **21. DC Motor Control Panel**: L298N H-Bridge Bidirectional Driver
- **22. Stepper Motor Controller**: A4988 Bipolar Microstepping Driver
- **23. Relay Control Dashboard**: 8-Channel Industrial Load Switching
- **24. Smart Greenhouse Automation**: Quad-Sensor Multi-Actuator Hub

### Category C — Smart Systems (25–36)
- **25. Smart Parking Assistant**: Ultrasonic Bay Sonar & SG90 Servo Barrier
- **26. RFID Attendance System**: MFRC522 13.56MHz Contactless Card Reader
- **27. RFID Door Access**: Solenoid Lock Controller & Access Log
- **28. Smart Dustbin**: Fill Depth Ultrasonic & Proximity Servo Lid
- **29. Fire & Smoke Alert**: MQ-2 Smoke Transducer & Optical Flame Sensor
- **30. Intrusion Detection Alarm**: HC-SR501 PIR Motion & Piezo Siren
- **31. Visitor Counter**: Dual IR Optical Break-Beam Bidirectional Tracker
- **32. Smart Energy Meter**: Peacefair PZEM-004T v3.0 AC Multi-Meter
- **33. Battery Voltage Monitor**: Precision Resistor Divider & State-of-Charge
- **34. Solar Panel Monitor**: INA219 I2C High-Side Current & Power Sensor
- **35. Digital Notice Board**: SSD1306 128x64 OLED Live Marquee
- **36. Smart Room Occupancy**: HLK-LD2410 24GHz mmWave Presence Radar

## Hardware Hubs (Multi-Device ESP8266 Architecture)
- **Device 1**: Sensors & Monitoring Hub (`firmware/device-1-sensors-hub/`)
- **Device 2**: Automation & Control Hub (`firmware/device-2-automation-hub/`)
- **Device 3**: Smart Systems Hub (`firmware/device-3-smart-systems-hub/`)

## Quick Start
1. Open `IoT-Projects-Lab/index.html` in any modern web browser.
2. Select any project to run in **Simulation Mode** or connect your physical ESP8266 by entering its IP address in **Hardware Mode**.
3. Flash corresponding firmware from the project's `firmware/` directory via Arduino IDE.
