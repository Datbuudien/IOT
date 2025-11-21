/**
 * Script fake dữ liệu cảm biến tự động
 * Mô phỏng các cảm biến gửi dữ liệu lên server liên tục
 * Chạy: node fakeSensorData.js
 */

const axios = require('axios');
require('dotenv').config();

// ⚙️ CONFIGURATION - Sửa thông tin đăng nhập ở đây
const CONFIG = {
  API_URL: 'http://localhost:5000/api',
  LOGIN: {
    email: 'khoigptptit@gmail.com',    // 👈 THAY ĐỔI EMAIL CỦA BẠN
    password: '123456'        // 👈 THAY ĐỔI PASSWORD CỦA BẠN
  },
  UPDATE_INTERVAL: 5000 // Cập nhật mỗi 5 giây (5000ms)
};

let authToken = '';
let devices = [];

// Hàm tạo nhiệt độ ngẫu nhiên (20-40°C)
const getRandomTemperature = () => {
  const base = 28; // Nhiệt độ trung bình
  const variation = Math.random() * 12 - 6; // Dao động ±6°C
  return parseFloat((base + variation).toFixed(1));
};

// Hàm tạo độ ẩm không khí ngẫu nhiên (50-95%)
const getRandomHumidity = () => {
  const base = 75; // Độ ẩm trung bình
  const variation = Math.random() * 30 - 15; // Dao động ±15%
  return parseFloat((base + variation).toFixed(1));
};

// Hàm tạo độ ẩm đất ngẫu nhiên (20-90%)
const getRandomSoilMoisture = () => {
  const base = 55; // Độ ẩm đất trung bình
  const variation = Math.random() * 40 - 20; // Dao động ±20%
  return parseFloat((base + variation).toFixed(1));
};

// Hàm tạo điều kiện thời tiết ngẫu nhiên
let weatherState = 'sunny';
let weatherChangeCounter = 0;
const getRandomWeather = () => {
  weatherChangeCounter++;
  
  // Thay đổi thời tiết mỗi 12 lần (60 giây)
  if (weatherChangeCounter % 12 === 0) {
    const rand = Math.random();
    if (rand < 0.15) weatherState = 'stormy';     // 15% giông
    else if (rand < 0.35) weatherState = 'rainy'; // 20% mưa
    else if (rand < 0.65) weatherState = 'cloudy';// 30% nhiều mây
    else weatherState = 'sunny';                   // 35% nắng
    
    const icons = {
      'sunny': '☀️ Nắng',
      'cloudy': '☁️ Nhiều mây',
      'rainy': '🌧️ Mưa',
      'stormy': '⛈️ Giông'
    };
    console.log(`\n🌤️ Thời tiết thay đổi: ${icons[weatherState]}\n`);
  }
  
  return weatherState;
};

// Hàm tạo mực nước trong bể ngẫu nhiên (30-95%)
const getRandomWaterLevel = () => {
  const base = 70; // Mực nước trung bình
  const variation = Math.random() * 40 - 20; // Dao động ±20%
  return parseFloat((base + variation).toFixed(1));
};

// Đăng nhập để lấy token
async function login() {
  try {
    console.log('🔐 Đang đăng nhập...');
    const response = await axios.post(`${CONFIG.API_URL}/auth/login`, {
      email: CONFIG.LOGIN.email,
      password: CONFIG.LOGIN.password
    });
    
    authToken = response.data.data.token; // Token nằm trong data.token
    console.log('✓ Đăng nhập thành công!');
    return true;
  } catch (error) {
    console.error('✗ Lỗi đăng nhập:', error.response?.data?.message || error.message);
    console.log('\n💡 Hướng dẫn:');
    console.log('   1. Đảm bảo backend đang chạy (npm start)');
    console.log('   2. Sửa email/password trong file fakeSensorData.js');
    console.log('   3. Hoặc tạo tài khoản mới tại http://localhost:3000/register\n');
    return false;
  }
}

// Lấy danh sách devices
async function getDevices() {
  try {
    const response = await axios.get(`${CONFIG.API_URL}/devices`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    devices = response.data.data;
    console.log(`✓ Tìm thấy ${devices.length} thiết bị`);
    
    if (devices.length === 0) {
      console.log('\n⚠️  Chưa có thiết bị nào!');
      console.log('💡 Vào http://localhost:3000/devices để tạo thiết bị mới\n');
      return false;
    }
    
    devices.forEach(device => {
      console.log(`   - ${device.deviceId} (${device.mode})`);
    });
    
    return true;
  } catch (error) {
    console.error('✗ Lỗi lấy devices:', error.response?.data?.message || error.message);
    return false;
  }
}

// Gửi dữ liệu cảm biến cho một device
async function sendSensorData(device) {
  try {
    const weather = getRandomWeather();
    const data = {
      deviceId: device._id,
      temperature: getRandomTemperature(),
      humidity: getRandomHumidity(),
      soil_moisture: getRandomSoilMoisture(),
      weather_condition: weather,
      water_level: getRandomWaterLevel()
    };
    
    const response = await axios.post(`${CONFIG.API_URL}/sensor-data`, data, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const weatherIcons = {
      'sunny': '☀️',
      'cloudy': '☁️',
      'rainy': '🌧️',
      'stormy': '⛈️'
    };
    const timestamp = new Date().toLocaleTimeString('vi-VN');
    console.log(`[${timestamp}] ${weatherIcons[weather]} ${device.deviceId}: ${data.temperature}°C, ${data.humidity}% RH, ${data.soil_moisture}% SM, 💧${data.water_level}% Water`);
    
    return true;
  } catch (error) {
    console.error(`✗ Lỗi gửi data cho ${device.deviceId}:`, error.response?.data?.message || error.message);
    if (error.response?.status === 401) {
      console.log('⚠️  Token hết hạn hoặc không hợp lệ. Đang thử đăng nhập lại...');
      const relogin = await login();
      if (relogin) {
        return sendSensorData(device); // Thử lại
      }
    }
    return false;
  }
}

// Gửi dữ liệu cho tất cả devices
async function sendDataForAllDevices() {
  for (const device of devices) {
    await sendSensorData(device);
  }
}

// Main function
async function main() {
  console.log('🚀 Fake Sensor Data Generator');
  console.log('================================\n');
  
  // Đăng nhập
  const loginSuccess = await login();
  if (!loginSuccess) {
    process.exit(1);
  }
  
  // Lấy devices
  const devicesFound = await getDevices();
  if (!devicesFound) {
    process.exit(1);
  }
  
  console.log('\n📊 Bắt đầu gửi dữ liệu cảm biến mỗi 5 giây...');
  console.log('   (Nhấn Ctrl+C để dừng)\n');
  
  // Gửi dữ liệu ngay lập tức
  await sendDataForAllDevices();
  
  // Gửi dữ liệu định kỳ
  console.log(`⏱️  Cập nhật mỗi ${CONFIG.UPDATE_INTERVAL / 1000} giây\n`);
  setInterval(async () => {
    await sendDataForAllDevices();
  }, CONFIG.UPDATE_INTERVAL);
}

// Xử lý khi người dùng nhấn Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n👋 Đã dừng fake sensor data!');
  process.exit(0);
});

// Chạy
main();
