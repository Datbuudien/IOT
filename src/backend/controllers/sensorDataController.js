const SensorData = require('../models/SensorData');
const Device = require('../models/Device');
const { validateSensorData } = require('../schemas/sensorDataSchema');

// Lấy data mới nhất của tất cả devices của user
const getLatestSensorData = async (req, res) => {
  try {
    const sensorData = await SensorData.findLatestByUserId(req.userId);

    res.json({
      success: true,
      data: sensorData
    });
  } catch (error) {
    console.error('Lỗi lấy sensor data:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Lấy data của một device cụ thể
const getSensorDataByDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    // Kiểm tra device có thuộc user không
    const device = await Device.findById(deviceId, req.userId);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy device'
      });
    }

    const sensorData = await SensorData.findByDeviceId(deviceId, limit);

    res.json({
      success: true,
      data: sensorData
    });
  } catch (error) {
    console.error('Lỗi lấy sensor data:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Lấy data mới nhất của một device
const getLatestSensorDataByDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Kiểm tra device có thuộc user không
    const device = await Device.findById(deviceId, req.userId);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy device'
      });
    }

    const sensorData = await SensorData.findLatestByDeviceId(deviceId);

    if (!sensorData) {
      return res.status(404).json({
        success: false,
        message: 'Chưa có dữ liệu sensor'
      });
    }

    res.json({
      success: true,
      data: sensorData
    });
  } catch (error) {
    console.error('Lỗi lấy sensor data:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Thêm sensor data mới (thường được gọi từ IoT device)
const createSensorData = async (req, res) => {
  try {
    const { deviceId, temperature, humidity, soil_moisture, weather_condition, water_level } = req.body;

    // Helper ép kiểu số và giới hạn
    const toNumber = (value, min = -Infinity, max = Infinity) => {
      const num = Number(value);
      if (Number.isNaN(num)) return null;
      return Math.min(Math.max(num, min), max);
    };

    // Validate dữ liệu
    const validation = validateSensorData({ 
      deviceId, 
      temperature: toNumber(temperature),
      humidity: toNumber(humidity, 0, 100),
      soil_moisture: toNumber(soil_moisture, 0, 100),
    });
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: validation.errors
      });
    }

    // Kiểm tra device có thuộc user không
    const device = await Device.findById(deviceId, req.userId);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy device'
      });
    }

    const newData = await SensorData.create({
      deviceId,
      temperature: toNumber(temperature),
      humidity: toNumber(humidity, 0, 100),
      soil_moisture: toNumber(soil_moisture, 0, 100),
      weather_condition,
      water_level: toNumber(water_level)
    });

    res.status(201).json({
      success: true,
      message: 'Thêm sensor data thành công',
      data: newData
    });
  } catch (error) {
    console.error('Lỗi thêm sensor data:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Lấy trung bình sensor data
const getAverageSensorData = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const hours = parseInt(req.query.hours) || 24;

    // Kiểm tra device có thuộc user không
    const device = await Device.findById(deviceId, req.userId);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy device'
      });
    }

    const avgData = await SensorData.getAverageByDeviceId(deviceId, hours);

    if (!avgData) {
      return res.status(404).json({
        success: false,
        message: 'Chưa có dữ liệu trong khoảng thời gian này'
      });
    }

    res.json({
      success: true,
      data: avgData
    });
  } catch (error) {
    console.error('Lỗi lấy trung bình sensor data:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Lấy sensor data theo khoảng thời gian
const getSensorDataByDateRange = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp startDate và endDate'
      });
    }

    // Kiểm tra device có thuộc user không
    const device = await Device.findById(deviceId, req.userId);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy device'
      });
    }

    const sensorData = await SensorData.findByDateRange(deviceId, startDate, endDate);

    res.json({
      success: true,
      data: sensorData
    });
  } catch (error) {
    console.error('Lỗi lấy sensor data theo thời gian:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

module.exports = {
  getLatestSensorData,
  getSensorDataByDevice,
  getLatestSensorDataByDevice,
  createSensorData,
  getAverageSensorData,
  getSensorDataByDateRange
};
