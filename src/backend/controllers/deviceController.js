const Device = require('../models/Device');
const { validateDevice } = require('../schemas/deviceSchema');
const mqttService = require('../services/mqttService');

// Lấy tất cả devices của user
const getAllDevices = async (req, res) => {
  try {
    const devices = await Device.findByUserId(req.userId);

    res.json({
      success: true,
      data: devices
    });
  } catch (error) {
    console.error('Lỗi lấy devices:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Lấy một device theo ID
const getDeviceById = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id, req.userId);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy device'
      });
    }

    res.json({
      success: true,
      data: device
    });
  } catch (error) {
    console.error('Lỗi lấy device:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Thêm device mới
const createDevice = async (req, res) => {
  try {
    const { deviceId, pumpStatus, mode } = req.body;

    // Validate dữ liệu
    const validation = validateDevice({ deviceId, pumpStatus, mode });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: validation.errors
      });
    }

    // Kiểm tra deviceId đã tồn tại chưa
    const existingDevice = await Device.findByDeviceId(deviceId);
    if (existingDevice) {
      return res.status(400).json({
        success: false,
        message: 'Mã thiết bị đã tồn tại'
      });
    }

    const deviceData = {
      userId: req.userId,
      deviceId,
      pumpStatus: pumpStatus !== undefined ? pumpStatus : false,
      mode: mode || 'manual'
    };

    const newDevice = await Device.create(deviceData);

    res.status(201).json({
      success: true,
      message: 'Thêm device thành công',
      data: newDevice
    });
  } catch (error) {
    console.error('Lỗi thêm device:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Cập nhật device
const updateDevice = async (req, res) => {
  try {
    const { deviceId, pumpStatus, mode } = req.body;
    
    // Validate dữ liệu (chỉ validate các field được gửi lên)
    const updateData = {};
    if (deviceId !== undefined) updateData.deviceId = deviceId;
    if (pumpStatus !== undefined) updateData.pumpStatus = pumpStatus;
    if (mode !== undefined) updateData.mode = mode;

    const validation = validateDevice(updateData, true); // isUpdate = true
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: validation.errors
      });
    }

    // Lấy device để lấy deviceId (mã thiết bị) trước khi update
    const device = await Device.findById(req.params.id, req.userId);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy device'
      });
    }

    const result = await Device.update(req.params.id, req.userId, updateData);

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy device'
      });
    }

    // Gửi MQTT command/config nếu có thay đổi
    try {
      if (updateData.mode !== undefined) {
        // Gửi config để ESP32 biết chế độ mới
        mqttService.sendConfig(device.deviceId, { mode: updateData.mode });
        console.log(`📤 Sent config to ${device.deviceId}: mode = ${updateData.mode}`);
      }
      
      if (updateData.pumpStatus !== undefined) {
        // Gửi command để điều khiển bơm
        const action = updateData.pumpStatus ? 'pump_on' : 'pump_off';
        mqttService.sendCommand(device.deviceId, { action });
        console.log(`📤 Sent command to ${device.deviceId}: ${action}`);
      }
    } catch (mqttError) {
      console.error('⚠️  MQTT error (device still updated in DB):', mqttError);
      // Không fail request nếu MQTT lỗi, vì DB đã được update
    }

    res.json({
      success: true,
      message: 'Cập nhật device thành công'
    });
  } catch (error) {
    console.error('Lỗi cập nhật device:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Xóa device
const deleteDevice = async (req, res) => {
  try {
    const result = await Device.delete(req.params.id, req.userId);

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy device'
      });
    }

    res.json({
      success: true,
      message: 'Xóa device thành công'
    });
  } catch (error) {
    console.error('Lỗi xóa device:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Gửi lệnh điều khiển qua MQTT
const sendCommand = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id, req.userId);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy device'
      });
    }

    const { action } = req.body;
    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu action trong request body'
      });
    }

    mqttService.sendCommand(device.deviceId, { action, timestamp: new Date() });
    
    res.json({
      success: true,
      message: 'Đã gửi lệnh điều khiển'
    });
  } catch (error) {
    console.error('Lỗi gửi lệnh:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Gửi cấu hình qua MQTT
const sendConfig = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id, req.userId);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy device'
      });
    }

    const config = req.body;
    mqttService.sendConfig(device.deviceId, config);
    
    res.json({
      success: true,
      message: 'Đã gửi cấu hình'
    });
  } catch (error) {
    console.error('Lỗi gửi cấu hình:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

module.exports = {
  getAllDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  sendCommand,
  sendConfig
};
