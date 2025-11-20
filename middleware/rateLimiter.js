// ======================================
// Rate Limiter - حماية من الهجمات
// ======================================

const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter عام
 */
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 دقيقة
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'عدد كبير جداً من الطلبات. يرجى المحاولة لاحقاً.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate Limiter لتسجيل الدخول (محدود أكثر)
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 5, // 5 محاولات فقط
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'عدد كبير من محاولات تسجيل الدخول الفاشلة. يرجى المحاولة بعد 15 دقيقة.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate Limiter للتحقق من المعرف
 */
const verifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 دقائق
  max: 10, // 10 محاولات
  message: {
    success: false,
    message: 'عدد كبير من محاولات التحقق. يرجى المحاولة بعد 5 دقائق.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate Limiter للـ API calls العامة
 */
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // دقيقة واحدة
  max: 30, // 30 طلب في الدقيقة
  message: {
    success: false,
    message: 'عدد كبير من الطلبات. يرجى التباطؤ قليلاً.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generalLimiter,
  loginLimiter,
  verifyLimiter,
  apiLimiter
};
