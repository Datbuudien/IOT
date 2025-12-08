const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');

/**
 * SensorData Model
 * Xử lý tất cả database operations liên quan đến sensor data
 */
class SensorData {
  constructor() {
    this.collectionName = 'sensordata'; // Lowercase để khớp với MongoDB convention
  }

  // Lấy collection
  getCollection() {
    const db = getDB();
    return db.collection(this.collectionName);
  }

  // Tìm tất cả sensor data của device
  async findByDeviceId(deviceId, limit = 100) {
    const collection = this.getCollection();
    return await collection
      .find({ deviceId: new ObjectId(deviceId) })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  // Lấy data mới nhất của device
  async findLatestByDeviceId(deviceId) {
    const collection = this.getCollection();
    return await collection
      .findOne(
        { deviceId: new ObjectId(deviceId) },
        { sort: { timestamp: -1 } }
      );
  }

  // Lấy tất cả data mới nhất của tất cả devices của user
  async findLatestByUserId(userId) {
    const db = getDB();
    const devicesCollection = db.collection('devices');
    
    // Lấy tất cả devices của user
    const devices = await devicesCollection
      .find({ userId })
      .toArray();
    
    if (devices.length === 0) {
      return [];
    }

    const collection = this.getCollection();
    const deviceIds = devices.map(d => d._id);
    
    // Lấy data mới nhất của từng device
    const latestData = await Promise.all(
      deviceIds.map(async (deviceId) => {
        const data = await collection
          .findOne(
            { deviceId },
            { sort: { timestamp: -1 } }
          );
        return data;
      })
    );

    return latestData.filter(d => d !== null);
  }

  // Thêm sensor data mới
  async create(sensorData) {
    const collection = this.getCollection();
    
    const newData = {
      deviceId: new ObjectId(sensorData.deviceId),
      temperature: sensorData.temperature,
      humidity: sensorData.humidity,
      soil_moisture: sensorData.soil_moisture,
      timestamp: sensorData.timestamp || new Date()
    };

    // Thêm weather_condition nếu có
    if (sensorData.weather_condition !== undefined) {
      newData.weather_condition = sensorData.weather_condition;
    }

    // Thêm water_level nếu có
    if (sensorData.water_level !== undefined) {
      newData.water_level = sensorData.water_level;
    }

    const result = await collection.insertOne(newData);
    return {
      _id: result.insertedId,
      ...newData
    };
  }

  // Lấy data trong khoảng thời gian
  async findByDateRange(deviceId, startDate, endDate) {
    const collection = this.getCollection();
    return await collection
      .find({
        deviceId: new ObjectId(deviceId),
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      })
      .sort({ timestamp: -1 })
      .toArray();
  }

  // Tính trung bình các giá trị
  async getAverageByDeviceId(deviceId, hours = 24) {
    const collection = this.getCollection();
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    const result = await collection
      .aggregate([
        {
          $match: {
            deviceId: new ObjectId(deviceId),
            timestamp: { $gte: startTime }
          }
        },
        {
          $group: {
            _id: null,
            avgTemperature: { $avg: '$temperature' },
            avgHumidity: { $avg: '$humidity' },
            avgSoilMoisture: { $avg: '$soil_moisture' },
            avgWaterLevel: { $avg: '$water_level' }
          }
        }
      ])
      .toArray();

    return result[0] || null;
  }

  // Xóa data cũ (cleanup)
  async deleteOlderThan(days) {
    const collection = this.getCollection();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await collection.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    return result;
  }
}

module.exports = new SensorData();
