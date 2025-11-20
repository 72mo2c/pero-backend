// ======================================
// Authentication Middleware - مصادقة JWT
// ======================================

const { verifyAccessToken } = require('../utils/jwtUtils');
const { unauthorized, serverError } = require('../utils/responseHelper');
const { Company } = require('../models');

/**
 * Middleware للتحقق من Access Token
 */
const authenticateToken = async (req, res, next) => {
  try {
    // الحصول على Token من Header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return unauthorized(res, 'لا يوجد رمز مصادقة. يرجى تسجيل الدخول.');
    }

    // التحقق من Token
    const decoded = verifyAccessToken(token);

    // التحقق من وجود الشركة
    const company = await Company.findByPk(decoded.companyId);

    if (!company) {
      return unauthorized(res, 'الشركة غير موجودة');
    }

    if (!company.is_active) {
      return unauthorized(res, 'الشركة غير مفعلة. يرجى التواصل مع الدعم.');
    }

    // إضافة معلومات الشركة للطلب
    req.company = company;
    req.companyId = company.id;

    next();
  } catch (error) {
    if (error.message.includes('expired')) {
      return unauthorized(res, 'انتهت صلاحية رمز المصادقة. يرجى تسجيل الدخول مرة أخرى.');
    }
    
    return unauthorized(res, 'رمز مصادقة غير صالح');
  }
};

/**
 * Middleware اختياري للتحقق من Token (لا يوقف الطلب إذا فشل)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyAccessToken(token);
      const company = await Company.findByPk(decoded.companyId);

      if (company && company.is_active) {
        req.company = company;
        req.companyId = company.id;
      }
    }
  } catch (error) {
    // لا نفعل شيء، نتابع الطلب
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth
};
