/**
 * Sensor Data Handler
 * Xử lý dữ liệu sensor nhận được từ ESP32 qua MQTT
 */

const SensorData = require('../../models/SensorData');
const Device = require('../../models/Device');

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
      console.log(`📊 Sensor data from ${deviceId}:`, data);

      // Validate device exists
      const device = await Device.findByDeviceId(deviceId);
      if (!device) {
        console.warn(`⚠️  Device ${deviceId} not found in database`);
        return;
      }

      // Chuẩn hóa dữ liệu số
      const temperature = toNumber(data.temperature);
      const humidity = toNumber(data.humidity, 0, 100);
      const soilMoisture = toNumber(data.soilMoisture, 0, 100);

      // Xử lý timestamp: ESP32 có thể gửi millis() thay vì Unix timestamp
      // Validate timestamp hợp lệ (phải là Unix timestamp trong khoảng hợp lý)
      let timestamp = new Date();
      if (data.timestamp) {
        const ts = Number(data.timestamp);
        // Kiểm tra nếu là Unix timestamp hợp lệ (milliseconds từ 2020-01-01 đến hiện tại)
        const minTimestamp = new Date('2020-01-01').getTime();
        const maxTimestamp = Date.now() + 86400000; // Cho phép sai lệch 1 ngày trong tương lai
        
        if (!Number.isNaN(ts) && ts >= minTimestamp && ts <= maxTimestamp) {
          // Timestamp hợp lệ (Unix timestamp milliseconds)
          timestamp = new Date(ts);
        } else if (!Number.isNaN(ts) && ts < 1000000000) {
          // Nếu timestamp < 1000000000, có thể là Unix timestamp seconds, convert sang milliseconds
          const tsMs = ts * 1000;
          if (tsMs >= minTimestamp && tsMs <= maxTimestamp) {
            timestamp = new Date(tsMs);
          }
          // Nếu vẫn không hợp lệ, dùng thời gian hiện tại (đã set ở trên)
        } else {
          // Timestamp không hợp lệ (có thể là millis() từ ESP32), dùng thời gian hiện tại
          console.warn(`⚠️  Invalid timestamp from ${deviceId}: ${data.timestamp}, using current time`);
        }
      }

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

      // Có thể thêm logic xử lý khác ở đây
      // Ví dụ: Kiểm tra ngưỡng, gửi cảnh báo, trigger automation, etc.

    } catch (error) {
      console.error(`❌ Error handling sensor data from ${deviceId}:`, error);
    }
  }
}

module.exports = new SensorHandler();

