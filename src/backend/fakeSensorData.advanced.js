/**
 * Script fake dữ liệu cảm biến nâng cao
 * Mô phỏng chu kỳ ngày/đêm, thời tiết thay đổi, và điều kiện thực tế
 * Chạy: node fakeSensorData.advanced.js
 */

const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
let authToken = '';
let devices = [];

// Cấu hình mô phỏng
const CONFIG = {
  updateInterval: 5000, // 5 giây
  
  // Kịch bản mô phỏng
  scenarios: {
    morning: { // Buổi sáng (6h-12h)
      temperature: { min: 24, max: 32 },
      humidity: { min: 70, max: 85 },
      soilMoisture: { min: 50, max: 70 }
    },
    afternoon: { // Buổi chiều (12h-18h)
      temperature: { min: 30, max: 38 },
      humidity: { min: 60, max: 75 },
      soilMoisture: { min: 35, max: 55 }
    },
    evening: { // Buổi tối (18h-22h)
      temperature: { min: 26, max: 30 },
      humidity: { min: 75, max: 90 },
      soilMoisture: { min: 40, max: 60 }
    },
    night: { // Ban đêm (22h-6h)
      temperature: { min: 22, max: 26 },
      humidity: { min: 80, max: 95 },
      soilMoisture: { min: 55, max: 75 }
    }
  },
  
  // Điều kiện đặc biệt
  weather: {
    rain: { // Trời mưa
      temperatureDelta: -3,
      humidityBonus: 15,
      soilMoistureBonus: 20
    },
    sunny: { // Trời nắng
      temperatureDelta: 5,
      humidityDelta: -10,
      soilMoistureDelta: -15
    }
  }
};

// Trạng thái mô phỏng
let currentWeather = 'normal'; // normal, rain, sunny
let weatherChangeCounter = 0;

// Lấy kịch bản theo giờ
function getScenario() {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 12) return CONFIG.scenarios.morning;
  if (hour >= 12 && hour < 18) return CONFIG.scenarios.afternoon;
  if (hour >= 18 && hour < 22) return CONFIG.scenarios.evening;
  return CONFIG.scenarios.night;
}

// Thay đổi thời tiết ngẫu nhiên
function updateWeather() {
  weatherChangeCounter++;
  
  // Mỗi 30 lần cập nhật (~2.5 phút), có thể thay đổi thời tiết
  if (weatherChangeCounter % 30 === 0) {
    const rand = Math.random();
    
    if (rand < 0.1) { // 10% mưa
      if (currentWeather !== 'rain') {
        currentWeather = 'rain';
        console.log('\n🌧️  Thời tiết: Đang mưa\n');
      }
    } else if (rand < 0.3) { // 20% nắng gắt
      if (currentWeather !== 'sunny') {
        currentWeather = 'sunny';
        console.log('\n☀️  Thời tiết: Nắng gắt\n');
      }
    } else { // 70% bình thường
      if (currentWeather !== 'normal') {
        currentWeather = 'normal';
        console.log('\n⛅ Thời tiết: Bình thường\n');
      }
    }
  }
}

// Tạo giá trị với biến động tự nhiên
function generateValue(range, delta = 0) {
  const base = (range.min + range.max) / 2;
  const variation = (range.max - range.min) / 4;
  const random = (Math.random() - 0.5) * 2 * variation;
  
  return parseFloat((base + random + delta).toFixed(1));
}

// Tạo dữ liệu cảm biến với điều kiện thực tế
function generateSensorData() {
  const scenario = getScenario();
  updateWeather();
  
  let tempDelta = 0;
  let humidityDelta = 0;
  let soilDelta = 0;
  
  // Áp dụng ảnh hưởng thời tiết
  if (currentWeather === 'rain') {
    const weather = CONFIG.weather.rain;
    tempDelta = weather.temperatureDelta;
    humidityDelta = weather.humidityBonus;
    soilDelta = weather.soilMoistureBonus;
  } else if (currentWeather === 'sunny') {
    const weather = CONFIG.weather.sunny;
    tempDelta = weather.temperatureDelta;
    humidityDelta = weather.humidityDelta;
    soilDelta = weather.soilMoistureDelta;
  }
  
  // Tạo dữ liệu với dao động tự nhiên
  const temperature = Math.max(15, Math.min(45, 
    generateValue(scenario.temperature, tempDelta)
  ));
  
  const humidity = Math.max(30, Math.min(100, 
    generateValue(scenario.humidity, humidityDelta)
  ));
  
  const soil_moisture = Math.max(10, Math.min(100, 
    generateValue(scenario.soilMoisture, soilDelta)
  ));
  
  return { temperature, humidity, soil_moisture };
}

// Đăng nhập
async function login() {
  try {
    console.log('🔐 Đang đăng nhập...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    authToken = response.data.token;
    console.log('✓ Đăng nhập thành công!');
    return true;
  } catch (error) {
    console.error('✗ Lỗi đăng nhập:', error.response?.data?.message || error.message);
    console.log('\n💡 Sửa email/password trong file fakeSensorData.advanced.js\n');
    return false;
  }
}

// Lấy devices
async function getDevices() {
  try {
    const response = await axios.get(`${API_URL}/devices`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    devices = response.data.data;
    console.log(`✓ Tìm thấy ${devices.length} thiết bị`);
    
    if (devices.length === 0) {
      console.log('\n⚠️  Chưa có thiết bị! Tạo tại http://localhost:3000/devices\n');
      return false;
    }
    
    devices.forEach(device => {
      console.log(`   - ${device.deviceId}`);
    });
    
    return true;
  } catch (error) {
    console.error('✗ Lỗi lấy devices:', error.message);
    return false;
  }
}

// Gửi dữ liệu
async function sendSensorData(device, data) {
  try {
    await axios.post(`${API_URL}/sensor-data`, {
      deviceId: device._id,
      ...data
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const timestamp = new Date().toLocaleTimeString('vi-VN');
    const weatherIcon = currentWeather === 'rain' ? '🌧️' : currentWeather === 'sunny' ? '☀️' : '⛅';
    
    console.log(
      `[${timestamp}] ${weatherIcon} ${device.deviceId}: ` +
      `🌡️ ${data.temperature}°C, 💧 ${data.humidity}%, 🌱 ${data.soil_moisture}%`
    );
    
    return true;
  } catch (error) {
    console.error(`✗ Lỗi gửi data:`, error.response?.data?.message || error.message);
    return false;
  }
}

// Main
async function main() {
  console.log('🚀 Advanced Fake Sensor Data Generator');
  console.log('=========================================');
  console.log('Mô phỏng: Chu kỳ ngày/đêm + Thời tiết thay đổi\n');
  
  if (!await login()) process.exit(1);
  if (!await getDevices()) process.exit(1);
  
  console.log('\n📊 Bắt đầu gửi dữ liệu (Ctrl+C để dừng)\n');
  
  // Gửi ngay
  const data = generateSensorData();
  for (const device of devices) {
    await sendSensorData(device, data);
  }
  
  // Gửi định kỳ
  setInterval(async () => {
    const data = generateSensorData();
    for (const device of devices) {
      await sendSensorData(device, data);
    }
  }, CONFIG.updateInterval);
}

process.on('SIGINT', () => {
  console.log('\n\n👋 Đã dừng!');
  process.exit(0);
});

main();
