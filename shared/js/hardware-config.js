/**
 * Tech IoT Warriors — Verified Hardware Configuration System (Single Source of Truth)
 * Central hardware architecture specification for physical laboratory devices:
 *   DEVICE A: Sensors & Monitoring Hub (Projects 01–12)
 *   DEVICE B: Automation & Control Hub (Projects 13–24)
 *   DEVICE C: Smart Systems Hub (Projects 25–36)
 */

const HardwareConfig = {
  // Common platform properties
  microcontroller: 'ESP8266 NodeMCU v2 / v3 (ESP-12E / ESP-12F Module)',
  cpuFrequencyMhz: 80,
  flashSizeMb: 4,
  logicVoltage: 3.3,
  onboardAdcRange: '0 - 1.0V (0 - 3.3V via NodeMCU onboard resistor divider)',

  devices: {
    deviceA: {
      id: 'esp8266-sensors-hub-01',
      group: 'A',
      name: 'Device A — Sensors & Monitoring Hub',
      category: 'Sensors & Monitoring',
      firmwareVersion: '2.4.0',
      firmwarePath: 'firmware/device-1-sensors-hub/sensors_hub/sensors_hub.ino',
      defaultIp: '192.168.4.1',
      defaultApSsid: 'TechIoTW_SensorsHub',
      storageKey: 'tech_iot_deviceA_ip',
      mDnsHostname: 'sensors-hub',
      supportedProjects: [
        { id: '01', slug: '01-terrascan-x-elite', name: 'TERRASCAN X ELITE — Ultrasonic Radar' },
        { id: '02', slug: '02-rainwatch-ai', name: 'RAINWATCH AI — Rain Detection' },
        { id: '03', slug: '03-terraiq', name: 'TerraIQ — Soil Moisture Monitor' },
        { id: '04', slug: '04-atmos-ai', name: 'ATMOS AI — Temperature & Humidity' },
        { id: '05', slug: '05-smart-air-quality-monitor', name: 'Smart Air Quality Monitor' },
        { id: '06', slug: '06-gas-leakage-detector', name: 'Gas Leakage Detector' },
        { id: '07', slug: '07-ldr-light-intensity-monitor', name: 'LDR Light Intensity Monitor' },
        { id: '08', slug: '08-digital-thermometer', name: 'Digital Thermometer' },
        { id: '09', slug: '09-water-level-monitor', name: 'Water Level Monitor' },
        { id: '10', slug: '10-water-flow-meter', name: 'Water Flow Meter' },
        { id: '11', slug: '11-tds-water-quality-monitor', name: 'TDS Water Quality Monitor' },
        { id: '12', slug: '12-vibration-tilt-monitor', name: 'Vibration & Tilt Monitor' }
      ],
      busses: {
        i2c: { sda: 'D2 (GPIO 4)', scl: 'D1 (GPIO 5)', clockSpeedKhz: 100 },
        oneWire: { pin: 'D6 (GPIO 12)', pullupResistor: '4.7kΩ to 3.3V' }
      },
      pinout: {
        'A0 (ADC0)': 'Internal ADC — LDR Light Divider (10kΩ pull-down) or MUX input',
        'D0 (GPIO 16)': 'Ultrasonic Shared Trigger (Projects 01 & 09)',
        'D1 (GPIO 5)': 'I2C SCL (ADS1115 ADC @ 0x48 & MPU-6050 IMU @ 0x68)',
        'D2 (GPIO 4)': 'I2C SDA (ADS1115 ADC @ 0x48 & MPU-6050 IMU @ 0x68)',
        'D3 (GPIO 0)': 'Ultrasonic Radar Echo #1 (via 1k/2k voltage divider)',
        'D4 (GPIO 2)': 'SW-420 Vibration Sensor Digital Output',
        'D5 (GPIO 14)': 'YF-S201 Flow Sensor Pulse Signal (Hardware Interrupt)',
        'D6 (GPIO 12)': 'DS18B20 1-Wire Digital Temperature Data',
        'D7 (GPIO 13)': 'DHT22 Digital Temperature & Humidity Data',
        'D8 (GPIO 15)': 'Ultrasonic Tank Echo #2 (via 1k/2k voltage divider)'
      },
      i2cDevices: [
        { address: '0x48', device: 'ADS1115 16-bit 4-ch ADC', channels: { A0: 'MQ-135 Gas', A1: 'MQ-2 Smoke', A2: 'Capacitive Soil', A3: 'Analog TDS' } },
        { address: '0x68', device: 'MPU-6050 6-DOF IMU (Accelerometer & Gyroscope)' }
      ],
      limitations: [
        'ESP8266 has only 1 physical ADC channel (A0, 0-1.0V internal / 0-3.3V on NodeMCU board).',
        'Simultaneous multi-analog reading (MQ-135, MQ-2, Soil, TDS) requires the external ADS1115 I2C ADC (0x48).',
        'HC-SR04 Echo pins output 5V logic; 1kΩ/2kΩ resistor voltage dividers are MANDATORY to protect 3.3V GPIOs.',
        'Gas sensor heater coils (MQ-2, MQ-135) draw ~150-180mA each at 5V; must be powered from external 5V rail, not NodeMCU 3V3 pin.'
      ]
    },

    deviceB: {
      id: 'esp8266-automation-hub-02',
      group: 'B',
      name: 'Device B — Automation & Control Hub',
      category: 'Automation & Control',
      firmwareVersion: '2.4.0',
      firmwarePath: 'firmware/device-2-automation-hub/automation_hub/automation_hub.ino',
      defaultIp: '192.168.4.2',
      defaultApSsid: 'TechIoTW_AutomationHub',
      storageKey: 'tech_iot_deviceB_ip',
      mDnsHostname: 'automation-hub',
      supportedProjects: [
        { id: '13', slug: '13-automatic-plant-watering', name: 'Automatic Plant Watering' },
        { id: '14', slug: '14-smart-water-tank-controller', name: 'Smart Water Tank Controller' },
        { id: '15', slug: '15-smart-street-light', name: 'Smart Street Light' },
        { id: '16', slug: '16-wifi-home-automation', name: 'Wi-Fi Home Automation' },
        { id: '17', slug: '17-fan-speed-controller', name: 'Fan Speed Controller' },
        { id: '18', slug: '18-smart-exhaust-fan', name: 'Smart Exhaust Fan' },
        { id: '19', slug: '19-automatic-door-controller', name: 'Automatic Door Controller' },
        { id: '20', slug: '20-servo-motor-web-control', name: 'Servo Motor Web Control' },
        { id: '21', slug: '21-dc-motor-control-panel', name: 'DC Motor Control Panel' },
        { id: '22', slug: '22-stepper-motor-controller', name: 'Stepper Motor Controller' },
        { id: '23', slug: '23-relay-control-dashboard', name: 'Relay Control Dashboard' },
        { id: '24', slug: '24-smart-greenhouse-automation', name: 'Smart Greenhouse Automation' }
      ],
      busses: {
        i2c: { sda: 'D2 (GPIO 4)', scl: 'D1 (GPIO 5)', clockSpeedKhz: 100 }
      },
      pinout: {
        'D0 (GPIO 16)': 'A4988 Stepper Enable (Active LOW)',
        'D1 (GPIO 5)': 'I2C SCL — PCF8574 IO Expander @ 0x27 for 8-ch Relay Board',
        'D2 (GPIO 4)': 'I2C SDA — PCF8574 IO Expander @ 0x27 for 8-ch Relay Board',
        'D3 (GPIO 0)': 'Emergency Stop Pushbutton (Active LOW)',
        'D4 (GPIO 2)': 'Safety Interlock / Status LED',
        'D5 (GPIO 14)': 'PWM Actuator 1 — IRF520 MOSFET / L298N ENA (Speed)',
        'D6 (GPIO 12)': 'Motor Control 1 — L298N IN1 / A4988 STEP Pin',
        'D7 (GPIO 13)': 'Motor Control 2 — L298N IN2 / A4988 DIR Pin',
        'D8 (GPIO 15)': 'Servo Micro-Actuator PWM Control (SG90 / MG996R)'
      },
      i2cDevices: [
        {
          address: '0x27',
          device: 'PCF8574 8-Bit I2C I/O Expander',
          channels: {
            P0: 'Relay 1 — Plant Submersible Pump (5V/12V)',
            P1: 'Relay 2 — Water Tank Overhead Pump',
            P2: 'Relay 3 — Home AC Load 1 (Living Room)',
            P3: 'Relay 4 — Home AC Load 2 (Bedroom)',
            P4: 'Relay 5 — Home AC Load 3 (Kitchen)',
            P5: 'Relay 6 — Home AC Load 4 (Exterior)',
            P6: 'Relay 7 — Heavy Exhaust Fan Relay',
            P7: 'Relay 8 — Greenhouse Ultrasonic Fogger / Mist Pump'
          }
        }
      ],
      limitations: [
        'GPIO pins MUST NEVER be connected directly to inductive loads (motors, coils, pumps, solenoids) — flyback diodes and optoisolation mandatory.',
        'Relay coils draw ~70mA each when energized. 8 active relays require ~560mA; power relay JD-VCC from external 5V supply, remove jumper and supply logic VCC with 3.3V.',
        'DC Motors and Stepper Motors require dedicated 12V 2A external DC power connected to driver VIN/VMOT terminals.',
        'Common Ground terminal between external 5V, 12V and NodeMCU GND is required for stable logic signals.'
      ]
    },

    deviceC: {
      id: 'esp8266-smart-systems-hub-03',
      group: 'C',
      name: 'Device C — Smart Systems Hub',
      category: 'Smart Systems & Infrastructure',
      firmwareVersion: '3.0.0',
      firmwarePath: 'firmware/device-3-smart-systems-hub/smart_systems_hub/smart_systems_hub.ino',
      defaultIp: '192.168.4.3',
      defaultApSsid: 'TechIoTW_SmartSystemsHub',
      storageKey: 'tech_iot_deviceC_ip',
      mDnsHostname: 'smart-systems',
      supportedProjects: [
        { id: '25', slug: '25-smart-parking-assistant', name: 'Smart Parking Assistant' },
        { id: '26', slug: '26-rfid-attendance-system', name: 'RFID Attendance System' },
        { id: '27', slug: '27-rfid-door-access', name: 'RFID Door Access' },
        { id: '28', slug: '28-smart-dustbin', name: 'Smart Dustbin' },
        { id: '29', slug: '29-fire-smoke-alert', name: 'Fire & Smoke Alert' },
        { id: '30', slug: '30-intrusion-detection-alarm', name: 'Intrusion Detection Alarm' },
        { id: '31', slug: '31-visitor-counter', name: 'Visitor Counter' },
        { id: '32', slug: '32-smart-energy-meter', name: 'Smart Energy Meter' },
        { id: '33', slug: '33-battery-voltage-monitor', name: 'Battery Voltage Monitor' },
        { id: '34', slug: '34-solar-panel-monitor', name: 'Solar Panel Monitor' },
        { id: '35', slug: '35-digital-notice-board', name: 'Digital Notice Board (SSD1306 OLED)' },
        { id: '36', slug: '36-smart-room-occupancy', name: 'Smart Room Occupancy (mmWave Radar)' }
      ],
      busses: {
        i2c: { sda: 'D2 (GPIO 4)', scl: 'D1 (GPIO 5)', clockSpeedKhz: 100 },
        spi: { sck: 'D5 (GPIO 14)', miso: 'D6 (GPIO 12)', mosi: 'D7 (GPIO 13)', cs: 'D8 (GPIO 15)' },
        uartSoftSerial: { rx: 'D5 (GPIO 14)', tx: 'D6 (GPIO 12)' }
      },
      pinout: {
        'A0 (ADC0)': 'Precision Resistor Divider (100kΩ/10kΩ) for 0-36V Battery Voltage telemetry',
        'D1 (GPIO 5)': 'I2C SCL — SSD1306 128x64 OLED @ 0x3C & INA219 Solar Monitor @ 0x40',
        'D2 (GPIO 4)': 'I2C SDA — SSD1306 128x64 OLED @ 0x3C & INA219 Solar Monitor @ 0x40',
        'D3 (GPIO 0)': 'RC522 RFID Reset Pin / Flame Sensor DO',
        'D4 (GPIO 2)': 'Status LED / Dustbin Proximity IR DO',
        'D5 (GPIO 14)': 'Shared: SPI SCK (RFID) / Piezo Siren Alert / SoftSerial RX (PZEM-004T / LD2410)',
        'D6 (GPIO 12)': 'Shared: SPI MISO (RFID) / SoftSerial TX (PZEM-004T / LD2410)',
        'D7 (GPIO 13)': 'SPI MOSI (RFID)',
        'D8 (GPIO 15)': 'SPI CS (RFID SS) / Barrier Servo Control'
      },
      i2cDevices: [
        { address: '0x3C', device: 'SSD1306 128x64 Monochrome OLED Display' },
        { address: '0x40', device: 'Texas Instruments INA219 High-Side Power Monitor' }
      ],
      limitations: [
        'RC522 RFID reader requires 3.3V strictly. Connecting to 5V will permanently destroy the IC.',
        'PZEM-004T AC Energy Meter measures MAINS VOLTAGE (110V - 240V AC). Proper enclosure, isolation, and safety precautions required.',
        'Pin multiplexing: D5 and D6 are shared between SPI (RC522) and SoftwareSerial (PZEM / mmWave). Test SPI and UART projects on separate bench setups or sequential testing.'
      ]
    }
  },

  // Lookup helper by project number (e.g. 1 to 36 or "01" to "36")
  getDeviceForProject(projectId) {
    const num = parseInt(projectId, 10);
    if (!isNaN(num)) {
      if (num >= 1 && num <= 12) return this.devices.deviceA;
      if (num >= 13 && num <= 24) return this.devices.deviceB;
      if (num >= 25 && num <= 36) return this.devices.deviceC;
    }
    return this.devices.deviceA;
  },

  // Validate if a project ID is supported by a given device group ('A', 'B', or 'C')
  isProjectSupportedByGroup(groupLetter, projectId) {
    const groupKey = 'device' + String(groupLetter).toUpperCase();
    const dev = this.devices[groupKey];
    if (!dev) return false;

    const num = parseInt(projectId, 10);
    const slug = String(projectId).toLowerCase();

    return dev.supportedProjects.some(p => {
      return parseInt(p.id, 10) === num || p.slug.includes(slug) || slug.includes(p.slug);
    });
  }
};

if (typeof window !== 'undefined') {
  window.HardwareConfig = HardwareConfig;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HardwareConfig;
}

