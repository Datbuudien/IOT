import apiClient from '../config/api';

const authService = {
  // Đăng ký
  register: async (userData) => {
    try {
      const response = await apiClient.post('/api/auth/register', {
        name: userData.fullName,
        email: userData.email,
        password: userData.password,
      });
      
      if (response.data.success) {
        // Lưu token và thông tin user vào localStorage
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify({
          userId: response.data.data.userId,
          email: response.data.data.email,
          name: response.data.data.name,
          role: response.data.data.role || 'user',
        }));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Đăng ký thất bại' };
    }
  },

  // Đăng nhập
  login: async (email, password) => {
    try {
      const response = await apiClient.post('/api/auth/login', {
        email,
        password,
      });
      
      if (response.data.success) {
        // Lưu token và thông tin user vào localStorage
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify({
          userId: response.data.data.userId,
          email: response.data.data.email,
          name: response.data.data.name,
          role: response.data.data.role || 'user',
        }));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Đăng nhập thất bại' };
    }
  },

  // Đăng xuất
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/api/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Không thể lấy thông tin user' };
    }
  },

  // Kiểm tra user đã đăng nhập chưa
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Lấy thông tin user từ localStorage
  getUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  },
};

export default authService;
