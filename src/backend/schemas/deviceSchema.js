/**
 * Device Schema
 * Định nghĩa cấu trúc và validation cho Device collection
 * Theo ERD: Users (1) -> (N) Devices
 */

const deviceModes = ['auto', 'manual', 'schedule', 'off'];

const deviceSchema = {
  // Required fields
  userId: {
    type: 'ObjectId',
    required: true,
    description: 'ID của user sở hữu device (Foreign Key)'
  },
  deviceId: {
    type: 'string',
    required: true,
    unique: true,
    description: 'Mã định danh thiết bị duy nhất (ví dụ: DEV001, PUMP01)'
  },
  
  // Control fields
  pumpStatus: {
    type: 'boolean',
    required: true,
    default: false,
    description: 'Trạng thái bơm: true = ON, false = OFF'
  },
  mode: {
    type: 'string',
    required: true,
    enum: deviceModes,
    default: 'manual',
    description: 'Chế độ hoạt động: auto, manual, schedule, off'
  },
  
  // Metadata
  createdAt: {
    type: 'Date',
    required: true,
    default: () => new Date(),
    description: 'Thời gian tạo'
  },
  updatedAt: {
    type: 'Date',
    required: true,
    default: () => new Date(),
    description: 'Thời gian cập nhật'
  }
};

// Validation functions
const validateDevice = (deviceData, isUpdate = false) => {
  const errors = [];

  // Validate deviceId (chỉ bắt buộc khi tạo mới)
  if (!isUpdate && (!deviceData.deviceId || deviceData.deviceId.trim().length === 0)) {
    errors.push('Mã thiết bị (deviceId) không được để trống');
  }
  if (deviceData.deviceId && deviceData.deviceId.length > 50) {
    errors.push('Mã thiết bị không được vượt quá 50 ký tự');
  }

  // Validate pumpStatus
  if (deviceData.pumpStatus !== undefined && typeof deviceData.pumpStatus !== 'boolean') {
    errors.push('Trạng thái bơm (pumpStatus) phải là true hoặc false');
  }

  // Validate mode
  if (deviceData.mode && !deviceModes.includes(deviceData.mode)) {
    errors.push(`Chế độ hoạt động phải là một trong: ${deviceModes.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Collection indexes (để tối ưu performance)
const indexes = [
  { key: { userId: 1 }, name: 'userId_index' },
  { key: { deviceId: 1 }, name: 'deviceId_unique', unique: true },
  { key: { pumpStatus: 1 }, name: 'pumpStatus_index' },
  { key: { mode: 1 }, name: 'mode_index' },
  { key: { userId: 1, pumpStatus: 1 }, name: 'userId_pumpStatus_index' }
];

module.exports = {
  deviceSchema,
  deviceModes,
  validateDevice,
  indexes
};
