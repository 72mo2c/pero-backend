// ======================================
// Admin Auth Middleware - التحقق من صلاحيات المسؤولين
// ======================================

const jwt = require('jsonwebtoken');
const { Admin } = require('../models');
const { error: errorResponse } = require('../utils/responseHelper');

// ======================================
// التحقق من توكن المسؤول
// ======================================
const verifyAdminToken = async (req, res, next) => {
  try {
    // الحصول على التوكن من الـ header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'غير مصرح. الرجاء تسجيل الدخول كمسؤول', 401);
    }

    const token = authHeader.substring(7);

    // التحقق من التوكن
    const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET);

    // التحقق من نوع التوكن
    if (decoded.type !== 'admin') {
      return errorResponse(res, 'غير مصرح. هذا التوكن ليس لمسؤول', 401);
    }

    // الحصول على بيانات المسؤول
    const admin = await Admin.findByPk(decoded.id);

    if (!admin) {
      return errorResponse(res, 'المسؤول غير موجود', 404);
    }

    if (!admin.is_active) {
      return errorResponse(res, 'حساب المسؤول معطل', 403);
    }

    // إضافة بيانات المسؤول إلى الـ request
    req.admin = admin;
    req.adminId = admin.id;

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'انتهت صلاحية الجلسة. الرجاء تسجيل الدخول مرة أخرى', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      return errorResponse(res, 'توكن غير صالح', 401);
    }
    return errorResponse(res, 'خطأ في التحقق من الصلاحيات', 500);
  }
};

// ======================================
// التحقق من دور Super Admin
// ======================================
const requireSuperAdmin = (req, res, next) => {
  if (!req.admin) {
    return errorResponse(res, 'غير مصرح', 401);
  }

  if (req.admin.role !== 'super_admin') {
    return errorResponse(res, 'يجب أن تكون Super Admin للقيام بهذه العملية', 403);
  }

  next();
};

// ======================================
// Middleware للسماح بـ Admin أو Super Admin
// ======================================
const requireAdmin = (req, res, next) => {
  if (!req.admin) {
    return errorResponse(res, 'غير مصرح', 401);
  }

  if (req.admin.role !== 'admin' && req.admin.role !== 'super_admin') {
    return errorResponse(res, 'صلاحيات غير كافية', 403);
  }

  next();
};

module.exports = {
  verifyAdminToken,
  requireSuperAdmin,
  requireAdmin
};
