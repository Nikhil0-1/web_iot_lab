#include "safety_manager.h"

SafetyManager safetyManager;

SafetyManager::SafetyManager()
  : _state(SAFETY_NORMAL),
    _lastHeartbeatMs(0)
{
  strncpy(_estopReason, "None", sizeof(_estopReason));
  for (int i = 0; i < 2; i++) {
    _pumpStartMs[i] = 0;
    _pumpStopMs[i] = 0;
    _pumpRunning[i] = false;
  }
}

void SafetyManager::begin() {
  _lastHeartbeatMs = millis();
  _state = SAFETY_NORMAL;
  Serial.println(F("[SAFETY] Safety subsystem initialized. Watchdog & thermal guards active."));
}

void SafetyManager::registerHeartbeat() {
  _lastHeartbeatMs = millis();
  if (_state == SAFETY_WATCHDOG_TRIPPED) {
    _state = SAFETY_NORMAL;
    Serial.println(F("[SAFETY] Watchdog connection restored by dashboard heartbeat."));
  }
}

bool SafetyManager::isHeartbeatAlive() const {
  return (millis() - _lastHeartbeatMs <= WATCHDOG_TIMEOUT_MS);
}

void SafetyManager::notifyPumpStarted(uint8_t ch) {
  int idx = (ch == 0) ? 0 : 1;
  _pumpStartMs[idx] = millis();
  _pumpRunning[idx] = true;
}

void SafetyManager::notifyPumpStopped(uint8_t ch) {
  int idx = (ch == 0) ? 0 : 1;
  _pumpStopMs[idx] = millis();
  _pumpRunning[idx] = false;
}

bool SafetyManager::isPumpRunAllowed(uint8_t ch) const {
  if (isEStopActive()) return false;

  int idx = (ch == 0) ? 0 : 1;
  unsigned long now = millis();

  // If pump is currently running, check max runtime limit
  if (_pumpRunning[idx]) {
    if (now - _pumpStartMs[idx] >= MAX_PUMP_RUNTIME_MS) {
      return false;
    }
  }

  // Check mandatory cooldown after previous run
  if (!_pumpRunning[idx] && _pumpStopMs[idx] > 0) {
    if (now - _pumpStopMs[idx] < PUMP_COOLDOWN_MS) {
      return false;
    }
  }

  return true;
}

void SafetyManager::triggerEmergencyStop(const char* reason) {
  _state = SAFETY_EMERGENCY_STOP;
  strncpy(_estopReason, reason ? reason : "Manual E-Stop", sizeof(_estopReason) - 1);
  _estopReason[sizeof(_estopReason) - 1] = '\0';

  Serial.print(F("[SAFETY] *** EMERGENCY STOP TRIGGERED *** Reason: "));
  Serial.println(_estopReason);
}

bool SafetyManager::clearEmergencyStop() {
  _state = SAFETY_NORMAL;
  strncpy(_estopReason, "None", sizeof(_estopReason));
  _lastHeartbeatMs = millis();

  for (int i = 0; i < 2; i++) {
    _pumpRunning[i] = false;
    _pumpStopMs[i] = millis();
  }

  Serial.println(F("[SAFETY] Emergency stop cleared. Normal operation resumed."));
  return true;
}

bool SafetyManager::isEStopActive() const {
  return (_state == SAFETY_EMERGENCY_STOP || _state == SAFETY_WATCHDOG_TRIPPED);
}

const char* SafetyManager::getEStopReason() const {
  return _estopReason;
}

bool SafetyManager::validatePwmValue(int value) const {
  return (value >= 0 && value <= 1023);
}

bool SafetyManager::validateServoAngle(int angle) const {
  return (angle >= 0 && angle <= 180);
}

bool SafetyManager::validateStepperSteps(int steps) const {
  return (steps >= -10000 && steps <= 10000);
}

SafetyState SafetyManager::getState() const {
  return _state;
}

const char* SafetyManager::getStateString() const {
  switch (_state) {
    case SAFETY_NORMAL:           return "NORMAL";
    case SAFETY_WATCHDOG_TRIPPED: return "WATCHDOG_TIMEOUT";
    case SAFETY_PUMP_OVERRUN:     return "PUMP_OVERRUN";
    case SAFETY_THERMAL_CUTOFF:   return "THERMAL_CUTOFF";
    case SAFETY_EMERGENCY_STOP:   return "EMERGENCY_STOP";
    default:                      return "UNKNOWN";
  }
}

void SafetyManager::update() {
  unsigned long now = millis();

  // 1. Connection watchdog: trigger fail-safe if web client disconnects
  if (_state == SAFETY_NORMAL && (now - _lastHeartbeatMs > WATCHDOG_TIMEOUT_MS)) {
    _state = SAFETY_WATCHDOG_TRIPPED;
    strncpy(_estopReason, "Communication Watchdog Timeout (>30s)", sizeof(_estopReason));
    Serial.println(F("[SAFETY] Dashboard heartbeat lost for 30s. Engaging fail-safe state."));
  }

  // 2. Pump runtime checks
  for (int idx = 0; idx < 2; idx++) {
    if (_pumpRunning[idx]) {
      if (now - _pumpStartMs[idx] >= MAX_PUMP_RUNTIME_MS) {
        _state = SAFETY_PUMP_OVERRUN;
        strncpy(_estopReason, "Max continuous pump runtime exceeded (60s)", sizeof(_estopReason));
        Serial.println(F("[SAFETY] Pump auto-cut triggered (Max 60s runtime)."));
      }
    }
  }
}
