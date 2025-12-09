const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const firmwareController = require('../controllers/firmwareController');

// Admin routes (cần auth + isAdmin)
router.post('/', auth, isAdmin, firmwareController.createFirmwareUpdate);
router.get('/all', auth, isAdmin, firmwareController.getAllFirmwareUpdates);
router.delete('/:firmwareId', auth, isAdmin, firmwareController.deleteFirmwareUpdate);

// User routes (chỉ cần auth)
router.get('/pending', auth, firmwareController.getPendingFirmwareUpdates);
router.post('/:firmwareId/accept', auth, firmwareController.acceptFirmwareUpdate);
router.post('/:firmwareId/reject', auth, firmwareController.rejectFirmwareUpdate);
router.get('/:firmwareId/response', auth, firmwareController.getMyResponse);

module.exports = router;

