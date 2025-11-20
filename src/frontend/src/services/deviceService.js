import apiClient from '../config/api';

const deviceService = {
  // Lấy danh sách devices
  getDevices: async () => {
    try {
      const response = await apiClient.get('/api/devices');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Không thể lấy danh sách devices' };
    }
  },

  // Thêm device mới
  addDevice: async (deviceData) => {
    try {
      const response = await apiClient.post('/api/devices', deviceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Không thể thêm device' };
    }
  },

  // Lấy một device theo ID
  getDevice: async (deviceId) => {
    try {
      const response = await apiClient.get(`/api/devices/${deviceId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Không thể lấy thông tin device' };
    }
  },

  // Cập nhật device
  updateDevice: async (deviceId, deviceData) => {
    try {
      const response = await apiClient.put(`/api/devices/${deviceId}`, deviceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Không thể cập nhật device' };
    }
  },

  // Xóa device
  deleteDevice: async (deviceId) => {
    try {
      const response = await apiClient.delete(`/api/devices/${deviceId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Không thể xóa device' };
    }
  },
};

export default deviceService;
