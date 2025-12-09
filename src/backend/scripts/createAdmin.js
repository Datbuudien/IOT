/**
 * Script tạo tài khoản Admin
 * 
 * Cách sử dụng:
 * 1. Tạo admin mới:
 *    node scripts/createAdmin.js --email admin@example.com --password admin123 --name "Admin User"
 * 
 * 2. Nâng cấp user hiện có thành admin:
 *    node scripts/createAdmin.js --email existing@example.com --promote
 */

const bcrypt = require('bcryptjs');
const { connectDB, getDB, closeDB } = require('../config/database');
require('dotenv').config();

async function createAdmin() {
  try {
    // Parse arguments
    const args = process.argv.slice(2);
    const emailIndex = args.indexOf('--email');
    const passwordIndex = args.indexOf('--password');
    const nameIndex = args.indexOf('--name');
    const promoteIndex = args.indexOf('--promote');

    if (emailIndex === -1) {
      console.error('❌ Vui lòng cung cấp email: --email <email>');
      console.log('\nCách sử dụng:');
      console.log('  Tạo admin mới:');
      console.log('    node scripts/createAdmin.js --email admin@example.com --password admin123 --name "Admin User"');
      console.log('\n  Nâng cấp user hiện có thành admin:');
      console.log('    node scripts/createAdmin.js --email existing@example.com --promote');
      process.exit(1);
    }

    const email = args[emailIndex + 1];
    const password = passwordIndex !== -1 ? args[passwordIndex + 1] : null;
    const name = nameIndex !== -1 ? args[nameIndex + 1] : 'Admin User';
    const promote = promoteIndex !== -1;

    // Kết nối database
    const db = await connectDB();
    const usersCollection = db.collection('users');

    // Kiểm tra user đã tồn tại chưa
    const existingUser = await usersCollection.findOne({ email });

    if (promote) {
      // Nâng cấp user hiện có thành admin
      if (!existingUser) {
        console.error(`❌ Không tìm thấy user với email: ${email}`);
        process.exit(1);
      }

      if (existingUser.role === 'admin') {
        console.log(`✅ User ${email} đã là admin rồi!`);
        await closeDB();
        process.exit(0);
      }

      const result = await usersCollection.updateOne(
        { email },
        {
          $set: {
            role: 'admin',
            updatedAt: new Date()
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Đã nâng cấp user ${email} thành admin!`);
      } else {
        console.error(`❌ Không thể nâng cấp user ${email}`);
      }
    } else {
      // Tạo admin mới
      if (!password) {
        console.error('❌ Vui lòng cung cấp password: --password <password>');
        process.exit(1);
      }

      if (existingUser) {
        console.error(`❌ User với email ${email} đã tồn tại!`);
        console.log('   Sử dụng --promote để nâng cấp user hiện có thành admin');
        process.exit(1);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Tạo admin user
      const newAdmin = {
        email,
        password: hashedPassword,
        name,
        role: 'admin',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await usersCollection.insertOne(newAdmin);

      if (result.insertedId) {
        console.log('✅ Đã tạo tài khoản admin thành công!');
        console.log(`   Email: ${email}`);
        console.log(`   Name: ${name}`);
        console.log(`   Role: admin`);
        console.log(`   ID: ${result.insertedId}`);
      } else {
        console.error('❌ Không thể tạo tài khoản admin');
      }
    }

    // Đóng kết nối
    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    await closeDB();
    process.exit(1);
  }
}

// Chạy script
createAdmin();

