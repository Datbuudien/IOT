const { getDB } = require('../config/database');

/**
 * User Model
 * Xử lý tất cả database operations liên quan đến users
 */
class User {
  constructor() {
    this.collectionName = 'users';
  }

  // Lấy collection
  getCollection() {
    const db = getDB();
    return db.collection(this.collectionName);
  }

  // Tìm user theo email
  async findByEmail(email) {
    const collection = this.getCollection();
    return await collection.findOne({ email });
  }

  // Tìm user theo ID
  async findById(userId) {
    const collection = this.getCollection();
    return await collection.findOne({ _id: userId });
  }

  // Tạo user mới
  async create(userData) {
    const collection = this.getCollection();
    
    const newUser = {
      name: userData.name,
      email: userData.email,
      password: userData.password, // Đã được hash từ controller
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(newUser);
    return {
      _id: result.insertedId,
      ...newUser
    };
  }

  // Cập nhật thông tin user
  async update(userId, updateData) {
    const collection = this.getCollection();
    
    const result = await collection.updateOne(
      { _id: userId },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );

    return result;
  }

  // Xóa user
  async delete(userId) {
    const collection = this.getCollection();
    const result = await collection.deleteOne({ _id: userId });
    return result;
  }

  // Kiểm tra email đã tồn tại
  async emailExists(email) {
    const collection = this.getCollection();
    const count = await collection.countDocuments({ email });
    return count > 0;
  }
}

module.exports = new User();
