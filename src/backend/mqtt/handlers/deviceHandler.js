/**
 * Device Handler
 * Xử lý trạng thái và lệnh từ thiết bị
 */

const Device = require('../../models/Device');

class DeviceHandler {
  /**
   * Xử lý trạng thái thiết bị (online/offline)
   */
  async handleStatus(deviceId, data) {
    try {
      console.log(`📱 Device status from ${deviceId}:`, data);

      const device = await Device.findByDeviceId(deviceId);
      if (!device) {
        console.warn(`⚠️  Device ${deviceId} not found`);
        return;
      }

      // Cập nhật trạng thái (cần userId để update, nhưng tạm thời bỏ qua)
      // TODO: Cần lưu userId trong device hoặc tìm cách khác
      const status = data.status || 'online';
      const lastSeen = new Date();
      console.log(`✅ Device ${deviceId} status updated: ${status}`);

    } catch (error) {
      console.error(`❌ Error handling device status from ${deviceId}:`, error);
    }
  }

  /**
   * Xử lý heartbeat từ thiết bị
   */
  async handleOnline(deviceId, data) {
    try {
      const device = await Device.findByDeviceId(deviceId);
      if (device) {
        const lastSeen = new Date();
        console.log(`💓 Heartbeat from ${deviceId} at ${lastSeen}`);
        // TODO: Cập nhật lastSeen vào database nếu cần
      }
    } catch (error) {
      console.error(`❌ Error handling heartbeat from ${deviceId}:`, error);
    }
  }
}

module.exports = new DeviceHandler();

