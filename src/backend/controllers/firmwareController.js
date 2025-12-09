const FirmwareUpdate = require('../models/FirmwareUpdate');
const Device = require('../models/Device');
const mqttService = require('../services/mqttService');
const { ObjectId } = require('mongodb');

/**
 * Firmware Controller
 * Xử lý các request liên quan đến firmware updates
 */

// Admin: Tạo firmware update mới
const createFirmwareUpdate = async (req, res) => {
  try {
    const { version, description, firmwareUrl, firmwareSize, checksum } = req.body;

    if (!version || !firmwareUrl) {
      return res.status(400).json({
        success: false,
        message: 'Version và firmwareUrl là bắt buộc'
      });
    }

    const firmware = await FirmwareUpdate.create({
      version,
      description: description || '',
      firmwareUrl,
      firmwareSize: firmwareSize || 0,
      checksum: checksum || '',
      createdBy: req.userId
    });

    console.log(`📦 Admin ${req.userId} đã tạo firmware update: ${version}`);

    res.status(201).json({
      success: true,
      message: 'Tạo firmware update thành công',
      data: firmware
    });
  } catch (error) {
    console.error('Lỗi tạo firmware update:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Admin: Lấy tất cả firmware updates
const getAllFirmwareUpdates = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const firmwares = await FirmwareUpdate.findAll(parseInt(limit));

    // Lấy thống kê responses cho mỗi firmware
    const firmwaresWithStats = await Promise.all(
      firmwares.map(async (fw) => {
        const stats = await FirmwareUpdate.getResponseStats(fw._id);
        return {
          ...fw,
          _id: fw._id.toString(),
          stats
        };
      })
    );

    res.json({
      success: true,
      data: firmwaresWithStats
    });
  } catch (error) {
    console.error('Lỗi lấy firmware updates:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// User: Lấy firmware updates đang pending (chưa respond)
const getPendingFirmwareUpdates = async (req, res) => {
  try {
    const firmwares = await FirmwareUpdate.findPendingForUser(req.userId);

    res.json({
      success: true,
      data: firmwares.map(fw => ({
        ...fw,
        _id: fw._id.toString()
      }))
    });
  } catch (error) {
    console.error('Lỗi lấy pending firmware updates:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// User: Accept firmware update
const acceptFirmwareUpdate = async (req, res) => {
  try {
    const { firmwareId } = req.params;
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'deviceId là bắt buộc'
      });
    }

    // Kiểm tra firmware tồn tại
    const firmware = await FirmwareUpdate.findById(firmwareId);
    if (!firmware) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy firmware update'
      });
    }

    // Kiểm tra device thuộc user
    const device = await Device.findById(deviceId, req.userId);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy device hoặc device không thuộc user'
      });
    }

    // Lưu response
    await FirmwareUpdate.saveUserResponse(firmwareId, req.userId, {
      response: 'accept',
      deviceId: deviceId
    });

    // Gửi firmware update qua MQTT đến ESP32
    const firmwareTopic = `iot/device/${device.deviceId}/firmware/update`;
    const firmwarePayload = JSON.stringify({
      version: firmware.version,
      firmwareUrl: firmware.firmwareUrl,
      firmwareSize: firmware.firmwareSize,
      checksum: firmware.checksum,
      action: 'start_update'
    });

    mqttService.publish(firmwareTopic, firmwarePayload);
    console.log(`📤 Gửi firmware update ${firmware.version} đến device ${device.deviceId}`);

    res.json({
      success: true,
      message: 'Đã chấp nhận firmware update. Firmware đang được gửi đến thiết bị.'
    });
  } catch (error) {
    console.error('Lỗi accept firmware update:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// User: Reject firmware update
const rejectFirmwareUpdate = async (req, res) => {
  try {
    const { firmwareId } = req.params;

    // Kiểm tra firmware tồn tại
    const firmware = await FirmwareUpdate.findById(firmwareId);
    if (!firmware) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy firmware update'
      });
    }

    // Lưu response
    await FirmwareUpdate.saveUserResponse(firmwareId, req.userId, {
      response: 'reject'
    });

    console.log(`❌ User ${req.userId} đã reject firmware update ${firmware.version}`);

    res.json({
      success: true,
      message: 'Đã từ chối firmware update'
    });
  } catch (error) {
    console.error('Lỗi reject firmware update:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// User: Lấy response của mình cho một firmware
const getMyResponse = async (req, res) => {
  try {
    const { firmwareId } = req.params;
    
    const response = await FirmwareUpdate.getUserResponse(firmwareId, req.userId);
    
    res.json({
      success: true,
      data: response || null
    });
  } catch (error) {
    console.error('Lỗi lấy response:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Admin: Xóa firmware update
const deleteFirmwareUpdate = async (req, res) => {
  try {
    const { firmwareId } = req.params;
    
    const deleted = await FirmwareUpdate.delete(firmwareId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy firmware update'
      });
    }

    res.json({
      success: true,
      message: 'Xóa firmware update thành công'
    });
  } catch (error) {
    console.error('Lỗi xóa firmware update:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

module.exports = {
  createFirmwareUpdate,
  getAllFirmwareUpdates,
  getPendingFirmwareUpdates,
  acceptFirmwareUpdate,
  rejectFirmwareUpdate,
  getMyResponse,
  deleteFirmwareUpdate
};

