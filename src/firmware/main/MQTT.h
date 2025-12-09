/**
 * MQTT Communication Module
 * Xử lý kết nối và giao tiếp MQTT
 */

#ifndef MQTT_H
#define MQTT_H

#include <PubSubClient.h>
#include <WiFi.h>
#include <Arduino_JSON.h>
#include "Config.h"

// Forward declarations (khai báo trong main.ino)
extern WiFiClient espClient;
extern PubSubClient mqttClient;
extern String topicSensorData;
extern String topicStatus;
extern String topicPumpStatus;
extern String topicCommand;
extern String topicConfig;
extern String topicFirmware;

// Forward declarations cho các hàm (phải khai báo trước khi sử dụng)
void handleCommand(String message);
void handleConfig(String message);
void handleFirmwareUpdate(String message);
void publishStatus(String status);
void reconnectMQTT();
void mqttCallback(char* topic, byte* payload, unsigned int length);

/**
 * Khởi tạo MQTT
 */
void setupMQTT() {
  // Kiểm tra WiFi trước
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Cannot setup MQTT.");
    return;
  }
  
  // Khởi tạo topics
  topicSensorData = "iot/device/" + String(deviceId) + "/sensor/data";
  topicStatus = "iot/device/" + String(deviceId) + "/status";
  topicPumpStatus = "iot/device/" + String(deviceId) + "/heartbeat"; // Dùng heartbeat topic để backend nhận được
  topicCommand = "iot/device/" + String(deviceId) + "/command";
  topicConfig = "iot/device/" + String(deviceId) + "/config";
  topicFirmware = "iot/device/" + String(deviceId) + "/firmware/update";
  
  // Cấu hình MQTT client
  mqttClient.setServer(mqtt_broker, mqtt_port);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(1024); // Tăng buffer size
  mqttClient.setKeepAlive(60); // Keepalive 60 giây
  
  Serial.print("📡 MQTT configured: ");
  Serial.print(mqtt_broker);
  Serial.print(":");
  Serial.println(mqtt_port);
  
  // Kết nối
  reconnectMQTT();
}

/**
 * Kết nối lại MQTT nếu mất kết nối
 */
void reconnectMQTT() {
  // Kiểm tra WiFi trước
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Reconnecting...");
    setupWiFi();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi connection failed. Cannot connect to MQTT.");
      return;
    }
  }
  
  while (!mqttClient.connected()) {
    Serial.print("🔌 Connecting to MQTT broker (");
    Serial.print(mqtt_broker);
    Serial.print(":");
    Serial.print(mqtt_port);
    Serial.print(")...");
    
    String clientId = "ESP32-" + String(deviceId) + "-" + String(random(0xffff), HEX);
    Serial.print(" ClientID: ");
    Serial.print(clientId);
    Serial.print(" ... ");
    
    // Thử kết nối với timeout
    bool connected = mqttClient.connect(clientId.c_str());
    
    if (connected) {
      Serial.println("✅ MQTT connected");
      
      // Subscribe topics để nhận lệnh
      mqttClient.subscribe(topicCommand.c_str());
      mqttClient.subscribe(topicConfig.c_str());
      mqttClient.subscribe(topicFirmware.c_str());
      Serial.println("📡 Subscribed to command topics");
      
      // Gửi trạng thái online
      publishStatus("online");
      
    } else {
      int state = mqttClient.state();
      Serial.print("Failed, rc=");
      Serial.print(state);
      
      // Giải thích mã lỗi
      switch(state) {
        case -4: Serial.print(" (MQTT_CONNECTION_TIMEOUT)"); break;
        case -3: Serial.print(" (MQTT_CONNECTION_LOST)"); break;
        case -2: Serial.print(" (MQTT_CONNECT_FAILED)"); break;
        case -1: Serial.print(" (MQTT_DISCONNECTED)"); break;
        case 1: Serial.print(" (MQTT_CONNECT_BAD_PROTOCOL)"); break;
        case 2: Serial.print(" (MQTT_CONNECT_BAD_CLIENT_ID)"); break;
        case 3: Serial.print(" (MQTT_CONNECT_UNAVAILABLE)"); break;
        case 4: Serial.print(" (MQTT_CONNECT_BAD_CREDENTIALS)"); break;
        case 5: Serial.print(" (MQTT_CONNECT_UNAUTHORIZED)"); break;
      }
      
      Serial.print(" | WiFi Status: ");
      Serial.print(WiFi.status());
      Serial.print(" | IP: ");
      Serial.print(WiFi.localIP());
      Serial.println(" | Retrying in 5 seconds...");
      delay(5000);
    }
  }
}

/**
 * Callback khi nhận message từ MQTT
 */
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  // Convert payload to string
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.print("📥 Message received on topic: ");
  Serial.print(topic);
  Serial.print(" - Message: ");
  Serial.println(message);
  
  // Parse JSON và xử lý lệnh
  if (String(topic) == topicCommand) {
    handleCommand(message);
  } else if (String(topic) == topicConfig) {
    handleConfig(message);
  } else if (String(topic) == topicFirmware) {
    handleFirmwareUpdate(message);
  }
}

/**
 * Gửi dữ liệu sensor qua MQTT
 */
void publishSensorData(int temperature, int humidity, int soilMoisture, bool isRain) {
  if (!mqttClient.connected()) {
    return;
  }
  
  // Tạo JSON payload
  // LƯU Ý: Không gửi timestamp vì ESP32 không có NTP
  // Backend sẽ tự tạo timestamp khi nhận dữ liệu
  JSONVar doc;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["soilMoisture"] = soilMoisture;
  doc["isRain"] = isRain;
  // Không gửi timestamp - backend sẽ tự tạo để đảm bảo chính xác
  
  String payload = JSON.stringify(doc);
  
  // Publish
  if (mqttClient.publish(topicSensorData.c_str(), payload.c_str())) {
    Serial.println("Sensor data published");
  } else {
    Serial.println("Failed to publish sensor data");
  }
}

/**
 * Gửi trạng thái thiết bị
 */
void publishStatus(String status) {
  if (!mqttClient.connected()) {
    return;
  }
  
  JSONVar doc;
  doc["status"] = status;
  doc["timestamp"] = (int)millis();
  
  String payload = JSON.stringify(doc);
  
  mqttClient.publish(topicStatus.c_str(), payload.c_str());
}

/**
 * Gửi heartbeat
 */
void publishPumpStatus() {
  if (!mqttClient.connected()) {
    return;
  }
  
  // Đọc trạng thái relay1 (LOW = đang hoạt động, HIGH = tắt)
  int relay1State = digitalRead(PIN_RELAY_1);
  bool relay1Active = (relay1State == LOW); // LOW = đang hoạt động
  
  JSONVar doc;
  doc["relay1Status"] = relay1Active; // true = đang hoạt động (LOW), false = tắt (HIGH)
  doc["timestamp"] = (int)millis();
  String payload = JSON.stringify(doc);
  
  // Debug: Log payload trước khi gửi

  
  mqttClient.publish(topicPumpStatus.c_str(), payload.c_str());
}

#endif

