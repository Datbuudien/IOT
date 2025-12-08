const Joi = require('joi');

/**
 * Schedule Schema
 * Định nghĩa validation cho lịch tưới tự động
 */

// Schema cho việc tạo schedule mới
const createScheduleSchema = Joi.object({
  deviceId: Joi.string().required().messages({
    'string.empty': 'Device ID không được để trống',
    'any.required': 'Device ID là bắt buộc'
  }),
  name: Joi.string().min(3).max(100).required().messages({
    'string.empty': 'Tên lịch không được để trống',
    'string.min': 'Tên lịch phải có ít nhất 3 ký tự',
    'string.max': 'Tên lịch không được quá 100 ký tự',
    'any.required': 'Tên lịch là bắt buộc'
  }),
  description: Joi.string().max(500).allow('').optional().messages({
    'string.max': 'Mô tả không được quá 500 ký tự'
  }),
  startTime: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
    'string.empty': 'Thời gian bắt đầu không được để trống',
    'string.pattern.base': 'Thời gian bắt đầu phải có định dạng HH:mm (VD: 08:00)',
    'any.required': 'Thời gian bắt đầu là bắt buộc'
  }),
  duration: Joi.number().integer().min(1).max(1440).required().messages({
    'number.base': 'Thời lượng phải là số',
    'number.integer': 'Thời lượng phải là số nguyên',
    'number.min': 'Thời lượng phải ít nhất 1 phút',
    'number.max': 'Thời lượng không được quá 1440 phút (24 giờ)',
    'any.required': 'Thời lượng là bắt buộc'
  }),
  daysOfWeek: Joi.array().items(
    Joi.number().integer().min(0).max(6)
  ).min(1).required().messages({
    'array.min': 'Phải chọn ít nhất 1 ngày trong tuần',
    'any.required': 'Ngày trong tuần là bắt buộc'
  }),
  isActive: Joi.boolean().default(true).messages({
    'boolean.base': 'Trạng thái kích hoạt phải là true/false'
  })
});

// Schema cho việc cập nhật schedule
const updateScheduleSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional().messages({
    'string.min': 'Tên lịch phải có ít nhất 3 ký tự',
    'string.max': 'Tên lịch không được quá 100 ký tự'
  }),
  description: Joi.string().max(500).allow('').optional().messages({
    'string.max': 'Mô tả không được quá 500 ký tự'
  }),
  startTime: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional().messages({
    'string.pattern.base': 'Thời gian bắt đầu phải có định dạng HH:mm (VD: 08:00)'
  }),
  duration: Joi.number().integer().min(1).max(1440).optional().messages({
    'number.base': 'Thời lượng phải là số',
    'number.integer': 'Thời lượng phải là số nguyên',
    'number.min': 'Thời lượng phải ít nhất 1 phút',
    'number.max': 'Thời lượng không được quá 1440 phút (24 giờ)'
  }),
  daysOfWeek: Joi.array().items(
    Joi.number().integer().min(0).max(6)
  ).min(1).optional().messages({
    'array.min': 'Phải chọn ít nhất 1 ngày trong tuần'
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'Trạng thái kích hoạt phải là true/false'
  })
}).min(1).messages({
  'object.min': 'Phải có ít nhất một trường để cập nhật'
});

// Hàm validate dữ liệu schedule
const validateSchedule = (data) => {
  const { error, value } = createScheduleSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message)
    };
  }

  return {
    isValid: true,
    data: value
  };
};

// Hàm validate dữ liệu cập nhật schedule
const validateScheduleUpdate = (data) => {
  const { error, value } = updateScheduleSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message)
    };
  }

  return {
    isValid: true,
    data: value
  };
};

module.exports = {
  createScheduleSchema,
  updateScheduleSchema,
  validateSchedule,
  validateScheduleUpdate
};
