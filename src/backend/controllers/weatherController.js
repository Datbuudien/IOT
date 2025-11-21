const axios = require('axios');

/**
 * Weather Controller
 * Tích hợp OpenWeatherMap API
 */

// API key - nên lưu trong .env
const API_KEY = process.env.OPENWEATHER_API_KEY || 'demo_key';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Lấy thời tiết hiện tại theo tọa độ
const getCurrentWeather = async (req, res) => {
  try {
    const { lat, lon, city } = req.query;

    let url = `${BASE_URL}/weather?appid=${API_KEY}&units=metric&lang=vi`;
    
    if (lat && lon) {
      url += `&lat=${lat}&lon=${lon}`;
    } else if (city) {
      url += `&q=${city}`;
    } else {
      // Default: Ha Noi
      url += `&q=Hanoi,VN`;
    }

    const response = await axios.get(url);
    const data = response.data;

    const weather = {
      location: data.name,
      country: data.sys.country,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      windSpeed: data.wind.speed,
      clouds: data.clouds.all,
      sunrise: new Date(data.sys.sunrise * 1000),
      sunset: new Date(data.sys.sunset * 1000),
      timestamp: new Date()
    };

    res.json({
      success: true,
      data: weather
    });
  } catch (error) {
    console.error('Lỗi lấy thời tiết:', error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'API key không hợp lệ. Vui lòng cấu hình OPENWEATHER_API_KEY trong .env'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Không thể lấy dữ liệu thời tiết',
      error: error.message
    });
  }
};

// Lấy dự báo thời tiết 5 ngày
const getForecast = async (req, res) => {
  try {
    const { lat, lon, city } = req.query;

    let url = `${BASE_URL}/forecast?appid=${API_KEY}&units=metric&lang=vi`;
    
    if (lat && lon) {
      url += `&lat=${lat}&lon=${lon}`;
    } else if (city) {
      url += `&q=${city}`;
    } else {
      url += `&q=Hanoi,VN`;
    }

    const response = await axios.get(url);
    const data = response.data;

    const forecast = data.list.map(item => ({
      time: new Date(item.dt * 1000),
      temperature: Math.round(item.main.temp),
      feelsLike: Math.round(item.main.feels_like),
      humidity: item.main.humidity,
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      windSpeed: item.wind.speed,
      pop: Math.round(item.pop * 100) // Probability of precipitation
    }));

    res.json({
      success: true,
      data: {
        location: data.city.name,
        country: data.city.country,
        forecast: forecast
      }
    });
  } catch (error) {
    console.error('Lỗi lấy dự báo thời tiết:', error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'API key không hợp lệ. Vui lòng cấu hình OPENWEATHER_API_KEY trong .env'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Không thể lấy dự báo thời tiết',
      error: error.message
    });
  }
};

module.exports = {
  getCurrentWeather,
  getForecast
};
