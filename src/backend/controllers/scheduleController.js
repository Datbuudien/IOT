const Schedule = require('../models/Schedule');
const Device = require('../models/Device');
const { validateSchedule, validateScheduleUpdate } = require('../schemas/scheduleSchema');

/**
 * Schedule Controller
 * Xử lý các request liên quan đến lịch tưới tự động
 */

// Lấy tất cả lịch của user
const getAllSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.findByUserId(req.userId);
    
    // Populate device info
    const db = require('../config/database').getDB();
    const devicesCollection = db.collection('devices');
    
    const schedulesWithDevice = await Promise.all(
      schedules.map(async (schedule) => {
        const device = await devicesCollection.findOne({ _id: schedule.deviceId });
        return {
          ...schedule,
          device: device ? { _id: device._id, name: device.name } : null
        };
      })
    );

    res.json({
      success: true,
      data: schedulesWithDevice
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách lịch:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Lấy lịch của một device
const getSchedulesByDevice = async (req, res) => {
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

    const schedules = await Schedule.findByDeviceId(deviceId, req.userId);

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Lỗi lấy lịch của device:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Lấy chi tiết một lịch
const getScheduleById = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await Schedule.findById(scheduleId, req.userId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch'
      });
    }

    // Lấy thông tin device
    const device = await Device.findById(schedule.deviceId.toString(), req.userId);

    res.json({
      success: true,
      data: {
        ...schedule,
        device: device ? { _id: device._id, name: device.name } : null
      }
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết lịch:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Tạo lịch mới
const createSchedule = async (req, res) => {
  try {
    const { deviceId, name, description, startTime, duration, daysOfWeek, isActive } = req.body;

    // Validate dữ liệu
    const validation = validateSchedule({ 
      deviceId, 
      name, 
      description, 
      startTime, 
      duration, 
      daysOfWeek, 
      isActive 
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

    const newSchedule = await Schedule.create(validation.data, req.userId);

    res.status(201).json({
      success: true,
      message: 'Tạo lịch thành công',
      data: newSchedule
    });
  } catch (error) {
    console.error('Lỗi tạo lịch:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Cập nhật lịch
const updateSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const updateData = req.body;

    // Validate dữ liệu
    const validation = validateScheduleUpdate(updateData);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: validation.errors
      });
    }

    // Kiểm tra lịch có tồn tại không
    const schedule = await Schedule.findById(scheduleId, req.userId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch'
      });
    }

    // Nếu có deviceId mới, kiểm tra device có thuộc user không
    if (updateData.deviceId) {
      const device = await Device.findById(updateData.deviceId, req.userId);
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy device'
        });
      }
    }

    const updatedSchedule = await Schedule.update(scheduleId, req.userId, validation.data);

    res.json({
      success: true,
      message: 'Cập nhật lịch thành công',
      data: updatedSchedule
    });
  } catch (error) {
    console.error('Lỗi cập nhật lịch:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Xóa lịch
const deleteSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    // Kiểm tra lịch có tồn tại không
    const schedule = await Schedule.findById(scheduleId, req.userId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch'
      });
    }

    const deleted = await Schedule.delete(scheduleId, req.userId);

    if (deleted) {
      res.json({
        success: true,
        message: 'Xóa lịch thành công'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Không thể xóa lịch'
      });
    }
  } catch (error) {
    console.error('Lỗi xóa lịch:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Toggle trạng thái active
const toggleScheduleActive = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await Schedule.findById(scheduleId, req.userId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch'
      });
    }

    const updatedSchedule = await Schedule.toggleActive(scheduleId, req.userId);

    res.json({
      success: true,
      message: `${updatedSchedule.isActive ? 'Kích hoạt' : 'Tắt'} lịch thành công`,
      data: updatedSchedule
    });
  } catch (error) {
    console.error('Lỗi toggle lịch:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Lấy lịch sử thực thi
const getExecutionHistory = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    // Kiểm tra lịch có tồn tại không
    const schedule = await Schedule.findById(scheduleId, req.userId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch'
      });
    }

    const history = await Schedule.getExecutionHistory(scheduleId, req.userId, limit);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Lỗi lấy lịch sử:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

module.exports = {
  getAllSchedules,
  getSchedulesByDevice,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  toggleScheduleActive,
  getExecutionHistory
};
