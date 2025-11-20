import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import Home from '../pages/home';
import Login from '../pages/login';
import Register from '../pages/register';
import Devices from '../pages/devices';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Routes without layout (Login, Register) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Routes with layout (Protected pages) */}
      <Route element={<MainLayout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/devices" element={<Devices />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
