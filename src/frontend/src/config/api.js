import axios from 'axios';

// Base URL cho API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Log để debug
console.log('🌐 API Base URL:', API_BASE_URL);

// Tạo axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor - thêm token vào header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - xử lý lỗi chung
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server trả về response với status code không thành công
      if (error.response.status === 401) {
        // Chỉ redirect nếu đang có token (token hết hạn)
        // Không redirect nếu đang ở trang login/register (đăng nhập sai)
        const token = localStorage.getItem('token');
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath === '/login' || currentPath === '/register';
        const errorMessage = error.response?.data?.message || '';
        
        // Không redirect nếu lỗi từ Weather API (thiếu OPENWEATHER_API_KEY)
        const isWeatherApiError = errorMessage.includes('OPENWEATHER_API_KEY') || 
                                  error.config?.url?.includes('/weather/');
        
        console.log('🔒 401 Error:', {
          hasToken: !!token,
          currentPath,
          isAuthPage,
          isWeatherApiError,
          errorMessage
        });
        
        // Chỉ redirect nếu là lỗi authentication thật sự (không phải Weather API)
        if (token && !isAuthPage && !isWeatherApiError) {
          // Token hết hạn hoặc không hợp lệ - redirect về login
          console.log('⚠️ Token không hợp lệ, đang chuyển về trang đăng nhập...');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          window.location.href = '/login';
        } else if (isWeatherApiError) {
          console.warn('⚠️ Lỗi Weather API - Cần cấu hình OPENWEATHER_API_KEY trong backend/.env');
        }
      }
    } else if (error.request) {
      // Request được gửi nhưng không nhận được response
      console.error('Không thể kết nối đến server:', error.request);
    } else {
      // Lỗi khác
      console.error('Lỗi:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
export { API_BASE_URL };
