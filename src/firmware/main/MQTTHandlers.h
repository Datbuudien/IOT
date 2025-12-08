/**
 * MQTT Message Handlers
 * Xử lý các lệnh và cấu hình nhận được từ MQTT
 */

#ifndef MQTT_HANDLERS_H
#define MQTT_HANDLERS_H

#include <Arduino_JSON.h>
#include "Config.h"

/**
 * Xử lý lệnh điều khiển từ Backend
 * @param message JSON string chứa lệnh
 */
void handleCommand(String message) {
  // Parse JSON
  JSONVar doc = JSON.parse(message);
  
  if (JSON.typeof(doc) == "undefined") {
    Serial.println("JSON parse error");
    return;
  }
  
  // Xử lý lệnh
  if (doc.hasOwnProperty("action")) {
    String action = (const char*)doc["action"];
    
    if (action == "pump_on") {
      digitalWrite(PIN_RELAY_1, LOW);
      Serial.println("✅ Pump turned ON (via MQTT)");
    } else if (action == "pump_off") {
      digitalWrite(PIN_RELAY_1, HIGH);
      Serial.println("✅ Pump turned OFF (via MQTT)");
    } else if (action == "relay2_on") {
      digitalWrite(PIN_RELAY_2, LOW);
      Serial.println("✅ Relay 2 turned ON (via MQTT)");
    } else if (action == "relay2_off") {
      digitalWrite(PIN_RELAY_2, HIGH);
      Serial.println("✅ Relay 2 turned OFF (via MQTT)");
    }
  }
}

/**
 * Xử lý cấu hình từ Backend
 * @param message JSON string chứa cấu hình
 */
void handleConfig(String message) {
  // Parse JSON và cập nhật cấu hình
  Serial.println("📋 Config received (not implemented yet)");
  // Có thể lưu config vào EEPROM hoặc biến toàn cục
}

#endif

