/**
 * Timezone Utilities
 * Xử lý timestamp theo múi giờ UTC+7 (GMT+7 - Asia/Ho_Chi_Minh)
 * MongoDB lưu timestamp dưới dạng UTC, nhưng hệ thống làm việc với UTC+7
 */

const GMT7_OFFSET_MS = 7 * 60 * 60 * 1000; // 7 giờ = 7 * 60 * 60 * 1000 milliseconds

/**
 * Tạo timestamp hiện tại theo UTC+7 để lưu vào MongoDB
 * 
 * MongoDB luôn lưu Date object dưới dạng UTC.
 * Để đảm bảo tương thích với dữ liệu cũ (UTC) và dữ liệu mới (UTC+7):
 * - Lưu timestamp UTC bình thường (không cộng offset)
 * - Khi query/filter, tính toán theo UTC
 * - Khi hiển thị, convert sang GMT+7
 * 
 * Cách này đảm bảo:
 * 1. Dữ liệu cũ (UTC) vẫn query được
 * 2. Dữ liệu mới (UTC) cũng query được
 * 3. Khi hiển thị, convert sang GMT+7 để người dùng thấy đúng múi giờ Việt Nam
 * 
 * @returns {Date} Date object để lưu vào MongoDB (UTC, nhưng đại diện cho thời gian hiện tại ở UTC+7)
 */
function createTimestampGMT7() {
  // Lưu UTC bình thường để tương thích với dữ liệu cũ
  // Khi hiển thị sẽ convert sang GMT+7
  return new Date(); // UTC hiện tại
}

/**
 * Tính toán thời gian trong quá khứ theo UTC+7
 * Lưu ý: baseDate đã được tạo với offset +7 giờ (từ createTimestampGMT7)
 * @param {Date} baseDate - Thời gian cơ sở (đã có offset +7 giờ)
 * @param {number} hours - Số giờ cần trừ
 * @returns {Date} Thời gian sau khi trừ (vẫn có offset +7 giờ)
 */
function subtractHoursGMT7(baseDate, hours) {
  return new Date(baseDate.getTime() - (hours * 60 * 60 * 1000));
}

/**
 * Tính toán thời gian trong quá khứ theo UTC+7
 * Lưu ý: baseDate đã được tạo với offset +7 giờ (từ createTimestampGMT7)
 * @param {Date} baseDate - Thời gian cơ sở (đã có offset +7 giờ)
 * @param {number} days - Số ngày cần trừ
 * @returns {Date} Thời gian sau khi trừ (vẫn có offset +7 giờ)
 */
function subtractDaysGMT7(baseDate, days) {
  return new Date(baseDate.getTime() - (days * 24 * 60 * 60 * 1000));
}

/**
 * Format timestamp theo UTC+7 để hiển thị
 * @param {Date} date - Date object
 * @returns {string} String đã format theo UTC+7
 */
function formatGMT7(date) {
  return date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

module.exports = {
  createTimestampGMT7,
  subtractHoursGMT7,
  subtractDaysGMT7,
  formatGMT7
};
