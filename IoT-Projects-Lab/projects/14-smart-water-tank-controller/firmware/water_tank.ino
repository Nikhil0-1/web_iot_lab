/*
 * Project 14 — Smart Water Tank Controller — ESP8266 Firmware
 * HC-SR04 + Relay pump controller
 *
 * Libraries: ESP8266WiFi, ESP8266WebServer, ArduinoJson v6+
 * Board: NodeMCU 1.0 (ESP-12E)
 *
 * Wiring:
 *   HC-SR04 Trig → D1 (GPIO5)
 *   HC-SR04 Echo → D2 (GPIO4) via 1kΩ/2kΩ voltage divider to safe 3.3V
 *   Relay IN     → D5 (GPIO14) — Active LOW
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

const char* WIFI_SSID     = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";

const int TRIG_PIN  = 5;   // D1
const int ECHO_PIN  = 4;   // D2
const int RELAY_PIN = 14;  // D5 — Active LOW

const float TANK_HEIGHT_CM = 100.0;  // Empty tank: sensor to bottom distance
const float TANK_CAPACITY_L = 500.0;

int lowThresh  = 20;   // % — start pump
int highThresh = 85;   // % — stop pump

bool  pumpOn   = false;
bool  autoMode = true;
int   fillPct  = 0;
float distCm   = 0;
int   events   = 0;

unsigned long lastPumpStart = 0;
const unsigned long MAX_PUMP_MS = 300000UL; // 5 min safety cutoff

ESP8266WebServer server(80);

void addCors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

float measureDistanceCm() {
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH, 25000); // 25ms timeout
  if (duration == 0) return -1.0; // Sensor timeout
  return (duration * 0.0343f) / 2.0f;
}

void setPump(bool on) {
  if (on == pumpOn) return;
  pumpOn = on;
  digitalWrite(RELAY_PIN, on ? LOW : HIGH);
  if (on) { lastPumpStart = millis(); events++; }
  Serial.print("[PUMP] "); Serial.println(on ? "ON" : "OFF");
}

void handleHealth() { addCors(); server.send(200,"application/json","{\"status\":\"ok\"}"); }
void handleDevice() {
  addCors();
  StaticJsonDocument<128> d; d["projectId"]="water-tank"; d["deviceId"]="ESP8266-WaterTank"; d["firmware"]="1.0.0";
  String o; serializeJson(d,o); server.send(200,"application/json",o);
}
void handleReadings() {
  addCors();
  StaticJsonDocument<256> d;
  d["projectId"]="water-tank"; d["fill"]=fillPct; d["distCm"]=distCm;
  d["pump"]=pumpOn; d["autoMode"]=autoMode;
  d["lowThresh"]=lowThresh; d["highThresh"]=highThresh;
  d["events"]=events; d["uptime"]=millis()/1000;
  String o; serializeJson(d,o); server.send(200,"application/json",o);
}
void handleControl() {
  addCors();
  if (server.method()==HTTP_OPTIONS){server.send(204);return;}
  StaticJsonDocument<256> req;
  if (deserializeJson(req,server.arg("plain"))){server.send(400,"application/json","{\"error\":\"Bad JSON\"}");return;}
  if (req.containsKey("autoMode")){autoMode=req["autoMode"].as<bool>();if(!autoMode)setPump(false);}
  if (req.containsKey("pump")&&!autoMode) setPump(req["pump"].as<bool>());
  if (req.containsKey("lowThresh")) lowThresh=constrain(req["lowThresh"].as<int>(),5,highThresh-5);
  if (req.containsKey("highThresh")) highThresh=constrain(req["highThresh"].as<int>(),lowThresh+5,100);
  server.send(200,"application/json","{\"ok\":true}");
}
void handleOptions(){addCors();server.send(204);}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT); pinMode(ECHO_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT); digitalWrite(RELAY_PIN, HIGH); // Safe off

  WiFi.mode(WIFI_STA); WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long t0=millis();
  while(WiFi.status()!=WL_CONNECTED&&millis()-t0<20000){delay(500);Serial.print(".");}
  if(WiFi.status()!=WL_CONNECTED){WiFi.softAP("WaterTank-Setup","12345678");Serial.print("[AP]");Serial.println(WiFi.softAPIP());}
  else{Serial.print("\n[IP]");Serial.println(WiFi.localIP());}

  server.on("/api/health",   HTTP_GET,     handleHealth);
  server.on("/api/device",   HTTP_GET,     handleDevice);
  server.on("/api/readings", HTTP_GET,     handleReadings);
  server.on("/api/control",  HTTP_POST,    handleControl);
  server.on("/api/control",  HTTP_OPTIONS, handleOptions);
  server.on("/api/health",   HTTP_OPTIONS, handleOptions);
  server.on("/api/readings", HTTP_OPTIONS, handleOptions);
  
  server.on("/api/command", HTTP_OPTIONS, []() {
    setCorsHeaders();
    server.send(204);
  });
  server.on("/api/command", HTTP_POST, handleControl);

  server.begin();
}

void loop() {
  server.handleClient();
  static unsigned long lastRead=0;
  if(millis()-lastRead>1000){
    lastRead=millis();
    float d = measureDistanceCm();
    if(d > 0){
      distCm = d;
      float waterCm = TANK_HEIGHT_CM - d;
      fillPct = constrain((int)((waterCm/TANK_HEIGHT_CM)*100),0,100);
    }
    if(autoMode){
      if(!pumpOn&&fillPct<=lowThresh) setPump(true);
      if(pumpOn&&fillPct>=highThresh) setPump(false);
    }
    // Safety cutoff
    if(pumpOn&&(millis()-lastPumpStart>MAX_PUMP_MS)){Serial.println("[SAFETY] Max pump time");setPump(false);}
  }
}
