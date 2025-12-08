/**
 * Server Entry Point
 * Khởi động server và kết nối database
 */
require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');

const PORT = process.env.PORT || 5000;

/**
 * Khởi động server
 */
const startServer = async () => {
  try {
    // Kết nối MongoDB
    await connectDB();
    console.log('✅ Database connected successfully');
    
    // Khởi động Scheduler Service
    const schedulerService = require('./services/schedulerService');
    await schedulerService.start();
    
    // Khởi động MQTT Service
    const mqttService = require('./services/mqttService');
    mqttService.connect();
    console.log('✅ MQTT service started');
    
    // Khởi động Express server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful Shutdown
    const gracefulShutdown = async () => {
      console.log('\n⚠️  Shutting down gracefully...');
      
      // Disconnect MQTT
      mqttService.disconnect();
      
      server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });

      // Force close after 10s
      setTimeout(() => {
        console.error('❌ Forcing shutdown');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});

startServer();

