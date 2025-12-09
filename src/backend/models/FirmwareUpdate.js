const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');

/**
 * FirmwareUpdate Model
 * Xử lý tất cả database operations liên quan đến firmware updates
 */
class FirmwareUpdate {
  constructor() {
    this.collectionName = 'firmware_updates';
  }

  // Lấy collection
  getCollection() {
    const db = getDB();
    return db.collection(this.collectionName);
  }

  // Tạo firmware update mới
  async create(firmwareData) {
    const collection = this.getCollection();
    
    const newFirmware = {
      version: firmwareData.version,
      description: firmwareData.description || '',
      firmwareUrl: firmwareData.firmwareUrl, // URL hoặc path đến file firmware
      firmwareSize: firmwareData.firmwareSize || 0, // Kích thước file (bytes)
      checksum: firmwareData.checksum || '', // MD5 hoặc SHA256 checksum
      createdBy: new ObjectId(firmwareData.createdBy), // Admin ID
      status: 'pending', // pending, active, rejected, completed
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(newFirmware);
    return {
      _id: result.insertedId,
      ...newFirmware
    };
  }

  // Lấy tất cả firmware updates
  async findAll(limit = 50) {
    const collection = this.getCollection();
    return await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  // Lấy firmware update theo ID
  async findById(firmwareId) {
    const collection = this.getCollection();
    return await collection.findOne({ _id: new ObjectId(firmwareId) });
  }

  // Lấy firmware update đang pending cho user
  async findPendingForUser(userId) {
    const collection = this.getCollection();
    const db = getDB();
    
    // Lấy tất cả firmware đang pending
    const pendingFirmwares = await collection
      .find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .toArray();

    // Kiểm tra xem user đã accept/reject chưa
    const userResponsesCollection = db.collection('firmware_user_responses');
    
    const userResponses = await userResponsesCollection
      .find({ userId: new ObjectId(userId) })
      .toArray();
    
    const responseMap = {};
    userResponses.forEach(response => {
      responseMap[response.firmwareId.toString()] = response;
    });

    // Lọc ra những firmware user chưa respond
    return pendingFirmwares.filter(fw => !responseMap[fw._id.toString()]);
  }

  // Cập nhật firmware update
  async update(firmwareId, updateData) {
    const collection = this.getCollection();
    
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(firmwareId) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    return result.value;
  }

  // Lưu response của user (accept/reject)
  async saveUserResponse(firmwareId, userId, response) {
    const db = getDB();
    const responsesCollection = db.collection('firmware_user_responses');
    
    // Kiểm tra xem user đã respond chưa
    const existingResponse = await responsesCollection.findOne({
      firmwareId: new ObjectId(firmwareId),
      userId: new ObjectId(userId)
    });

    if (existingResponse) {
      // Update response
      const result = await responsesCollection.findOneAndUpdate(
        {
          firmwareId: new ObjectId(firmwareId),
          userId: new ObjectId(userId)
        },
        {
          $set: {
            response: response.response, // 'accept' hoặc 'reject'
            respondedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );
      return result.value;
    } else {
      // Tạo response mới
      const newResponse = {
        firmwareId: new ObjectId(firmwareId),
        userId: new ObjectId(userId),
        response: response.response, // 'accept' hoặc 'reject'
        respondedAt: new Date()
      };
      
      const result = await responsesCollection.insertOne(newResponse);
      return {
        _id: result.insertedId,
        ...newResponse
      };
    }
  }

  // Lấy response của user cho một firmware
  async getUserResponse(firmwareId, userId) {
    const db = getDB();
    const responsesCollection = db.collection('firmware_user_responses');
    
    return await responsesCollection.findOne({
      firmwareId: new ObjectId(firmwareId),
      userId: new ObjectId(userId)
    });
  }

  // Lấy thống kê responses cho một firmware
  async getResponseStats(firmwareId) {
    const db = getDB();
    const responsesCollection = db.collection('firmware_user_responses');
    
    const responses = await responsesCollection
      .find({ firmwareId: new ObjectId(firmwareId) })
      .toArray();
    
    const stats = {
      total: responses.length,
      accept: responses.filter(r => r.response === 'accept').length,
      reject: responses.filter(r => r.response === 'reject').length
    };
    
    return stats;
  }

  // Xóa firmware update
  async delete(firmwareId) {
    const collection = this.getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(firmwareId) });
    return result.deletedCount > 0;
  }
}

module.exports = new FirmwareUpdate();

