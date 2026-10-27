#ifndef SAFETY_MANAGER_H
#define SAFETY_MANAGER_H

#include <Arduino.h>
#include "config.h"

enum SafetyState {
  SAFETY_NORMAL = 0,
  SAFETY_WATCHDOG_TRIPPED = 1,
  SAFETY_PUMP_OVERRUN = 2,
  SAFETY_THERMAL_CUTOFF = 3,
  SAFETY_EMERGENCY_STOP = 4
};

class SafetyManager {
public:
  SafetyManager();
  void begin();
  void update();

  // Heartbeat & Watchdog
  void registerHeartbeat();
  bool isHeartbeatAlive() const;

  // Pump Run-Time Protection
  void notifyPumpStarted(uint8_t relayChannel);
  void notifyPumpStopped(uint8_t relayChannel);
  bool isPumpRunAllowed(uint8_t relayChannel) const;

  // Emergency Stop
  void triggerEmergencyStop(const char* reason);
  bool clearEmergencyStop();
  bool isEStopActive() const;
  const char* getEStopReason() const;

  // Validation Helpers
  bool validatePwmValue(int value) const;
  bool validateServoAngle(int angle) const;
  bool validateStepperSteps(int steps) const;

  SafetyState getState() const;
  const char* getStateString() const;

private:
  SafetyState _state;
  unsigned long _lastHeartbeatMs;
  char _estopReason[64];

  // Pump Safety Trackers (Plant Pump = index 0, Tank Pump = index 1)
  unsigned long _pumpStartMs[2];
  unsigned long _pumpStopMs[2];
  bool _pumpRunning[2];
};

extern SafetyManager safetyManager;

#endif // SAFETY_MANAGER_H
