import React, { useState, useEffect } from 'react';
import firmwareService from '../../services/firmwareService';

const FirmwareAdmin = () => {
  const [firmwares, setFirmwares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    version: '',
    description: '',
    firmwareUrl: '',
    firmwareSize: '',
    checksum: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadFirmwares();
  }, []);

  const loadFirmwares = async () => {
    try {
      setLoading(true);
      const response = await firmwareService.getAllFirmwareUpdates();
      if (response.success) {
        setFirmwares(response.data);
      }
    } catch (error) {
      setError(error.message || 'Không thể tải danh sách firmware');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.version || !formData.firmwareUrl) {
      setError('Version và Firmware URL là bắt buộc');
      return;
    }

    try {
      await firmwareService.createFirmwareUpdate({
        ...formData,
        firmwareSize: formData.firmwareSize ? parseInt(formData.firmwareSize) : 0
      });
      setShowModal(false);
      setFormData({
        version: '',
        description: '',
        firmwareUrl: '',
        firmwareSize: '',
        checksum: ''
      });
      loadFirmwares();
    } catch (error) {
      setError(error.message || 'Không thể tạo firmware update');
    }
  };

  const handleDelete = async (firmwareId) => {
    if (!window.confirm('Bạn có chắc muốn xóa firmware update này?')) {
      return;
    }

    try {
      await firmwareService.deleteFirmwareUpdate(firmwareId);
      loadFirmwares();
    } catch (error) {
      setError(error.message || 'Không thể xóa firmware update');
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              📦 Quản lý Firmware Updates
            </h1>
            <p className="text-gray-600">Tạo và quản lý firmware updates cho ESP32</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tạo Firmware Update
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mô tả
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thống kê
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {firmwares.map((fw) => (
                <tr key={fw._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{fw.version}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{fw.description || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-blue-600 truncate max-w-xs">
                      <a href={fw.firmwareUrl} target="_blank" rel="noopener noreferrer">
                        {fw.firmwareUrl}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      fw.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      fw.status === 'active' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {fw.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {fw.stats && (
                      <div className="text-sm">
                        <div>✅ Accept: {fw.stats.accept}</div>
                        <div>❌ Reject: {fw.stats.reject}</div>
                        <div>📊 Total: {fw.stats.total}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDelete(fw._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal tạo firmware update */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Tạo Firmware Update</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Version *
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: 1.0.0"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Mô tả về bản cập nhật..."
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Firmware URL *
                  </label>
                  <input
                    type="url"
                    value={formData.firmwareUrl}
                    onChange={(e) => setFormData({ ...formData, firmwareUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/firmware.bin"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kích thước (bytes)
                  </label>
                  <input
                    type="number"
                    value={formData.firmwareSize}
                    onChange={(e) => setFormData({ ...formData, firmwareSize: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Checksum (MD5/SHA256)
                  </label>
                  <input
                    type="text"
                    value={formData.checksum}
                    onChange={(e) => setFormData({ ...formData, checksum: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Tạo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setError('');
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FirmwareAdmin;

