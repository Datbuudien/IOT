import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../../services/authService';

/**
 * Component để bảo vệ route chỉ dành cho admin
 */
const AdminRoute = ({ children }) => {
  const user = authService.getUser();
  const isAdmin = user && user.role === 'admin';

  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default AdminRoute;

