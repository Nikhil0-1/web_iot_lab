#include "telemetry.h"
#include "config.h"

TelemetryManager telemetryManager;

TelemetryManager::TelemetryManager() {
  init();
}

void TelemetryManager::init() {
  memset(&data, 0, sizeof(Device2Telemetry));
}

void TelemetryManager::serializeAll(JsonObject& root) const {
  unsigned long now = millis();
  root["deviceId"]       = DEVICE_ID;
  root["deviceType"]     = DEVICE_TYPE;
  root["firmwareVersion"] = FIRMWARE_VERSION;
  root["timestamp"]      = now;
  root["uptime"]         = now / 1000;
  root["freeHeap"]       = ESP.getFreeHeap();
  root["rssi"]           = WiFi.RSSI();

  // Safety Status
  JsonObject safety = root.createNestedObject("safety");
  safety["state"]       = safetyManager.getStateString();
  safety["estopActive"] = safetyManager.isEStopActive();
  safety["reason"]      = safetyManager.getEStopReason();
  safety["watchdogAlive"] = safetyManager.isHeartbeatAlive();

  JsonObject projects = root.createNestedObject("projects");

  // P13: Automatic Plant Watering
  JsonObject p13 = projects.createNestedObject("13-automatic-plant-watering");
  p13["pump"]            = actuatorManager.state.relayState[RELAY_CH_PLANT_PUMP];
  p13["moistureRaw"]     = actuatorManager.state.localAnalogRaw;
  p13["status"]          = actuatorManager.state.relayState[RELAY_CH_PLANT_PUMP] ? "WATERING" : "IDLE";

  // P14: Smart Water Tank Controller
  JsonObject p14 = projects.createNestedObject("14-smart-water-tank-controller");
  p14["pump"]            = actuatorManager.state.relayState[RELAY_CH_TANK_PUMP];
  p14["status"]          = actuatorManager.state.relayState[RELAY_CH_TANK_PUMP] ? "FILLING" : "STANDBY";

  // P15: Smart Street Light
  JsonObject p15 = projects.createNestedObject("15-smart-street-light");
  p15["pwmDuty"]         = actuatorManager.state.streetLightPwm;
  p15["brightnessPct"]   = ((float)actuatorManager.state.streetLightPwm / 1023.0f) * 100.0f;
  p15["status"]          = (actuatorManager.state.streetLightPwm > 0) ? "ILLUMINATED" : "DARK";

  // P16: Wi-Fi Home Automation
  JsonObject p16 = projects.createNestedObject("16-wifi-home-automation");
  p16["living"]          = actuatorManager.state.relayState[RELAY_CH_HOME_LIVING];
  p16["kitchen"]         = actuatorManager.state.relayState[RELAY_CH_HOME_KITCHEN];
  p16["bedroom"]         = actuatorManager.state.relayState[RELAY_CH_HOME_BEDROOM];
  p16["appliance"]       = actuatorManager.state.relayState[RELAY_CH_HOME_APPLIANCE];

  // P17: Fan Speed Controller
  JsonObject p17 = projects.createNestedObject("17-fan-speed-controller");
  p17["pwmDuty"]         = actuatorManager.state.fanPwmDuty;
  p17["rpm"]             = actuatorManager.state.fanRpmEstimate;
  p17["speedPct"]        = ((float)actuatorManager.state.fanPwmDuty / 1023.0f) * 100.0f;

  // P18: Smart Exhaust Fan
  JsonObject p18 = projects.createNestedObject("18-smart-exhaust-fan");
  p18["fanActive"]       = actuatorManager.state.relayState[RELAY_CH_EXHAUST_FAN];
  p18["status"]          = actuatorManager.state.relayState[RELAY_CH_EXHAUST_FAN] ? "VENTILATING" : "OFF";

  // P19: Automatic Door Controller
  JsonObject p19 = projects.createNestedObject("19-automatic-door-controller");
  p19["doorOpen"]        = actuatorManager.state.doorOpenState;
  p19["servoAngle"]      = actuatorManager.state.servoAngleDeg;
  p19["proximity"]       = actuatorManager.state.proximityTriggered;

  // P20: Servo Motor Web Control
  JsonObject p20 = projects.createNestedObject("20-servo-motor-web-control");
  p20["currentAngle"]    = actuatorManager.state.servoAngleDeg;

  // P21: DC Motor Control Panel
  JsonObject p21 = projects.createNestedObject("21-dc-motor-control-panel");
  p21["speed"]           = actuatorManager.state.dcMotorSpeed;
  p21["speedPct"]        = ((float)actuatorManager.state.dcMotorSpeed / 1023.0f) * 100.0f;
  p21["direction"]       = (actuatorManager.state.dcMotorDirection > 0) ? "FORWARD" : (actuatorManager.state.dcMotorDirection < 0 ? "REVERSE" : "STOPPED");

  // P22: Stepper Motor Controller
  JsonObject p22 = projects.createNestedObject("22-stepper-motor-controller");
  p22["currentPos"]      = actuatorManager.state.stepperCurrentPos;
  p22["targetPos"]       = actuatorManager.state.stepperTargetPos;
  p22["enabled"]         = actuatorManager.state.stepperEnabled;

  // P23: Relay Control Dashboard
  JsonObject p23 = projects.createNestedObject("23-relay-control-dashboard");
  JsonArray relays = p23.createNestedArray("relays");
  int activeCount = 0;
  for (int i = 0; i < 8; i++) {
    relays.add(actuatorManager.state.relayState[i]);
    if (actuatorManager.state.relayState[i]) activeCount++;
  }
  p23["activeCount"]     = activeCount;

  // P24: Smart Greenhouse Automation
  JsonObject p24 = projects.createNestedObject("24-smart-greenhouse-automation");
  p24["mistingPump"]     = actuatorManager.state.relayState[RELAY_CH_GREENHOUSE_MIST];
  p24["circulationFan"]  = actuatorManager.state.relayState[RELAY_CH_EXHAUST_FAN];
  p24["ventAngle"]       = actuatorManager.state.servoAngleDeg;
}

void TelemetryManager::serializeProject(int pNum, JsonObject& root) const {
  root["deviceId"]  = DEVICE_ID;
  root["timestamp"] = millis();

  switch (pNum) {
    case 13:
      root["projectId"] = "13-automatic-plant-watering";
      root["pump"]      = actuatorManager.state.relayState[RELAY_CH_PLANT_PUMP];
      root["moisture"]  = map(constrain(actuatorManager.state.localAnalogRaw, 250, 950), 950, 250, 0, 100);
      root["status"]    = actuatorManager.state.relayState[RELAY_CH_PLANT_PUMP] ? "PUMP_ON" : "STANDBY";
      break;

    case 14:
      root["projectId"] = "14-smart-water-tank-controller";
      root["pump"]      = actuatorManager.state.relayState[RELAY_CH_TANK_PUMP];
      root["status"]    = actuatorManager.state.relayState[RELAY_CH_TANK_PUMP] ? "FILLING" : "FULL";
      break;

    case 15:
      root["projectId"] = "15-smart-street-light";
      root["brightness"] = ((float)actuatorManager.state.streetLightPwm / 1023.0f) * 100.0f;
      root["pwm"]       = actuatorManager.state.streetLightPwm;
      root["status"]    = (actuatorManager.state.streetLightPwm > 0) ? "ON" : "OFF";
      break;

    case 16:
      root["projectId"] = "16-wifi-home-automation";
      root["relay1"]    = actuatorManager.state.relayState[RELAY_CH_HOME_LIVING];
      root["relay2"]    = actuatorManager.state.relayState[RELAY_CH_HOME_KITCHEN];
      root["relay3"]    = actuatorManager.state.relayState[RELAY_CH_HOME_BEDROOM];
      root["relay4"]    = actuatorManager.state.relayState[RELAY_CH_HOME_APPLIANCE];
      break;

    case 17:
      root["projectId"] = "17-fan-speed-controller";
      root["pwm"]       = actuatorManager.state.fanPwmDuty;
      root["rpm"]       = actuatorManager.state.fanRpmEstimate;
      break;

    case 18:
      root["projectId"] = "18-smart-exhaust-fan";
      root["fan"]       = actuatorManager.state.relayState[RELAY_CH_EXHAUST_FAN];
      break;

    case 19:
      root["projectId"] = "19-automatic-door-controller";
      root["doorOpen"]  = actuatorManager.state.doorOpenState;
      root["servoAngle"] = actuatorManager.state.servoAngleDeg;
      root["proximity"] = actuatorManager.state.proximityTriggered;
      break;

    case 20:
      root["projectId"] = "20-servo-motor-web-control";
      root["angle"]     = actuatorManager.state.servoAngleDeg;
      break;

    case 21:
      root["projectId"] = "21-dc-motor-control-panel";
      root["speed"]     = actuatorManager.state.dcMotorSpeed;
      root["direction"] = actuatorManager.state.dcMotorDirection;
      break;

    case 22:
      root["projectId"] = "22-stepper-motor-controller";
      root["position"]  = actuatorManager.state.stepperCurrentPos;
      root["enabled"]   = actuatorManager.state.stepperEnabled;
      break;

    case 23:
      root["projectId"] = "23-relay-control-dashboard";
      for (int i = 0; i < 8; i++) {
        char key[12];
        snprintf(key, sizeof(key), "relay%d", i + 1);
        root[key] = actuatorManager.state.relayState[i];
      }
      break;

    case 24:
      root["projectId"] = "24-smart-greenhouse-automation";
      root["misting"]   = actuatorManager.state.relayState[RELAY_CH_GREENHOUSE_MIST];
      root["ventAngle"] = actuatorManager.state.servoAngleDeg;
      break;

    default:
      root["error"] = "Invalid project index";
      break;
  }
}

void TelemetryManager::serializeActuatorsStatus(JsonArray& array) const {
  const struct { int pId; const char* name; const char* type; } actList[] = {
    { 13, "Plant Watering Pump", "Relay (CH0)" },
    { 14, "Tank Inflow Pump", "Relay (CH1)" },
    { 15, "Street Light PWM", "N-MOSFET (D5)" },
    { 16, "4-Ch Home Relays", "Relays (CH2-5)" },
    { 17, "Fan Speed MOSFET", "PWM (D5)" },
    { 18, "Exhaust Fan Relay", "Relay (CH6)" },
    { 19, "Door Servo Actuator", "Servo (D8)" },
    { 20, "Precision Servo", "Servo (D8)" },
    { 21, "DC Motor H-Bridge", "L298N (D5/D6/D7)" },
    { 22, "Stepper Driver", "A4988 (D0/D6/D7)" },
    { 23, "8-Ch Relay Bank", "PCF8574 I2C" },
    { 24, "Greenhouse Vent/Mist", "Hybrid Actuator" }
  };

  for (size_t i = 0; i < 12; i++) {
    JsonObject obj = array.createNestedObject();
    obj["project"]   = actList[i].pId;
    obj["actuator"]  = actList[i].name;
    obj["interface"] = actList[i].type;
    obj["safe"]      = !safetyManager.isEStopActive();
  }
}
