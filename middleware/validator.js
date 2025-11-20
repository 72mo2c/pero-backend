// ======================================
// Validation Middleware - التحقق من البيانات
// ======================================

const { body, validationResult } = require('express-validator');
const { validationError } = require('../utils/responseHelper');

/**
 * Middleware للتحقق من نتائج Validation
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return validationError(res, errors);
  }
  
  next();
};

/**
 * قواعد التحقق من تسجيل الشركة
 */
const verifyIdentifierRules = [
  body('identifier')
    .trim()
    .notEmpty().withMessage('معرف الشركة مطلوب')
    .isLength({ min: 3, max: 100 }).withMessage('معرف الشركة يجب أن يكون بين 3 و 100 حرف')
];

/**
 * قواعد التحقق من تسجيل الدخول
 */
const loginRules = [
  body('identifier')
    .trim()
    .notEmpty().withMessage('معرف الشركة مطلوب')
    .isLength({ min: 3, max: 100 }).withMessage('معرف الشركة يجب أن يكون بين 3 و 100 حرف'),
  body('password')
    .notEmpty().withMessage('كلمة المرور مطلوبة')
    .isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
];

/**
 * قواعد التحقق من Refresh Token
 */
const refreshTokenRules = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh Token مطلوب')
];

/**
 * قواعد تحديث الإعدادات
 */
const updateSettingsRules = [
  body('settings')
    .isObject().withMessage('الإعدادات يجب أن تكون كائن JSON')
];

/**
 * قواعد إنشاء شركة جديدة (للـ Admin Panel)
 */
const createCompanyRules = [
  body('identifier')
    .trim()
    .notEmpty().withMessage('معرف الشركة مطلوب')
    .isLength({ min: 3, max: 100 }).withMessage('معرف الشركة يجب أن يكون بين 3 و 100 حرف')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('معرف الشركة يجب أن يحتوي على أحرف وأرقام فقط'),
  body('password')
    .notEmpty().withMessage('كلمة المرور مطلوبة')
    .isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  body('name')
    .trim()
    .notEmpty().withMessage('اسم الشركة مطلوب')
    .isLength({ min: 2, max: 200 }).withMessage('اسم الشركة يجب أن يكون بين 2 و 200 حرف'),
  body('plan')
    .optional()
    .isIn(['basic', 'standard', 'premium']).withMessage('الخطة يجب أن تكون basic أو standard أو premium')
];

module.exports = {
  validate,
  verifyIdentifierRules,
  loginRules,
  refreshTokenRules,
  updateSettingsRules,
  createCompanyRules
};
