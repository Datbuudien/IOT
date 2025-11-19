import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [systemData, setSystemData] = useState({
    temperature: 28,
    humidity: 65,
    soilMoisture: 45,
    waterLevel: 80,
    pumpStatus: false,
    autoMode: true
  });

  const [notifications] = useState([
    { id: 1, message: 'Hệ thống tưới tự động đã kích hoạt', time: '10 phút trước', type: 'info' },
    { id: 2, message: 'Độ ẩm đất thấp hơn ngưỡng', time: '25 phút trước', type: 'warning' },
    { id: 3, message: 'Bơm nước đã dừng hoạt động', time: '1 giờ trước', type: 'success' }
  ]);

  const handleLogout = () => {
    // TODO: Clear user session/token
    navigate('/login');
  };

  const togglePump = () => {
    setSystemData({ ...systemData, pumpStatus: !systemData.pumpStatus });
  };

  const toggleAutoMode = () => {
    setSystemData({ ...systemData, autoMode: !systemData.autoMode });
  };

  const getStatusColor = (value, type) => {
    if (type === 'temperature') {
      if (value > 35) return 'text-red-600';
      if (value > 30) return 'text-orange-600';
      return 'text-green-600';
    }
    if (type === 'moisture') {
      if (value < 30) return 'text-red-600';
      if (value < 50) return 'text-orange-600';
      return 'text-green-600';
    }
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hệ Thống Tưới Tiêu Thông Minh</h1>
                <p className="text-sm text-gray-500">Giám sát và điều khiển</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">Xin chào, Admin</p>
                <p className="text-xs text-gray-500">admin@example.com</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-150 text-sm font-medium shadow-md"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Control Panel */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="h-6 w-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Bảng điều khiển
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
              <div>
                <p className="text-sm text-gray-600 mb-1">Bơm nước</p>
                <p className={`text-lg font-bold ${systemData.pumpStatus ? 'text-green-600' : 'text-gray-600'}`}>
                  {systemData.pumpStatus ? 'Đang hoạt động' : 'Đã tắt'}
                </p>
              </div>
              <button
                onClick={togglePump}
                disabled={systemData.autoMode}
                className={`px-6 py-3 rounded-lg font-medium transition duration-150 shadow-md ${
                  systemData.pumpStatus
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                } ${systemData.autoMode ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {systemData.pumpStatus ? 'Tắt' : 'Bật'}
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
              <div>
                <p className="text-sm text-gray-600 mb-1">Chế độ tự động</p>
                <p className={`text-lg font-bold ${systemData.autoMode ? 'text-green-600' : 'text-gray-600'}`}>
                  {systemData.autoMode ? 'Đang bật' : 'Đã tắt'}
                </p>
              </div>
              <button
                onClick={toggleAutoMode}
                className={`px-6 py-3 rounded-lg font-medium transition duration-150 shadow-md ${
                  systemData.autoMode
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {systemData.autoMode ? 'Tắt' : 'Bật'}
              </button>
            </div>
          </div>
        </div>

        {/* Sensor Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Temperature */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-2">Nhiệt độ</h3>
            <p className={`text-3xl font-bold ${getStatusColor(systemData.temperature, 'temperature')}`}>
              {systemData.temperature}°C
            </p>
            <p className="text-xs text-gray-500 mt-2">Cập nhật: 2 phút trước</p>
          </div>

          {/* Humidity */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-2">Độ ẩm không khí</h3>
            <p className="text-3xl font-bold text-blue-600">
              {systemData.humidity}%
            </p>
            <p className="text-xs text-gray-500 mt-2">Cập nhật: 2 phút trước</p>
          </div>

          {/* Soil Moisture */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-2">Độ ẩm đất</h3>
            <p className={`text-3xl font-bold ${getStatusColor(systemData.soilMoisture, 'moisture')}`}>
              {systemData.soilMoisture}%
            </p>
            <p className="text-xs text-gray-500 mt-2">Cập nhật: 2 phút trước</p>
          </div>

          {/* Water Level */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-cyan-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-2">Mức nước</h3>
            <p className="text-3xl font-bold text-cyan-600">
              {systemData.waterLevel}%
            </p>
            <p className="text-xs text-gray-500 mt-2">Cập nhật: 5 phút trước</p>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="h-6 w-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Thông báo
          </h2>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border-l-4 ${
                  notification.type === 'warning'
                    ? 'bg-orange-50 border-orange-500'
                    : notification.type === 'success'
                    ? 'bg-green-50 border-green-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <p className="text-gray-800 font-medium">{notification.message}</p>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-4">{notification.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
