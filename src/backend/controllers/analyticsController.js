const { getDB } = require('../config/database');
const SensorData = require('../models/SensorData');
const { ObjectId } = require('mongodb');

const getUserDevices = async (devicesCollection, userId) => {
  return devicesCollection
    .find({ userId })
    .project({ _id: 1, name: 1, deviceId: 1 })
    .toArray();
};

const buildDeviceQuery = (userDevices, requestedDeviceId) => {
  if (!requestedDeviceId) {
    if (userDevices.length === 0) {
      return { deviceIds: [], query: null };
    }

    return {
      deviceIds: userDevices.map(device => device._id),
      query: { deviceId: { $in: userDevices.map(device => device._id) } }
    };
  }

  if (!ObjectId.isValid(requestedDeviceId)) {
    throw new Error('INVALID_DEVICE_ID');
  }

  const objectId = new ObjectId(requestedDeviceId);
  const ownsDevice = userDevices.some(device => device._id.equals(objectId));

  if (!ownsDevice) {
    throw new Error('DEVICE_NOT_FOUND');
  }

  return {
    deviceIds: [objectId],
    query: { deviceId: objectId }
  };
};

/**
 * Analytics Controller
 * Xử lý các request liên quan đến phân tích và thống kê
 */

// Lấy lịch sử sensor data với filters
const getSensorHistory = async (req, res) => {
  try {
    const { deviceId, startDate, endDate, limit = 100 } = req.query;
    const db = getDB();
    const sensorDataCollection = db.collection('sensordata');
    const devicesCollection = db.collection('devices');

    const userDevices = await getUserDevices(devicesCollection, req.userId);
    const deviceQuery = buildDeviceQuery(userDevices, deviceId);

    if (deviceQuery.query === null) {
      return res.json({
        success: true,
        data: [],
        count: 0
      });
    }

    const query = { ...deviceQuery.query };

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const history = await sensorDataCollection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .toArray();

    const deviceMap = {};
    userDevices.forEach(device => {
      deviceMap[device._id.toString()] = device.name || device.deviceId || 'Unknown';
    });

    const historyWithDeviceNames = history.map(h => ({
      ...h,
      _id: h._id.toString(),
      deviceId: h.deviceId.toString(),
      deviceName: deviceMap[h.deviceId.toString()] || 'Unknown'
    }));

    res.json({
      success: true,
      data: historyWithDeviceNames,
      count: historyWithDeviceNames.length
    });
  } catch (error) {
    if (error.message === 'INVALID_DEVICE_ID') {
      return res.status(400).json({
        success: false,
        message: 'deviceId không hợp lệ'
      });
    }
    if (error.message === 'DEVICE_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thiết bị'
      });
    }
    console.error('Lỗi lấy lịch sử sensor:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Lấy thống kê tổng quan
const getStatistics = async (req, res) => {
  try {
    const { deviceId, startDate, endDate, timeRange } = req.query;
    const db = getDB();
    const sensorDataCollection = db.collection('sensordata');
    const devicesCollection = db.collection('devices');

    const userDevices = await getUserDevices(devicesCollection, req.userId);
    const deviceQuery = buildDeviceQuery(userDevices, deviceId);

    if (deviceQuery.query === null) {
      return res.json({
        success: true,
        data: {
          message: 'Không có thiết bị nào'
        }
      });
    }

    const query = { ...deviceQuery.query };

    // Cleanup data older than 30 days
    try {
      await SensorData.deleteOlderThan(30);
    } catch (cleanupErr) {
      console.warn('⚠️  Cleanup old sensor data failed:', cleanupErr);
    }

    // Build time filter (inclusive upper bound = now)
    // Tính toán theo UTC để tương thích với cả dữ liệu cũ và mới
    // Khi hiển thị sẽ convert sang GMT+7
    const now = new Date(); // UTC hiện tại
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
      else query.timestamp.$lte = now;
    } else if (timeRange) {
      // Tính toán theo UTC (không có offset)
      let tsFilter = new Date(now);
      
      if (timeRange === '12h') {
        tsFilter = new Date(now.getTime() - (12 * 60 * 60 * 1000)); // Trừ 12 giờ
      } else if (timeRange === '24h') {
        tsFilter = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // Trừ 24 giờ
      } else if (timeRange === '7') {
        tsFilter = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); // Trừ 7 ngày
      } else if (timeRange === '30') {
        tsFilter = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // Trừ 30 ngày
      } else if (!Number.isNaN(Number(timeRange))) {
        // fallback: if timeRange is a number => treat as days
        tsFilter = new Date(now.getTime() - (Number(timeRange) * 24 * 60 * 60 * 1000));
      }
      query.timestamp = { $gte: tsFilter, $lte: now };
      console.log(`📅 Time filter: ${tsFilter.toISOString()} to ${now.toISOString()}`);
    }
    
    console.log('🔍 Query:', JSON.stringify(query, null, 2));

    // Aggregate statistics
    const stats = await sensorDataCollection.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          avgTemperature: { $avg: '$temperature' },
          minTemperature: { $min: '$temperature' },
          maxTemperature: { $max: '$temperature' },
          avgHumidity: { $avg: '$humidity' },
          minHumidity: { $min: '$humidity' },
          maxHumidity: { $max: '$humidity' },
          avgSoilMoisture: { $avg: '$soil_moisture' },
          minSoilMoisture: { $min: '$soil_moisture' },
          maxSoilMoisture: { $max: '$soil_moisture' },
          avgWaterLevel: { $avg: '$water_level' },
          minWaterLevel: { $min: '$water_level' },
          maxWaterLevel: { $max: '$water_level' },
          totalRecords: { $sum: 1 },
          weatherConditions: { $push: '$weather_condition' }
        }
      }
    ]).toArray();

    if (stats.length === 0) {
      return res.json({
        success: true,
        data: {
          message: 'Không có dữ liệu trong khoảng thời gian này'
        }
      });
    }

    // Count weather conditions
    const weatherCounts = {};
    stats[0].weatherConditions.forEach(weather => {
      if (weather) {
        weatherCounts[weather] = (weatherCounts[weather] || 0) + 1;
      }
    });

    // Đếm số lần mưa (weather_condition === 'rain')
    const rainCount = weatherCounts['rain'] || 0;

    const result = {
      temperature: {
        avg: Math.round(stats[0].avgTemperature * 10) / 10,
        min: stats[0].minTemperature,
        max: stats[0].maxTemperature
      },
      humidity: {
        avg: Math.round(stats[0].avgHumidity * 10) / 10,
        min: stats[0].minHumidity,
        max: stats[0].maxHumidity
      },
      soilMoisture: {
        avg: Math.round(stats[0].avgSoilMoisture * 10) / 10,
        min: stats[0].minSoilMoisture,
        max: stats[0].maxSoilMoisture
      },
      waterLevel: {
        avg: Math.round(stats[0].avgWaterLevel * 10) / 10,
        min: stats[0].minWaterLevel,
        max: stats[0].maxWaterLevel
      },
      weatherConditions: weatherCounts,
      rainCount: rainCount, // Số lần ghi nhận mưa (isRain = true)
      totalRecords: stats[0].totalRecords
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error.message === 'INVALID_DEVICE_ID') {
      return res.status(400).json({
        success: false,
        message: 'deviceId không hợp lệ'
      });
    }
    if (error.message === 'DEVICE_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thiết bị'
      });
    }
    console.error('Lỗi lấy thống kê:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Lấy dữ liệu theo giờ (cho charts)
const getHourlyData = async (req, res) => {
  try {
    const { deviceId, hours = 24 } = req.query;
    const db = getDB();
    const sensorDataCollection = db.collection('sensordata');
    const devicesCollection = db.collection('devices');

    const userDevices = await getUserDevices(devicesCollection, req.userId);
    const deviceQuery = buildDeviceQuery(userDevices, deviceId);

    if (deviceQuery.query === null) {
      return res.json({
        success: true,
        data: []
      });
    }

    const query = { ...deviceQuery.query };

    // Get data from last N hours (with upper bound = now)
    // Tính toán theo UTC để tương thích với cả dữ liệu cũ và mới
    const now = new Date(); // UTC hiện tại
    const hoursAgo = new Date(now.getTime() - (parseInt(hours) * 60 * 60 * 1000)); // Trừ N giờ
    query.timestamp = { $gte: hoursAgo, $lte: now };
    
    console.log(`📊 Hourly data query: ${hoursAgo.toISOString()} to ${now.toISOString()}`);

    const data = await sensorDataCollection.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' },
            hour: { $hour: '$timestamp' }
          },
          avgTemperature: { $avg: '$temperature' },
          avgHumidity: { $avg: '$humidity' },
          avgSoilMoisture: { $avg: '$soil_moisture' },
          avgWaterLevel: { $avg: '$water_level' },
          count: { $sum: 1 },
          timestamp: { $first: '$timestamp' }
        }
      },
      { $sort: { timestamp: 1 } }
    ]).toArray();

    console.log(`📈 Found ${data.length} hourly data points`);

    const chartData = data.map(d => {
      // Convert timestamp từ UTC sang GMT+7 để hiển thị đúng múi giờ Việt Nam
      const timestamp = d.timestamp ? new Date(d.timestamp) : new Date();
      
      // Format time theo GMT+7 (cộng 7 giờ vào UTC)
      const gmt7Time = new Date(timestamp.getTime() + (7 * 60 * 60 * 1000));
      const day = String(gmt7Time.getUTCDate()).padStart(2, '0');
      const month = String(gmt7Time.getUTCMonth() + 1).padStart(2, '0');
      const hour = String(gmt7Time.getUTCHours()).padStart(2, '0');
      
      return {
        time: `${day}/${month} ${hour}:00`,
        temperature: Math.round((d.avgTemperature || 0) * 10) / 10,
        humidity: Math.round((d.avgHumidity || 0) * 10) / 10,
        soilMoisture: Math.round((d.avgSoilMoisture || 0) * 10) / 10,
        waterLevel: Math.round((d.avgWaterLevel || 0) * 10) / 10,
        count: d.count,
        timestamp: d.timestamp
      };
    });

    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    if (error.message === 'INVALID_DEVICE_ID') {
      return res.status(400).json({
        success: false,
        message: 'deviceId không hợp lệ'
      });
    }
    if (error.message === 'DEVICE_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thiết bị'
      });
    }
    console.error('Lỗi lấy dữ liệu theo giờ:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Lấy dữ liệu theo ngày (cho charts)
const getDailyData = async (req, res) => {
  try {
    const { deviceId, days = 7 } = req.query;
    const db = getDB();
    const sensorDataCollection = db.collection('sensordata');
    const devicesCollection = db.collection('devices');

    const userDevices = await getUserDevices(devicesCollection, req.userId);
    const deviceQuery = buildDeviceQuery(userDevices, deviceId);

    if (deviceQuery.query === null) {
      return res.json({
        success: true,
        data: []
      });
    }

    const query = { ...deviceQuery.query };

    // Get data from last N days (with upper bound = now)
    // Tính toán theo UTC để tương thích với cả dữ liệu cũ và mới
    const now = new Date(); // UTC hiện tại
    const daysAgo = new Date(now.getTime() - (parseInt(days) * 24 * 60 * 60 * 1000)); // Trừ N ngày
    query.timestamp = { $gte: daysAgo, $lte: now };
    
    console.log(`📊 Daily data query: ${daysAgo.toISOString()} to ${now.toISOString()}`);

    const data = await sensorDataCollection.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          },
          avgTemperature: { $avg: '$temperature' },
          avgHumidity: { $avg: '$humidity' },
          avgSoilMoisture: { $avg: '$soil_moisture' },
          avgWaterLevel: { $avg: '$water_level' },
          minTemperature: { $min: '$temperature' },
          maxTemperature: { $max: '$temperature' },
          count: { $sum: 1 },
          timestamp: { $first: '$timestamp' }
        }
      },
      { $sort: { timestamp: 1 } }
    ]).toArray();

    console.log(`📈 Found ${data.length} daily data points`);

    const chartData = data.map(d => {
      // Convert timestamp từ UTC sang GMT+7 để hiển thị đúng múi giờ Việt Nam
      const timestamp = d.timestamp ? new Date(d.timestamp) : new Date();
      
      // Format date theo GMT+7 (cộng 7 giờ vào UTC)
      const gmt7Time = new Date(timestamp.getTime() + (7 * 60 * 60 * 1000));
      const day = String(gmt7Time.getUTCDate()).padStart(2, '0');
      const month = String(gmt7Time.getUTCMonth() + 1).padStart(2, '0');
      const year = gmt7Time.getUTCFullYear();
      
      return {
        date: `${day}/${month}/${year}`,
        temperature: Math.round((d.avgTemperature || 0) * 10) / 10,
        humidity: Math.round((d.avgHumidity || 0) * 10) / 10,
        soilMoisture: Math.round((d.avgSoilMoisture || 0) * 10) / 10,
        waterLevel: Math.round((d.avgWaterLevel || 0) * 10) / 10,
        minTemp: d.minTemperature,
        maxTemp: d.maxTemperature,
        count: d.count,
        timestamp: d.timestamp
      };
    });

    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    if (error.message === 'INVALID_DEVICE_ID') {
      return res.status(400).json({
        success: false,
        message: 'deviceId không hợp lệ'
      });
    }
    if (error.message === 'DEVICE_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thiết bị'
      });
    }
    console.error('Lỗi lấy dữ liệu theo ngày:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

module.exports = {
  getSensorHistory,
  getStatistics,
  getHourlyData,
  getDailyData
};
