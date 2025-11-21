import api from '../config/api';

/**
 * Analytics Service
 * Gọi API liên quan đến phân tích và thống kê
 */

const analyticsService = {
  // Lấy lịch sử sensor data
  getHistory: async (params = {}) => {
    const response = await api.get('/api/analytics/history', { params });
    return response.data;
  },

  // Lấy thống kê tổng quan
  getStatistics: async (params = {}) => {
    const response = await api.get('/api/analytics/statistics', { params });
    return response.data;
  },

  // Lấy dữ liệu theo giờ
  getHourlyData: async (params = {}) => {
    const response = await api.get('/api/analytics/hourly', { params });
    return response.data;
  },

  // Lấy dữ liệu theo ngày
  getDailyData: async (params = {}) => {
    const response = await api.get('/api/analytics/daily', { params });
    return response.data;
  }
};

export default analyticsService;
