const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const authenticate = require('../middleware/auth');

/**
 * Schedule Routes
 * Tất cả routes đều yêu cầu authentication
 */

// @route   GET /api/schedules
// @desc    Lấy tất cả lịch của user
// @access  Private
router.get('/', authenticate, scheduleController.getAllSchedules);

// @route   GET /api/schedules/device/:deviceId
// @desc    Lấy lịch của một device
// @access  Private
router.get('/device/:deviceId', authenticate, scheduleController.getSchedulesByDevice);

// @route   GET /api/schedules/:scheduleId
// @desc    Lấy chi tiết một lịch
// @access  Private
router.get('/:scheduleId', authenticate, scheduleController.getScheduleById);

// @route   POST /api/schedules
// @desc    Tạo lịch mới
// @access  Private
router.post('/', authenticate, scheduleController.createSchedule);

// @route   PUT /api/schedules/:scheduleId
// @desc    Cập nhật lịch
// @access  Private
router.put('/:scheduleId', authenticate, scheduleController.updateSchedule);

// @route   DELETE /api/schedules/:scheduleId
// @desc    Xóa lịch
// @access  Private
router.delete('/:scheduleId', authenticate, scheduleController.deleteSchedule);

// @route   PATCH /api/schedules/:scheduleId/toggle
// @desc    Toggle trạng thái active
// @access  Private
router.patch('/:scheduleId/toggle', authenticate, scheduleController.toggleScheduleActive);

// @route   GET /api/schedules/:scheduleId/history
// @desc    Lấy lịch sử thực thi
// @access  Private
router.get('/:scheduleId/history', authenticate, scheduleController.getExecutionHistory);

module.exports = router;
