/**
 * MQTT Service
 * Quản lý kết nối MQTT và xử lý publish/subscribe
 */

const mqtt = require('mqtt');
const mqttConfig = require('../config/mqtt');
const Topics = require('../mqtt/topics');
const sensorHandler = require('../mqtt/handlers/sensorHandler');
const deviceHandler = require('../mqtt/handlers/deviceHandler');

class MQTTService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.subscribedTopics = new Set();
  }

  /**
   * Kết nối tới MQTT Broker
   */
  connect() {
    if (this.client && this.isConnected) {
      console.log('✅ MQTT already connected');
      return;
    }

    const options = {
      clientId: mqttConfig.clientId,
      clean: mqttConfig.options.clean,
      reconnectPeriod: mqttConfig.options.reconnectPeriod,
      connectTimeout: mqttConfig.options.connectTimeout,
      keepalive: mqttConfig.options.keepalive,
    };

    // Thêm authentication nếu có
    if (mqttConfig.username) {
      options.username = mqttConfig.username;
      options.password = mqttConfig.password;
    }

    console.log(`🔌 Connecting to MQTT broker: ${mqttConfig.broker}`);
    this.client = mqtt.connect(mqttConfig.broker, options);

    // Event handlers
    this.client.on('connect', () => {
      this.isConnected = true;
      console.log('✅ MQTT connected successfully');
      this.subscribeToDefaultTopics();
    });

    this.client.on('error', (error) => {
      console.error('❌ MQTT error:', error);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      console.log('⚠️  MQTT connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnect', () => {
      console.log('🔄 MQTT reconnecting...');
    });

    this.client.on('offline', () => {
      console.log('⚠️  MQTT client offline');
      this.isConnected = false;
    });

    // Xử lý messages
    this.client.on('message', (topic, message) => {
      this.handleMessage(topic, message);
    });
  }

  /**
   * Subscribe các topics mặc định
   */
  subscribeToDefaultTopics() {
    // Subscribe tất cả sensor data
    this.subscribe(Topics.ALL_SENSOR_DATA);
    
    // Subscribe tất cả device status
    this.subscribe(Topics.ALL_DEVICE_STATUS);
    
    // Subscribe tất cả device heartbeat (QUAN TRỌNG: để nhận relay1Status)
    this.subscribe(Topics.ALL_DEVICE_HEARTBEAT);
    
    console.log('✅ Subscribed to default MQTT topics');
  }

  /**
   * Subscribe một topic
   */
  subscribe(topic) {
    if (!this.client || !this.isConnected) {
      console.error('❌ MQTT not connected, cannot subscribe');
      return;
    }

    if (this.subscribedTopics.has(topic)) {
      return; // Đã subscribe rồi
    }

    this.client.subscribe(topic, { qos: mqttConfig.options.qos }, (error) => {
      if (error) {
        console.error(`❌ Failed to subscribe to ${topic}:`, error);
      } else {
        console.log(`📡 Subscribed to: ${topic}`);
        this.subscribedTopics.add(topic);
      }
    });
  }

  /**
   * Unsubscribe một topic
   */
  unsubscribe(topic) {
    if (!this.client || !this.isConnected) {
      return;
    }

    this.client.unsubscribe(topic, (error) => {
      if (error) {
        console.error(`❌ Failed to unsubscribe from ${topic}:`, error);
      } else {
        console.log(`📡 Unsubscribed from: ${topic}`);
        this.subscribedTopics.delete(topic);
      }
    });
  }

  /**
   * Publish message
   */
  publish(topic, payload, options = {}) {
    if (!this.client || !this.isConnected) {
      console.error('❌ MQTT not connected, cannot publish');
      return false;
    }

    const message = typeof payload === 'object' ? JSON.stringify(payload) : payload;
    const publishOptions = {
      qos: options.qos || mqttConfig.options.qos,
      retain: options.retain || false,
    };

    this.client.publish(topic, message, publishOptions, (error) => {
      if (error) {
        console.error(`❌ Failed to publish to ${topic}:`, error);
      } else {
        console.log(`📤 Published to ${topic}:`, message);
      }
    });

    return true;
  }

  /**
   * Xử lý message nhận được
   */
  handleMessage(topic, message) {
    try {
      const rawMessage = message.toString();
      
      // Debug: Log raw message cho heartbeat để kiểm tra
      if (topic.includes('/heartbeat')) {
        console.log(`📥 Raw heartbeat message:`, rawMessage);
      }
      
      const payload = JSON.parse(rawMessage);
      
      // Extract deviceId từ topic (ví dụ: iot/device/ESP32_001/sensor/data)
      const topicParts = topic.split('/');
      const deviceId = topicParts[2]; // deviceId ở vị trí thứ 3

      // Route message đến handler phù hợp
      if (topic.includes('/sensor/data')) {
        sensorHandler.handle(deviceId, payload);
      } else if (topic.includes('/heartbeat')) {
        // Heartbeat cũng cập nhật status = online
        deviceHandler.handleOnline(deviceId, payload);
      } else if (topic.includes('/status')) {
        deviceHandler.handleStatus(deviceId, payload);
      } else if (topic.includes('/online')) {
        deviceHandler.handleOnline(deviceId, payload);
      } else {
        console.log(`📥 Received message on ${topic}:`, payload);
      }
    } catch (error) {
      console.error(`❌ Error parsing message from ${topic}:`, error);
      console.error(`❌ Raw message:`, message.toString());
    }
  }

  /**
   * Gửi lệnh điều khiển đến thiết bị
   */
  sendCommand(deviceId, command) {
    const topic = Topics.DEVICE_COMMAND(deviceId);
    return this.publish(topic, command);
  }

  /**
   * Gửi cấu hình đến thiết bị
   */
  sendConfig(deviceId, config) {
    const topic = Topics.DEVICE_CONFIG(deviceId);
    return this.publish(topic, config);
  }

  /**
   * Ngắt kết nối
   */
  disconnect() {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
      console.log('✅ MQTT disconnected');
    }
  }

  /**
   * Lấy trạng thái kết nối MQTT
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      broker: mqttConfig.broker,
      subscribedTopics: Array.from(this.subscribedTopics),
      clientId: this.client ? this.client.options.clientId : null
    };
  }
}

// Export singleton instance
const mqttService = new MQTTService();
module.exports = mqttService;

