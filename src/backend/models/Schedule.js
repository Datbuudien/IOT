const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');

/**
 * Schedule Model
 * Xử lý tất cả database operations liên quan đến lịch tưới tự động
 */
class Schedule {
  constructor() {
    this.collectionName = 'schedules';
  }

  // Lấy collection
  getCollection() {
    const db = getDB();
    return db.collection(this.collectionName);
  }

  // Tạo lịch tưới mới
  async create(scheduleData, userId) {
    const collection = this.getCollection();
    
    const newSchedule = {
      deviceId: new ObjectId(scheduleData.deviceId),
      userId: userId,
      name: scheduleData.name,
      description: scheduleData.description || '',
      startTime: scheduleData.startTime,
      duration: scheduleData.duration,
      daysOfWeek: scheduleData.daysOfWeek,
      isActive: scheduleData.isActive !== undefined ? scheduleData.isActive : true,
      lastRun: null,
      nextRun: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(newSchedule);
    return {
      _id: result.insertedId,
      ...newSchedule
    };
  }

  // Lấy tất cả lịch của user
  async findByUserId(userId) {
    const collection = this.getCollection();
    return await collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  // Lấy lịch của một device cụ thể
  async findByDeviceId(deviceId, userId) {
    const collection = this.getCollection();
    return await collection
      .find({ 
        deviceId: new ObjectId(deviceId),
        userId 
      })
      .sort({ createdAt: -1 })
      .toArray();
  }

  // Lấy lịch theo ID
  async findById(scheduleId, userId) {
    const collection = this.getCollection();
    return await collection.findOne({
      _id: new ObjectId(scheduleId),
      userId
    });
  }

  // Cập nhật lịch
  async update(scheduleId, userId, updateData) {
    const collection = this.getCollection();
    
    const updateFields = { ...updateData };
    
    // Convert deviceId if present
    if (updateFields.deviceId) {
      updateFields.deviceId = new ObjectId(updateFields.deviceId);
    }
    
    updateFields.updatedAt = new Date();

    const result = await collection.findOneAndUpdate(
      { 
        _id: new ObjectId(scheduleId),
        userId 
      },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    return result.value;
  }

  // Xóa lịch
  async delete(scheduleId, userId) {
    const collection = this.getCollection();
    const result = await collection.deleteOne({
      _id: new ObjectId(scheduleId),
      userId
    });
    return result.deletedCount > 0;
  }

  // Toggle trạng thái active
  async toggleActive(scheduleId, userId) {
    const collection = this.getCollection();
    
    const schedule = await this.findById(scheduleId, userId);
    if (!schedule) return null;

    const result = await collection.findOneAndUpdate(
      { 
        _id: new ObjectId(scheduleId),
        userId 
      },
      { 
        $set: { 
          isActive: !schedule.isActive,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    return result.value;
  }

  // Lấy tất cả lịch active cần chạy
  async findActiveSchedules() {
    const collection = this.getCollection();
    return await collection
      .find({ isActive: true })
      .toArray();
  }

  // Cập nhật thời gian chạy
  async updateRunTimes(scheduleId, lastRun, nextRun) {
    const collection = this.getCollection();
    await collection.updateOne(
      { _id: new ObjectId(scheduleId) },
      { 
        $set: { 
          lastRun,
          nextRun,
          updatedAt: new Date()
        }
      }
    );
  }

  // Lấy lịch sử thực thi
  async getExecutionHistory(scheduleId, userId, limit = 50) {
    const db = getDB();
    const historyCollection = db.collection('schedule_executions');
    
    return await historyCollection
      .find({ 
        scheduleId: new ObjectId(scheduleId),
        userId 
      })
      .sort({ executedAt: -1 })
      .limit(limit)
      .toArray();
  }

  // Lưu lịch sử thực thi
  async logExecution(scheduleId, userId, deviceId, success, message = '') {
    const db = getDB();
    const historyCollection = db.collection('schedule_executions');
    
    await historyCollection.insertOne({
      scheduleId: new ObjectId(scheduleId),
      userId,
      deviceId: new ObjectId(deviceId),
      success,
      message,
      executedAt: new Date()
    });
  }
}

module.exports = new Schedule();
