/**
 * Routes Index
 * Tập trung tất cả routes của ứng dụng
 */
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const deviceRoutes = require('./devices');
const sensorDataRoutes = require('./sensorData');
const scheduleRoutes = require('./schedule');
const analyticsRoutes = require('./analytics');
const weatherRoutes = require('./weather');
const firmwareRoutes = require('./firmware');

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

// MQTT Status endpoint
router.get('/api/mqtt/status', (req, res) => {
  const mqttService = require('../services/mqttService');
  const status = mqttService.getStatus();
  res.json({
    status: status.isConnected ? 'connected' : 'disconnected',
    ...status,
    timestamp: new Date().toISOString()
  });
});

// API routes
router.use('/api/auth', authRoutes);
router.use('/api/devices', deviceRoutes);
router.use('/api/sensor-data', sensorDataRoutes);
router.use('/api/schedules', scheduleRoutes);
router.use('/api/analytics', analyticsRoutes);
router.use('/api/weather', weatherRoutes);
router.use('/api/firmware', firmwareRoutes);

module.exports = router;
