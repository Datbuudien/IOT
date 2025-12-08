import apiClient from '../config/api';

const firmwareService = {
  // Admin: Tạo firmware update mới
  createFirmwareUpdate: async (firmwareData) => {
    try {
      const response = await apiClient.post('/api/firmware', firmwareData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Không thể tạo firmware update' };
    }
  },

  // Admin: Lấy tất cả firmware updates
  getAllFirmwareUpdates: async () => {
    try {
      const response = await apiClient.get('/api/firmware/all');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Không thể lấy danh sách firmware updates' };
    }
  },

  // Admin: Xóa firmware update
  deleteFirmwareUpdate: async (firmwareId) => {
    try {
      const response = await apiClient.delete(`/api/firmware/${firmwareId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Không thể xóa firmware update' };
    }
  },

  // User: Lấy firmware updates đang pending
  getPendingFirmwareUpdates: async () => {
    try {
      const response = await apiClient.get('/api/firmware/pending');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Không thể lấy danh sách firmware updates' };
    }
  },

  // User: Accept firmware update
  acceptFirmwareUpdate: async (firmwareId, deviceId) => {
    try {
      const response = await apiClient.post(`/api/firmware/${firmwareId}/accept`, { deviceId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Không thể chấp nhận firmware update' };
    }
  },

  // User: Reject firmware update
  rejectFirmwareUpdate: async (firmwareId) => {
    try {
      const response = await apiClient.post(`/api/firmware/${firmwareId}/reject`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Không thể từ chối firmware update' };
    }
  },

  // User: Lấy response của mình cho một firmware
  getMyResponse: async (firmwareId) => {
    try {
      const response = await apiClient.get(`/api/firmware/${firmwareId}/response`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Không thể lấy response' };
    }
  }
};

export default firmwareService;

