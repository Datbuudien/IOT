/**
 * Routes Index
 * Tập trung tất cả routes của ứng dụng
 */
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const deviceRoutes = require('./devices');

// Health check routes
router.get('/', (req, res) => {
  res.json({ 
    message: 'IoT Backend API đang hoạt động!',
    status: 'success',
    version: '1.0.0'
  });
});

router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

// API routes
router.use('/api/auth', authRoutes);
router.use('/api/devices', deviceRoutes);

module.exports = router;
