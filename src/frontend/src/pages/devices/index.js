import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import deviceService from '../../services/deviceService';

const Devices = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [formData, setFormData] = useState({
    deviceId: '',
    pumpStatus: false,
    mode: 'manual'
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadDevices();
  }, [navigate]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const response = await deviceService.getDevices();
      if (response.success) {
        setDevices(response.data);
      }
    } catch (error) {
      setError('Không thể tải danh sách thiết bị');
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddDevice = () => {
    setEditingDevice(null);
    setFormData({
      deviceId: '',
      pumpStatus: false,
      mode: 'manual'
    });
    setShowModal(true);
  };

  const handleEditDevice = (device) => {
    setEditingDevice(device);
    setFormData({
      deviceId: device.deviceId,
      pumpStatus: device.pumpStatus,
      mode: device.mode
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.deviceId) {
      setError('Vui lòng điền mã thiết bị');
      return;
    }

    try {
      if (editingDevice) {
        // Update device
        await deviceService.updateDevice(editingDevice._id, formData);
      } else {
        // Add new device
        await deviceService.addDevice(formData);
      }
      setShowModal(false);
      loadDevices();
    } catch (error) {
      setError(error.message || 'Có lỗi xảy ra');
    }
  };

  const handleTogglePump = async (device) => {
    try {
      await deviceService.updateDevice(device._id, {
        pumpStatus: !device.pumpStatus
      });
      loadDevices();
    } catch (error) {
      setError('Không thể thay đổi trạng thái bơm');
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    if (!window.confirm('Bạn có chắc muốn xóa thiết bị này?')) {
      return;
    }

    try {
      await deviceService.deleteDevice(deviceId);
      loadDevices();
    } catch (error) {
      setError('Không thể xóa thiết bị');
    }
  };

  const getDeviceIcon = (pumpStatus) => {
    return (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  };

  const getModeLabel = (mode) => {
    const modeConfig = {
      auto: { label: 'Tự động', color: 'text-blue-600' },
      manual: { label: 'Thủ công', color: 'text-gray-600' },
      schedule: { label: 'Lịch trình', color: 'text-purple-600' },
      off: { label: 'Tắt', color: 'text-red-600' }
    };
    return modeConfig[mode] || modeConfig.manual;
  };

  const getPumpStatusBadge = (pumpStatus) => {
    return pumpStatus ? (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
        <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
        Đang hoạt động
      </span>
    ) : (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Tắt
      </span>
    );
  };

  return (
    <>
      <div className="bg-gray-50 min-h-screen">
        {/* Page Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý Thiết bị</h1>
              <p className="text-sm text-gray-500 mt-1">Theo dõi và điều khiển các thiết bị IoT</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Bar */}
        <div className="mb-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Tổng số thiết bị: <span className="font-semibold text-gray-900">{devices.length}</span>
          </div>
          <button
            onClick={handleAddDevice}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition duration-150 shadow-md"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm thiết bị
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-12 w-12 mx-auto text-green-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <svg className="h-16 w-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <p className="mt-4 text-gray-600">Chưa có thiết bị nào</p>
            <button
              onClick={handleAddDevice}
              className="mt-4 text-green-600 hover:text-green-700 font-medium"
            >
              Thêm thiết bị đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <div key={device._id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition duration-150 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${
                    device.pumpStatus ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getDeviceIcon(device.pumpStatus)}
                  </div>
                  {getPumpStatusBadge(device.pumpStatus)}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {device.deviceId}
                </h3>
                <div className="space-y-2 mb-4">
                  <p className={`text-sm font-medium ${getModeLabel(device.mode).color}`}>
                    Chế độ: {getModeLabel(device.mode).label}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleTogglePump(device)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition duration-150 ${
                      device.pumpStatus
                        ? 'bg-red-50 hover:bg-red-100 text-red-600'
                        : 'bg-green-50 hover:bg-green-100 text-green-600'
                    }`}
                  >
                    {device.pumpStatus ? 'Tắt bơm' : 'Bật bơm'}
                  </button>
                  <button
                    onClick={() => handleEditDevice(device)}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium transition duration-150"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDeleteDevice(device._id)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-medium transition duration-150"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>

      {/* Modal Add/Edit Device */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingDevice ? 'Chỉnh sửa thiết bị' : 'Thêm thiết bị mới'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã thiết bị <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="deviceId"
                  value={formData.deviceId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ví dụ: PUMP001, DEV001"
                  disabled={editingDevice !== null}
                />
                {editingDevice && (
                  <p className="text-xs text-gray-500 mt-1">Không thể thay đổi mã thiết bị</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chế độ hoạt động
                </label>
                <select
                  name="mode"
                  value={formData.mode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="manual">Thủ công</option>
                  <option value="auto">Tự động</option>
                  <option value="schedule">Lịch trình</option>
                  <option value="off">Tắt</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái bơm
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="pumpStatus"
                      checked={formData.pumpStatus === false}
                      onChange={() => setFormData({ ...formData, pumpStatus: false })}
                      className="mr-2"
                    />
                    <span className="text-sm">Tắt</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="pumpStatus"
                      checked={formData.pumpStatus === true}
                      onChange={() => setFormData({ ...formData, pumpStatus: true })}
                      className="mr-2"
                    />
                    <span className="text-sm">Bật</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-150"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-150"
                >
                  {editingDevice ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Devices;
