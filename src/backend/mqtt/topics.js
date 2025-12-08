/**
 * MQTT Topics Definition
 * Định nghĩa các MQTT topics cho hệ thống
 */

const Topics = {
  // ===== ESP32 → Backend (Publish) =====
  
  /**
   * Dữ liệu sensor từ thiết bị
   * Format: iot/device/{deviceId}/sensor/data
   * Payload: { temperature, humidity, soilMoisture, isRain, timestamp }
   */
  SENSOR_DATA: (deviceId) => `iot/device/${deviceId}/sensor/data`,
  
  /**
   * Trạng thái thiết bị (online/offline)
   * Format: iot/device/{deviceId}/status
   * Payload: { status: "online" | "offline", timestamp }
   */
  DEVICE_STATUS: (deviceId) => `iot/device/${deviceId}/status`,
  
  /**
   * Heartbeat từ thiết bị
   * Format: iot/device/{deviceId}/heartbeat
   * Payload: { timestamp }
   */
  DEVICE_HEARTBEAT: (deviceId) => `iot/device/${deviceId}/heartbeat`,
  
  // ===== Backend → ESP32 (Subscribe) =====
  
  /**
   * Lệnh điều khiển thiết bị
   * Format: iot/device/{deviceId}/command
   * Payload: { action: "pump_on" | "pump_off" | "light_on" | "light_off", ... }
   */
  DEVICE_COMMAND: (deviceId) => `iot/device/${deviceId}/command`,
  
  /**
   * Cấu hình thiết bị
   * Format: iot/device/{deviceId}/config
   * Payload: { threshold: {...}, schedule: {...}, ... }
   */
  DEVICE_CONFIG: (deviceId) => `iot/device/${deviceId}/config`,

  /**
   * Firmware update cho thiết bị
   * Format: iot/device/{deviceId}/firmware/update
   * Payload: { version, firmwareUrl, firmwareSize, checksum, action: "start_update" }
   */
  FIRMWARE_UPDATE: (deviceId) => `iot/device/${deviceId}/firmware/update`,
  
  // ===== Wildcard patterns (để subscribe nhiều thiết bị) =====
  
  /**
   * Subscribe tất cả sensor data từ mọi thiết bị
   * Pattern: iot/device/+/sensor/data
   */
  ALL_SENSOR_DATA: 'iot/device/+/sensor/data',
  
  /**
   * Subscribe tất cả status từ mọi thiết bị
   * Pattern: iot/device/+/status
   */
  ALL_DEVICE_STATUS: 'iot/device/+/status',
  
  /**
   * Subscribe tất cả heartbeat từ mọi thiết bị
   * Pattern: iot/device/+/heartbeat
   */
  ALL_DEVICE_HEARTBEAT: 'iot/device/+/heartbeat',
};

module.exports = Topics;

