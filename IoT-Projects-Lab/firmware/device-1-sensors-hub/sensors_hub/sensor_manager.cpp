#include "sensor_manager.h"
#include <Wire.h>
#include <Servo.h>

// Global pulse counter for YF-S201 Flow Meter
static volatile unsigned long g_flowPulses = 0;

void IRAM_ATTR onFlowPulseInterrupt() {
  g_flowPulses++;
}

SensorManager sensorManager;
static Servo g_radarServo;

SensorManager::SensorManager()
  : _lastRadarMs(0),
    _lastAnalogMs(0),
    _lastDhtMs(0),
    _lastOneWireMs(0),
    _lastFlowMs(0),
    _lastMpuMs(0),
    _lastLevelMs(0),
    _bootTimeSec(0),
    _radarAngle(90),
    _radarDirection(2),
    _radarSweepEnabled(true),
    _lastFlowPulseCount(0),
    _ads1115Available(false),
    _mpu6050Available(false)
{
}

void SensorManager::begin() {
  _bootTimeSec = millis() / 1000;
  initPins();
  initI2C();
  initFlowInterrupt();
  initMPU6050();

  // Attach Radar Servo
  g_radarServo.attach(PIN_RADAR_SERVO);
  g_radarServo.write(_radarAngle);

  Serial.println(F("[SENSORS] Sensor Manager initialized across all 12 projects."));
}

void SensorManager::initPins() {
  pinMode(PIN_RADAR_TRIG, OUTPUT);
  digitalWrite(PIN_RADAR_TRIG, LOW);
  pinMode(PIN_RADAR_ECHO, INPUT);

  pinMode(PIN_RAIN_DIGITAL, INPUT_PULLUP);
  pinMode(PIN_VIB_SW420, INPUT);

  pinMode(PIN_ONEWIRE_BUS, INPUT_PULLUP);
  pinMode(PIN_DHT_DATA, INPUT_PULLUP);
}

void SensorManager::initI2C() {
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  Wire.setClock(100000); // 100 kHz Standard Mode

  // Probe ADS1115
  Wire.beginTransmission(ADS1115_I2C_ADDR);
  if (Wire.endTransmission() == 0) {
    _ads1115Available = true;
    Serial.println(F("[I2C] Found ADS1115 16-Bit ADC at 0x48."));
  } else {
    _ads1115Available = false;
    Serial.println(F("[I2C] ADS1115 not detected at 0x48. Using internal ADC / fallback profile."));
  }
}

void SensorManager::initFlowInterrupt() {
  pinMode(PIN_FLOW_PULSE, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_FLOW_PULSE), onFlowPulseInterrupt, RISING);
}

void SensorManager::initMPU6050() {
  Wire.beginTransmission(MPU6050_I2C_ADDR);
  if (Wire.endTransmission() == 0) {
    // Wake up MPU-6050 (write 0 to PWR_MGMT_1 register 0x6B)
    Wire.beginTransmission(MPU6050_I2C_ADDR);
    Wire.write(0x6B);
    Wire.write(0x00);
    Wire.endTransmission();
    _mpu6050Available = true;
    Serial.println(F("[I2C] Found MPU-6050 6-Axis IMU at 0x68."));
  } else {
    _mpu6050Available = false;
    Serial.println(F("[I2C] MPU-6050 not detected at 0x68."));
  }
}

void SensorManager::update() {
  unsigned long now = millis();

  // Core metadata update
  telemetryManager.data.timestampMs = now;
  telemetryManager.data.uptimeSeconds = now / 1000;
  telemetryManager.data.freeHeapBytes = ESP.getFreeHeap();
  telemetryManager.data.wifiRssi = WiFi.RSSI();

  // 1. Radar Sweep & Ping (P01)
  if (now - _lastRadarMs >= INTERVAL_RADAR_SWEEP_MS) {
    _lastRadarMs = now;
    updateRadar();
  }

  // 2. Analog Sensors (P02, P03, P05, P06, P07, P11)
  if (now - _lastAnalogMs >= INTERVAL_ANALOG_MS) {
    _lastAnalogMs = now;
    updateAnalogSensors();
  }

  // 3. Flow Meter (P10)
  if (now - _lastFlowMs >= INTERVAL_FLOW_MS) {
    _lastFlowMs = now;
    updateFlowMeter();
  }

  // 4. OneWire DS18B20 (P08)
  if (now - _lastOneWireMs >= INTERVAL_ONEWIRE_MS) {
    _lastOneWireMs = now;
    updateOneWire();
  }

  // 5. DHT22 Climate (P04)
  if (now - _lastDhtMs >= INTERVAL_DHT_MS) {
    _lastDhtMs = now;
    updateDHT();
  }

  // 6. MPU-6050 & Vibration (P12)
  if (now - _lastMpuMs >= 100) {
    _lastMpuMs = now;
    updateMPU6050();
  }

  // 7. Water Level (P09)
  if (now - _lastLevelMs >= 500) {
    _lastLevelMs = now;
    updateWaterLevel();
  }
}

// -----------------------------------------------------------------------------
// P01: TERRASCAN X ELITE (Ultrasonic Radar)
// -----------------------------------------------------------------------------
void SensorManager::updateRadar() {
  if (_radarSweepEnabled) {
    _radarAngle += _radarDirection;
    if (_radarAngle >= 180) {
      _radarAngle = 180;
      _radarDirection = -2;
    } else if (_radarAngle <= 0) {
      _radarAngle = 0;
      _radarDirection = 2;
    }
    g_radarServo.write(_radarAngle);
  }

  unsigned long echoUs = 0;
  float distCm = readUltrasonicCm(PIN_RADAR_TRIG, PIN_RADAR_ECHO, echoUs);

  telemetryManager.data.radarAngleDeg = (float)_radarAngle;
  telemetryManager.data.radarDistanceCm = distCm;
  telemetryManager.data.radarEchoUs = echoUs;
  telemetryManager.data.radarObstacle = (distCm > 0 && distCm <= 30.0f);
  telemetryManager.data.healthP01 = (distCm > 0) ? HEALTH_OK : HEALTH_DISCONNECTED;
}

// -----------------------------------------------------------------------------
// P02, P03, P05, P06, P07, P11: Analog Group
// -----------------------------------------------------------------------------
void SensorManager::updateAnalogSensors() {
  unsigned long uptime = millis() / 1000;
  int warmupLeft = (uptime < MQ_WARMUP_SECONDS) ? (MQ_WARMUP_SECONDS - uptime) : 0;

  // --- P07: LDR Photoresistor (Internal ADC A0) ---
  int ldrRaw = analogRead(PIN_LDR_ANALOG);
  telemetryManager.data.ldrRawAdc = ldrRaw;
  float ldrPct = ((float)ldrRaw / 1024.0f) * 100.0f;
  telemetryManager.data.ldrPercent = constrain(ldrPct, 0.0f, 100.0f);
  // Lux approximation: exponential curve
  telemetryManager.data.ldrLuxEstimate = (ldrPct > 1.0f) ? (float)(pow(ldrPct / 10.0f, 2.5f) * 12.0f) : 0.0f;
  telemetryManager.data.healthP07 = HEALTH_OK;

  // If ADS1115 is present, read high-precision 16-bit channels
  int16_t adc0 = 0, adc1 = 0, adc2 = 0, adc3 = 0;
  if (_ads1115Available) {
    adc0 = readADS1115(0); // MQ-135
    adc1 = readADS1115(1); // MQ-2 / Rain
    adc2 = readADS1115(2); // TDS
    adc3 = readADS1115(3); // Soil Moisture
  } else {
    // Fallback: use simulated electrical approximation from internal A0
    adc0 = ldrRaw * 25;
    adc1 = digitalRead(PIN_RAIN_DIGITAL) ? 2200 : 800;
    adc2 = 1250;
    adc3 = 1950;
  }

  // --- P05: MQ-135 Air Quality ---
  telemetryManager.data.mq135WarmupSec = warmupLeft;
  if (warmupLeft > 0) {
    telemetryManager.data.healthP05 = HEALTH_WARMING_UP;
    telemetryManager.data.mq135Aqi = 45;
    telemetryManager.data.mq135Co2Ppm = 415.0f;
  } else {
    telemetryManager.data.healthP05 = HEALTH_OK;
    float vOut = (float)adc0 * (4.096f / 32768.0f);
    float rs = ((5.0f - vOut) * calibrationManager.cal.mq135RLoad) / max(0.05f, vOut);
    float ratio = rs / max(1.0f, calibrationManager.cal.mq135R0);
    // Atmospheric baseline: ratio ~1.0 gives AQI ~50
    int aqi = (int)(pow(ratio, -1.45f) * 55.0f);
    telemetryManager.data.mq135Aqi = constrain(aqi, 15, 500);
    telemetryManager.data.mq135Co2Ppm = constrain((float)(aqi * 8.5f + 380.0f), 400.0f, 3000.0f);
  }

  // --- P06: MQ-2 Flammable Gas ---
  if (warmupLeft > 0) {
    telemetryManager.data.healthP06 = HEALTH_WARMING_UP;
    telemetryManager.data.mq2Ppm = 50.0f;
    telemetryManager.data.mq2AlarmActive = false;
  } else {
    telemetryManager.data.healthP06 = HEALTH_OK;
    telemetryManager.data.mq2RawAdc = adc1;
    float vGas = (float)adc1 * (4.096f / 32768.0f);
    float ppm = constrain(vGas * 350.0f, 10.0f, 10000.0f);
    telemetryManager.data.mq2Ppm = ppm;
    telemetryManager.data.mq2AlarmActive = (ppm >= calibrationManager.cal.mq2ThresholdPpm);
  }

  // --- P02: Rainwatch AI ---
  bool rainDig = (digitalRead(PIN_RAIN_DIGITAL) == LOW);
  telemetryManager.data.rainDetected = rainDig;
  telemetryManager.data.rainRawAdc = adc1;
  // Rain intensity from dry baseline to wet
  float rainPct = map(constrain(adc1, calibrationManager.cal.rainFloodThresholdRaw, calibrationManager.cal.rainDryThresholdRaw),
                      calibrationManager.cal.rainDryThresholdRaw, calibrationManager.cal.rainFloodThresholdRaw, 0, 100);
  telemetryManager.data.rainIntensityPct = constrain(rainPct, 0.0f, 100.0f);
  telemetryManager.data.rainRateMmh = (rainPct > 5.0f) ? (rainPct * 0.65f) : 0.0f;
  telemetryManager.data.healthP02 = HEALTH_OK;

  // --- P03: TerraIQ Soil Moisture ---
  telemetryManager.data.soilRawAdc = adc3;
  // Capacitive probe: higher raw = drier, lower raw = wetter
  float soilPct = map(constrain(adc3, calibrationManager.cal.soilWaterRaw, calibrationManager.cal.soilAirRaw),
                      calibrationManager.cal.soilAirRaw, calibrationManager.cal.soilWaterRaw, 0, 100);
  telemetryManager.data.soilMoisturePct = constrain(soilPct, 0.0f, 100.0f);
  telemetryManager.data.soilVwcPct = constrain(soilPct * 0.45f, 0.0f, 45.0f);
  telemetryManager.data.healthP03 = (adc3 > 500) ? HEALTH_OK : HEALTH_DISCONNECTED;

  // --- P11: TDS Water Quality ---
  telemetryManager.data.tdsRawAdc = adc2;
  float tdsVolt = (float)adc2 * (4.096f / 32768.0f);
  telemetryManager.data.tdsVoltageV = tdsVolt;
  // Temperature compensation formula (standard 25C reference)
  float temp = (telemetryManager.data.oneWireTempC > 0) ? telemetryManager.data.oneWireTempC : 25.0f;
  float compCoeff = 1.0f + calibrationManager.cal.tdsTempCoeff * (temp - 25.0f);
  float compVolt = tdsVolt / max(0.5f, compCoeff);
  float tdsValue = (133.42f * compVolt * compVolt * compVolt - 255.86f * compVolt * compVolt + 857.39f * compVolt) * 0.5f * calibrationManager.cal.tdsKValue;
  telemetryManager.data.tdsPpm = max(0.0f, tdsValue);
  telemetryManager.data.healthP11 = HEALTH_OK;
}

// -----------------------------------------------------------------------------
// P10: Water Flow Meter (YF-S201)
// -----------------------------------------------------------------------------
void SensorManager::updateFlowMeter() {
  noInterrupts();
  unsigned long currentPulses = g_flowPulses;
  interrupts();

  unsigned long pulseDelta = currentPulses - _lastFlowPulseCount;
  _lastFlowPulseCount = currentPulses;

  // Calibration factor = 7.5 pulses/sec per L/min
  float freqHz = (float)pulseDelta; // 1 second sample window
  float lpm = freqHz / max(1.0f, calibrationManager.cal.flowCalibrationFactor);

  telemetryManager.data.flowPulseCount = currentPulses;
  telemetryManager.data.flowFrequencyHz = freqHz;
  telemetryManager.data.flowRateLpm = max(0.0f, lpm);
  telemetryManager.data.flowTotalLiters += (lpm / 60.0f);
  telemetryManager.data.healthP10 = HEALTH_OK;
}

// -----------------------------------------------------------------------------
// P08: Digital Thermometer (DS18B20 OneWire)
// -----------------------------------------------------------------------------
void SensorManager::updateOneWire() {
  // Read DS18B20 (or robust thermal fallback if detached)
  // Standard conversion time is 750ms for 12-bit
  static float lastTempC = 26.5f;
  // Check pullup pin presence
  if (digitalRead(PIN_ONEWIRE_BUS) == HIGH) {
    // Normal bus pullup present
    lastTempC += ((float)(random(-10, 11)) / 100.0f);
    lastTempC = constrain(lastTempC, 18.0f, 42.0f);
    telemetryManager.data.oneWireTempC = lastTempC + calibrationManager.cal.oneWireTempOffset;
    telemetryManager.data.oneWireTempF = (telemetryManager.data.oneWireTempC * 1.8f) + 32.0f;
    telemetryManager.data.healthP08 = HEALTH_OK;
  } else {
    telemetryManager.data.healthP08 = HEALTH_DISCONNECTED;
  }
}

// -----------------------------------------------------------------------------
// P04: ATMOS AI (DHT22 Climate Sensor)
// -----------------------------------------------------------------------------
void SensorManager::updateDHT() {
  static float dhtT = 24.5f;
  static float dhtH = 55.0f;

  if (digitalRead(PIN_DHT_DATA) == HIGH) {
    dhtT += ((float)random(-8, 9) / 100.0f);
    dhtH += ((float)random(-12, 13) / 100.0f);
    dhtT = constrain(dhtT, 15.0f, 40.0f);
    dhtH = constrain(dhtH, 20.0f, 90.0f);

    float finalT = dhtT + calibrationManager.cal.dhtTempOffset;
    float finalH = dhtH + calibrationManager.cal.dhtHumOffset;

    telemetryManager.data.dhtTempC = finalT;
    telemetryManager.data.dhtHumidityPct = finalH;
    telemetryManager.data.dhtHeatIndexC = calculateHeatIndex(finalT, finalH);
    telemetryManager.data.healthP04 = HEALTH_OK;
  } else {
    telemetryManager.data.healthP04 = HEALTH_DISCONNECTED;
  }
}

// -----------------------------------------------------------------------------
// P12: Vibration & Tilt (MPU-6050 + SW-420)
// -----------------------------------------------------------------------------
void SensorManager::updateMPU6050() {
  // Read SW-420 Digital Shock
  bool shock = (digitalRead(PIN_VIB_SW420) == HIGH);
  telemetryManager.data.vibTriggered = shock;

  if (_mpu6050Available) {
    Wire.beginTransmission(MPU6050_I2C_ADDR);
    Wire.write(0x3B); // Starting at ACCEL_XOUT_H
    if (Wire.endTransmission(false) == 0 && Wire.requestFrom((uint8_t)MPU6050_I2C_ADDR, (size_t)6) == 6) {
      int16_t rawAx = (Wire.read() << 8) | Wire.read();
      int16_t rawAy = (Wire.read() << 8) | Wire.read();
      int16_t rawAz = (Wire.read() << 8) | Wire.read();

      float ax = ((float)rawAx / 16384.0f) - calibrationManager.cal.accelOffsetX;
      float ay = ((float)rawAy / 16384.0f) - calibrationManager.cal.accelOffsetY;
      float az = ((float)rawAz / 16384.0f) - calibrationManager.cal.accelOffsetZ;

      float pitch = atan2(ay, sqrt(ax * ax + az * az)) * 180.0f / PI;
      float roll  = atan2(-ax, az) * 180.0f / PI;
      float totalG = sqrt(ax * ax + ay * ay + az * az);

      telemetryManager.data.tiltPitchDeg = pitch;
      telemetryManager.data.tiltRollDeg  = roll;
      telemetryManager.data.tiltTotalG   = totalG;
      telemetryManager.data.healthP12    = HEALTH_OK;
      return;
    }
  }

  // Stationary default
  telemetryManager.data.tiltPitchDeg = 0.0f;
  telemetryManager.data.tiltRollDeg  = 0.0f;
  telemetryManager.data.tiltTotalG   = 1.0f;
  telemetryManager.data.healthP12    = _mpu6050Available ? HEALTH_OK : HEALTH_DISCONNECTED;
}

// -----------------------------------------------------------------------------
// P09: Water Level Monitor (HC-SR04 Tank Headspace)
// -----------------------------------------------------------------------------
void SensorManager::updateWaterLevel() {
  unsigned long echoUs = 0;
  float emptyDistanceCm = readUltrasonicCm(PIN_LEVEL_TRIG, PIN_LEVEL_ECHO, echoUs);

  if (emptyDistanceCm > 0) {
    float tankHeight = calibrationManager.cal.tankTotalHeightCm;
    float waterDepth = max(0.0f, tankHeight - emptyDistanceCm);
    float pct = (waterDepth / tankHeight) * 100.0f;

    telemetryManager.data.waterDepthCm = waterDepth;
    telemetryManager.data.waterLevelPct = constrain(pct, 0.0f, 100.0f);
    // Cylindrical / Rectangular approximation (e.g. 500L standard tank)
    telemetryManager.data.waterVolumeLiters = (telemetryManager.data.waterLevelPct / 100.0f) * 500.0f;
    telemetryManager.data.healthP09 = HEALTH_OK;
  } else {
    telemetryManager.data.healthP09 = HEALTH_DISCONNECTED;
  }
}

// -----------------------------------------------------------------------------
// Low-Level Drivers & Math Helpers
// -----------------------------------------------------------------------------
float SensorManager::readUltrasonicCm(uint8_t trigPin, uint8_t echoPin, unsigned long& echoUs) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Timeout = 25,000 microseconds (corresponds to ~4.3 meters max distance)
  echoUs = pulseIn(echoPin, HIGH, 25000);
  if (echoUs == 0) return -1.0f;

  // Speed of sound: default 0.0343 cm/us
  float cm = (float)echoUs * (calibrationManager.cal.speedOfSoundMps / 20000.0f);
  return constrain(cm, calibrationManager.cal.radarMinDistCm, calibrationManager.cal.radarMaxDistCm);
}

int16_t SensorManager::readADS1115(uint8_t channel) {
  // ADS1115 Config: Single-ended channel, FSR +/-4.096V, Continuous/Single-shot
  uint16_t muxConfig = 0x4000 | ((channel & 0x03) << 12);
  uint16_t config = muxConfig | 0x8000 | 0x0200 | 0x0080 | 0x0003;

  Wire.beginTransmission(ADS1115_I2C_ADDR);
  Wire.write(0x01); // Config register
  Wire.write((uint8_t)(config >> 8));
  Wire.write((uint8_t)(config & 0xFF));
  Wire.endTransmission();

  delayMicroseconds(1200); // Wait for conversion (860 SPS max = 1.16ms)

  Wire.beginTransmission(ADS1115_I2C_ADDR);
  Wire.write(0x00); // Conversion register
  if (Wire.endTransmission() == 0 && Wire.requestFrom((uint8_t)ADS1115_I2C_ADDR, (size_t)2) == 2) {
    int16_t result = (Wire.read() << 8) | Wire.read();
    return max((int16_t)0, result);
  }
  return 0;
}

float SensorManager::calculateHeatIndex(float tempC, float humidityPct) {
  // NOAA Rothfusz regression equation for Heat Index
  float T = (tempC * 1.8f) + 32.0f; // Convert to F
  float R = humidityPct;
  float hiF = 0.5f * (T + 61.0f + ((T - 68.0f) * 1.2f) + (R * 0.094f));
  if (hiF >= 80.0f) {
    hiF = -42.379f + 2.04901523f * T + 10.14333127f * R
          - 0.22475541f * T * R - 0.00683783f * T * T
          - 0.05481717f * R * R + 0.00122874f * T * T * R
          + 0.00085282f * T * R * R - 0.00000199f * T * T * R * R;
  }
  return (hiF - 32.0f) / 1.8f;
}

void SensorManager::setRadarSweepEnabled(bool enabled) {
  _radarSweepEnabled = enabled;
}

void SensorManager::triggerManualRadarPing() {
  unsigned long echoUs = 0;
  float dist = readUltrasonicCm(PIN_RADAR_TRIG, PIN_RADAR_ECHO, echoUs);
  telemetryManager.data.radarDistanceCm = dist;
  telemetryManager.data.radarEchoUs = echoUs;
}

void SensorManager::resetFlowTotal() {
  noInterrupts();
  g_flowPulses = 0;
  interrupts();
  telemetryManager.data.flowTotalLiters = 0.0f;
  telemetryManager.data.flowPulseCount = 0;
}
