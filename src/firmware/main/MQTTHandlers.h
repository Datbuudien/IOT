/**
 * MQTT Message Handlers
 * Xử lý các lệnh và cấu hình nhận được từ MQTT
 */

#ifndef MQTT_HANDLERS_H
#define MQTT_HANDLERS_H

#include <Arduino_JSON.h>
#include <HTTPClient.h>
#include <Update.h>
#include <WiFi.h>
#include "Config.h"

// Forward declaration
void performOTAUpdate(String firmwareUrl, int expectedSize, String version);

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
  // Parse JSON
  JSONVar doc = JSON.parse(message);
  
  if (JSON.typeof(doc) == "undefined") {
    Serial.println("❌ JSON parse error in config");
    return;
  }
  
  // Cập nhật mode nếu có trong config
  if (doc.hasOwnProperty("mode")) {
    String newMode = (const char*)doc["mode"];
    
    // Validate mode
    if (newMode == "auto" || newMode == "manual" || newMode == "schedule") {
      // Khai báo extern để truy cập biến toàn cục từ Config.h
      extern String deviceMode;
      deviceMode = newMode;
      Serial.print("✅ Mode updated to: ");
      Serial.println(deviceMode);
      
      // Log giải thích mode
      if (deviceMode == "manual") {
        Serial.println("📌 Chế độ THỦ CÔNG: Logic tự động đã TẮT, chỉ điều khiển qua MQTT command");
      } else if (deviceMode == "auto") {
        Serial.println("📌 Chế độ TỰ ĐỘNG: Logic tự động đã BẬT, điều khiển dựa trên sensor");
      } else if (deviceMode == "schedule") {
        Serial.println("📌 Chế độ LỊCH TRÌNH: Logic tự động đã TẮT, điều khiển theo lịch từ Backend");
      }
    } else {
      Serial.print("⚠️  Invalid mode: ");
      Serial.println(newMode);
    }
  } else {
    Serial.println("📋 Config received but no 'mode' field found");
  }
}

/**
 * Xử lý firmware update từ Backend
 * @param message JSON string chứa thông tin firmware update
 */
void handleFirmwareUpdate(String message) {
  // Parse JSON
  JSONVar doc = JSON.parse(message);
  
  if (JSON.typeof(doc) == "undefined") {
    Serial.println("❌ JSON parse error in firmware update");
    return;
  }
  
  Serial.println("📦 Firmware update received!");
  
  String version = "";
  String firmwareUrl = "";
  int firmwareSize = 0;
  String checksum = "";
  
  if (doc.hasOwnProperty("version")) {
    version = (const char*)doc["version"];
    Serial.print("Version: ");
    Serial.println(version);
  }
  
  if (doc.hasOwnProperty("firmwareUrl")) {
    firmwareUrl = (const char*)doc["firmwareUrl"];
    Serial.print("Firmware URL: ");
    Serial.println(firmwareUrl);
  }
  
  if (doc.hasOwnProperty("firmwareSize")) {
    firmwareSize = (int)doc["firmwareSize"];
    Serial.print("Firmware Size: ");
    Serial.print(firmwareSize);
    Serial.println(" bytes");
  }
  
  if (doc.hasOwnProperty("checksum")) {
    checksum = (const char*)doc["checksum"];
    Serial.print("Checksum: ");
    Serial.println(checksum);
  }
  
  if (doc.hasOwnProperty("action") && String((const char*)doc["action"]) == "start_update") {
    Serial.println("🚀 Starting OTA firmware update...");
    
    // Thực hiện OTA update
    performOTAUpdate(firmwareUrl, firmwareSize, version);
  }
}

/**
 * Thực hiện OTA update: download và flash firmware
 * @param firmwareUrl URL của file firmware
 * @param expectedSize Kích thước dự kiến (bytes)
 * @param version Version của firmware
 */
void performOTAUpdate(String firmwareUrl, int expectedSize, String version) {
  HTTPClient http;
  
  Serial.println("📥 Connecting to firmware server...");
  http.begin(firmwareUrl);
  
  // Set timeout
  http.setTimeout(30000); // 30 seconds
  
  // Start download
  int httpCode = http.GET();
  
  if (httpCode != HTTP_CODE_OK) {
    Serial.print("❌ HTTP Error: ");
    Serial.println(httpCode);
    http.end();
    return;
  }
  
  // Get file size
  int contentLength = http.getSize();
  if (contentLength <= 0) {
    Serial.println("❌ Invalid content length");
    http.end();
    return;
  }
  
  Serial.print("📦 Downloading firmware (");
  Serial.print(contentLength);
  Serial.println(" bytes)...");
  
  // Check if enough space
  if (expectedSize > 0 && contentLength != expectedSize) {
    Serial.print("⚠️  Warning: Size mismatch. Expected: ");
    Serial.print(expectedSize);
    Serial.print(", Got: ");
    Serial.println(contentLength);
  }
  
  // Begin OTA update
  if (!Update.begin(contentLength)) {
    Serial.print("❌ OTA begin failed. Error: ");
    Serial.println(Update.errorString());
    http.end();
    return;
  }
  
  Serial.println("📥 Downloading and flashing...");
  
  // Download and write to flash
  WiFiClient* stream = http.getStreamPtr();
  size_t written = 0;
  size_t totalSize = contentLength;
  
  uint8_t buffer[1024] = { 0 };
  
  while (http.connected() && (written < totalSize)) {
    // Read available data
    size_t available = stream->available();
    
    if (available) {
      int c = stream->readBytes(buffer, ((available > sizeof(buffer)) ? sizeof(buffer) : available));
      
      // Write to flash
      Update.write(buffer, c);
      written += c;
      
      // Print progress
      if (written % 10000 == 0 || written == totalSize) {
        int progress = (written * 100) / totalSize;
        Serial.print("📊 Progress: ");
        Serial.print(progress);
        Serial.print("% (");
        Serial.print(written);
        Serial.print("/");
        Serial.print(totalSize);
        Serial.println(" bytes)");
      }
    }
    
    delay(1);
  }
  
  http.end();
  
  // Finish update
  if (Update.end()) {
    Serial.println("✅ Firmware update successful!");
    
    if (Update.isFinished()) {
      Serial.println("✅ Update finished successfully!");
      Serial.print("📦 Firmware version: ");
      Serial.println(version);
      Serial.println("🔄 Rebooting in 3 seconds...");
      delay(3000);
      ESP.restart();
    } else {
      Serial.println("❌ Update not finished. Something went wrong!");
      Serial.print("Error: ");
      Serial.println(Update.errorString());
    }
  } else {
    Serial.print("❌ OTA update failed. Error: ");
    Serial.println(Update.errorString());
  }
}

#endif

