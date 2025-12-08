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
    return await collection.find({ userId }).toArray();
  }

  // Tìm device theo ID và userId
  async findById(deviceId, userId) {
    const collection = this.getCollection();
    return await collection.findOne({
      _id: new ObjectId(deviceId),
      userId
    });
  }

  // Tạo device mới
  async create(deviceData) {
    const collection = this.getCollection();
    
    const newDevice = {
      userId: deviceData.userId,
      deviceId: deviceData.deviceId,
      pumpStatus: deviceData.pumpStatus !== undefined ? deviceData.pumpStatus : false,
      mode: deviceData.mode || 'manual',
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
    return await collection.findOne({ deviceId });
  }
}

module.exports = new Device();
