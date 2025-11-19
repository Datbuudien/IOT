const express = require('express');
const { connectDB } = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'IoT Backend API đang hoạt động!',
    status: 'success'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    database: 'connected'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', protectedRoutes);

// Khởi động server
const startServer = async () => {
  try {
    // Kết nối MongoDB
    await connectDB();
    
    // Khởi động Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Lỗi khởi động server:', error);
    process.exit(1);
  }
};

// Xử lý tắt graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️  Đang dừng server...');
  process.exit(0);
});

startServer();