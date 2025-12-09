const express = require('express');
const auth = require('../middleware/auth');
const deviceController = require('../controllers/deviceController');

const router = express.Router();

// Tất cả routes đều yêu cầu authentication
router.use(auth);

// GET /api/devices - Lấy tất cả devices
router.get('/', deviceController.getAllDevices);

// GET /api/devices/:id - Lấy một device
router.get('/:id', deviceController.getDeviceById);

// POST /api/devices - Thêm device mới
router.post('/', deviceController.createDevice);

// PUT /api/devices/:id - Cập nhật device
router.put('/:id', deviceController.updateDevice);

// DELETE /api/devices/:id - Xóa device
router.delete('/:id', deviceController.deleteDevice);

// POST /api/devices/:id/command - Gửi lệnh điều khiển qua MQTT
router.post('/:id/command', deviceController.sendCommand);

// POST /api/devices/:id/config - Gửi cấu hình qua MQTT
router.post('/:id/config', deviceController.sendConfig);

module.exports = router;
