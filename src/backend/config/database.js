const { MongoClient } = require('mongodb');
require('dotenv').config();

let db = null;
let client = null;

const connectDB = async () => {
  try {
    if (db) {
      console.log('MongoDB đã được kết nối trước đó');
      return db;
    }

    const uri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME;

    if (!uri) {
      throw new Error('MONGODB_URI không được tìm thấy trong file .env');
    }

    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    console.log('✅ Kết nối MongoDB thành công!');

    db = client.db(dbName);
    return db;
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error.message);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database chưa được khởi tạo. Gọi connectDB() trước!');
  }
  return db;
};

const closeDB = async () => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
    db = null;
    client = null;
  }
};

module.exports = {
  connectDB,
  getDB,
  closeDB
};
