const express = require('express');
const auth = require('../middleware/auth');
const sensorDataController = require('../controllers/sensorDataController');

const router = express.Router();

// Tất cả routes đều yêu cầu authentication
router.use(auth);

// GET /api/sensor-data/latest - Lấy data mới nhất của tất cả devices
router.get('/latest', sensorDataController.getLatestSensorData);

// GET /api/sensor-data/device/:deviceId - Lấy tất cả data của device
router.get('/device/:deviceId', sensorDataController.getSensorDataByDevice);

// GET /api/sensor-data/device/:deviceId/latest - Lấy data mới nhất của device
router.get('/device/:deviceId/latest', sensorDataController.getLatestSensorDataByDevice);

// GET /api/sensor-data/device/:deviceId/average - Lấy trung bình data
router.get('/device/:deviceId/average', sensorDataController.getAverageSensorData);

// GET /api/sensor-data/device/:deviceId/range - Lấy data theo khoảng thời gian
router.get('/device/:deviceId/range', sensorDataController.getSensorDataByDateRange);

// POST /api/sensor-data - Thêm sensor data mới
router.post('/', sensorDataController.createSensorData);

module.exports = router;
