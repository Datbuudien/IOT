/**
 * Script để sửa các bản ghi có timestamp sai (1970 hoặc timestamp không hợp lệ)
 * Chạy: node src/backend/scripts/fixTimestamps.js
 */

const { getDB } = require('../config/database');

async function fixTimestamps() {
  try {
    const db = getDB();
    const sensorDataCollection = db.collection('sensordata');
    
    // Tìm các bản ghi có timestamp < 2020-01-01 (timestamp sai)
    const cutoffDate = new Date('2020-01-01');
    const invalidRecords = await sensorDataCollection.find({
      timestamp: { $lt: cutoffDate }
    }).toArray();
    
    console.log(`📊 Tìm thấy ${invalidRecords.length} bản ghi có timestamp sai`);
    
    if (invalidRecords.length === 0) {
      console.log('✅ Không có bản ghi nào cần sửa');
      return;
    }
    
    // Sửa từng bản ghi: thay timestamp sai bằng thời gian hiện tại
    // Lưu ý: Đây chỉ là giải pháp tạm thời, tốt nhất là xóa các bản ghi này
    let fixed = 0;
    let deleted = 0;
    
    for (const record of invalidRecords) {
      // Kiểm tra nếu timestamp là 1970 hoặc rất cũ, có thể xóa luôn
      const recordDate = new Date(record.timestamp);
      if (recordDate.getFullYear() < 2020) {
        // Xóa bản ghi có timestamp sai thay vì sửa
        await sensorDataCollection.deleteOne({ _id: record._id });
        deleted++;
      }
    }
    
    console.log(`✅ Đã xóa ${deleted} bản ghi có timestamp sai`);
    console.log(`📝 Còn lại ${invalidRecords.length - deleted} bản ghi`);
    
  } catch (error) {
    console.error('❌ Lỗi khi sửa timestamps:', error);
  } finally {
    process.exit(0);
  }
}

// Chạy script
fixTimestamps();

