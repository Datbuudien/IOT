/**
 * User Schema
 * Định nghĩa cấu trúc và validation cho User collection
 */

const userRoles = ['user', 'admin'];
const userStatuses = ['active', 'inactive', 'suspended'];

const userSchema = {
  // Required fields
  name: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 100,
    description: 'Tên người dùng'
  },
  email: {
    type: 'string',
    required: true,
    unique: true,
    lowercase: true,
    description: 'Email đăng nhập'
  },
  password: {
    type: 'string',
    required: true,
    minLength: 6,
    description: 'Mật khẩu đã hash'
  },
  
  // Optional fields
  role: {
    type: 'string',
    required: false,
    enum: userRoles,
    default: 'user',
    description: 'Vai trò: user, admin'
  },
  status: {
    type: 'string',
    required: false,
    enum: userStatuses,
    default: 'active',
    description: 'Trạng thái tài khoản'
  },
  phone: {
    type: 'string',
    required: false,
    description: 'Số điện thoại'
  },
  avatar: {
    type: 'string',
    required: false,
    description: 'URL avatar'
  },
  
  // Metadata
  lastLogin: {
    type: 'Date',
    required: false,
    description: 'Lần đăng nhập cuối'
  },
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
const validateUser = (userData) => {
  const errors = [];

  // Validate name
  if (!userData.name || userData.name.trim().length === 0) {
    errors.push('Tên không được để trống');
  }
  if (userData.name && userData.name.length < 2) {
    errors.push('Tên phải có ít nhất 2 ký tự');
  }
  if (userData.name && userData.name.length > 100) {
    errors.push('Tên không được vượt quá 100 ký tự');
  }

  // Validate email
  if (!userData.email || userData.email.trim().length === 0) {
    errors.push('Email không được để trống');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (userData.email && !emailRegex.test(userData.email)) {
    errors.push('Email không hợp lệ');
  }

  // Validate password (chỉ khi tạo mới, không validate khi update)
  if (userData.password !== undefined) {
    if (!userData.password || userData.password.length === 0) {
      errors.push('Mật khẩu không được để trống');
    }
    if (userData.password && userData.password.length < 6) {
      errors.push('Mật khẩu phải có ít nhất 6 ký tự');
    }
  }

  // Validate role
  if (userData.role && !userRoles.includes(userData.role)) {
    errors.push(`Vai trò phải là một trong: ${userRoles.join(', ')}`);
  }

  // Validate status
  if (userData.status && !userStatuses.includes(userData.status)) {
    errors.push(`Trạng thái phải là một trong: ${userStatuses.join(', ')}`);
  }

  // Validate phone
  if (userData.phone) {
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(userData.phone)) {
      errors.push('Số điện thoại không hợp lệ (10-11 chữ số)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Collection indexes
const indexes = [
  { key: { email: 1 }, name: 'email_unique', unique: true },
  { key: { role: 1 }, name: 'role_index' },
  { key: { status: 1 }, name: 'status_index' }
];

module.exports = {
  userSchema,
  userRoles,
  userStatuses,
  validateUser,
  indexes
};
