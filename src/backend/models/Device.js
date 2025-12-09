const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');

/**
 * Device Model
 * Xử lý tất cả database operations liên quan đến devices
 */
class Device {
  constructor() {
    this.collectionName = 'devices';
  }

  // Lấy collection
  getCollection() {
    const db = getDB();
    return db.collection(this.collectionName);
  }

  // Tìm tất cả devices của user
  async findByUserId(userId) {
    const collection = this.getCollection();
    const devices = await collection.find({ userId }).toArray();
    // Đảm bảo relay1Status luôn có giá trị (mặc định false nếu không có)
    return devices.map(device => ({
      ...device,
      relay1Status: device.relay1Status !== undefined ? device.relay1Status : false
    }));
  }

  // Tìm device theo ID và userId
  async findById(deviceId, userId) {
    const collection = this.getCollection();
    const device = await collection.findOne({
      _id: new ObjectId(deviceId),
      userId
    });
    // Đảm bảo relay1Status luôn có giá trị (mặc định false nếu không có)
    if (device) {
      device.relay1Status = device.relay1Status !== undefined ? device.relay1Status : false;
    }
    return device;
  }

  // Tạo device mới
  async create(deviceData) {
    const collection = this.getCollection();
    
    const newDevice = {
      userId: deviceData.userId,
      deviceId: deviceData.deviceId,
      pumpStatus: deviceData.pumpStatus !== undefined ? deviceData.pumpStatus : false,
      relay1Status: deviceData.relay1Status !== undefined ? deviceData.relay1Status : false, // Mặc định false (tắt/HIGH)
      mode: deviceData.mode || 'manual',
      status: deviceData.status || 'offline', // Mặc định offline khi tạo mới
      lastSeen: deviceData.lastSeen || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(newDevice);
    return {
      _id: result.insertedId,
      ...newDevice
    };
  }

  // Cập nhật device
  async update(deviceId, userId, updateData) {
    const collection = this.getCollection();
    
    const result = await collection.updateOne(
      {
        _id: new ObjectId(deviceId),
        userId
      },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );

    return result;
  }

  // Xóa device
  async delete(deviceId, userId) {
    const collection = this.getCollection();
    
    const result = await collection.deleteOne({
      _id: new ObjectId(deviceId),
      userId
    });

    return result;
  }

  // Đếm số lượng devices của user
  async countByUserId(userId) {
    const collection = this.getCollection();
    return await collection.countDocuments({ userId });
  }

  // Lấy devices theo trạng thái bơm
  async findByPumpStatus(userId, pumpStatus) {
    const collection = this.getCollection();
    return await collection.find({ userId, pumpStatus }).toArray();
  }

  // Cập nhật trạng thái bơm
  async updatePumpStatus(deviceId, userId, pumpStatus) {
    const collection = this.getCollection();
    
    const result = await collection.updateOne(
      {
        _id: new ObjectId(deviceId),
        userId
      },
      {
        $set: {
          pumpStatus,
          updatedAt: new Date()
        }
      }
    );

    return result;
  }

  // Tìm device theo deviceId (mã thiết bị)
  async findByDeviceId(deviceId) {
    const collection = this.getCollection();
    const device = await collection.findOne({ deviceId });
    // Đảm bảo relay1Status luôn có giá trị (mặc định false nếu không có)
    if (device) {
      device.relay1Status = device.relay1Status !== undefined ? device.relay1Status : false;
    }
    return device;
  }

  // Cập nhật trạng thái online/offline và lastSeen
  async updateStatus(deviceId, userId, status, lastSeen) {
    const collection = this.getCollection();
    
    const result = await collection.updateOne(
      {
        _id: new ObjectId(deviceId),
        userId
      },
      {
        $set: {
          status: status || 'online',
          lastSeen: lastSeen || new Date(),
          updatedAt: new Date()
        }
      }
    );

    return result;
  }

  // Cập nhật trạng thái relay1 (true = đang hoạt động/LOW, false = tắt/HIGH)
  async updateRelay1Status(deviceId, userId, relay1Status) {
    const collection = this.getCollection();
    
    const result = await collection.updateOne(
      {
        _id: new ObjectId(deviceId),
        userId
      },
      {
        $set: {
          relay1Status: relay1Status, // true = đang hoạt động (LOW), false = tắt (HIGH)
          updatedAt: new Date()
        }
      }
    );

    return result;
  }

  // Đánh dấu tất cả devices offline nếu không nhận heartbeat trong X phút
  async markOfflineDevices(timeoutMinutes = 1) {
    const collection = this.getCollection();
    const now = new Date();
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const cutoffTime = new Date(now.getTime() - timeoutMs);
    
    // Tìm tất cả devices có lastSeen < cutoffTime và status = 'online'
    const result = await collection.updateMany(
      {
        status: 'online',
        $or: [
          { lastSeen: { $lt: cutoffTime } },
          { lastSeen: null }
        ]
      },
      {
        $set: {
          status: 'offline',
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`🔴 Marked ${result.modifiedCount} device(s) as offline (no heartbeat for ${timeoutMinutes} minute(s))`);
    }

    return result;
  }
}

module.exports = new Device();
