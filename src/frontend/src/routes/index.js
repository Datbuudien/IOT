import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';
import Home from '../pages/home';
import Login from '../pages/login';
import Register from '../pages/register';
import Devices from '../pages/devices';
import Schedules from '../pages/schedules';
import Analytics from '../pages/analytics';
import FirmwareAdmin from '../pages/firmware/admin';
import FirmwareUser from '../pages/firmware/user';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Routes without layout (Login, Register) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Routes with layout (Protected pages) */}
      <Route element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="/home" element={<Home />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/schedules" element={<Schedules />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/firmware" element={<FirmwareUser />} />
      </Route>

      {/* Admin routes */}
      <Route element={
        <ProtectedRoute>
          <AdminRoute>
            <MainLayout />
          </AdminRoute>
        </ProtectedRoute>
      }>
        <Route path="/admin/firmware" element={<FirmwareAdmin />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
