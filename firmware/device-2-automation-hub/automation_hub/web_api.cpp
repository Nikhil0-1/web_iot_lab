#include "web_api.h"
#include <ArduinoJson.h>

WebApiServer webApiServer;

WebApiServer::WebApiServer() : _server(WEB_SERVER_PORT) {}

void WebApiServer::begin() {
  setupRoutes();
  _server.begin();
  Serial.println(F("[HTTP] Automation Hub Web API online on port 80."));
}

void WebApiServer::update() {
  _server.handleClient();
}

void WebApiServer::sendCorsHeaders() {
  _server.sendHeader(F("Access-Control-Allow-Origin"), F("*"));
  _server.sendHeader(F("Access-Control-Allow-Methods"), F("GET, POST, OPTIONS"));
  _server.sendHeader(F("Access-Control-Allow-Headers"), F("Content-Type, Authorization"));
}

void WebApiServer::handleOptions() {
  sendCorsHeaders();
  _server.send(204);
}

void WebApiServer::setupRoutes() {
  _server.on(F("/"), HTTP_GET, [this]() { handleRoot(); });
  _server.on(F("/api/health"), HTTP_GET, [this]() { handleHealth(); });
  _server.on(F("/api/device"), HTTP_GET, [this]() { handleDevice(); });
  _server.on(F("/api/telemetry"), HTTP_GET, [this]() { handleTelemetry(); });
  _server.on(F("/api/actuators"), HTTP_GET, [this]() { handleActuators(); });
  _server.on(F("/api/readings"), HTTP_GET, [this]() { handleReadings(); });

  _server.on(F("/api/command"), HTTP_POST, [this]() { handleCommand(); });
  _server.on(F("/api/command"), HTTP_OPTIONS, [this]() { handleOptions(); });

  _server.onNotFound([this]() { handleNotFound(); });
}

void WebApiServer::handleRoot() {
  sendCorsHeaders();
  String html = F("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Device 2 — Automation Hub</title>"
                  "<style>body{font-family:sans-serif;padding:24px;background:#f8fafc;color:#0f172a;max-width:700px;margin:auto;}"
                  "h1{color:#2563eb;}a{color:#2563eb;text-decoration:none;}a:hover{text-decoration:underline;}"
                  ".card{background:#fff;padding:16px 20px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:16px;}"
                  "code{background:#e2e8f0;padding:2px 6px;border-radius:4px;font-size:0.9em;}"
                  ".badge{background:#ecfdf5;color:#059669;padding:4px 8px;border-radius:4px;font-weight:bold;font-size:0.85em;}"
                  "</style></head><body>"
                  "<h1>Tech IoT Warriors &middot; Automation Hub (Device 2)</h1>"
                  "<div class='card'>"
                  "<p><strong>Device ID:</strong> esp8266-automation-hub-02</p>"
                  "<p><strong>Safety State:</strong> <span class='badge'>" + String(safetyManager.getStateString()) + "</span></p>"
                  "<p><strong>Network:</strong> " + wifiManager.getModeString() + " &bull; IP: " + wifiManager.getIpAddress() + "</p>"
                  "<p><strong>Supported Projects:</strong> 13 to 24 (Category B: Automation &amp; Actuators)</p>"
                  "</div>"
                  "<div class='card'><h3>Active API Endpoints</h3><ul>"
                  "<li><a href='/api/health'><code>/api/health</code></a> &mdash; Liveness &amp; safety watchdog state</li>"
                  "<li><a href='/api/device'><code>/api/device</code></a> &mdash; Hardware metadata</li>"
                  "<li><a href='/api/telemetry'><code>/api/telemetry</code></a> &mdash; Full 12-actuator telemetry snapshot</li>"
                  "<li><a href='/api/actuators'><code>/api/actuators</code></a> &mdash; Detailed channel status list</li>"
                  "<li><a href='/api/readings?project=13'><code>/api/readings?project=13</code></a> &mdash; Specific project status</li>"
                  "<li><code>POST /api/command</code> &mdash; Control relays, PWM, DC motor, stepper, servo</li>"
                  "</ul></div>"
                  "</body></html>");
  _server.send(200, F("text/html"), html);
}

void WebApiServer::handleHealth() {
  sendCorsHeaders();
  StaticJsonDocument<256> doc;
  doc["status"] = safetyManager.isEStopActive() ? "estop" : "ok";
  doc["deviceId"] = DEVICE_ID;
  doc["uptime"] = millis() / 1000;
  doc["safetyState"] = safetyManager.getStateString();
  doc["estopActive"] = safetyManager.isEStopActive();
  doc["freeHeap"] = ESP.getFreeHeap();

  String res;
  serializeJson(doc, res);
  _server.send(200, F("application/json"), res);
}

void WebApiServer::handleDevice() {
  sendCorsHeaders();
  StaticJsonDocument<512> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["deviceType"] = DEVICE_TYPE;
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["ip"] = wifiManager.getIpAddress();
  doc["mac"] = wifiManager.getMacAddress();
  doc["category"] = "B";
  doc["totalProjects"] = 12;

  JsonArray projs = doc.createNestedArray("supportedProjects");
  const char* ids[] = {
    "13-automatic-plant-watering", "14-smart-water-tank-controller", "15-smart-street-light",
    "16-wifi-home-automation", "17-fan-speed-controller", "18-smart-exhaust-fan",
    "19-automatic-door-controller", "20-servo-motor-web-control", "21-dc-motor-control-panel",
    "22-stepper-motor-controller", "23-relay-control-dashboard", "24-smart-greenhouse-automation"
  };
  for (size_t i = 0; i < 12; i++) {
    projs.add(ids[i]);
  }

  String res;
  serializeJson(doc, res);
  _server.send(200, F("application/json"), res);
}

void WebApiServer::handleTelemetry() {
  sendCorsHeaders();
  DynamicJsonDocument doc(2048);
  JsonObject root = doc.to<JsonObject>();
  telemetryManager.serializeAll(root);

  String res;
  serializeJson(doc, res);
  _server.send(200, F("application/json"), res);
}

void WebApiServer::handleActuators() {
  sendCorsHeaders();
  DynamicJsonDocument doc(1536);
  JsonArray arr = doc.createNestedArray("actuators");
  telemetryManager.serializeActuatorsStatus(arr);

  doc["deviceId"] = DEVICE_ID;
  doc["safetyState"] = safetyManager.getStateString();
  doc["estopActive"] = safetyManager.isEStopActive();

  String res;
  serializeJson(doc, res);
  _server.send(200, F("application/json"), res);
}

void WebApiServer::handleReadings() {
  sendCorsHeaders();

  int projectNum = 13;
  if (_server.hasArg(F("project"))) {
    projectNum = _server.arg(F("project")).toInt();
  } else if (_server.hasArg(F("p"))) {
    projectNum = _server.arg(F("p")).toInt();
  } else if (_server.hasArg(F("id"))) {
    String id = _server.arg(F("id"));
    if (id.startsWith("13") || id.indexOf("plant") >= 0) projectNum = 13;
    else if (id.startsWith("14") || id.indexOf("tank") >= 0) projectNum = 14;
    else if (id.startsWith("15") || id.indexOf("street") >= 0) projectNum = 15;
    else if (id.startsWith("16") || id.indexOf("home") >= 0) projectNum = 16;
    else if (id.startsWith("17") || id.indexOf("fan-speed") >= 0) projectNum = 17;
    else if (id.startsWith("18") || id.indexOf("exhaust") >= 0) projectNum = 18;
    else if (id.startsWith("19") || id.indexOf("door") >= 0) projectNum = 19;
    else if (id.startsWith("20") || id.indexOf("servo") >= 0) projectNum = 20;
    else if (id.startsWith("21") || id.indexOf("dc-motor") >= 0) projectNum = 21;
    else if (id.startsWith("22") || id.indexOf("stepper") >= 0) projectNum = 22;
    else if (id.startsWith("23") || id.indexOf("relay") >= 0) projectNum = 23;
    else if (id.startsWith("24") || id.indexOf("greenhouse") >= 0) projectNum = 24;
  }

  if (projectNum < 13 || projectNum > 24) {
    _server.send(400, F("application/json"), F("{\"error\":\"Invalid project index. Device 2 handles projects 13 to 24.\"}"));
    return;
  }

  StaticJsonDocument<512> doc;
  JsonObject root = doc.to<JsonObject>();
  telemetryManager.serializeProject(projectNum, root);

  String res;
  serializeJson(doc, res);
  _server.send(200, F("application/json"), res);
}

void WebApiServer::handleCommand() {
  sendCorsHeaders();

  if (!_server.hasArg(F("plain"))) {
    _server.send(400, F("application/json"), F("{\"error\":\"Missing JSON command body\"}"));
    return;
  }

  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, _server.arg(F("plain")));
  if (err) {
    _server.send(400, F("application/json"), F("{\"error\":\"Invalid JSON format\"}"));
    return;
  }

  // Any valid command acts as a heartbeat to keep the communication watchdog fed
  safetyManager.registerHeartbeat();

  const char* cmd = doc["command"] | "";
  StaticJsonDocument<256> resp;
  bool success = false;

  // 1. Emergency Stop controls
  if (strcmp(cmd, "estop_trigger") == 0) {
    const char* reason = doc["reason"] | "User Emergency Stop Clicked";
    safetyManager.triggerEmergencyStop(reason);
    actuatorManager.emergencyAllStop();
    resp["success"] = true;
    resp["action"] = "EMERGENCY_STOP_ACTIVE";
    success = true;
  }
  else if (strcmp(cmd, "estop_clear") == 0) {
    safetyManager.clearEmergencyStop();
    resp["success"] = true;
    resp["action"] = "EMERGENCY_STOP_CLEARED";
    success = true;
  }
  else if (strcmp(cmd, "heartbeat") == 0) {
    resp["success"] = true;
    resp["watchdog"] = "RESET";
    success = true;
  }

  // 2. Actuator Commands (Blocked if E-Stop is active)
  else if (safetyManager.isEStopActive()) {
    resp["success"] = false;
    resp["error"] = "Command blocked: Emergency Stop or Watchdog Timeout is active!";
    resp["reason"] = safetyManager.getEStopReason();
    String res;
    serializeJson(resp, res);
    _server.send(403, F("application/json"), res);
    return;
  }

  else if (strcmp(cmd, "relay_set") == 0) {
    uint8_t ch = doc["channel"] | 255;
    bool state = doc["state"] | false;
    if (ch < 8) {
      success = actuatorManager.setRelay(ch, state);
      resp["success"] = success;
      resp["channel"] = ch;
      resp["state"] = state;
    } else {
      resp["error"] = "Channel must be 0 to 7";
    }
  }

  else if (strcmp(cmd, "dc_motor_set") == 0) {
    int speed = doc["speed"] | 0;
    int dir = doc["direction"] | 0;
    success = actuatorManager.setDcMotor(speed, dir);
    resp["success"] = success;
    resp["speed"] = speed;
    resp["direction"] = dir;
  }

  else if (strcmp(cmd, "fan_speed_set") == 0) {
    int pwm = doc["pwm"] | 0;
    success = actuatorManager.setFanSpeedPwm(pwm);
    resp["success"] = success;
    resp["pwm"] = pwm;
  }

  else if (strcmp(cmd, "street_light_set") == 0) {
    int pwm = doc["pwm"] | 0;
    success = actuatorManager.setStreetLightPwm(pwm);
    resp["success"] = success;
    resp["pwm"] = pwm;
  }

  else if (strcmp(cmd, "servo_set") == 0) {
    int angle = doc["angle"] | 90;
    success = actuatorManager.setServoAngle(angle);
    resp["success"] = success;
    resp["angle"] = angle;
  }

  else if (strcmp(cmd, "door_set") == 0) {
    bool open = doc["open"] | false;
    success = actuatorManager.setDoorState(open);
    resp["success"] = success;
    resp["doorOpen"] = open;
  }

  else if (strcmp(cmd, "stepper_step") == 0) {
    int steps = doc["steps"] | 0;
    int delayUs = doc["delayUs"] | 800;
    success = actuatorManager.moveStepper(steps, delayUs);
    resp["success"] = success;
    resp["steps"] = steps;
  }

  else {
    _server.send(400, F("application/json"), F("{\"error\":\"Unrecognized automation command\"}"));
    return;
  }

  String res;
  serializeJson(resp, res);
  _server.send(success ? 200 : 400, F("application/json"), res);
}

void WebApiServer::handleNotFound() {
  sendCorsHeaders();
  _server.send(404, F("application/json"), F("{\"error\":\"Not Found\",\"deviceId\":\"" DEVICE_ID "\"}"));
}
