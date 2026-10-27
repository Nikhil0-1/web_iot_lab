#ifndef ACTUATOR_MANAGER_H
#define ACTUATOR_MANAGER_H

#include <Arduino.h>
#include "pin_config.h"
#include "config.h"
#include "safety_manager.h"

struct ActuatorState {
  // Relays (8 Channels)
  bool relayState[8];

  // DC Motor (P21)
  int dcMotorSpeed;         // 0–1023
  int dcMotorDirection;     // 1=Fwd, -1=Rev, 0=Stop

  // Fan Controller (P17)
  int fanPwmDuty;           // 0–1023
  float fanRpmEstimate;     // Telemetry from tachometer

  // Street Light (P15)
  int streetLightPwm;       // 0–1023
  bool streetLightAutoMode;

  // Servo Actuator (P19, P20, P24)
  int servoAngleDeg;        // 0–180
  bool doorOpenState;       // P19 Door: open vs closed

  // Stepper Motor (P22)
  long stepperTargetPos;
  long stepperCurrentPos;
  bool stepperEnabled;

  // Feedback Signals
  int localAnalogRaw;       // A0
  bool proximityTriggered;  // D0
};

class ActuatorManager {
public:
  ActuatorManager();
  void begin();
  void update();

  // Control APIs with safety interlocks
  bool setRelay(uint8_t channel, bool state);
  bool getRelay(uint8_t channel) const;
  void allRelaysOff();

  bool setDcMotor(int speed, int direction);
  bool setFanSpeedPwm(int pwmDuty);
  bool setStreetLightPwm(int pwmDuty);
  bool setServoAngle(int angleDeg);
  bool moveStepper(int steps, int speedDelayUs = 800);
  bool setDoorState(bool open);

  void emergencyAllStop();

  ActuatorState state;

private:
  void initI2C();
  void initPins();
  void writePcf8574(uint8_t data);
  uint8_t readPcf8574();

  bool _pcf8574Available;
  uint8_t _pcf8574OutputByte;
  unsigned long _lastFeedbackMs;
  unsigned long _lastTachPulseCount;
};

extern ActuatorManager actuatorManager;

#endif // ACTUATOR_MANAGER_H
