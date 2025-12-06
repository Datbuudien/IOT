import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { CloudRain, Thermometer, Droplets, Power, Sprout, RefreshCw, History, Wifi, WifiOff } from 'lucide-react';
import io from 'socket.io-client';

// Cấu hình kết nối tới Backend (Thay đổi URL này nếu backend của bạn chạy ở nơi khác)
const BACKEND_URL = 'http://localhost:5000';
const socket = io(BACKEND_URL);

function App() {
  // --- State quản lý dữ liệu ---
  const [currentData, setCurrentData] = useState({
    temperature: '--',
    humidity: '--',
    soil_moisture: '--',
    timestamp: null
  });
  const [historyData, setHistoryData] = useState([]);
  const [isPumpOn, setIsPumpOn] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // --- Hàm lấy dữ liệu lịch sử ---
  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/sensors/history`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      // Format lại thời gian cho đẹp để hiển thị trên biểu đồ
      const formattedData = data.map(item => ({
        ...item,
        time: new Date(item.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }));
      setHistoryData(formattedData);
    } catch (error) {
      console.error("Lỗi lấy lịch sử:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // --- Hàm lấy dữ liệu mới nhất lần đầu ---
  const fetchLatest = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/sensors/latest`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.timestamp) {
           setCurrentData(data);
        }
      }
    } catch (error) {
      console.error("Lỗi lấy dữ liệu mới nhất:", error);
    }
  }, []);

  // --- Xử lý sự kiện Socket.IO & Khởi tạo ---
  useEffect(() => {
    // 1. Lắng nghe sự kiện kết nối
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // 2. Lắng nghe dữ liệu cảm biến mới từ Server gửi xuống
    socket.on('new_sensor_data', (newData) => {
      console.log("🔥 Nhận data mới từ Socket:", newData);
      setCurrentData(newData);
      // Cập nhật luôn vào biểu đồ (thêm vào cuối mảng lịch sử)
      setHistoryData(prev => {
        const newItem = {
          ...newData,
           time: new Date(newData.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };
        // Giữ lại tối đa 50 điểm dữ liệu để biểu đồ không bị quá tải
        const newHistory = [...prev, newItem];
        if (newHistory.length > 50) newHistory.shift();
        return newHistory;
      });
    });

    // 3. Lắng nghe trạng thái bơm (nếu có thiết bị khác điều khiển)
    socket.on('pump_status_changed', (command) => {
      setIsPumpOn(command.status === 'ON');
    });

    // 4. Gọi API lấy dữ liệu lần đầu khi app vừa tải
    fetchLatest();
    fetchHistory();

    // Cleanup khi component bị hủy
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('new_sensor_data');
      socket.off('pump_status_changed');
    };
  }, [fetchHistory, fetchLatest]);

  // --- Hàm xử lý bật/tắt bơm ---
  const togglePump = () => {
    const newStatus = isPumpOn ? 'OFF' : 'ON';
    setIsPumpOn(!isPumpOn); // Cập nhật UI ngay cho mượt
    // Gửi lệnh về server
    socket.emit('control_pump', { status: newStatus });
  };

  // --- Component con: Thẻ hiển thị thông số ---
  const StatCard = ({ title, value, unit, icon: Icon, color }) => (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4`}>
      <div className={`p-4 rounded-full ${color.bg} ${color.text}`}>
        <Icon size={32} strokeWidth={2} />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline space-x-1">
          <h3 className="text-3xl font-bold text-gray-800">{typeof value === 'number' ? value.toFixed(1) : value}</h3>
          <span className="text-lg text-gray-500 font-medium">{unit}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* --- HEADER --- */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-green-500 p-2 rounded-lg">
              <Sprout className="text-white" size={28} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Smart Garden</h1>
          </div>
          <div className="flex items-center space-x-4">
             {/* Trạng thái kết nối Server */}
            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {isConnected ? <Wifi size={16} className="mr-2"/> : <WifiOff size={16} className="mr-2"/>}
              {isConnected ? 'Đã kết nối Server' : 'Mất kết nối'}
            </div>
            <div className="text-sm text-gray-500">
              Cập nhật: {currentData.timestamp ? new Date(currentData.timestamp).toLocaleTimeString('vi-VN') : '--:--'}
            </div>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 1. Hàng Thẻ Thông Số (Stats Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Độ ẩm đất"
            value={currentData.soil_moisture}
            unit="%"
            icon={Droplets}
            color={{ bg: 'bg-blue-100', text: 'text-blue-600' }}
          />
          <StatCard
            title="Nhiệt độ"
            value={currentData.temperature}
            unit="°C"
            icon={Thermometer}
            color={{ bg: 'bg-orange-100', text: 'text-orange-600' }}
          />
          <StatCard
            title="Độ ẩm không khí"
            value={currentData.humidity}
            unit="%"
            icon={CloudRain}
            color={{ bg: 'bg-cyan-100', text: 'text-cyan-600' }}
          />
        </div>

        {/* 2. Hàng Điều khiển & Biểu đồ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cột Trái: Bảng điều khiển */}
          <div className="lg:col-span-1 space-y-8">
             {/* Card Điều khiển Máy bơm */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Power className="mr-2 text-gray-500" /> Điều khiển Máy bơm
              </h2>
              
              <div className="flex flex-col items-center justify-center py-6">
                {/* Nút bấm lớn */}
                <button
                  onClick={togglePump}
                  className={`relative group w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 ${
                    isPumpOn 
                      ? 'bg-green-500 hover:bg-green-600 focus:ring-green-300 shadow-lg shadow-green-500/50' 
                      : 'bg-gray-200 hover:bg-gray-300 focus:ring-gray-100'
                  }`}
                >
                  <Power size={48} className={`transition-colors duration-300 ${isPumpOn ? 'text-white' : 'text-gray-500'}`} />
                  {isPumpOn && (
                    <span className="absolute w-full h-full rounded-full border-4 border-green-500 animate-ping opacity-75"></span>
                  )}
                </button>
                <p className="mt-6 text-lg font-medium text-gray-700">
                  Trạng thái: <span className={isPumpOn ? 'text-green-600 font-bold' : 'text-gray-500'}>
                    {isPumpOn ? 'ĐANG TƯỚI...' : 'ĐÃ TẮT'}
                  </span>
                </p>
              </div>

               {/* Chế độ hoạt động (Ví dụ placeholder) */}
               <div className="mt-8 border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600 font-medium">Chế độ:</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Thủ công</span>
                </div>
                 <button className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                   Chuyển sang Tự động
                 </button>
               </div>
            </div>
          </div>

          {/* Cột Phải: Biểu đồ Lịch sử */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <History className="mr-2 text-gray-500" /> Biểu đồ theo dõi
                </h2>
                <button 
                  onClick={fetchHistory} 
                  disabled={isLoadingHistory}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                  title="Làm mới dữ liệu"
                >
                  <RefreshCw size={20} className={isLoadingHistory ? 'animate-spin' : ''} />
                </button>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSoil" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#9CA3AF" fontSize={12}  domain={[0, 100]} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontSize: '14px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="soil_moisture" 
                      name="Độ ẩm đất (%)"
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorSoil)" 
                    />
                     <Area 
                      type="monotone" 
                      dataKey="temperature" 
                      name="Nhiệt độ (°C)"
                      stroke="#F97316" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorTemp)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center mt-4 space-x-6">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Độ ẩm đất</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Nhiệt độ</span>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;