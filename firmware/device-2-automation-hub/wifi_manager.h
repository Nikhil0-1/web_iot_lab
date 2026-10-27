#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266mDNS.h>
#include "config.h"

class WiFiManager {
public:
  WiFiManager();
  void begin();
  void update();

  bool isConnected() const;
  bool isApMode() const;
  String getIpAddress() const;
  String getMacAddress() const;
  int8_t getRssi() const;
  String getModeString() const;

private:
  void startStation();
  void startAP();

  bool _isApMode;
  unsigned long _lastCheckMs;
  unsigned long _connectStartMs;
  uint8_t _reconnectAttempts;
};

extern WiFiManager wifiManager;

#endif // WIFI_MANAGER_H
