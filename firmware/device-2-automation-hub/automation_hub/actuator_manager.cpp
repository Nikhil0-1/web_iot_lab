#include "actuator_manager.h"
#include <Wire.h>
#include <Servo.h>

ActuatorManager actuatorManager;
static Servo g_actuatorServo;

// Fan Tachometer Pulse Counter
static volatile unsigned long g_tachPulses = 0;
void IRAM_ATTR onFanTachInterrupt() {
  g_tachPulses++;
}

ActuatorManager::ActuatorManager()
  : _pcf8574Available(false),
    _pcf8574OutputByte(0xFF), // All bits HIGH = All relays DE-ENERGIZED (active LOW)
    _lastFeedbackMs(0),
    _lastTachPulseCount(0)
{
  memset(&state, 0, sizeof(ActuatorState));
  state.dcMotorSpeed = 0;
  state.fanPwmDuty = 0;
  state.servoAngleDeg = 90;
  state.stepperEnabled = true;
}

void ActuatorManager::begin() {
  initPins();
  initI2C();

  // Attach Servo
  g_actuatorServo.attach(PIN_SERVO_PWM);
  g_actuatorServo.write(state.servoAngleDeg);

  // Set initial safe state (all relays OFF)
  allRelaysOff();

  Serial.println(F("[ACTUATOR] Actuator controller online. All channels in SAFE OFF state."));
}

void ActuatorManager::initPins() {
  // PWM Hardware Output
  analogWriteFreq(1000); // 1 kHz PWM
  analogWriteRange(1023); // 10-bit resolution
  pinMode(PIN_ACTUATOR_PWM, OUTPUT);
  analogWrite(PIN_ACTUATOR_PWM, 0);

  // Motor direction and stepper controls
  pinMode(PIN_MOTOR_IN1_STEP, OUTPUT);
  pinMode(PIN_MOTOR_IN2_DIR, OUTPUT);
  pinMode(PIN_STEPPER_ENABLE, OUTPUT);
  digitalWrite(PIN_MOTOR_IN1_STEP, LOW);
  digitalWrite(PIN_MOTOR_IN2_DIR, LOW);
  digitalWrite(PIN_STEPPER_ENABLE, HIGH); // Disabled

  // Sensor feedback inputs
  pinMode(PIN_DOOR_PROXIMITY, INPUT_PULLUP);
  pinMode(PIN_FAN_TACH_PULSE, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_FAN_TACH_PULSE), onFanTachInterrupt, FALLING);
}

void ActuatorManager::initI2C() {
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  Wire.setClock(100000);

  // Probe PCF8574 on 0x27 or alternate 0x20
  Wire.beginTransmission(PCF8574_I2C_ADDR);
  if (Wire.endTransmission() == 0) {
    _pcf8574Available = true;
    Serial.println(F("[I2C] PCF8574 8-Channel Relay Driver found at 0x27."));
  } else {
    // Try alternate address 0x20
    Wire.beginTransmission(0x20);
    if (Wire.endTransmission() == 0) {
      _pcf8574Available = true;
      Serial.println(F("[I2C] PCF8574 8-Channel Relay Driver found at 0x20."));
    } else {
      _pcf8574Available = false;
      Serial.println(F("[I2C] PCF8574 not detected. Using direct GPIO relay fallback."));
    }
  }
}

void ActuatorManager::writePcf8574(uint8_t data) {
  _pcf8574OutputByte = data;
  if (_pcf8574Available) {
    Wire.beginTransmission(PCF8574_I2C_ADDR);
    Wire.write(data);
    Wire.endTransmission();
  }
}

bool ActuatorManager::setRelay(uint8_t channel, bool active) {
  if (channel >= 8) return false;

  // Interlock: If emergency stop is active, reject activating any relay
  if (active && safetyManager.isEStopActive()) {
    Serial.println(F("[ACTUATOR] Blocked relay activation: Emergency Stop is active!"));
    return false;
  }

  // Interlock: Pump run-time safety check (channels 0 & 1)
  if ((channel == RELAY_CH_PLANT_PUMP || channel == RELAY_CH_TANK_PUMP) && active) {
    if (!safetyManager.isPumpRunAllowed(channel)) {
      Serial.println(F("[ACTUATOR] Blocked pump start: Run-time limit or cooldown in effect."));
      return false;
    }
    safetyManager.notifyPumpStarted(channel);
  } else if ((channel == RELAY_CH_PLANT_PUMP || channel == RELAY_CH_TANK_PUMP) && !active) {
    safetyManager.notifyPumpStopped(channel);
  }

  state.relayState[channel] = active;

  // Active-LOW relay logic: 0 = Energized, 1 = De-energized
  if (active) {
    _pcf8574OutputByte &= ~(1 << channel); // Clear bit to pull LOW
  } else {
    _pcf8574OutputByte |= (1 << channel);  // Set bit to pull HIGH
  }

  writePcf8574(_pcf8574OutputByte);
  return true;
}

bool ActuatorManager::getRelay(uint8_t channel) const {
  if (channel >= 8) return false;
  return state.relayState[channel];
}

void ActuatorManager::allRelaysOff() {
  for (int i = 0; i < 8; i++) {
    state.relayState[i] = false;
  }
  _pcf8574OutputByte = 0xFF; // All HIGH = all de-energized
  writePcf8574(_pcf8574OutputByte);
}

bool ActuatorManager::setDcMotor(int speed, int direction) {
  if (safetyManager.isEStopActive() && speed > 0) {
    return false;
  }

  int clampedSpeed = constrain(speed, 0, 1023);
  state.dcMotorSpeed = clampedSpeed;
  state.dcMotorDirection = direction;

  if (clampedSpeed == 0 || direction == 0) {
    digitalWrite(PIN_MOTOR_IN1_STEP, LOW);
    digitalWrite(PIN_MOTOR_IN2_DIR, LOW);
    analogWrite(PIN_ACTUATOR_PWM, 0);
  } else if (direction > 0) {
    // Forward
    digitalWrite(PIN_MOTOR_IN1_STEP, HIGH);
    digitalWrite(PIN_MOTOR_IN2_DIR, LOW);
    analogWrite(PIN_ACTUATOR_PWM, clampedSpeed);
  } else {
    // Reverse
    digitalWrite(PIN_MOTOR_IN1_STEP, LOW);
    digitalWrite(PIN_MOTOR_IN2_DIR, HIGH);
    analogWrite(PIN_ACTUATOR_PWM, clampedSpeed);
  }
  return true;
}

bool ActuatorManager::setFanSpeedPwm(int pwmDuty) {
  if (safetyManager.isEStopActive() && pwmDuty > 0) return false;

  int duty = constrain(pwmDuty, 0, 1023);
  state.fanPwmDuty = duty;
  analogWrite(PIN_ACTUATOR_PWM, duty);
  return true;
}

bool ActuatorManager::setStreetLightPwm(int pwmDuty) {
  if (safetyManager.isEStopActive() && pwmDuty > 0) return false;

  int duty = constrain(pwmDuty, 0, 1023);
  state.streetLightPwm = duty;
  analogWrite(PIN_ACTUATOR_PWM, duty);
  return true;
}

bool ActuatorManager::setServoAngle(int angleDeg) {
  if (!safetyManager.validateServoAngle(angleDeg)) return false;

  int angle = constrain(angleDeg, 0, 180);
  state.servoAngleDeg = angle;
  g_actuatorServo.write(angle);
  return true;
}

bool ActuatorManager::setDoorState(bool open) {
  state.doorOpenState = open;
  int targetAngle = open ? 90 : 0;
  return setServoAngle(targetAngle);
}

bool ActuatorManager::moveStepper(int steps, int speedDelayUs) {
  if (safetyManager.isEStopActive()) return false;
  if (!safetyManager.validateStepperSteps(steps)) return false;

  // Direction: positive = clockwise, negative = counter-clockwise
  bool dir = (steps >= 0);
  int count = abs(steps);

  digitalWrite(PIN_STEPPER_ENABLE, LOW); // Enable driver (active LOW)
  digitalWrite(PIN_MOTOR_IN2_DIR, dir ? HIGH : LOW);
  delayMicroseconds(5);

  int delayTime = max(300, speedDelayUs);
  for (int i = 0; i < count; i++) {
    digitalWrite(PIN_MOTOR_IN1_STEP, HIGH);
    delayMicroseconds(delayTime);
    digitalWrite(PIN_MOTOR_IN1_STEP, LOW);
    delayMicroseconds(delayTime);

    // Yield to keep ESP8266 Wi-Fi stack fed during long steps
    if ((i % 100) == 0) {
      yield();
    }
  }

  state.stepperCurrentPos += steps;
  digitalWrite(PIN_STEPPER_ENABLE, HIGH); // Auto-sleep driver to prevent coil heating
  return true;
}

void ActuatorManager::emergencyAllStop() {
  allRelaysOff();
  setDcMotor(0, 0);
  setFanSpeedPwm(0);
  digitalWrite(PIN_STEPPER_ENABLE, HIGH); // Disable stepper
  analogWrite(PIN_ACTUATOR_PWM, 0);
  Serial.println(F("[ACTUATOR] Emergency all-stop executed! All outputs cut."));
}

void ActuatorManager::update() {
  // If safety watchdog tripped or E-Stop active, enforce shutdown
  if (safetyManager.isEStopActive()) {
    if (state.dcMotorSpeed > 0 || state.fanPwmDuty > 0) {
      emergencyAllStop();
    }
    return;
  }

  unsigned long now = millis();
  if (now - _lastFeedbackMs >= 1000) {
    _lastFeedbackMs = now;

    // Read local sensor feedback
    state.localAnalogRaw = analogRead(PIN_LOCAL_ANALOG);
    state.proximityTriggered = (digitalRead(PIN_DOOR_PROXIMITY) == LOW);

    // Calculate fan RPM from tachometer pulses (1 sec window, 2 pulses per rev)
    noInterrupts();
    unsigned long currentTach = g_tachPulses;
    interrupts();

    unsigned long delta = currentTach - _lastTachPulseCount;
    _lastTachPulseCount = currentTach;

    float rps = (float)delta / 2.0f;
    state.fanRpmEstimate = max(0.0f, rps * 60.0f);
  }
}
