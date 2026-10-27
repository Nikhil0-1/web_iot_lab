#include "telemetry.h"
#include "config.h"

TelemetryManager telemetryManager;

TelemetryManager::TelemetryManager() {
  init();
}

void TelemetryManager::init() {
  memset(&data, 0, sizeof(Device1Telemetry));

  data.healthP01 = HEALTH_OK;
  data.healthP02 = HEALTH_OK;
  data.healthP03 = HEALTH_OK;
  data.healthP04 = HEALTH_OK;
  data.healthP05 = HEALTH_WARMING_UP;
  data.healthP06 = HEALTH_WARMING_UP;
  data.healthP07 = HEALTH_OK;
  data.healthP08 = HEALTH_OK;
  data.healthP09 = HEALTH_OK;
  data.healthP10 = HEALTH_OK;
  data.healthP11 = HEALTH_OK;
  data.healthP12 = HEALTH_OK;
}

const char* TelemetryManager::healthToString(SensorHealth h) const {
  switch (h) {
    case HEALTH_OK:                 return "ok";
    case HEALTH_WARMING_UP:         return "warming_up";
    case HEALTH_DISCONNECTED:       return "disconnected";
    case HEALTH_OUT_OF_RANGE:       return "out_of_range";
    case HEALTH_CALIBRATION_NEEDED: return "cal_needed";
    default:                        return "unknown";
  }
}

void TelemetryManager::serializeAll(JsonObject& root) const {
  root["deviceId"]       = DEVICE_ID;
  root["deviceType"]     = DEVICE_TYPE;
  root["firmwareVersion"] = FIRMWARE_VERSION;
  root["timestamp"]      = data.timestampMs;
  root["uptime"]         = data.uptimeSeconds;
  root["freeHeap"]       = data.freeHeapBytes;
  root["rssi"]           = data.wifiRssi;

  JsonObject projects = root.createNestedObject("projects");

  // P01: Terrascan X Elite
  JsonObject p01 = projects.createNestedObject("01-terrascan-x-elite");
  p01["angle"]            = data.radarAngleDeg;
  p01["distanceCm"]       = data.radarDistanceCm;
  p01["echoTimeUs"]       = data.radarEchoUs;
  p01["obstacle"]         = data.radarObstacle;
  p01["health"]           = healthToString(data.healthP01);

  // P02: Rainwatch AI
  JsonObject p02 = projects.createNestedObject("02-rainwatch-ai");
  p02["rainDetected"]     = data.rainDetected;
  p02["intensity"]        = data.rainIntensityPct;
  p02["rawAdc"]           = data.rainRawAdc;
  p02["rainRate"]         = data.rainRateMmh;
  p02["health"]           = healthToString(data.healthP02);

  // P03: TerraIQ
  JsonObject p03 = projects.createNestedObject("03-terraiq");
  p03["moisture"]         = data.soilMoisturePct;
  p03["rawAdc"]           = data.soilRawAdc;
  p03["vwc"]              = data.soilVwcPct;
  p03["health"]           = healthToString(data.healthP03);

  // P04: Atmos AI
  JsonObject p04 = projects.createNestedObject("04-atmos-ai");
  p04["temperature"]      = data.dhtTempC;
  p04["humidity"]         = data.dhtHumidityPct;
  p04["heatIndex"]        = data.dhtHeatIndexC;
  p04["health"]           = healthToString(data.healthP04);

  // P05: Air Quality
  JsonObject p05 = projects.createNestedObject("05-smart-air-quality-monitor");
  p05["aqi"]              = data.mq135Aqi;
  p05["co2Ppm"]           = data.mq135Co2Ppm;
  p05["warmupRemaining"]  = data.mq135WarmupSec;
  p05["health"]           = healthToString(data.healthP05);

  // P06: Gas Leakage
  JsonObject p06 = projects.createNestedObject("06-gas-leakage-detector");
  p06["gasPpm"]           = data.mq2Ppm;
  p06["rawAdc"]           = data.mq2RawAdc;
  p06["alarmActive"]      = data.mq2AlarmActive;
  p06["health"]           = healthToString(data.healthP06);

  // P07: LDR Light
  JsonObject p07 = projects.createNestedObject("07-ldr-light-intensity-monitor");
  p07["percent"]          = data.ldrPercent;
  p07["rawAdc"]           = data.ldrRawAdc;
  p07["lux"]              = data.ldrLuxEstimate;
  p07["health"]           = healthToString(data.healthP07);

  // P08: Digital Thermometer
  JsonObject p08 = projects.createNestedObject("08-digital-thermometer");
  p08["temperatureC"]     = data.oneWireTempC;
  p08["temperatureF"]     = data.oneWireTempF;
  p08["health"]           = healthToString(data.healthP08);

  // P09: Water Level
  JsonObject p09 = projects.createNestedObject("09-water-level-monitor");
  p09["levelPercent"]     = data.waterLevelPct;
  p09["depthCm"]          = data.waterDepthCm;
  p09["liters"]           = data.waterVolumeLiters;
  p09["health"]           = healthToString(data.healthP09);

  // P10: Water Flow Meter
  JsonObject p10 = projects.createNestedObject("10-water-flow-meter");
  p10["flowRateLpm"]      = data.flowRateLpm;
  p10["totalLiters"]      = data.flowTotalLiters;
  p10["pulseCount"]       = data.flowPulseCount;
  p10["frequencyHz"]      = data.flowFrequencyHz;
  p10["health"]           = healthToString(data.healthP10);

  // P11: TDS Water Quality
  JsonObject p11 = projects.createNestedObject("11-tds-water-quality-monitor");
  p11["tdsPpm"]           = data.tdsPpm;
  p11["rawAdc"]           = data.tdsRawAdc;
  p11["voltageV"]         = data.tdsVoltageV;
  p11["health"]           = healthToString(data.healthP11);

  // P12: Vibration & Tilt
  JsonObject p12 = projects.createNestedObject("12-vibration-tilt-monitor");
  p12["pitchDeg"]         = data.tiltPitchDeg;
  p12["rollDeg"]          = data.tiltRollDeg;
  p12["totalG"]           = data.tiltTotalG;
  p12["vibration"]        = data.vibTriggered;
  p12["health"]           = healthToString(data.healthP12);
}

void TelemetryManager::serializeProject(int pNum, JsonObject& root) const {
  root["deviceId"]  = DEVICE_ID;
  root["timestamp"] = data.timestampMs;

  switch (pNum) {
    case 1:
      root["projectId"] = "01-terrascan-x-elite";
      root["angle"] = data.radarAngleDeg;
      root["distance"] = data.radarDistanceCm;
      root["echoTimeUs"] = data.radarEchoUs;
      root["obstacle"] = data.radarObstacle;
      root["health"] = healthToString(data.healthP01);
      break;

    case 2:
      root["projectId"] = "02-rainwatch-ai";
      root["intensity"] = data.rainIntensityPct;
      root["rainDetected"] = data.rainDetected;
      root["rainRate"] = data.rainRateMmh;
      root["adcRaw"] = data.rainRawAdc;
      root["health"] = healthToString(data.healthP02);
      break;

    case 3:
      root["projectId"] = "03-terraiq";
      root["moisture"] = data.soilMoisturePct;
      root["vwc"] = data.soilVwcPct;
      root["rawAdc"] = data.soilRawAdc;
      root["health"] = healthToString(data.healthP03);
      break;

    case 4:
      root["projectId"] = "04-atmos-ai";
      root["temperature"] = data.dhtTempC;
      root["humidity"] = data.dhtHumidityPct;
      root["heatIndex"] = data.dhtHeatIndexC;
      root["health"] = healthToString(data.healthP04);
      break;

    case 5:
      root["projectId"] = "05-smart-air-quality-monitor";
      root["aqi"] = data.mq135Aqi;
      root["co2Ppm"] = data.mq135Co2Ppm;
      root["warmupRemaining"] = data.mq135WarmupSec;
      root["health"] = healthToString(data.healthP05);
      break;

    case 6:
      root["projectId"] = "06-gas-leakage-detector";
      root["gasPpm"] = data.mq2Ppm;
      root["rawAdc"] = data.mq2RawAdc;
      root["alarmActive"] = data.mq2AlarmActive;
      root["health"] = healthToString(data.healthP06);
      break;

    case 7:
      root["projectId"] = "07-ldr-light-intensity-monitor";
      root["percent"] = data.ldrPercent;
      root["rawAdc"] = data.ldrRawAdc;
      root["lux"] = data.ldrLuxEstimate;
      root["health"] = healthToString(data.healthP07);
      break;

    case 8:
      root["projectId"] = "08-digital-thermometer";
      root["temperatureC"] = data.oneWireTempC;
      root["temperatureF"] = data.oneWireTempF;
      root["health"] = healthToString(data.healthP08);
      break;

    case 9:
      root["projectId"] = "09-water-level-monitor";
      root["levelPercent"] = data.waterLevelPct;
      root["depthCm"] = data.waterDepthCm;
      root["liters"] = data.waterVolumeLiters;
      root["health"] = healthToString(data.healthP09);
      break;

    case 10:
      root["projectId"] = "10-water-flow-meter";
      root["flowRateLpm"] = data.flowRateLpm;
      root["totalLiters"] = data.flowTotalLiters;
      root["pulseCount"] = data.flowPulseCount;
      root["frequencyHz"] = data.flowFrequencyHz;
      root["health"] = healthToString(data.healthP10);
      break;

    case 11:
      root["projectId"] = "11-tds-water-quality-monitor";
      root["tdsPpm"] = data.tdsPpm;
      root["voltageV"] = data.tdsVoltageV;
      root["rawAdc"] = data.tdsRawAdc;
      root["health"] = healthToString(data.healthP11);
      break;

    case 12:
      root["projectId"] = "12-vibration-tilt-monitor";
      root["pitchDeg"] = data.tiltPitchDeg;
      root["rollDeg"] = data.tiltRollDeg;
      root["totalG"] = data.tiltTotalG;
      root["vibration"] = data.vibTriggered;
      root["health"] = healthToString(data.healthP12);
      break;

    default:
      root["error"] = "Invalid project index";
      break;
  }
}

void TelemetryManager::serializeSensorsHealth(JsonArray& array) const {
  const struct { int id; const char* name; SensorHealth h; } sensorList[] = {
    { 1, "HC-SR04 Radar", data.healthP01 },
    { 2, "Rain Grid Sensor", data.healthP02 },
    { 3, "Capacitive Soil Probe", data.healthP03 },
    { 4, "DHT22 Climate Sensor", data.healthP04 },
    { 5, "MQ-135 Gas Sensor", data.healthP05 },
    { 6, "MQ-2 Flammable Gas", data.healthP06 },
    { 7, "LDR Photoresistor", data.healthP07 },
    { 8, "DS18B20 OneWire", data.healthP08 },
    { 9, "Water Level Ultrasonic", data.healthP09 },
    { 10, "YF-S201 Flow Meter", data.healthP10 },
    { 11, "Analog TDS Probe", data.healthP11 },
    { 12, "MPU-6050 & SW-420", data.healthP12 }
  };

  for (size_t i = 0; i < 12; i++) {
    JsonObject item = array.createNestedObject();
    item["project"] = sensorList[i].id;
    item["sensor"]  = sensorList[i].name;
    item["status"]  = healthToString(sensorList[i].h);
    item["healthy"] = (sensorList[i].h == HEALTH_OK);
  }
}
