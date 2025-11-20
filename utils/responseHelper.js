// ======================================
// Response Helper - مساعد الاستجابات الموحدة
// ======================================

/**
 * استجابة نجاح
 */
const success = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * استجابة خطأ
 */
const error = (res, message = 'Error occurred', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * استجابة خطأ التحقق من البيانات
 */
const validationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'خطأ في البيانات المدخلة',
    errors: errors.array()
  });
};

/**
 * استجابة غير مصرح
 */
const unauthorized = (res, message = 'غير مصرح بالدخول') => {
  return res.status(401).json({
    success: false,
    message
  });
};

/**
 * استجابة ممنوع
 */
const forbidden = (res, message = 'الوصول ممنوع') => {
  return res.status(403).json({
    success: false,
    message
  });
};

/**
 * استجابة غير موجود
 */
const notFound = (res, message = 'المورد غير موجود') => {
  return res.status(404).json({
    success: false,
    message
  });
};

/**
 * استجابة تعارض
 */
const conflict = (res, message = 'تعارض في البيانات') => {
  return res.status(409).json({
    success: false,
    message
  });
};

/**
 * استجابة خطأ داخلي
 */
const serverError = (res, error, message = 'خطأ في الخادم') => {
  console.error('Server Error:', error);
  
  return res.status(500).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
};

module.exports = {
  success,
  error,
  validationError,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  serverError
};
