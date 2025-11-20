import api from '../config/api';

const sensorDataService = {
  // Lấy data mới nhất của tất cả devices
  getLatestData: async () => {
    try {
      const response = await api.get('/api/sensor-data/latest');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Không thể lấy dữ liệu sensor' };
    }
  },

  // Lấy tất cả data của một device
  getDataByDevice: async (deviceId, limit = 100) => {
    try {
      const response = await api.get(`/api/sensor-data/device/${deviceId}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Không thể lấy dữ liệu sensor' };
    }
  },

  // Lấy data mới nhất của một device
  getLatestDataByDevice: async (deviceId) => {
    try {
      const response = await api.get(`/api/sensor-data/device/${deviceId}/latest`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Không thể lấy dữ liệu sensor' };
    }
  },

  // Lấy trung bình data của device
  getAverageData: async (deviceId, hours = 24) => {
    try {
      const response = await api.get(`/api/sensor-data/device/${deviceId}/average`, {
        params: { hours }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Không thể lấy dữ liệu trung bình' };
    }
  },

  // Lấy data theo khoảng thời gian
  getDataByDateRange: async (deviceId, startDate, endDate) => {
    try {
      const response = await api.get(`/api/sensor-data/device/${deviceId}/range`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Không thể lấy dữ liệu theo thời gian' };
    }
  },

  // Thêm sensor data mới (thường do IoT device gọi)
  addSensorData: async (deviceId, temperature, humidity, soil_moisture) => {
    try {
      const response = await api.post('/api/sensor-data', {
        deviceId,
        temperature,
        humidity,
        soil_moisture
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Không thể thêm dữ liệu sensor' };
    }
  }
};

export default sensorDataService;
