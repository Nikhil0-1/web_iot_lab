#ifndef TELEMETRY_H
#define TELEMETRY_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include "actuator_manager.h"
#include "safety_manager.h"

struct Device2Telemetry {
  unsigned long timestampMs;
  unsigned long uptimeSeconds;
  uint32_t freeHeapBytes;
  int8_t wifiRssi;

  // Actuator snapshots
  ActuatorState actuators;
  SafetyState safetyState;
  const char* safetyReason;
};

class TelemetryManager {
public:
  TelemetryManager();
  void init();

  void serializeAll(JsonObject& root) const;
  void serializeProject(int projectNum, JsonObject& root) const;
  void serializeActuatorsStatus(JsonArray& array) const;

  Device2Telemetry data;
};

extern TelemetryManager telemetryManager;

#endif // TELEMETRY_H
