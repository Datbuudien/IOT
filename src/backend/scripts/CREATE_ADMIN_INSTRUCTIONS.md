# Hướng dẫn tạo tài khoản Admin

## Cách 1: Tạo admin mới

Chạy lệnh sau trong thư mục `src/backend`:

```bash
node scripts/createAdmin.js --email admin@example.com --password admin123 --name "Admin User"
```

**Thay đổi:**
- `admin@example.com` → Email của admin
- `admin123` → Mật khẩu của admin
- `Admin User` → Tên của admin

**Ví dụ:**
```bash
node scripts/createAdmin.js --email admin@iot.com --password Admin@123 --name "Nguyễn Văn Admin"
```

## Cách 2: Nâng cấp user hiện có thành admin

Nếu bạn đã có tài khoản user và muốn nâng cấp thành admin:

```bash
node scripts/createAdmin.js --email existing@example.com --promote
```

**Ví dụ:**
```bash
node scripts/createAdmin.js --email user@example.com --promote
```

## Lưu ý

- Đảm bảo MongoDB đang chạy
- Đảm bảo file `.env` đã được cấu hình đúng `MONGODB_URI` và `DB_NAME`
- Sau khi tạo admin, bạn có thể đăng nhập với email và password đã tạo
- Admin sẽ có quyền truy cập vào `/admin/firmware` để quản lý firmware updates

