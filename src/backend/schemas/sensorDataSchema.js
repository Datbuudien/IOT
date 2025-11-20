/**
 * SensorData Schema
 * Định nghĩa cấu trúc và validation cho SensorData collection
 * Theo ERD: Devices (1) -> (N) SensorData
 */

const sensorDataSchema = {
  // Required fields
  deviceId: {
    type: 'ObjectId',
    required: true,
    description: 'ID của device (Foreign Key)'
  },
  temperature: {
    type: 'number',
    required: true,
    min: -50,
    max: 100,
    description: 'Nhiệt độ (°C)'
  },
  humidity: {
    type: 'number',
    required: true,
    min: 0,
    max: 100,
    description: 'Độ ẩm không khí (%)'
  },
  soil_moisture: {
    type: 'number',
    required: true,
    min: 0,
    max: 100,
    description: 'Độ ẩm đất (%)'
  },
  timestamp: {
    type: 'Date',
    required: true,
    default: () => new Date(),
    description: 'Thời gian đo'
  }
};

// Validation functions
const validateSensorData = (sensorData) => {
  const errors = [];

  // Validate deviceId
  if (!sensorData.deviceId) {
    errors.push('Device ID không được để trống');
  }

  // Validate temperature
  if (sensorData.temperature === undefined || sensorData.temperature === null) {
    errors.push('Nhiệt độ không được để trống');
  }
  if (typeof sensorData.temperature !== 'number') {
    errors.push('Nhiệt độ phải là số');
  }
  if (sensorData.temperature < -50 || sensorData.temperature > 100) {
    errors.push('Nhiệt độ phải trong khoảng -50°C đến 100°C');
  }

  // Validate humidity
  if (sensorData.humidity === undefined || sensorData.humidity === null) {
    errors.push('Độ ẩm không khí không được để trống');
  }
  if (typeof sensorData.humidity !== 'number') {
    errors.push('Độ ẩm không khí phải là số');
  }
  if (sensorData.humidity < 0 || sensorData.humidity > 100) {
    errors.push('Độ ẩm không khí phải trong khoảng 0% đến 100%');
  }

  // Validate soil_moisture
  if (sensorData.soil_moisture === undefined || sensorData.soil_moisture === null) {
    errors.push('Độ ẩm đất không được để trống');
  }
  if (typeof sensorData.soil_moisture !== 'number') {
    errors.push('Độ ẩm đất phải là số');
  }
  if (sensorData.soil_moisture < 0 || sensorData.soil_moisture > 100) {
    errors.push('Độ ẩm đất phải trong khoảng 0% đến 100%');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Collection indexes
const indexes = [
  { key: { deviceId: 1 }, name: 'deviceId_index' },
  { key: { timestamp: -1 }, name: 'timestamp_desc_index' },
  { key: { deviceId: 1, timestamp: -1 }, name: 'deviceId_timestamp_index' }
];

module.exports = {
  sensorDataSchema,
  validateSensorData,
  indexes
};
