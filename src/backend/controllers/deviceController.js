const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');

// Lấy tất cả devices của user
const getAllDevices = async (req, res) => {
  try {
    const db = getDB();
    const devicesCollection = db.collection('devices');

    const devices = await devicesCollection
      .find({ userId: req.userId })
      .toArray();

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
    const db = getDB();
    const devicesCollection = db.collection('devices');

    const device = await devicesCollection.findOne({
      _id: new ObjectId(req.params.id),
      userId: req.userId
    });

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
    const { name, type, status } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    const db = getDB();
    const devicesCollection = db.collection('devices');

    const newDevice = {
      userId: req.userId,
      name,
      type,
      status: status || 'offline',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await devicesCollection.insertOne(newDevice);

    res.status(201).json({
      success: true,
      message: 'Thêm device thành công',
      data: {
        _id: result.insertedId,
        ...newDevice
      }
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
    const { name, type, status } = req.body;
    const db = getDB();
    const devicesCollection = db.collection('devices');

    const result = await devicesCollection.updateOne(
      {
        _id: new ObjectId(req.params.id),
        userId: req.userId
      },
      {
        $set: {
          name,
          type,
          status,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy device'
      });
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
    const db = getDB();
    const devicesCollection = db.collection('devices');

    const result = await devicesCollection.deleteOne({
      _id: new ObjectId(req.params.id),
      userId: req.userId
    });

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

module.exports = {
  getAllDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice
};
