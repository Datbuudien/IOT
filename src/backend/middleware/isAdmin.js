const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

/**
 * Middleware kiểm tra user có phải admin không
 */
const isAdmin = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực'
      });
    }

    const db = getDB();
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ _id: new ObjectId(req.userId) });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có quyền thực hiện thao tác này'
      });
    }

    req.userRole = user.role;
    next();
  } catch (error) {
    console.error('Lỗi kiểm tra admin:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

module.exports = isAdmin;

