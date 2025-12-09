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
  http.setTimeout(120000); // 120 seconds (2 phút) cho file lớn
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS); // Follow redirects (302, 301, etc.)
  
  // Start download
  int httpCode = http.GET();
  
  Serial.print("HTTP Code: ");
  Serial.println(httpCode);
  
  // Xử lý redirect (301, 302, 303, 307)
  if (httpCode == HTTP_CODE_MOVED_PERMANENTLY || httpCode == HTTP_CODE_FOUND || httpCode == HTTP_CODE_TEMPORARY_REDIRECT || httpCode == 303) {
    String location = http.header("Location");
    Serial.print("⚠️  Redirect detected. New location: ");
    Serial.println(location);
    
    http.end();
    
    // Thử lại với URL mới
    if (location.length() > 0) {
      Serial.println("🔄 Retrying with redirect URL...");
      http.begin(location);
      http.setTimeout(120000);
      http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
      httpCode = http.GET();
      Serial.print("HTTP Code (after redirect): ");
      Serial.println(httpCode);
    }
  }
  
  if (httpCode != HTTP_CODE_OK) {
    Serial.print("❌ HTTP Error: ");
    Serial.println(httpCode);
    
    // Giải thích mã lỗi
    switch(httpCode) {
      case HTTP_CODE_MOVED_PERMANENTLY:
        Serial.println("   → 301: Moved Permanently (redirect)");
        break;
      case HTTP_CODE_FOUND:
        Serial.println("   → 302: Found (redirect)");
        break;
      case HTTP_CODE_TEMPORARY_REDIRECT:
        Serial.println("   → 307: Temporary Redirect");
        break;
      case 303:
        Serial.println("   → 303: See Other (redirect - chuyển sang GET)");
        break;
      case HTTP_CODE_BAD_REQUEST:
        Serial.println("   → 400: Bad Request (URL sai)");
        break;
      case HTTP_CODE_UNAUTHORIZED:
        Serial.println("   → 401: Unauthorized (cần authentication)");
        break;
      case HTTP_CODE_FORBIDDEN:
        Serial.println("   → 403: Forbidden (không có quyền)");
        break;
      case HTTP_CODE_NOT_FOUND:
        Serial.println("   → 404: Not Found (file không tồn tại)");
        break;
      default:
        Serial.println("   → Unknown error");
    }
    
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
  unsigned long lastActivity = millis();
  unsigned long lastProgress = millis();
  const unsigned long TIMEOUT_MS = 60000; // 1 phút timeout nếu không có data
  const unsigned long PROGRESS_INTERVAL = 5000; // Hiển thị progress mỗi 5 giây
  
  // Forward declaration
  extern PubSubClient mqttClient;
  
  Serial.print("📊 Starting download... Total: ");
  Serial.print(totalSize);
  Serial.println(" bytes");
  
  while (http.connected() && (written < totalSize)) {
    // Kiểm tra timeout - nếu không có data trong 1 phút
    if (millis() - lastActivity > TIMEOUT_MS) {
      Serial.println("❌ Download timeout! No data received for 1 minute.");
      Serial.print("Downloaded: ");
      Serial.print(written);
      Serial.print("/");
      Serial.println(totalSize);
      Update.abort();
      http.end();
      return;
    }
    
    // Kiểm tra WiFi connection
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("❌ WiFi disconnected during download!");
      Update.abort();
      http.end();
      return;
    }
    
    // Read available data
    size_t available = stream->available();
    
    if (available) {
      lastActivity = millis(); // Reset timeout
      
      int c = stream->readBytes(buffer, ((available > sizeof(buffer)) ? sizeof(buffer) : available));
      
      if (c > 0) {
        // Write to flash
        size_t writtenBytes = Update.write(buffer, c);
        if (writtenBytes != c) {
          Serial.print("❌ Flash write error! Expected: ");
          Serial.print(c);
          Serial.print(", Written: ");
          Serial.println(writtenBytes);
          Update.abort();
          http.end();
          return;
        }
        
        written += writtenBytes;
        
        // Print progress mỗi 5 giây hoặc mỗi 10KB
        unsigned long now = millis();
        if ((now - lastProgress > PROGRESS_INTERVAL) || (written % 10000 == 0) || (written == totalSize)) {
          int progress = (written * 100) / totalSize;
          Serial.print("📊 Progress: ");
          Serial.print(progress);
          Serial.print("% (");
          Serial.print(written);
          Serial.print("/");
          Serial.print(totalSize);
          Serial.print(" bytes) - ");
          Serial.print((written * 1000) / (now - (millis() - (now - lastProgress)))); // bytes/second estimate
          Serial.println(" bytes/s");
          lastProgress = now;
        }
      }
    } else {
      // Không có data, đợi một chút
      delay(10);
    }
    
    // Maintain MQTT connection (nhưng không block)
    mqttClient.loop();
    
    // Yield để tránh watchdog timeout
    yield();
  }
  
  // Kiểm tra xem đã download đủ chưa
  if (written < totalSize) {
    Serial.print("❌ Download incomplete! Expected: ");
    Serial.print(totalSize);
    Serial.print(", Got: ");
    Serial.println(written);
    Serial.println("Possible reasons: Connection lost, server closed connection, or timeout");
    Update.abort();
    http.end();
    return;
  }
  
  Serial.print("✅ Download complete! Total: ");
  Serial.print(written);
  Serial.println(" bytes");
  
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

