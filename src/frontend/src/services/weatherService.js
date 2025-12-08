import api from '../config/api';

/**
 * Weather Service
 * Gọi API liên quan đến thời tiết
 */

const weatherService = {
  // Lấy thời tiết hiện tại
  getCurrentWeather: async (params = {}) => {
    const response = await api.get('/api/weather/current', { params });
    return response.data;
  },

  // Lấy dự báo thời tiết
  getForecast: async (params = {}) => {
    const response = await api.get('/api/weather/forecast', { params });
    return response.data;
  }
};

export default weatherService;
