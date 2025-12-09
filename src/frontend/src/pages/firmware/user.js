import React, { useState, useEffect } from 'react';
import firmwareService from '../../services/firmwareService';
import deviceService from '../../services/deviceService';

const FirmwareUser = () => {
  const [pendingFirmwares, setPendingFirmwares] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load pending firmwares
      const fwResponse = await firmwareService.getPendingFirmwareUpdates();
      if (fwResponse.success) {
        setPendingFirmwares(fwResponse.data);
      }

      // Load devices
      const deviceResponse = await deviceService.getAll();
      if (deviceResponse.success && deviceResponse.data.length > 0) {
        setDevices(deviceResponse.data);
        setSelectedDevice(deviceResponse.data[0]._id);
      }
    } catch (error) {
      setError(error.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (firmwareId) => {
    if (!selectedDevice) {
      setError('Vui lòng chọn thiết bị');
      return;
    }

    try {
      await firmwareService.acceptFirmwareUpdate(firmwareId, selectedDevice);
      alert('Đã chấp nhận firmware update. Firmware đang được gửi đến thiết bị.');
      loadData();
    } catch (error) {
      setError(error.message || 'Không thể chấp nhận firmware update');
    }
  };

  const handleReject = async (firmwareId) => {
    if (!window.confirm('Bạn có chắc muốn từ chối firmware update này?')) {
      return;
    }

    try {
      await firmwareService.rejectFirmwareUpdate(firmwareId);
      alert('Đã từ chối firmware update');
      loadData();
    } catch (error) {
      setError(error.message || 'Không thể từ chối firmware update');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📦 Firmware Updates
          </h1>
          <p className="text-gray-600">Có bản cập nhật firmware mới cho thiết bị của bạn</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {pendingFirmwares.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Không có firmware update nào
            </h2>
            <p className="text-gray-600">
              Tất cả thiết bị của bạn đã được cập nhật lên phiên bản mới nhất
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingFirmwares.map((fw) => (
              <div key={fw._id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      Version {fw.version}
                    </h3>
                    <p className="text-gray-600">{fw.description || 'Không có mô tả'}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Ngày tạo: {new Date(fw.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                    Pending
                  </span>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn thiết bị để cập nhật:
                  </label>
                  <select
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {devices.map(device => (
                      <option key={device._id} value={device._id}>
                        {device.deviceId || device.name || 'Thiết bị'} ({device._id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleAccept(fw._id)}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Chấp nhận & Cập nhật
                  </button>
                  <button
                    onClick={() => handleReject(fw._id)}
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FirmwareUser;

