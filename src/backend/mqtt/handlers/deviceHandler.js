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

      // Cập nhật trạng thái và lastSeen
      const status = data.status || 'online';
      const lastSeen = new Date();
      
      await Device.updateStatus(device._id, device.userId, status, lastSeen);
      console.log(`✅ Device ${deviceId} status updated: ${status} at ${lastSeen}`);

    } catch (error) {
      console.error(`❌ Error handling device status from ${deviceId}:`, error);
    }
  }

  /**
   * Xử lý heartbeat từ thiết bị
   */
  async handleOnline(deviceId, data) {
    try {
      // Debug: Log toàn bộ payload để kiểm tra
      console.log(`💓 Heartbeat payload from ${deviceId}:`, JSON.stringify(data));
      console.log(`💓 Data keys:`, Object.keys(data));
      console.log(`💓 relay1Status value:`, data.relay1Status, `(type: ${typeof data.relay1Status})`);
      
      const device = await Device.findByDeviceId(deviceId);
      if (device) {
        const lastSeen = new Date();
        // Cập nhật lastSeen và set status = online khi nhận heartbeat
        await Device.updateStatus(device._id, device.userId, 'online', lastSeen);
        
        // Cập nhật relay1Status nếu có trong data (LOW = true = đang hoạt động, HIGH = false = tắt)
        // Kiểm tra cả boolean và string "true"/"false"
        let relay1Status = data.relay1Status;
        if (relay1Status === undefined) {
          // Thử các tên field khác có thể ESP32 gửi
          relay1Status = data.relay1_status || data.relayStatus || data.pumpStatus;
        }
        
        // Convert string "true"/"false" thành boolean nếu cần
        if (typeof relay1Status === 'string') {
          relay1Status = relay1Status.toLowerCase() === 'true' || relay1Status === '1';
        }
        
        if (relay1Status !== undefined && relay1Status !== null) {
          await Device.updateRelay1Status(device._id, device.userId, Boolean(relay1Status));
          console.log(`✅ Updated relay1Status: ${Boolean(relay1Status)}`);
        } else {
          console.log(`⚠️  relay1Status not found in heartbeat payload`);
        }
        
        console.log(`💓 Heartbeat from ${deviceId} at ${lastSeen}, relay1Status: ${relay1Status !== undefined ? relay1Status : 'N/A'}`);
      }
    } catch (error) {
      console.error(`❌ Error handling heartbeat from ${deviceId}:`, error);
    }
  }
}

module.exports = new DeviceHandler();

