import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Log thông tin authentication để debug
    console.log('🔐 Protected Route Check:', {
      path: location.pathname,
      isAuthenticated,
      hasToken: !!token,
      token: token ? `${token.substring(0, 20)}...` : 'null'
    });
  }, [location.pathname, isAuthenticated, token]);

  if (!isAuthenticated) {
    console.warn('⚠️ Không có quyền truy cập, chuyển về trang đăng nhập');
    // Lưu URL hiện tại để redirect sau khi đăng nhập
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
