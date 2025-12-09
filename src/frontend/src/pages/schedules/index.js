import React, { useState, useEffect } from 'react';
import scheduleService from '../../services/scheduleService';
import deviceService from '../../services/deviceService';

const Schedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    deviceId: '',
    name: '',
    description: '',
    startTime: '06:00',
    duration: 30,
    daysOfWeek: [],
    isActive: true
  });

  const daysMap = [
    { value: 0, label: 'CN' },
    { value: 1, label: 'T2' },
    { value: 2, label: 'T3' },
    { value: 3, label: 'T4' },
    { value: 4, label: 'T5' },
    { value: 5, label: 'T6' },
    { value: 6, label: 'T7' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedulesRes, devicesRes] = await Promise.all([
        scheduleService.getAll(),
        deviceService.getAll()
      ]);
      setSchedules(schedulesRes.data);
      setDevices(devicesRes.data);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        await scheduleService.update(editingSchedule._id, formData);
      } else {
        await scheduleService.create(formData);
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Lỗi lưu lịch:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      deviceId: schedule.deviceId.toString(),
      name: schedule.name,
      description: schedule.description || '',
      startTime: schedule.startTime,
      duration: schedule.duration,
      daysOfWeek: schedule.daysOfWeek,
      isActive: schedule.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm('Bạn có chắc muốn xóa lịch này?')) return;
    try {
      await scheduleService.delete(scheduleId);
      fetchData();
    } catch (error) {
      console.error('Lỗi xóa lịch:', error);
      alert('Không thể xóa lịch');
    }
  };

  const handleToggleActive = async (scheduleId) => {
    try {
      await scheduleService.toggleActive(scheduleId);
      fetchData();
    } catch (error) {
      console.error('Lỗi toggle lịch:', error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
    setFormData({
      deviceId: '',
      name: '',
      description: '',
      startTime: '06:00',
      duration: 30,
      daysOfWeek: [],
      isActive: true
    });
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  const formatDaysOfWeek = (days) => {
    return days.sort((a, b) => a - b).map(day => daysMap[day].label).join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">🕐 Lịch Tưới Tự Động</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition"
        >
          ➕ Tạo Lịch Mới
        </button>
      </div>

      {schedules.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 text-lg mb-4">Chưa có lịch tưới nào</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Tạo lịch đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map(schedule => (
            <div key={schedule._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{schedule.name}</h3>
                  <p className="text-sm text-gray-500">
                    {devices.find(d => d._id === schedule.deviceId.toString())?.deviceId || 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleActive(schedule._id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    schedule.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {schedule.isActive ? 'BẬT' : 'TẮT'}
                </button>
              </div>

              {schedule.description && (
                <p className="text-gray-600 text-sm mb-3">{schedule.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-gray-700">
                  <span className="text-lg mr-2">⏰</span>
                  <span className="font-medium">{schedule.startTime}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-lg mr-2">⏱️</span>
                  <span>{schedule.duration} phút</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-lg mr-2">📅</span>
                  <span>{formatDaysOfWeek(schedule.daysOfWeek)}</span>
                </div>
              </div>

              {schedule.nextRun && (
                <div className="bg-blue-50 rounded p-2 mb-3">
                  <p className="text-xs text-blue-800">
                    Lần chạy tiếp: {new Date(schedule.nextRun).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(schedule)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-medium transition"
                >
                  ✏️ Sửa
                </button>
                <button
                  onClick={() => handleDelete(schedule._id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded font-medium transition"
                >
                  🗑️ Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {editingSchedule ? 'Chỉnh Sửa Lịch' : 'Tạo Lịch Mới'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Device */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Thiết Bị *</label>
                    <select
                      value={formData.deviceId}
                      onChange={(e) => setFormData({...formData, deviceId: e.target.value})}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- Chọn thiết bị --</option>
                      {devices.map(device => (
                        <option key={device._id} value={device._id}>{device.deviceId || device.name || `Device ${device._id}`}</option>
                      ))}
                    </select>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Tên Lịch *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      placeholder="VD: Tưới sáng"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Mô Tả</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows="2"
                      placeholder="Mô tả ngắn về lịch tưới..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Start Time */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Thời Gian Bắt Đầu *</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Thời Lượng (phút) *</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                      required
                      min="1"
                      max="1440"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Days of Week */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Ngày Trong Tuần *</label>
                    <div className="flex gap-2 flex-wrap">
                      {daysMap.map(day => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={`px-4 py-2 rounded-lg font-medium transition ${
                            formData.daysOfWeek.includes(day.value)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                    {formData.daysOfWeek.length === 0 && (
                      <p className="text-red-500 text-sm mt-1">* Chọn ít nhất 1 ngày</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={formData.daysOfWeek.length === 0}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition"
                  >
                    {editingSchedule ? 'Cập Nhật' : 'Tạo Lịch'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-medium transition"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedules;
