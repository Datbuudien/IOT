const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');
const authenticate = require('../middleware/auth');

/**
 * Weather Routes
 * Tất cả routes đều yêu cầu authentication
 */

// @route   GET /api/weather/current
// @desc    Lấy thời tiết hiện tại
// @access  Private
router.get('/current', authenticate, weatherController.getCurrentWeather);

// @route   GET /api/weather/forecast
// @desc    Lấy dự báo thời tiết 5 ngày
// @access  Private
router.get('/forecast', authenticate, weatherController.getForecast);

module.exports = router;
