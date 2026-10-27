#ifndef TELEMETRY_H
#define TELEMETRY_H

#include <Arduino.h>
#include <ArduinoJson.h>

// Sensor Health Enumeration
enum SensorHealth {
  HEALTH_OK = 0,
  HEALTH_WARMING_UP = 1,
  HEALTH_DISCONNECTED = 2,
  HEALTH_OUT_OF_RANGE = 3,
  HEALTH_CALIBRATION_NEEDED = 4
};

// Telemetry state container for all 12 monitoring projects
struct Device1Telemetry {
  // Device Core Metrics
  unsigned long timestampMs;
  unsigned long uptimeSeconds;
  uint32_t freeHeapBytes;
  int8_t wifiRssi;

  // Project 01: TERRASCAN X ELITE (Radar)
  float radarAngleDeg;
  float radarDistanceCm;
  unsigned long radarEchoUs;
  bool radarObstacle;
  SensorHealth healthP01;

  // Project 02: RAINWATCH AI (Rain)
  bool rainDetected;
  float rainIntensityPct;
  int rainRawAdc;
  float rainRateMmh;
  SensorHealth healthP02;

  // Project 03: TerraIQ (Soil Moisture)
  float soilMoisturePct;
  int soilRawAdc;
  float soilVwcPct;
  SensorHealth healthP03;

  // Project 04: ATMOS AI (DHT22 Climate)
  float dhtTempC;
  float dhtHumidityPct;
  float dhtHeatIndexC;
  SensorHealth healthP04;

  // Project 05: Smart Air Quality Monitor (MQ-135)
  int mq135Aqi;
  float mq135Co2Ppm;
  int mq135WarmupSec;
  SensorHealth healthP05;

  // Project 06: Gas Leakage Detector (MQ-2)
  float mq2Ppm;
  int mq2RawAdc;
  bool mq2AlarmActive;
  SensorHealth healthP06;

  // Project 07: LDR Light Intensity
  float ldrPercent;
  int ldrRawAdc;
  float ldrLuxEstimate;
  SensorHealth healthP07;

  // Project 08: Digital Thermometer (DS18B20)
  float oneWireTempC;
  float oneWireTempF;
  SensorHealth healthP08;

  // Project 09: Water Level Monitor
  float waterLevelPct;
  float waterDepthCm;
  float waterVolumeLiters;
  SensorHealth healthP09;

  // Project 10: Water Flow Meter (YF-S201)
  float flowRateLpm;
  float flowTotalLiters;
  unsigned long flowPulseCount;
  float flowFrequencyHz;
  SensorHealth healthP10;

  // Project 11: TDS Water Quality
  float tdsPpm;
  int tdsRawAdc;
  float tdsVoltageV;
  SensorHealth healthP11;

  // Project 12: Vibration & Tilt (MPU-6050 + SW-420)
  float tiltPitchDeg;
  float tiltRollDeg;
  float tiltTotalG;
  bool vibTriggered;
  SensorHealth healthP12;
};

class TelemetryManager {
public:
  TelemetryManager();
  void init();

  // Serialization helpers
  void serializeAll(JsonObject& root) const;
  void serializeProject(int projectNum, JsonObject& root) const;
  void serializeSensorsHealth(JsonArray& array) const;

  const char* healthToString(SensorHealth h) const;

  Device1Telemetry data;
};

extern TelemetryManager telemetryManager;

#endif // TELEMETRY_H
