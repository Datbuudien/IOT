import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer
} from 'recharts';
import analyticsService from '../../services/analyticsService';
import deviceService from '../../services/deviceService';

const Analytics = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [timeRange, setTimeRange] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [deviceError, setDeviceError] = useState('');
  
  // Data states
  const [statistics, setStatistics] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (devices.length > 0) {
      fetchData();
    }
  }, [selectedDevice, timeRange, devices]);

  const fetchDevices = async () => {
    try {
      setDeviceError('');
      const response = await deviceService.getAll();
      if (response.success && response.data.length > 0) {
        setDevices(response.data);
        setSelectedDevice(response.data[0]._id);
      } else {
        setDevices([]);
        setSelectedDevice('');
        setDeviceError('Chưa có thiết bị nào được gán cho tài khoản của bạn');
      }
    } catch (error) {
      console.error('Lỗi tải devices:', error);
      setDeviceError(error.message || 'Không thể tải danh sách thiết bị');
      setDevices([]);
      setSelectedDevice('');
    }
  };

  const fetchData = async () => {
    try {
      // Kiểm tra token trước khi fetch
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ Không có token, cần đăng nhập');
        return;
      }

      setLoading(true);
      const params = selectedDevice ? { deviceId: selectedDevice } : {};
      params.timeRange = timeRange; // gửi timeRange để backend lọc thống kê cùng mốc thời gian

      console.log('📊 Fetching analytics data with params:', params);

      // Fetch statistics
      const statsRes = await analyticsService.getStatistics(params);
      console.log('✅ Statistics loaded:', statsRes);
      setStatistics(statsRes.data);

      // Fetch chart data based on time range
      if (timeRange === '24h' || timeRange === '12h') {
        const hours = timeRange === '24h' ? 24 : 12;
        const chartRes = await analyticsService.getHourlyData({ ...params, hours });
        console.log('✅ Hourly data loaded:', chartRes);
        setChartData(chartRes.data);
      } else {
        const days = parseInt(timeRange);
        const chartRes = await analyticsService.getDailyData({ ...params, days });
        console.log('✅ Daily data loaded:', chartRes);
        setChartData(chartRes.data);
      }
    } catch (error) {
      console.error('❌ Lỗi tải dữ liệu analytics:', error);
      if (error.response?.status === 401) {
        console.error('❌ Lỗi xác thực - Token có thể đã hết hạn');
      }
    } finally {
      setLoading(false);
    }
  };



  const COLORS = {
    temperature: '#ef4444',
    humidity: '#3b82f6',
  soilMoisture: '#10b981'
  };

  const StatCard = ({ title, value, unit, icon, color }) => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>
            {value}
            <span className="text-lg ml-1">{unit}</span>
          </p>
        </div>
        <div className={`text-4xl ${color}`}>{icon}</div>
      </div>
    </div>
  );

  if (loading && !statistics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📊 Phân Tích & Thống Kê
          </h1>
          <p className="text-gray-600">Theo dõi và phân tích dữ liệu cảm biến</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thiết bị
              </label>
              {devices.length === 0 ? (
                <div className="px-4 py-3 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 bg-gray-50">
                  {deviceError || 'Chưa có thiết bị. Hãy thêm thiết bị để xem dữ liệu.'}
                </div>
              ) : (
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tất cả thiết bị</option>
                  {devices.map(device => (
                    <option key={device._id} value={device._id}>
                      {device.deviceId || device.name || 'Thiết bị'} ({device._id})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khoảng thời gian
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="12h">12 giờ qua</option>
                <option value="24h">24 giờ qua</option>
                <option value="7">7 ngày qua</option>
                <option value="30">30 ngày qua</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b">
            {[
              { id: 'overview', label: '📈 Tổng quan', icon: '📈' },
              { id: 'charts', label: '📊 Biểu đồ', icon: '📊' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && statistics && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Nhiệt độ trung bình"
                value={statistics.temperature?.avg || 0}
                unit="°C"
                icon="🌡️"
                color="text-red-500"
              />
              <StatCard
                title="Độ ẩm trung bình"
                value={statistics.humidity?.avg || 0}
                unit="%"
                icon="💧"
                color="text-blue-500"
              />
              <StatCard
                title="Độ ẩm đất TB"
                value={statistics.soilMoisture?.avg || 0}
                unit="%"
                icon="🌱"
                color="text-green-500"
              />
            </div>

            {/* Detailed Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Chi tiết thống kê</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Temperature */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                    <span className="text-2xl mr-2">🌡️</span> Nhiệt độ
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trung bình:</span>
                      <span className="font-bold text-red-500">{statistics.temperature?.avg || 0}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thấp nhất:</span>
                      <span className="font-medium">{statistics.temperature?.min || 0}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cao nhất:</span>
                      <span className="font-medium">{statistics.temperature?.max || 0}°C</span>
                    </div>
                  </div>
                </div>

                {/* Humidity */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                    <span className="text-2xl mr-2">💧</span> Độ ẩm không khí
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trung bình:</span>
                      <span className="font-bold text-blue-500">{statistics.humidity?.avg || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thấp nhất:</span>
                      <span className="font-medium">{statistics.humidity?.min || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cao nhất:</span>
                      <span className="font-medium">{statistics.humidity?.max || 0}%</span>
                    </div>
                  </div>
                </div>

                {/* Soil Moisture */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                    <span className="text-2xl mr-2">🌱</span> Độ ẩm đất
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trung bình:</span>
                      <span className="font-bold text-green-500">{statistics.soilMoisture?.avg || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thấp nhất:</span>
                      <span className="font-medium">{statistics.soilMoisture?.min || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cao nhất:</span>
                      <span className="font-medium">{statistics.soilMoisture?.max || 0}%</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Weather (isRain) */}
              <div className="mt-6 border rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  <span className="text-2xl mr-2">🌦️</span> Tình trạng mưa (dựa trên isRain)
                </h3>
                {(() => {
                  const rainCount = statistics?.rainCount || 0;
                  const total = statistics?.totalRecords || 0;
                  const rainPercent = total > 0 ? Math.round((rainCount / total) * 100) : 0;
                  const noRainCount = total - rainCount;
                  const noRainPercent = total > 0 ? Math.round((noRainCount / total) * 100) : 0;
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <span className="text-3xl">🌧️</span>
                        <div className="flex-1">
                          <div className="text-sm text-gray-600">Có mưa</div>
                          <div className="text-xl font-bold text-blue-600">{rainCount} lần</div>
                          <div className="text-xs text-gray-500">{rainPercent}%</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                        <span className="text-3xl">🌤️</span>
                        <div className="flex-1">
                          <div className="text-sm text-gray-600">Không mưa</div>
                          <div className="text-xl font-bold text-yellow-600">{noRainCount} lần</div>
                          <div className="text-xs text-gray-500">{noRainPercent}%</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="mt-4 text-center text-sm text-gray-500">
                Tổng số bản ghi: {statistics.totalRecords || 0}
              </div>
            </div>
          </div>
        )}

        {/* Charts Tab */}
        {activeTab === 'charts' && (
          <div className="space-y-6">
            {/* Temperature Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">🌡️ Biểu đồ Nhiệt độ</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={timeRange === '24h' || timeRange === '12h' ? 'time' : 'date'} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke={COLORS.temperature} 
                    fill={COLORS.temperature}
                    fillOpacity={0.6}
                    name="Nhiệt độ (°C)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Humidity Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">💧 Biểu đồ Độ ẩm không khí</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={timeRange === '24h' || timeRange === '12h' ? 'time' : 'date'} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="humidity" 
                    stroke={COLORS.humidity} 
                    fill={COLORS.humidity}
                    fillOpacity={0.6}
                    name="Độ ẩm không khí (%)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4"> Biểu đồ độ ẩm đất</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={timeRange === '24h' || timeRange === '12h' ? 'time' : 'date'} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="soilMoisture" fill={COLORS.soilMoisture} name="Độ ẩm đất (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default Analytics;
