// ======================================
// JWT Utilities - أدوات JWT
// ======================================

const jwt = require('jsonwebtoken');
const { RefreshToken } = require('../models');

/**
 * إنشاء Access Token
 */
const generateAccessToken = (company) => {
  const payload = {
    companyId: company.id,
    identifier: company.identifier,
    name: company.name,
    type: 'access'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '1h'
  });
};

/**
 * إنشاء Refresh Token
 */
const generateRefreshToken = async (company) => {
  const payload = {
    companyId: company.id,
    type: 'refresh'
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '30d'
  });

  // حفظ في قاعدة البيانات
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 يوم

  await RefreshToken.create({
    company_id: company.id,
    token: token,
    expires_at: expiresAt
  });

  return token;
};

/**
 * التحقق من Access Token
 */
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * التحقق من Refresh Token
 */
const verifyRefreshToken = async (token) => {
  try {
    // التحقق من JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // التحقق من قاعدة البيانات
    const refreshToken = await RefreshToken.findOne({
      where: { token, is_revoked: false }
    });

    if (!refreshToken || !refreshToken.isValid()) {
      throw new Error('Refresh token is invalid or expired');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * إلغاء Refresh Token
 */
const revokeRefreshToken = async (token) => {
  const refreshToken = await RefreshToken.findOne({ where: { token } });
  
  if (refreshToken) {
    await refreshToken.revoke();
  }
};

/**
 * إلغاء جميع Refresh Tokens للشركة
 */
const revokeAllRefreshTokens = async (companyId) => {
  await RefreshToken.update(
    { is_revoked: true },
    { where: { company_id: companyId } }
  );
};

/**
 * فك تشفير Token بدون التحقق
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

/**
 * الحصول على وقت انتهاء Token (بالثواني)
 */
const getTokenExpiry = () => {
  const expiry = process.env.JWT_ACCESS_EXPIRY || '1h';
  
  // تحويل إلى ثواني
  if (expiry.includes('h')) {
    return parseInt(expiry) * 3600;
  } else if (expiry.includes('m')) {
    return parseInt(expiry) * 60;
  } else if (expiry.includes('d')) {
    return parseInt(expiry) * 86400;
  }
  
  return 3600; // افتراضياً ساعة
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
  decodeToken,
  getTokenExpiry
};
