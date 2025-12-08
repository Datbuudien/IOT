import api from '../config/api';

/**
 * Schedule Service
 * Gọi API liên quan đến lịch tưới tự động
 */

const scheduleService = {
  // Lấy tất cả lịch
  getAll: async () => {
    const response = await api.get('/api/schedules');
    return response.data;
  },

  // Lấy lịch theo device
  getByDevice: async (deviceId) => {
    const response = await api.get(`/api/schedules/device/${deviceId}`);
    return response.data;
  },

  // Lấy chi tiết lịch
  getById: async (scheduleId) => {
    const response = await api.get(`/api/schedules/${scheduleId}`);
    return response.data;
  },

  // Tạo lịch mới
  create: async (scheduleData) => {
    const response = await api.post('/api/schedules', scheduleData);
    return response.data;
  },

  // Cập nhật lịch
  update: async (scheduleId, scheduleData) => {
    const response = await api.put(`/api/schedules/${scheduleId}`, scheduleData);
    return response.data;
  },

  // Xóa lịch
  delete: async (scheduleId) => {
    const response = await api.delete(`/api/schedules/${scheduleId}`);
    return response.data;
  },

  // Toggle trạng thái active
  toggleActive: async (scheduleId) => {
    const response = await api.patch(`/api/schedules/${scheduleId}/toggle`);
    return response.data;
  },

  // Lấy lịch sử thực thi
  getHistory: async (scheduleId, limit = 50) => {
    const response = await api.get(`/api/schedules/${scheduleId}/history`, {
      params: { limit }
    });
    return response.data;
  }
};

export default scheduleService;
