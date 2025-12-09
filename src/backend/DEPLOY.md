# Hướng dẫn Deploy lên Render

## 📋 Chuẩn bị trước khi Deploy

### 1. Kiểm tra các file cần thiết
- ✅ `render.yaml` - File cấu hình Render
- ✅ `package.json` - Script start đã có
- ✅ `.env.example` - Template biến môi trường
- ✅ Health check endpoint tại `/api/health`

### 2. Chuẩn bị MongoDB
Bạn có thể sử dụng:
- **MongoDB Atlas** (Khuyến nghị - Free tier)
- Hoặc MongoDB của Render

#### Tạo MongoDB Atlas (Miễn phí):
1. Truy cập: https://www.mongodb.com/cloud/atlas/register
2. Tạo cluster miễn phí (M0)
3. Tạo Database User (username/password)
4. Whitelist IP: Chọn **Allow access from anywhere** (0.0.0.0/0)
5. Lấy Connection String có dạng:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/
   ```

## 🚀 Các bước Deploy lên Render

### Bước 1: Push code lên GitHub
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Bước 2: Tạo Web Service trên Render

1. **Đăng nhập Render**
   - Truy cập: https://render.com
   - Đăng nhập bằng GitHub

2. **Tạo New Web Service**
   - Click **"New +"** → **"Web Service"**
   - Chọn repository: `IOT-BE`
   - Click **"Connect"**

3. **Cấu hình Service**
   - **Name:** `iot-backend` (hoặc tên bạn muốn)
   - **Region:** `Singapore` (gần VN nhất)
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** `Free`

### Bước 3: Cấu hình Environment Variables

Trong phần **Environment**, thêm các biến sau:

| Key | Value | Ghi chú |
|-----|-------|---------|
| `NODE_ENV` | `production` | Môi trường production |
| `MONGODB_URI` | `mongodb+srv://...` | Connection string từ MongoDB Atlas |
| `DB_NAME` | `iot_database` | Tên database của bạn |
| `JWT_SECRET` | `your-strong-secret-key-here` | Tạo secret key mạnh (32+ ký tự ngẫu nhiên) |
| `JWT_EXPIRE` | `7d` | Thời gian expire của JWT |
| `FRONTEND_URL` | `https://your-frontend.com` | URL frontend sau khi deploy |

**Tạo JWT_SECRET mạnh:**
```bash
# Dùng lệnh này để tạo secret key ngẫu nhiên
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Bước 4: Deploy

1. Click **"Create Web Service"**
2. Render sẽ tự động:
   - Clone repository
   - Chạy `npm install`
   - Chạy `npm start`
   - Kiểm tra health check tại `/api/health`

3. Đợi vài phút để deploy hoàn tất

## 🔍 Kiểm tra sau khi Deploy

### 1. Kiểm tra Health Check
Truy cập: `https://your-app-name.onrender.com/api/health`

Kết quả mong đợi:
```json
{
  "status": "ok",
  "service": "iot-backend",
  "database": "connected",
  "uptime": 123.456,
  "timestamp": "2025-12-09T..."
}
```

### 2. Kiểm tra API
```bash
# Test API root
curl https://your-app-name.onrender.com/

# Test auth endpoint
curl https://your-app-name.onrender.com/api/auth/login
```

### 3. Kiểm tra Logs
- Vào Render Dashboard → Service của bạn → **Logs** tab
- Kiểm tra có error không

## ⚠️ Lưu ý quan trọng

### 1. Free Tier Render
- **Spin down** sau 15 phút không hoạt động
- Request đầu tiên sau khi spin down sẽ mất ~30-50s để khởi động lại
- Không thể dùng cho production thật

### 2. MongoDB Atlas Whitelist
- Phải cho phép IP: `0.0.0.0/0` để Render kết nối được
- Hoặc thêm IP cụ thể của Render trong Dashboard

### 3. CORS
Cập nhật `FRONTEND_URL` sau khi deploy frontend để cho phép CORS

### 4. Environment Variables
- Không commit file `.env` lên GitHub
- Chỉ set các biến môi trường trên Render Dashboard

## 🔧 Troubleshooting

### Lỗi: Database connection failed
```
❌ Lỗi kết nối MongoDB
```
**Giải pháp:**
1. Kiểm tra `MONGODB_URI` đúng format
2. Kiểm tra username/password trong connection string
3. Kiểm tra MongoDB Atlas đã whitelist IP `0.0.0.0/0`

### Lỗi: Health check failed
```
Health check failed
```
**Giải pháp:**
1. Kiểm tra endpoint `/api/health` hoạt động local
2. Kiểm tra PORT trong logs
3. Đảm bảo `npm start` chạy được

### Service bị restart liên tục
**Giải pháp:**
1. Xem logs để tìm lỗi
2. Kiểm tra tất cả environment variables đã set đúng
3. Test lại local với các biến môi trường giống production

## 🎯 URL cuối cùng

Sau khi deploy thành công, bạn sẽ có:
- **Backend URL:** `https://your-app-name.onrender.com`
- **API Base URL:** `https://your-app-name.onrender.com/api`
- **Health Check:** `https://your-app-name.onrender.com/api/health`

## 📱 Cập nhật Frontend

Sau khi có backend URL, cập nhật trong frontend:
```javascript
// Frontend config
const API_BASE_URL = 'https://your-app-name.onrender.com/api';
```

## 🔄 Deploy lại sau khi sửa code

```bash
# Commit và push code mới
git add .
git commit -m "Update feature"
git push origin main

# Render sẽ tự động deploy lại
```

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra Render Logs
2. Kiểm tra MongoDB Atlas Logs
3. Test API với Postman/Thunder Client
4. Xem docs: https://render.com/docs

---

**Chúc bạn deploy thành công! 🎉**
