#ifndef WEB_API_H
#define WEB_API_H

#include <Arduino.h>
#include <ESP8266WebServer.h>
#include "config.h"
#include "actuator_manager.h"
#include "safety_manager.h"
#include "telemetry.h"
#include "wifi_manager.h"

class WebApiServer {
public:
  WebApiServer();
  void begin();
  void update();

private:
  void setupRoutes();
  void sendCorsHeaders();

  // Route Handlers
  void handleRoot();
  void handleHealth();
  void handleDevice();
  void handleTelemetry();
  void handleActuators();
  void handleReadings();
  void handleCommand();
  void handleNotFound();
  void handleOptions();

  ESP8266WebServer _server;
};

extern WebApiServer webApiServer;

#endif // WEB_API_H
