/**
 * MQTT Configuration
 * Cấu hình kết nối MQTT Broker
 */

require('dotenv').config();

const mqttConfig = {
  // MQTT Broker connection
  // Tạm thời dùng broker công cộng để test (không cần cài đặt)
  broker: process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com:1883',
  // Sau khi cài Mosquitto, đổi lại thành: 'mqtt://localhost:1883'
  
  // Authentication (nếu có)
  username: process.env.MQTT_USERNAME || '',
  password: process.env.MQTT_PASSWORD || '',
  
  // Client options
  clientId: `iot-backend-${Date.now()}`,
  
  // Connection options
  options: {
    clean: true,              // Clean session
    reconnectPeriod: 1000,     // Reconnect interval (ms)
    connectTimeout: 30 * 1000, // Connection timeout (30s)
    keepalive: 60,            // Keep alive interval (s)
    qos: 1,                   // Quality of Service (0, 1, 2)
  },
  
  // Topics
  topics: {
    // ESP32 publish topics (thiết bị gửi dữ liệu)
    sensorData: 'iot/device/+/sensor/data',      // + = deviceId
    deviceStatus: 'iot/device/+/status',         // Trạng thái thiết bị
    deviceOnline: 'iot/device/+/online',         // Thiết bị online/offline
    
    // Backend publish topics (điều khiển thiết bị)
    deviceCommand: 'iot/device/+/command',       // Lệnh điều khiển
    deviceConfig: 'iot/device/+/config',        // Cấu hình thiết bị
  },
};

module.exports = mqttConfig;

