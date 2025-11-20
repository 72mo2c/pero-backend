// ======================================
// Admin Company Controller - إدارة الشركات
// ======================================

const { Op } = require('sequelize');
const { Company, Subscription, CompanySettings, AuditLog } = require('../models');
const { success, error: errorResponse } = require('../utils/responseHelper');
const bcrypt = require('bcrypt');

// ======================================
// 1. الحصول على جميع الشركات
// ======================================
const getAllCompanies = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      isActive, 
      subscriptionPlan,
      subscriptionStatus 
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};
    const subscriptionWhere = {};

    // فلترة حسب البحث
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { identifier: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // فلترة حسب الحالة
    if (isActive !== undefined) {
      where.is_active = isActive === 'true';
    }

    // فلترة حسب خطة الاشتراك
    if (subscriptionPlan) {
      subscriptionWhere.plan = subscriptionPlan;
    }

    // فلترة حسب حالة الاشتراك
    if (subscriptionStatus) {
      subscriptionWhere.status = subscriptionStatus;
    }

    const { count, rows: companies } = await Company.findAndCountAll({
      where,
      include: [
        {
          model: Subscription,
          as: 'subscription',
          where: Object.keys(subscriptionWhere).length > 0 ? subscriptionWhere : undefined,
          required: Object.keys(subscriptionWhere).length > 0
        },
        {
          model: CompanySettings,
          as: 'settings'
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      distinct: true
    });

    return success(res, {
      companies: companies.map(c => ({
        ...c.toJSON(),
        subscription: c.subscription ? c.subscription.toJSON() : null,
        settings: c.settings ? c.settings.toJSON() : null
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    }, 'تم جلب البيانات بنجاح');

  } catch (err) {
    console.error('❌ Error getting companies:', err);
    return errorResponse(res, 'حدث خطأ أثناء جلب البيانات', 500);
  }
};

// ======================================
// 2. الحصول على شركة محددة
// ======================================
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findByPk(id, {
      include: [
        {
          model: Subscription,
          as: 'subscription'
        },
        {
          model: CompanySettings,
          as: 'settings'
        }
      ]
    });

    if (!company) {
      return errorResponse(res, 'الشركة غير موجودة', 404);
    }

    return success(res, {
      ...company.toJSON(),
      subscription: company.subscription ? company.subscription.toJSON() : null,
      settings: company.settings ? company.settings.toJSON() : null
    }, 'تم جلب البيانات بنجاح');

  } catch (err) {
    console.error('❌ Error getting company:', err);
    return errorResponse(res, 'حدث خطأ أثناء جلب البيانات', 500);
  }
};

// ======================================
// 3. إنشاء شركة جديدة
// ======================================
const createCompany = async (req, res) => {
  try {
    const {
      name,
      identifier,
      email,
      phone,
      password,
      logo,
      primaryColor,
      secondaryColor,
      isActive,
      subscription
    } = req.body;

    // التحقق من المدخلات
    if (!name || !identifier || !email || !password) {
      return errorResponse(res, 'الحقول المطلوبة: name, identifier, email, password', 400);
    }

    // التحقق من عدم وجود شركة بنفس المعرف أو البريد
    const existingCompany = await Company.findOne({
      where: {
        [Op.or]: [
          { identifier },
          { email }
        ]
      }
    });

    if (existingCompany) {
      return errorResponse(res, 'المعرف أو البريد الإلكتروني مستخدم بالفعل', 400);
    }

    // تشفير كلمة المرور
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // إنشاء الشركة
    const company = await Company.create({
      name,
      identifier,
      email,
      phone,
      password: hashedPassword,
      logo,
      primary_color: primaryColor || '#3b82f6',
      secondary_color: secondaryColor || '#8b5cf6',
      is_active: isActive !== undefined ? isActive : true
    });

    // إنشاء الاشتراك إذا تم توفيره
    if (subscription) {
      await Subscription.create({
        company_id: company.id,
        plan: subscription.plan || 'trial',
        status: subscription.status || 'active',
        start_date: subscription.startDate || new Date(),
        end_date: subscription.endDate,
        features: subscription.features || {},
        limits: subscription.limits || {}
      });
    }

    // إنشاء الإعدادات الافتراضية
    await CompanySettings.create({
      company_id: company.id
    });

    // تسجيل في AuditLog
    await AuditLog.log({
      admin_id: req.admin.id,
      action: 'create',
      entity_type: 'company',
      entity_id: company.id,
      details: { name, identifier, email },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    // جلب الشركة مع العلاقات
    const newCompany = await Company.findByPk(company.id, {
      include: [
        { model: Subscription, as: 'subscription' },
        { model: CompanySettings, as: 'settings' }
      ]
    });

    return success(res, {
      ...newCompany.toJSON(),
      subscription: newCompany.subscription ? newCompany.subscription.toJSON() : null,
      settings: newCompany.settings ? newCompany.settings.toJSON() : null
    }, 'تم إنشاء الشركة بنجاح', 201);

  } catch (err) {
    console.error('❌ Error creating company:', err);
    return errorResponse(res, 'حدث خطأ أثناء إنشاء الشركة', 500);
  }
};

// ======================================
// 4. تحديث شركة
// ======================================
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      logo,
      primaryColor,
      secondaryColor,
      isActive,
      password
    } = req.body;

    const company = await Company.findByPk(id);
    if (!company) {
      return errorResponse(res, 'الشركة غير موجودة', 404);
    }

    // تحديث البيانات
    if (name) company.name = name;
    if (email) company.email = email;
    if (phone) company.phone = phone;
    if (logo) company.logo = logo;
    if (primaryColor) company.primary_color = primaryColor;
    if (secondaryColor) company.secondary_color = secondaryColor;
    if (isActive !== undefined) company.is_active = isActive;
    
    // تحديث كلمة المرور إذا تم توفيرها
    if (password) {
      const salt = await bcrypt.genSalt(10);
      company.password = await bcrypt.hash(password, salt);
    }

    await company.save();

    // تسجيل في AuditLog
    await AuditLog.log({
      admin_id: req.admin.id,
      action: 'update',
      entity_type: 'company',
      entity_id: company.id,
      details: { name, email, phone, isActive },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    // جلب الشركة المحدثة مع العلاقات
    const updatedCompany = await Company.findByPk(id, {
      include: [
        { model: Subscription, as: 'subscription' },
        { model: CompanySettings, as: 'settings' }
      ]
    });

    return success(res, {
      ...updatedCompany.toJSON(),
      subscription: updatedCompany.subscription ? updatedCompany.subscription.toJSON() : null,
      settings: updatedCompany.settings ? updatedCompany.settings.toJSON() : null
    }, 'تم تحديث الشركة بنجاح');

  } catch (err) {
    console.error('❌ Error updating company:', err);
    return errorResponse(res, 'حدث خطأ أثناء تحديث الشركة', 500);
  }
};

// ======================================
// 5. حذف شركة
// ======================================
const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findByPk(id);
    if (!company) {
      return errorResponse(res, 'الشركة غير موجودة', 404);
    }

    // تسجيل في AuditLog قبل الحذف
    await AuditLog.log({
      admin_id: req.admin.id,
      action: 'delete',
      entity_type: 'company',
      entity_id: company.id,
      details: { name: company.name, identifier: company.identifier },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    await company.destroy();

    return success(res, null, 'تم حذف الشركة بنجاح');

  } catch (err) {
    console.error('❌ Error deleting company:', err);
    return errorResponse(res, 'حدث خطأ أثناء حذف الشركة', 500);
  }
};

// ======================================
// 6. تبديل حالة الشركة (تفعيل/إيقاف)
// ======================================
const toggleCompanyStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findByPk(id);
    if (!company) {
      return errorResponse(res, 'الشركة غير موجودة', 404);
    }

    company.is_active = !company.is_active;
    await company.save();

    // تسجيل في AuditLog
    await AuditLog.log({
      admin_id: req.admin.id,
      action: company.is_active ? 'activate' : 'deactivate',
      entity_type: 'company',
      entity_id: company.id,
      details: { isActive: company.is_active },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    return success(res, company.toJSON(), `تم ${company.is_active ? 'تفعيل' : 'إيقاف'} الشركة بنجاح`);

  } catch (err) {
    console.error('❌ Error toggling company status:', err);
    return errorResponse(res, 'حدث خطأ أثناء تغيير حالة الشركة', 500);
  }
};

module.exports = {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  toggleCompanyStatus
};
