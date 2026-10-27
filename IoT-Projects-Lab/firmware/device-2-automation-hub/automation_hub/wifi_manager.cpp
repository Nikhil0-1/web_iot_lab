#include "wifi_manager.h"

WiFiManager wifiManager;

WiFiManager::WiFiManager()
  : _isApMode(false),
    _lastCheckMs(0),
    _connectStartMs(0),
    _reconnectAttempts(0)
{
}

void WiFiManager::begin() {
  Serial.println(F("[WIFI] Initializing Automation Hub network..."));
  startStation();
}

void WiFiManager::startStation() {
  _isApMode = false;
  WiFi.mode(WIFI_STA);
  WiFi.hostname(MDNS_HOSTNAME);
  WiFi.begin(DEFAULT_WIFI_SSID, DEFAULT_WIFI_PASS);

  _connectStartMs = millis();
  Serial.print(F("[WIFI] Connecting to "));
  Serial.print(DEFAULT_WIFI_SSID);
  Serial.println(F("..."));
}

void WiFiManager::startAP() {
  _isApMode = true;
  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, AP_PASS, AP_CHANNEL, false, AP_MAX_CONN);

  IPAddress myIP = WiFi.softAPIP();
  Serial.println(F("[WIFI] Station connection timed out. Fallback Access Point STARTED."));
  Serial.print(F("[WIFI] AP SSID: "));
  Serial.println(AP_SSID);
  Serial.print(F("[WIFI] AP IP: "));
  Serial.println(myIP);

  if (MDNS.begin(MDNS_HOSTNAME)) {
    MDNS.addService("http", "tcp", WEB_SERVER_PORT);
    Serial.println(F("[mDNS] Responder started: http://automation-hub.local/"));
  }
}

void WiFiManager::update() {
  unsigned long now = millis();

  if (!_isApMode && WiFi.status() != WL_CONNECTED) {
    if (now - _connectStartMs > 15000) {
      startAP();
      return;
    }
  }

  if (now - _lastCheckMs >= 5000) {
    _lastCheckMs = now;

    if (!_isApMode) {
      if (WiFi.status() == WL_CONNECTED) {
        if (_reconnectAttempts > 0) {
          Serial.println(F("[WIFI] Reconnected successfully to station."));
          _reconnectAttempts = 0;
        }
        MDNS.update();
      } else {
        _reconnectAttempts++;
        Serial.print(F("[WIFI] Reconnecting attempt #"));
        Serial.println(_reconnectAttempts);
        WiFi.reconnect();
      }
    } else {
      MDNS.update();
    }
  }
}

bool WiFiManager::isConnected() const {
  return (_isApMode || WiFi.status() == WL_CONNECTED);
}

bool WiFiManager::isApMode() const {
  return _isApMode;
}

String WiFiManager::getIpAddress() const {
  if (_isApMode) {
    return WiFi.softAPIP().toString();
  }
  return WiFi.localIP().toString();
}

String WiFiManager::getMacAddress() const {
  return WiFi.macAddress();
}

int8_t WiFiManager::getRssi() const {
  if (_isApMode) return 0;
  return WiFi.RSSI();
}

String WiFiManager::getModeString() const {
  return _isApMode ? "AccessPoint" : "Station";
}
