#include "calibration.h"
#include "config.h"
#include <EEPROM.h>

CalibrationManager calibrationManager;

CalibrationManager::CalibrationManager() {
  applyDefaults();
}

void CalibrationManager::applyDefaults() {
  cal.speedOfSoundMps        = 343.0f;
  cal.radarMinDistCm         = 2.0f;
  cal.radarMaxDistCm         = 400.0f;

  cal.rainDryThresholdRaw    = 950;
  cal.rainFloodThresholdRaw  = 250;

  cal.soilAirRaw             = 2750;   // In air (bone dry)
  cal.soilWaterRaw           = 1350;   // In water (saturated)

  cal.dhtTempOffset          = 0.0f;
  cal.dhtHumOffset           = 0.0f;

  cal.mq135R0                = 76.63f; // Default factory baseline in kOhms
  cal.mq135RLoad             = 20.0f;

  cal.mq2R0                  = 9.83f;
  cal.mq2ThresholdPpm        = 600.0f;

  cal.ldrDarkRaw             = 40.0f;
  cal.ldrBrightRaw           = 980.0f;

  cal.oneWireTempOffset      = 0.0f;

  cal.tankTotalHeightCm      = 120.0f;
  cal.tankSensorOffsetCm     = 10.0f;

  cal.flowCalibrationFactor  = 7.5f;   // YF-S201 standard

  cal.tdsKValue              = 1.0f;
  cal.tdsTempCoeff           = 0.02f;

  cal.accelOffsetX           = 0.0f;
  cal.accelOffsetY           = 0.0f;
  cal.accelOffsetZ           = 0.0f;
  cal.gyroOffsetX            = 0.0f;
  cal.gyroOffsetY            = 0.0f;
  cal.gyroOffsetZ            = 0.0f;
}

void CalibrationManager::begin() {
  EEPROM.begin(sizeof(SensorCalibration) + 4);
  if (!load()) {
    Serial.println(F("[CAL] No valid EEPROM calibration found. Initializing factory defaults."));
    applyDefaults();
    save();
  } else {
    Serial.println(F("[CAL] Successfully loaded calibrated profiles from EEPROM."));
  }
}

void CalibrationManager::resetToDefaults() {
  applyDefaults();
  save();
  Serial.println(F("[CAL] Calibration reset to factory defaults."));
}

bool CalibrationManager::load() {
  uint8_t magic = EEPROM.read(EEPROM_CONFIG_ADDR);
  if (magic != EEPROM_MAGIC_BYTE) {
    return false;
  }

  uint8_t* p = (uint8_t*)&cal;
  for (size_t i = 0; i < sizeof(SensorCalibration); i++) {
    p[i] = EEPROM.read(EEPROM_CONFIG_ADDR + 1 + i);
  }
  return true;
}

bool CalibrationManager::save() {
  EEPROM.write(EEPROM_CONFIG_ADDR, EEPROM_MAGIC_BYTE);
  uint8_t* p = (uint8_t*)&cal;
  for (size_t i = 0; i < sizeof(SensorCalibration); i++) {
    EEPROM.write(EEPROM_CONFIG_ADDR + 1 + i, p[i]);
  }
  return EEPROM.commit();
}

bool CalibrationManager::updateFromJson(const JsonObject& json) {
  bool modified = false;

  if (json.containsKey("speedOfSound")) { cal.speedOfSoundMps = json["speedOfSound"]; modified = true; }
  if (json.containsKey("soilAirRaw"))    { cal.soilAirRaw = json["soilAirRaw"]; modified = true; }
  if (json.containsKey("soilWaterRaw"))  { cal.soilWaterRaw = json["soilWaterRaw"]; modified = true; }
  if (json.containsKey("dhtTempOffset")) { cal.dhtTempOffset = json["dhtTempOffset"]; modified = true; }
  if (json.containsKey("dhtHumOffset"))  { cal.dhtHumOffset = json["dhtHumOffset"]; modified = true; }
  if (json.containsKey("mq135R0"))       { cal.mq135R0 = json["mq135R0"]; modified = true; }
  if (json.containsKey("mq2R0"))         { cal.mq2R0 = json["mq2R0"]; modified = true; }
  if (json.containsKey("tankHeight"))    { cal.tankTotalHeightCm = json["tankHeight"]; modified = true; }
  if (json.containsKey("flowFactor"))    { cal.flowCalibrationFactor = json["flowFactor"]; modified = true; }
  if (json.containsKey("tdsKValue"))     { cal.tdsKValue = json["tdsKValue"]; modified = true; }
  if (json.containsKey("oneWireOffset")) { cal.oneWireTempOffset = json["oneWireOffset"]; modified = true; }

  if (modified) {
    save();
    Serial.println(F("[CAL] Saved updated calibration parameters to non-volatile storage."));
  }
  return modified;
}

void CalibrationManager::toJson(JsonObject& root) const {
  root["speedOfSound"]   = cal.speedOfSoundMps;
  root["soilAirRaw"]     = cal.soilAirRaw;
  root["soilWaterRaw"]   = cal.soilWaterRaw;
  root["dhtTempOffset"]  = cal.dhtTempOffset;
  root["dhtHumOffset"]   = cal.dhtHumOffset;
  root["mq135R0"]        = cal.mq135R0;
  root["mq2R0"]          = cal.mq2R0;
  root["tankHeight"]     = cal.tankTotalHeightCm;
  root["flowFactor"]     = cal.flowCalibrationFactor;
  root["tdsKValue"]      = cal.tdsKValue;
  root["oneWireOffset"]  = cal.oneWireTempOffset;
}
