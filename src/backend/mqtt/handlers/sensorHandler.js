/**
 * Sensor Data Handler
 * Xử lý dữ liệu sensor nhận được từ ESP32 qua MQTT
 */

const SensorData = require('../../models/SensorData');
const Device = require('../../models/Device');
const deviceHandler = require('./deviceHandler');

// Helper: ép kiểu số và giới hạn phạm vi
const toNumber = (value, min = -Infinity, max = Infinity) => {
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  return Math.min(Math.max(num, min), max);
};

class SensorHandler {
  /**
   * Xử lý dữ liệu sensor từ thiết bị
   * @param {string} deviceId - ID của thiết bị
   * @param {object} data - Dữ liệu sensor
   */
  async handle(deviceId, data) {
    try {
      console.log(`Sensor data from ${deviceId}:`, data);

      // Validate device exists
      const device = await Device.findByDeviceId(deviceId);
      if (!device) {
        console.warn(`Device ${deviceId} not found in database`);
        return;
      }

      // Chuẩn hóa dữ liệu số
      const temperature = toNumber(data.temperature);
      const humidity = toNumber(data.humidity, 0, 100);
      const soilMoisture = toNumber(data.soilMoisture, 0, 100);

      // Xử lý timestamp: ESP32 KHÔNG gửi timestamp, backend tự tạo
      // MongoDB sẽ lưu dưới dạng UTC
      const timestamp = new Date(); // Tạo timestamp hiện tại (UTC)

      // Tạo sensor data record (mapping đúng field trong DB)
      const sensorData = {
        deviceId: device._id,
        temperature,
        humidity,
        soil_moisture: soilMoisture, // Map từ soilMoisture sang soil_moisture
        weather_condition: data.isRain ? 'rain' : 'clear', // Map isRain sang weather_condition
        timestamp: timestamp,
      };

      // Lưu vào database
      await SensorData.create(sensorData);

      // Cập nhật trạng thái online khi nhận sensor data (thiết bị đang hoạt động)
      // Gọi handleOnline để cập nhật lastSeen và status = online
      await deviceHandler.handleOnline(deviceId, { timestamp: sensorData.timestamp });

      // Có thể thêm logic xử lý khác ở đây
      // Ví dụ: Kiểm tra ngưỡng, gửi cảnh báo, trigger automation, etc.

    } catch (error) {
      console.error(`Error handling sensor data from ${deviceId}:`, error);
    }
  }
}

module.exports = new SensorHandler();

