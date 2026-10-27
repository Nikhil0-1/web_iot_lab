#ifndef CALIBRATION_H
#define CALIBRATION_H

#include <Arduino.h>
#include <ArduinoJson.h>

// Calibration structure holding all user-configurable parameters
struct SensorCalibration {
  // P01: Ultrasonic Radar
  float speedOfSoundMps;        // 343.0 m/s at 20C
  float radarMinDistCm;         // 2.0 cm
  float radarMaxDistCm;         // 400.0 cm

  // P02: Rain Detection
  int rainDryThresholdRaw;      // ADC raw value when dry (e.g. 1000)
  int rainFloodThresholdRaw;    // ADC raw value when submerged (e.g. 200)

  // P03: Soil Moisture
  int soilAirRaw;               // Capacitive probe in air (dry): ~2800 (ADS1115) or 850 (A0)
  int soilWaterRaw;             // Capacitive probe in water (wet): ~1300 (ADS1115) or 380 (A0)

  // P04: DHT22
  float dhtTempOffset;          // +/- Deg C offset
  float dhtHumOffset;           // +/- % Humidity offset

  // P05: MQ-135 Air Quality
  float mq135R0;                // Calibrated clean-air sensor resistance in kOhm
  float mq135RLoad;             // Load resistor in kOhm (typically 20k or 10k)

  // P06: MQ-2 Gas Leakage
  float mq2R0;                  // Calibrated clean-air resistance
  float mq2ThresholdPpm;        // Warning threshold in PPM

  // P07: LDR Light
  float ldrDarkRaw;             // Raw ADC in pitch dark
  float ldrBrightRaw;           // Raw ADC in direct sunlight

  // P08: DS18B20
  float oneWireTempOffset;      // +/- Deg C offset

  // P09: Water Level
  float tankTotalHeightCm;      // Depth of empty tank in cm (sensor to bottom)
  float tankSensorOffsetCm;     // Margin above max water level

  // P10: Water Flow Meter
  float flowCalibrationFactor;  // Pulses per second per L/min (default 7.5 for YF-S201)

  // P11: TDS Water Quality
  float tdsKValue;              // Probe cell constant multiplier (default 1.0)
  float tdsTempCoeff;           // 0.02 (2% per degree C compensation)

  // P12: MPU-6050 Accelerometer offsets
  float accelOffsetX;
  float accelOffsetY;
  float accelOffsetZ;
  float gyroOffsetX;
  float gyroOffsetY;
  float gyroOffsetZ;
};

class CalibrationManager {
public:
  CalibrationManager();
  void begin();
  void resetToDefaults();
  bool load();
  bool save();
  bool updateFromJson(const JsonObject& json);
  void toJson(JsonObject& json) const;

  SensorCalibration cal;

private:
  void applyDefaults();
};

extern CalibrationManager calibrationManager;

#endif // CALIBRATION_H
