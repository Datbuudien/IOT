/**
 * Script để xóa tất cả bản ghi có timestamp trước tháng 12/2025
 * Chạy: node src/backend/scripts/deleteOldData.js
 */

const { connectDB, getDB, closeDB } = require('../config/database');

async function deleteOldData() {
  try {
    // Kết nối database trước
    await connectDB();
    const db = getDB();
    const sensorDataCollection = db.collection('sensordata');
    
    // Tạo cutoff date: 1/12/2025 00:00:00 UTC (tức là 7:00 UTC+7)
    const cutoffDate = new Date('2025-12-01T00:00:00.000Z');
    
    console.log(`🗑️  Đang xóa tất cả bản ghi trước ${cutoffDate.toLocaleString('vi-VN')}...`);
    
    // Đếm số bản ghi sẽ bị xóa
    const countBefore = await sensorDataCollection.countDocuments({
      timestamp: { $lt: cutoffDate }
    });
    
    console.log(`📊 Tìm thấy ${countBefore} bản ghi sẽ bị xóa`);
    
    if (countBefore === 0) {
      console.log('✅ Không có bản ghi nào cần xóa');
      return;
    }
    
    // Xác nhận trước khi xóa
    console.log(`⚠️  Bạn có chắc chắn muốn xóa ${countBefore} bản ghi?`);
    console.log(`📅 Tất cả bản ghi trước ${cutoffDate.toLocaleString('vi-VN')} sẽ bị xóa`);
    
    // Xóa các bản ghi
    const result = await sensorDataCollection.deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    
    console.log(`\n✅ Đã xóa thành công ${result.deletedCount} bản ghi`);
    
    // Kiểm tra lại
    const countAfter = await sensorDataCollection.countDocuments({
      timestamp: { $lt: cutoffDate }
    });
    
    if (countAfter === 0) {
      console.log('✅ Xác nhận: Không còn bản ghi nào trước tháng 12/2025');
    } else {
      console.log(`⚠️  Còn lại ${countAfter} bản ghi (có thể do lỗi)`);
    }
    
    // Hiển thị thống kê tổng
    const totalCount = await sensorDataCollection.countDocuments({});
    console.log(`\n📊 Tổng số bản ghi còn lại trong database: ${totalCount}`);
    
  } catch (error) {
    console.error('❌ Lỗi khi xóa dữ liệu:', error);
  } finally {
    // Đóng kết nối database
    await closeDB();
    process.exit(0);
  }
}

// Chạy script
deleteOldData();

