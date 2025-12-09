# Hướng dẫn Insert Dữ Liệu Fake vào MongoDB

## File: `fakeData.json`

File này chứa 49 bản ghi dữ liệu sensor từ **20:00 7/12/2025** đến **20:00 8/12/2025** (mỗi 30 phút một bản ghi).

## Cách Insert:

### Cách 1: Sử dụng MongoDB Compass (GUI)
1. Mở MongoDB Compass
2. Kết nối với database của bạn
3. Chọn collection `sensordata`
4. Click "Add Data" → "Insert Document"
5. Copy toàn bộ nội dung file `fakeData.json`
6. **QUAN TRỌNG**: Thay thế `"REPLACE_WITH_DEVICE_OBJECTID"` bằng ObjectId thực tế của device của bạn
   - Ví dụ: `"deviceId": "691f02d38be006db6ffd87da"`
7. Paste vào và click "Insert"

### Cách 2: Sử dụng MongoDB Shell (mongosh)
```bash
# 1. Kết nối MongoDB
mongosh "mongodb://localhost:27017/your_database_name"

# 2. Thay thế deviceId trong file JSON trước
# (Sử dụng text editor để thay thế "REPLACE_WITH_DEVICE_OBJECTID")

# 3. Insert dữ liệu
use your_database_name
db.sensordata.insertMany([
  // Paste nội dung từ fakeData.json vào đây
  // (sau khi đã thay thế deviceId)
])
```

### Cách 3: Sử dụng mongoimport (Command Line)
```bash
# 1. Sửa file JSON: thay "REPLACE_WITH_DEVICE_OBJECTID" bằng ObjectId thực tế

# 2. Import
mongoimport --uri="mongodb://localhost:27017/your_database_name" \
  --collection=sensordata \
  --file=fakeData.json \
  --jsonArray
```

## Lưu ý:

1. **DeviceId**: Bạn cần thay thế `"REPLACE_WITH_DEVICE_OBJECTID"` bằng ObjectId thực tế của device trong database
   - Có thể tìm trong collection `devices`
   - Format: `"deviceId": ObjectId("691f02d38be006db6ffd87da")` hoặc `"deviceId": "691f02d38be006db6ffd87da"`

2. **Timestamp**: Timestamp đã được format đúng cho MongoDB (UTC)
   - 20:00 7/12/2025 (UTC+7) = 13:00 UTC
   - MongoDB sẽ tự động convert khi query

3. **Dữ liệu**: 
   - Nhiệt độ: 17-34°C (thấp vào đêm, cao vào trưa)
   - Độ ẩm không khí: 44-85% (cao vào đêm/sáng, thấp vào trưa)
   - Độ ẩm đất: 42-65% (dao động nhẹ)
   - Mưa: có một vài bản ghi có `weather_condition: "rain"` vào chiều tối

## Kiểm tra sau khi insert:

```javascript
// Trong MongoDB Shell
db.sensordata.countDocuments({
  timestamp: {
    $gte: ISODate("2025-12-07T13:00:00.000Z"),
    $lte: ISODate("2025-12-08T13:00:00.000Z")
  }
})
// Kết quả mong đợi: 49
```

