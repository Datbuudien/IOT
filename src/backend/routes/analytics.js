const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authenticate = require('../middleware/auth');

/**
 * Analytics Routes
 * Tất cả routes đều yêu cầu authentication
 */

// Test route - no auth required
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Analytics routes are working!',
    timestamp: new Date()
  });
});

// @route   GET /api/analytics/history
// @desc    Lấy lịch sử sensor data với filters
// @access  Private
router.get('/history', authenticate, analyticsController.getSensorHistory);

// @route   GET /api/analytics/statistics
// @desc    Lấy thống kê tổng quan
// @access  Private
router.get('/statistics', authenticate, analyticsController.getStatistics);

// @route   GET /api/analytics/hourly
// @desc    Lấy dữ liệu theo giờ (cho charts)
// @access  Private
router.get('/hourly', authenticate, analyticsController.getHourlyData);

// @route   GET /api/analytics/daily
// @desc    Lấy dữ liệu theo ngày (cho charts)
// @access  Private
router.get('/daily', authenticate, analyticsController.getDailyData);

module.exports = router;
