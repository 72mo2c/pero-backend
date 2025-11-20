// ======================================
// Company Controller - المتحكم الرئيسي
// ======================================

const { Company, Subscription, CompanySettings } = require('../models');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
  getTokenExpiry
} = require('../utils/jwtUtils');
const { 
  success, 
  error, 
  unauthorized, 
  notFound,
  conflict,
  serverError 
} = require('../utils/responseHelper');

// ======================================
// 1. POST /verify - التحقق من معرف الشركة
// ======================================
const verifyIdentifier = async (req, res) => {
  try {
    const { identifier } = req.body;

    // البحث عن الشركة
    const company = await Company.findOne({
      where: { identifier },
      attributes: ['id', 'name', 'identifier', 'is_active', 'logo', 'primary_color', 'secondary_color']
    });

    if (!company) {
      return notFound(res, 'معرف الشركة غير صحيح');
    }

    // DEBUG: طباعة القيمة الفعلية
    console.log('🔍 DEBUG - Company:', identifier);
    console.log('📊 is_active value:', company.is_active);
    console.log('📊 is_active type:', typeof company.is_active);
    console.log('📊 Raw data:', JSON.stringify(company.dataValues));

    // التحقق من حالة التفعيل (التأكد من أن القيمة boolean)
    const isActive = company.is_active === true || company.is_active === 'true' || company.is_active === 1;
    console.log('✅ isActive result:', isActive);
    
    if (!isActive) {
      return unauthorized(res, 'هذه الشركة غير مفعلة حالياً. يرجى التواصل مع الدعم.');
    }

    // تحويل البيانات إلى camelCase للفرونت إند
    const responseData = {
      id: company.id,
      name: company.name,
      identifier: company.identifier,
      isActive: company.is_active,  // snake_case → camelCase
      logo: company.logo,
      primaryColor: company.primary_color,  // snake_case → camelCase
      secondaryColor: company.secondary_color  // snake_case → camelCase
    };

    return success(res, responseData, 'تم التحقق من المعرف بنجاح');
    
  } catch (err) {
    return serverError(res, err, 'حدث خطأ أثناء التحقق من المعرف');
  }
};

// ======================================
// 2. POST /login - تسجيل دخول الشركة
// ======================================
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // البحث عن الشركة
    const company = await Company.findOne({
      where: { identifier },
      include: [
        {
          model: Subscription,
          as: 'subscription'
        }
      ]
    });

    if (!company) {
      return unauthorized(res, 'معرف الشركة أو كلمة المرور غير صحيحة');
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await company.comparePassword(password);

    if (!isPasswordValid) {
      return unauthorized(res, 'معرف الشركة أو كلمة المرور غير صحيحة');
    }

    // DEBUG: Login
    console.log('🔐 LOGIN DEBUG - Company:', identifier);
    console.log('📊 is_active value:', company.is_active);
    console.log('📊 is_active type:', typeof company.is_active);
    
    // التحقق من حالة الشركة
    const isActive = company.is_active === true || company.is_active === 'true' || company.is_active === 1;
    console.log('✅ isActive result:', isActive);
    
    if (!isActive) {
      console.log('❌ LOGIN FAILED - Company is not active!');
      return unauthorized(res, 'الشركة غير مفعلة. يرجى التواصل مع الدعم.');
    }

    // التحقق من وجود اشتراك
    if (!company.subscription) {
      return unauthorized(res, 'لا يوجد اشتراك نشط لهذه الشركة');
    }

    // تحديث حالة الاشتراك
    company.subscription.updateStatus();
    if (company.subscription.changed()) {
      await company.subscription.save();
    }

    // إنشاء Tokens
    const accessToken = generateAccessToken(company);
    const refreshToken = await generateRefreshToken(company);

    // البيانات المرسلة
    const responseData = {
      company: {
        id: company.id,
        name: company.name,
        identifier: company.identifier,
        isActive: company.is_active,
        logo: company.logo,
        primaryColor: company.primary_color,
        secondaryColor: company.secondary_color,
        theme: company.theme
      },
      subscription: company.subscription,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: getTokenExpiry()
      }
    };

    return success(res, responseData, 'تم تسجيل الدخول بنجاح');

  } catch (err) {
    return serverError(res, err, 'حدث خطأ أثناء تسجيل الدخول');
  }
};

// ======================================
// 3. GET /details - جلب تفاصيل الشركة
// ======================================
const getCompanyDetails = async (req, res) => {
  try {
    const company = await Company.findByPk(req.companyId, {
      attributes: { exclude: ['password'] }
    });

    if (!company) {
      return notFound(res, 'الشركة غير موجودة');
    }

    const responseData = {
      company: {
        id: company.id,
        name: company.name,
        identifier: company.identifier,
        isActive: company.is_active,
        logo: company.logo,
        primaryColor: company.primary_color,
        secondaryColor: company.secondary_color,
        theme: company.theme
      }
    };

    return success(res, responseData);

  } catch (err) {
    return serverError(res, err);
  }
};

// ======================================
// 4. GET /subscription - جلب معلومات الاشتراك
// ======================================
const getSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { company_id: req.companyId }
    });

    if (!subscription) {
      return notFound(res, 'لا يوجد اشتراك لهذه الشركة');
    }

    // تحديث الحالة
    subscription.updateStatus();
    if (subscription.changed()) {
      await subscription.save();
    }

    return success(res, { subscription });

  } catch (err) {
    return serverError(res, err);
  }
};

// ======================================
// 5. GET /config - جلب إعدادات الشركة
// ======================================
const getCompanyConfig = async (req, res) => {
  try {
    const company = await Company.findByPk(req.companyId, {
      include: [
        {
          model: CompanySettings,
          as: 'settings'
        }
      ]
    });

    if (!company) {
      return notFound(res, 'الشركة غير موجودة');
    }

    const config = {
      company: {
        id: company.id,
        name: company.name,
        identifier: company.identifier,
        logo: company.logo,
        primaryColor: company.primary_color,
        secondaryColor: company.secondary_color,
        theme: company.theme
      },
      settings: company.settings?.settings || {}
    };

    return success(res, config);

  } catch (err) {
    return serverError(res, err);
  }
};

// ======================================
// 6. PUT /config - تحديث إعدادات الشركة
// ======================================
const updateCompanyConfig = async (req, res) => {
  try {
    const { settings } = req.body;

    let companySettings = await CompanySettings.findOne({
      where: { company_id: req.companyId }
    });

    if (!companySettings) {
      // إنشاء إعدادات جديدة
      companySettings = await CompanySettings.create({
        company_id: req.companyId,
        settings
      });
    } else {
      // تحديث الإعدادات
      companySettings.settings = settings;
      companySettings.changed('settings', true);
      await companySettings.save();
    }

    return success(res, { settings: companySettings.settings }, 'تم تحديث الإعدادات بنجاح');

  } catch (err) {
    return serverError(res, err);
  }
};

// ======================================
// 7. POST /refresh - تجديد Token
// ======================================
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return unauthorized(res, 'Refresh Token مطلوب');
    }

    // التحقق من Refresh Token
    const decoded = await verifyRefreshToken(token);

    // جلب الشركة
    const company = await Company.findByPk(decoded.companyId);

    const isActive = company && (company.is_active === true || company.is_active === 'true' || company.is_active === 1);
    if (!company || !isActive) {
      return unauthorized(res, 'الشركة غير موجودة أو غير مفعلة');
    }

    // إلغاء Token القديم
    await revokeRefreshToken(token);

    // إنشاء Tokens جديدة
    const newAccessToken = generateAccessToken(company);
    const newRefreshToken = await generateRefreshToken(company);

    const responseData = {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: getTokenExpiry()
    };

    return success(res, responseData, 'تم تجديد Token بنجاح');

  } catch (err) {
    if (err.message.includes('Invalid') || err.message.includes('expired')) {
      return unauthorized(res, 'Refresh Token غير صالح أو منتهي الصلاحية');
    }
    return serverError(res, err);
  }
};

// ======================================
// 8. POST /logout - تسجيل خروج
// ======================================
const logout = async (req, res) => {
  try {
    // إلغاء جميع Refresh Tokens للشركة
    await revokeAllRefreshTokens(req.companyId);

    return success(res, null, 'تم تسجيل الخروج بنجاح');

  } catch (err) {
    return serverError(res, err);
  }
};

// ======================================
// 9. GET /validate - التحقق من صلاحية Token
// ======================================
const validateToken = async (req, res) => {
  try {
    // إذا وصلنا هنا، فـ Token صالح (middleware تحقق منه)
    return success(res, { valid: true, companyId: req.companyId }, 'Token صالح');

  } catch (err) {
    return serverError(res, err);
  }
};

// ======================================
// 10. GET /usage - جلب حدود الاستخدام
// ======================================
const getUsageLimits = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { company_id: req.companyId }
    });

    if (!subscription) {
      return notFound(res, 'لا يوجد اشتراك');
    }

    // TODO: حساب الاستخدام الفعلي من جداول أخرى
    // هنا نرسل الحدود فقط، يمكن لاحقاً إضافة الاستخدام الفعلي
    const usage = {
      limits: subscription.limits,
      current: {
        users: 0,
        products: 0,
        invoices: 0,
        warehouses: 0,
        customers: 0,
        suppliers: 0
      }
    };

    return success(res, usage);

  } catch (err) {
    return serverError(res, err);
  }
};

// ======================================
// 11. GET /subscription/status - فحص حالة الاشتراك
// ======================================
const checkSubscriptionStatus = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { company_id: req.companyId }
    });

    if (!subscription) {
      return notFound(res, 'لا يوجد اشتراك');
    }

    // تحديث الحالة
    subscription.updateStatus();
    if (subscription.changed()) {
      await subscription.save();
    }

    const status = {
      isValid: subscription.isValid(),
      status: subscription.status,
      daysRemaining: subscription.getDaysRemaining(),
      endDate: subscription.end_date
    };

    return success(res, status);

  } catch (err) {
    return serverError(res, err);
  }
};

module.exports = {
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
};
