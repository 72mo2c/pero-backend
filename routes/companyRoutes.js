// ======================================
// Company Routes - مسارات API
// ======================================

const express = require('express');
const router = express.Router();

// Controllers
const {
  verifyIdentifier,
  login,
  getCompanyDetails,
  getSubscription,
  getCompanyConfig,
  updateCompanyConfig,
  refreshToken,
  logout,
  validateToken,
  getUsageLimits,
  checkSubscriptionStatus
} = require('../controllers/companyController');

// Middleware
const { authenticateToken } = require('../middleware/auth');
const { 
  validate,
  verifyIdentifierRules,
  loginRules,
  refreshTokenRules,
  updateSettingsRules
} = require('../middleware/validator');
const { 
  verifyLimiter,
  loginLimiter,
  apiLimiter
} = require('../middleware/rateLimiter');

// ======================================
// Public Routes (لا تحتاج مصادقة)
// ======================================

/**
 * POST /api/v1/companies/verify
 * التحقق من معرف الشركة
 */
router.post(
  '/verify',
  verifyLimiter,
  verifyIdentifierRules,
  validate,
  verifyIdentifier
);

/**
 * POST /api/v1/companies/login
 * تسجيل دخول الشركة
 */
router.post(
  '/login',
  loginLimiter,
  loginRules,
  validate,
  login
);

/**
 * POST /api/v1/companies/refresh
 * تجديد Access Token
 */
router.post(
  '/refresh',
  apiLimiter,
  refreshTokenRules,
  validate,
  refreshToken
);

// ======================================
// Protected Routes (تحتاج مصادقة)
// ======================================

/**
 * GET /api/v1/companies/details
 * جلب تفاصيل الشركة
 */
router.get(
  '/details',
  authenticateToken,
  apiLimiter,
  getCompanyDetails
);

/**
 * GET /api/v1/companies/subscription
 * جلب معلومات الاشتراك
 */
router.get(
  '/subscription',
  authenticateToken,
  apiLimiter,
  getSubscription
);

/**
 * GET /api/v1/companies/config
 * جلب إعدادات الشركة
 */
router.get(
  '/config',
  authenticateToken,
  apiLimiter,
  getCompanyConfig
);

/**
 * PUT /api/v1/companies/config
 * تحديث إعدادات الشركة
 */
router.put(
  '/config',
  authenticateToken,
  apiLimiter,
  updateSettingsRules,
  validate,
  updateCompanyConfig
);

/**
 * POST /api/v1/companies/logout
 * تسجيل خروج
 */
router.post(
  '/logout',
  authenticateToken,
  logout
);

/**
 * GET /api/v1/companies/validate
 * التحقق من صلاحية Token
 */
router.get(
  '/validate',
  authenticateToken,
  validateToken
);

/**
 * GET /api/v1/companies/usage
 * جلب حدود الاستخدام
 */
router.get(
  '/usage',
  authenticateToken,
  apiLimiter,
  getUsageLimits
);

/**
 * GET /api/v1/companies/subscription/status
 * فحص حالة الاشتراك
 */
router.get(
  '/subscription/status',
  authenticateToken,
  apiLimiter,
  checkSubscriptionStatus
);

module.exports = router;
