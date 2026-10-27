#ifndef WEB_API_H
#define WEB_API_H

#include <Arduino.h>
#include <ESP8266WebServer.h>
#include "config.h"
#include "telemetry.h"
#include "sensor_manager.h"
#include "wifi_manager.h"
#include "calibration.h"

class WebApiServer {
public:
  WebApiServer();
  void begin();
  void update();

private:
  void setupRoutes();
  void sendCorsHeaders();

  // Handlers
  void handleRoot();
  void handleHealth();
  void handleDevice();
  void handleTelemetry();
  void handleSensors();
  void handleReadings();
  void handleGetConfig();
  void handlePostConfig();
  void handleCommand();
  void handleNotFound();
  void handleOptions();

  ESP8266WebServer _server;
};

extern WebApiServer webApiServer;

#endif // WEB_API_H
