#include "web_api.h"
#include <ArduinoJson.h>

WebApiServer webApiServer;

WebApiServer::WebApiServer() : _server(WEB_SERVER_PORT) {}

void WebApiServer::begin() {
  setupRoutes();
  _server.begin();
  Serial.println(F("[HTTP] REST API Server started on port 80."));
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
  _server.on(F("/api/sensors"), HTTP_GET, [this]() { handleSensors(); });
  _server.on(F("/api/readings"), HTTP_GET, [this]() { handleReadings(); });

  _server.on(F("/api/config"), HTTP_GET, [this]() { handleGetConfig(); });
  _server.on(F("/api/config"), HTTP_POST, [this]() { handlePostConfig(); });
  _server.on(F("/api/command"), HTTP_POST, [this]() { handleCommand(); });

  // Handle CORS Preflight for all endpoints
  _server.on(F("/api/config"), HTTP_OPTIONS, [this]() { handleOptions(); });
  _server.on(F("/api/command"), HTTP_OPTIONS, [this]() { handleOptions(); });

  _server.onNotFound([this]() { handleNotFound(); });
}

void WebApiServer::handleRoot() {
  sendCorsHeaders();
  String html = F("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Device 1 — Sensors Hub</title>"
                  "<style>body{font-family:sans-serif;padding:24px;background:#f8fafc;color:#0f172a;max-width:700px;margin:auto;}"
                  "h1{color:#0284c7;}a{color:#0284c7;text-decoration:none;}a:hover{text-decoration:underline;}"
                  ".card{background:#fff;padding:16px 20px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:16px;}"
                  "code{background:#e2e8f0;padding:2px 6px;border-radius:4px;font-size:0.9em;}"
                  "</style></head><body>"
                  "<h1>Tech IoT Warriors &middot; Sensors Hub (Device 1)</h1>"
                  "<div class='card'>"
                  "<p><strong>Device ID:</strong> esp8266-sensors-hub-01</p>"
                  "<p><strong>Firmware:</strong> v2.4.0 (Universal Monitoring Engine)</p>"
                  "<p><strong>Network:</strong> " + wifiManager.getModeString() + " &bull; IP: " + wifiManager.getIpAddress() + "</p>"
                  "<p><strong>Supported Projects:</strong> 01 to 12 (Category A)</p>"
                  "</div>"
                  "<div class='card'><h3>Active API Endpoints</h3><ul>"
                  "<li><a href='/api/health'><code>/api/health</code></a> &mdash; Liveness check</li>"
                  "<li><a href='/api/device'><code>/api/device</code></a> &mdash; Hardware metadata</li>"
                  "<li><a href='/api/telemetry'><code>/api/telemetry</code></a> &mdash; Full 12-project snapshot</li>"
                  "<li><a href='/api/sensors'><code>/api/sensors</code></a> &mdash; Sensor diagnostic array</li>"
                  "<li><a href='/api/readings?project=01'><code>/api/readings?project=01</code></a> &mdash; Individual project reading</li>"
                  "<li><a href='/api/config'><code>/api/config</code></a> &mdash; Calibration parameters</li>"
                  "</ul></div>"
                  "<p style='color:#64748b;font-size:0.85em;'>Connect via the web dashboard at <code>IoT-Projects-Lab/index.html</code></p>"
                  "</body></html>");
  _server.send(200, F("text/html"), html);
}

void WebApiServer::handleHealth() {
  sendCorsHeaders();
  StaticJsonDocument<256> doc;
  doc["status"] = "ok";
  doc["deviceId"] = DEVICE_ID;
  doc["uptime"] = telemetryManager.data.uptimeSeconds;
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["wifiConnected"] = wifiManager.isConnected();

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
  doc["mode"] = "hardware";
  doc["category"] = "A";
  doc["totalProjects"] = 12;

  JsonArray projs = doc.createNestedArray("supportedProjects");
  const char* ids[] = {
    "01-terrascan-x-elite", "02-rainwatch-ai", "03-terraiq", "04-atmos-ai",
    "05-smart-air-quality-monitor", "06-gas-leakage-detector", "07-ldr-light-intensity-monitor",
    "08-digital-thermometer", "09-water-level-monitor", "10-water-flow-meter",
    "11-tds-water-quality-monitor", "12-vibration-tilt-monitor"
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

void WebApiServer::handleSensors() {
  sendCorsHeaders();
  DynamicJsonDocument doc(1536);
  JsonArray arr = doc.createNestedArray("sensors");
  telemetryManager.serializeSensorsHealth(arr);

  doc["timestamp"] = telemetryManager.data.timestampMs;
  doc["deviceId"] = DEVICE_ID;

  String res;
  serializeJson(doc, res);
  _server.send(200, F("application/json"), res);
}

void WebApiServer::handleReadings() {
  sendCorsHeaders();

  int projectNum = 1;
  if (_server.hasArg(F("project"))) {
    projectNum = _server.arg(F("project")).toInt();
  } else if (_server.hasArg(F("p"))) {
    projectNum = _server.arg(F("p")).toInt();
  } else if (_server.hasArg(F("id"))) {
    String id = _server.arg(F("id"));
    if (id.startsWith("01") || id.indexOf("terrascan") >= 0) projectNum = 1;
    else if (id.startsWith("02") || id.indexOf("rain") >= 0) projectNum = 2;
    else if (id.startsWith("03") || id.indexOf("terraiq") >= 0) projectNum = 3;
    else if (id.startsWith("04") || id.indexOf("atmos") >= 0) projectNum = 4;
    else if (id.startsWith("05") || id.indexOf("air") >= 0) projectNum = 5;
    else if (id.startsWith("06") || id.indexOf("gas") >= 0) projectNum = 6;
    else if (id.startsWith("07") || id.indexOf("ldr") >= 0) projectNum = 7;
    else if (id.startsWith("08") || id.indexOf("thermo") >= 0) projectNum = 8;
    else if (id.startsWith("09") || id.indexOf("level") >= 0) projectNum = 9;
    else if (id.startsWith("10") || id.indexOf("flow") >= 0) projectNum = 10;
    else if (id.startsWith("11") || id.indexOf("tds") >= 0) projectNum = 11;
    else if (id.startsWith("12") || id.indexOf("tilt") >= 0) projectNum = 12;
  }

  if (projectNum < 1 || projectNum > 12) {
    _server.send(400, F("application/json"), F("{\"error\":\"Invalid project. Device 1 supports projects 01 through 12.\"}"));
    return;
  }

  StaticJsonDocument<512> doc;
  JsonObject root = doc.to<JsonObject>();
  telemetryManager.serializeProject(projectNum, root);

  String res;
  serializeJson(doc, res);
  _server.send(200, F("application/json"), res);
}

void WebApiServer::handleGetConfig() {
  sendCorsHeaders();
  StaticJsonDocument<512> doc;
  JsonObject root = doc.to<JsonObject>();
  doc["deviceId"] = DEVICE_ID;
  JsonObject calObj = root.createNestedObject("calibration");
  calibrationManager.toJson(calObj);

  String res;
  serializeJson(doc, res);
  _server.send(200, F("application/json"), res);
}

void WebApiServer::handlePostConfig() {
  sendCorsHeaders();
  if (!_server.hasArg(F("plain"))) {
    _server.send(400, F("application/json"), F("{\"error\":\"Missing JSON payload in body\"}"));
    return;
  }

  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, _server.arg(F("plain")));
  if (err) {
    _server.send(400, F("application/json"), F("{\"error\":\"Malformed JSON syntax\"}"));
    return;
  }

  JsonObject root = doc.as<JsonObject>();
  bool updated = calibrationManager.updateFromJson(root);

  StaticJsonDocument<256> resp;
  resp["success"] = updated;
  resp["message"] = updated ? "Calibration updated and saved to non-volatile storage" : "No parameters modified";

  String res;
  serializeJson(resp, res);
  _server.send(200, F("application/json"), res);
}

void WebApiServer::handleCommand() {
  sendCorsHeaders();
  if (!_server.hasArg(F("plain"))) {
    _server.send(400, F("application/json"), F("{\"error\":\"Missing JSON command body\"}"));
    return;
  }

  StaticJsonDocument<384> doc;
  DeserializationError err = deserializeJson(doc, _server.arg(F("plain")));
  if (err) {
    _server.send(400, F("application/json"), F("{\"error\":\"Invalid JSON format\"}"));
    return;
  }

  const char* cmd = doc["command"] | "";
  StaticJsonDocument<256> resp;

  if (strcmp(cmd, "radar_sweep_enable") == 0) {
    sensorManager.setRadarSweepEnabled(true);
    resp["success"] = true;
    resp["action"] = "Radar sweep enabled";
  } else if (strcmp(cmd, "radar_sweep_disable") == 0) {
    sensorManager.setRadarSweepEnabled(false);
    resp["success"] = true;
    resp["action"] = "Radar sweep disabled";
  } else if (strcmp(cmd, "radar_ping") == 0) {
    sensorManager.triggerManualRadarPing();
    resp["success"] = true;
    resp["action"] = "Manual ultrasonic ping executed";
  } else if (strcmp(cmd, "flow_reset_total") == 0) {
    sensorManager.resetFlowTotal();
    resp["success"] = true;
    resp["action"] = "Flow volume counter reset to 0 Liters";
  } else if (strcmp(cmd, "calibration_reset") == 0) {
    calibrationManager.resetToDefaults();
    resp["success"] = true;
    resp["action"] = "Sensor calibration reset to factory profile";
  } else {
    _server.send(400, F("application/json"), F("{\"error\":\"Unknown command. Valid: radar_sweep_enable, radar_sweep_disable, radar_ping, flow_reset_total, calibration_reset\"}"));
    return;
  }

  String res;
  serializeJson(resp, res);
  _server.send(200, F("application/json"), res);
}

void WebApiServer::handleNotFound() {
  sendCorsHeaders();
  _server.send(404, F("application/json"), F("{\"error\":\"Not Found\",\"deviceId\":\"" DEVICE_ID "\"}"));
}
