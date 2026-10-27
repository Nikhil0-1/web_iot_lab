#ifndef SENSOR_MANAGER_H
#define SENSOR_MANAGER_H

#include <Arduino.h>
#include "pin_config.h"
#include "config.h"
#include "calibration.h"
#include "telemetry.h"

class SensorManager {
public:
  SensorManager();
  void begin();
  void update();

  // Control commands
  void setRadarSweepEnabled(bool enabled);
  void triggerManualRadarPing();
  void resetFlowTotal();

private:
  // Hardware subsystem initializers
  void initI2C();
  void initPins();
  void initFlowInterrupt();
  void initMPU6050();

  // Polling tasks
  void updateRadar();
  void updateAnalogSensors();
  void updateDHT();
  void updateOneWire();
  void updateFlowMeter();
  void updateMPU6050();
  void updateWaterLevel();

  // Low-level helper functions
  float readUltrasonicCm(uint8_t trigPin, uint8_t echoPin, unsigned long& echoUs);
  int16_t readADS1115(uint8_t channel);
  float calculateHeatIndex(float tempC, float humidityPct);
  float calculateMqResistance(int rawAdc, float vRef, float rLoad);
  float calculateMqPpm(float rsRoRatio, float a, float b);

  // Timing tracking
  unsigned long _lastRadarMs;
  unsigned long _lastAnalogMs;
  unsigned long _lastDhtMs;
  unsigned long _lastOneWireMs;
  unsigned long _lastFlowMs;
  unsigned long _lastMpuMs;
  unsigned long _lastLevelMs;
  unsigned long _bootTimeSec;

  // Radar State
  int _radarAngle;
  int _radarDirection; // +1 or -1
  bool _radarSweepEnabled;

  // Flow State
  unsigned long _lastFlowPulseCount;

  // ADS1115 state flag
  bool _ads1115Available;
  bool _mpu6050Available;
};

extern SensorManager sensorManager;

#endif // SENSOR_MANAGER_H
