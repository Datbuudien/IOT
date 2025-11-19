const express = require('express');
const auth = require('../middleware/auth');
const { getDB } = require('../config/database');

const router = express.Router();

// Route được bảo vệ - ví dụ lấy danh sách devices
router.get('/devices', auth, async (req, res) => {
  try {
    const db = getDB();
    const devicesCollection = db.collection('devices');

    // Lấy devices của user hiện tại
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
});

// Route được bảo vệ - thêm device
router.post('/devices', auth, async (req, res) => {
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
        deviceId: result.insertedId,
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
});

module.exports = router;
