# IoT Backend API

Backend server cho dự án IoT sử dụng Node.js, Express và MongoDB.

## Cấu trúc dự án

```
backend/
├── config/
│   └── database.js      # Cấu hình kết nối MongoDB
├── .env                 # Biến môi trường (không commit)
├── .env.example         # Mẫu biến môi trường
├── .gitignore          # File ignore cho Git
├── index.js            # File khởi động server
└── package.json        # Quản lý dependencies
```

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file `.env` từ `.env.example` và cập nhật thông tin:
```env
MONGODB_URI=mongodb+srv://khoind:<db_password>@cluster0.dasfvxc.mongodb.net/?appName=Cluster0
DB_NAME=iot_database
PORT=3000
NODE_ENV=development
```

**Lưu ý:** Thay thế `<db_password>` bằng mật khẩu thực của database user `khoind`.

## Chạy ứng dụng

```bash
# Chế độ production
npm start

# Chế độ development (với nodemon)
npm run dev
```

## API Endpoints

- `GET /` - Kiểm tra trạng thái API
- `GET /health` - Kiểm tra health của server và database

## Công nghệ sử dụng

- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **dotenv** - Quản lý biến môi trường
