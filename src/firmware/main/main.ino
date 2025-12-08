#include <Arduino.h>
#include "Config.h"
#include "Sensors.h"
#include "WiFiModule.h"
#include "MQTT.h"
#include "MQTTHandlers.h"
#include "Control.h"
#include <DHT.h>

// ===== Biến toàn cục =====
int temperature;
int humidity;
bool isRain;
int soilMoisture;
DHT dht(PIN_DHT, DHTTYPE);

// ===== MQTT Client =====
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ===== MQTT Topics =====
String topicSensorData;
String topicStatus;
String topicHeartbeat;
String topicCommand;
String topicConfig;

// ===== Timing =====
unsigned long lastSensorPublish = 0;
const unsigned long SENSOR_PUBLISH_INTERVAL = 30000;  // Gửi dữ liệu mỗi 5 giây

unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 30000;  // Heartbeat mỗi 30 giây

unsigned long lastLoop = 0;
const unsigned long LOOP_INTERVAL = 5000;  // Logic điều khiển mỗi 5 giây

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  // Khởi tạo sensors
  dht.begin();
  initSensors();
  
  // Khởi tạo relay
  pinMode(PIN_RELAY_1, OUTPUT);
  digitalWrite(PIN_RELAY_1, HIGH);
  
  Serial.println("🚀 ESP32 Starting...");
  
  // Kết nối WiFi
  setupWiFi();
  
  // Đợi WiFi kết nối trước khi setup MQTT
  if (WiFi.status() == WL_CONNECTED) {
    // Kết nối MQTT
    setupMQTT();
    Serial.println("Setup complete!");
  } else {
    Serial.println("Setup incomplete - WiFi not connected. MQTT will retry in loop().");
  }
}

void loop() {
  // Duy trì kết nối MQTT
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();
  
  // Đọc dữ liệu sensor
  temperature = dht.readTemperature();
  humidity = dht.readHumidity();
  isRain = readRainStatus();
  soilMoisture = readSoilMoisture();
  
  // Logic điều khiển bơm
  if (millis() - lastLoop >= LOOP_INTERVAL) {
    controlPump(soilMoisture, temperature, humidity, isRain);
    lastLoop = millis();
  }
  
  // Gửi dữ liệu sensor qua MQTT định kỳ
  if (millis() - lastSensorPublish >= SENSOR_PUBLISH_INTERVAL) {
    publishSensorData(temperature, humidity, soilMoisture, isRain);
    lastSensorPublish = millis();
  }
  
  // Gửi heartbeat
  if (millis() - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    publishHeartbeat();
    lastHeartbeat = millis();
  }
  
  delay(100);
}