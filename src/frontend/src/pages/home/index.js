import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import deviceService from '../../services/deviceService';
import sensorDataService from '../../services/sensorDataService';

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [devices, setDevices] = useState([]);
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const [notifications] = useState([
    { id: 1, message: 'Hệ thống tưới tự động đã kích hoạt', time: '10 phút trước', type: 'info' },
    { id: 2, message: 'Độ ẩm đất thấp hơn ngưỡng', time: '25 phút trước', type: 'warning' },
    { id: 3, message: 'Bơm nước đã dừng hoạt động', time: '1 giờ trước', type: 'success' }
  ]);

  // Kiểm tra authentication và load data
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    const userData = authService.getUser();
    setUser(userData);

    loadData();

    // Auto-refresh mỗi 5 giây
    const interval = setInterval(() => {
      loadData();
    }, 5000);

    return () => clearInterval(interval);
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load devices và sensor data song song
      const [devicesResponse, sensorResponse] = await Promise.all([
        deviceService.getDevices(),
        sensorDataService.getLatestData()
      ]);

      if (devicesResponse.success) {
        setDevices(devicesResponse.data);
      }

      if (sensorResponse.success) {
        setSensorData(sensorResponse.data);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePump = async (device) => {
    try {
      // Optimistic update: Cập nhật UI ngay lập tức trước khi gửi lệnh
      const newRelay1Status = !device.relay1Status;
      setDevices(prevDevices => 
        prevDevices.map(d => 
          d._id === device._id 
            ? { ...d, relay1Status: newRelay1Status }
            : d
        )
      );
      
      // Gửi lệnh MQTT để điều khiển bơm
      // relay1Status: true = đang hoạt động (LOW), false = tắt (HIGH)
      const action = device.relay1Status ? 'pump_off' : 'pump_on';
      await deviceService.sendCommand(device._id, { action });
      
      // Đợi 2 giây để ESP32 kịp gửi heartbeat với trạng thái mới, rồi reload để sync
      // UI đã được cập nhật ngay lập tức ở trên (optimistic update)
      setTimeout(() => {
        loadData();
      }, 2000);
    } catch (error) {
      console.error('Lỗi khi thay đổi trạng thái bơm:', error);
      // Rollback nếu có lỗi
      setDevices(prevDevices => 
        prevDevices.map(d => 
          d._id === device._id 
            ? { ...d, relay1Status: device.relay1Status }
            : d
        )
      );
    }
  };

  // Lấy sensor data mới nhất cho device
  const getLatestSensorForDevice = (deviceId) => {
    return sensorData.find(data => data.deviceId === deviceId);
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
    <div className="bg-gradient-to-br from-green-50 to-blue-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with last update */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Cập nhật: {lastUpdate.toLocaleTimeString('vi-VN')}</span>
          </div>
        </div>

        {/* Sensor Data Cards */}
        {loading && devices.length === 0 ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-12 w-12 mx-auto text-green-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            {/* Real-time Sensor Data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {sensorData.length === 0 ? (
                <div className="col-span-3 text-center py-8 bg-white rounded-2xl shadow-xl">
                  <svg className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-gray-600 text-lg mb-2">Chưa có dữ liệu cảm biến</p>
                  <p className="text-gray-500 text-sm">Thêm dữ liệu để xem thông số theo dõi</p>
                </div>
              ) : (
                sensorData.map((data) => {
                  const device = devices.find(d => d._id === data.deviceId);
                  return (
                    <div key={data._id} className="bg-white rounded-2xl shadow-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {device?.deviceId || 'Unknown Device'}
                      </h3>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Live
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Temperature */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span className="text-sm text-gray-600">Nhiệt độ</span>
                        </div>
                        <span className={`text-lg font-bold ${getStatusColor(data.temperature, 'temperature')}`}>
                          {data.temperature}°C
                        </span>
                      </div>

                      {/* Humidity */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                          </svg>
                          <span className="text-sm text-gray-600">Độ ẩm không khí</span>
                        </div>
                        <span className="text-lg font-bold text-blue-600">
                          {data.humidity}%
                        </span>
                      </div>

                      {/* Soil Moisture */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                          <span className="text-sm text-gray-600">Độ ẩm đất</span>
                        </div>
                        <span className={`text-lg font-bold ${getStatusColor(data.soil_moisture, 'moisture')}`}>
                          {data.soil_moisture}%
                        </span>
                      </div>

                      {/* Weather Condition from isRain */}
                      {data.isRain !== undefined && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">
                              {data.isRain ? '🌧️' : '🌤️'}
                            </span>
                            <span className="text-sm text-gray-600">Thời tiết</span>
                          </div>
                          <span className="text-lg font-bold text-yellow-600 capitalize">
                            {data.isRain ? 'Mưa' : 'Không mưa'}
                          </span>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="pt-3 border-t text-xs text-gray-500">
                        {new Date(data.timestamp).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                      </div>
                    </div>
                  </div>
                );
              })
              )}
            </div>

            {/* Device Control Panel */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <svg className="h-6 w-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Điều khiển thiết bị
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {devices.map((device) => {
                  // Kiểm tra trạng thái online/offline dựa trên lastSeen
                  // Nếu lastSeen < 1 phút trước thì online, ngược lại offline
                  // Ưu tiên kiểm tra lastSeen thay vì device.status vì lastSeen được cập nhật từ heartbeat thực tế
                  const isOnline = device.lastSeen 
                    ? (new Date() - new Date(device.lastSeen)) < 1 * 60 * 1000 // 1 phút (vì heartbeat gửi mỗi 5 giây)
                    : false;
                  
                  const status = isOnline ? 'online' : 'offline';
                  
                  return (
                    <div key={device._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-medium text-gray-700">{device.deviceId}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            status === 'online' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {status === 'online' ? '🟢 Online' : '⚫ Offline'}
                          </span>
                        </div>
                        <p className={`text-lg font-bold ${device.relay1Status ? 'text-green-600' : 'text-gray-600'}`}>
                          {device.relay1Status ? 'Đang hoạt động' : 'Đang tắt'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Chế độ: {device.mode}</p>
                        {device.lastSeen && (
                          <p className="text-xs text-gray-400 mt-1">
                            Lần cuối: {new Date(device.lastSeen).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
