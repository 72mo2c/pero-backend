// ======================================
// Admin Controller - وحدة تحكم المسؤولين
// ======================================

const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Admin, AuditLog, Company, Subscription, CompanySettings } = require('../models');
const { success, error: errorResponse } = require('../utils/responseHelper');

// ======================================
// 1. تسجيل دخول المسؤول
// ======================================
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // التحقق من المدخلات
    if (!username || !password) {
      return errorResponse(res, 'اسم المستخدم وكلمة المرور مطلوبان', 400);
    }

    // البحث عن المسؤول
    const admin = await Admin.findOne({ 
      where: { 
        [Op.or]: [
          { username },
          { email: username }
        ]
      } 
    });

    if (!admin) {
      return errorResponse(res, 'اسم المستخدم أو كلمة المرور غير صحيحة', 401);
    }

    // التحقق من حالة الحساب
    if (!admin.is_active) {
      return errorResponse(res, 'حسابك معطل. يرجى التواصل مع الإدارة', 403);
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return errorResponse(res, 'اسم المستخدم أو كلمة المرور غير صحيحة', 401);
    }

    // تحديث آخر تسجيل دخول
    await admin.updateLastLogin();

    // إنشاء التوكن
    const token = jwt.sign(
      { 
        id: admin.id, 
        username: admin.username,
        role: admin.role,
        type: 'admin'
      },
      process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // تسجيل في AuditLog
    await AuditLog.log({
      admin_id: admin.id,
      action: 'login',
      entity_type: 'admin',
      entity_id: admin.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    return success(res, {
      admin: admin.toJSON(),
      token
    }, 'تم تسجيل الدخول بنجاح');

  } catch (err) {
    console.error('❌ Error in admin login:', err);
    return errorResponse(res, 'حدث خطأ أثناء تسجيل الدخول', 500);
  }
};

// ======================================
// 2. الحصول على معلومات المسؤول الحالي
// ======================================
const getCurrentAdmin = async (req, res) => {
  try {
    return success(res, req.admin.toJSON(), 'تم جلب البيانات بنجاح');
  } catch (err) {
    console.error('❌ Error getting current admin:', err);
    return errorResponse(res, 'حدث خطأ أثناء جلب البيانات', 500);
  }
};

// ======================================
// 3. تغيير كلمة المرور
// ======================================
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'كلمة المرور الحالية والجديدة مطلوبتان', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse(res, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', 400);
    }

    // التحقق من كلمة المرور الحالية
    const isValid = await req.admin.comparePassword(currentPassword);
    if (!isValid) {
      return errorResponse(res, 'كلمة المرور الحالية غير صحيحة', 401);
    }

    // تحديث كلمة المرور
    req.admin.password = newPassword;
    await req.admin.save();

    // تسجيل في AuditLog
    await AuditLog.log({
      admin_id: req.admin.id,
      action: 'change_password',
      entity_type: 'admin',
      entity_id: req.admin.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    return success(res, null, 'تم تغيير كلمة المرور بنجاح');

  } catch (err) {
    console.error('❌ Error changing password:', err);
    return errorResponse(res, 'حدث خطأ أثناء تغيير كلمة المرور', 500);
  }
};

// ======================================
// 4. إنشاء مسؤول جديد (Super Admin فقط)
// ======================================
const createAdmin = async (req, res) => {
  try {
    const { username, email, password, fullName, role } = req.body;

    // التحقق من المدخلات
    if (!username || !email || !password || !fullName) {
      return errorResponse(res, 'جميع الحقول مطلوبة', 400);
    }

    // التحقق من عدم وجود مسؤول بنفس الاسم أو البريد
    const existingAdmin = await Admin.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingAdmin) {
      return errorResponse(res, 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل', 400);
    }

    // إنشاء المسؤول
    const admin = await Admin.create({
      username,
      email,
      password,
      full_name: fullName,
      role: role || 'admin'
    });

    // تسجيل في AuditLog
    await AuditLog.log({
      admin_id: req.admin.id,
      action: 'create',
      entity_type: 'admin',
      entity_id: admin.id,
      details: { username, email, role: admin.role },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    return success(res, admin.toJSON(), 'تم إنشاء المسؤول بنجاح', 201);

  } catch (err) {
    console.error('❌ Error creating admin:', err);
    return errorResponse(res, 'حدث خطأ أثناء إنشاء المسؤول', 500);
  }
};

// ======================================
// 5. الحصول على قائمة المسؤولين (Super Admin فقط)
// ======================================
const getAllAdmins = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, isActive } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // فلترة حسب البحث
    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { full_name: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // فلترة حسب الدور
    if (role) {
      where.role = role;
    }

    // فلترة حسب الحالة
    if (isActive !== undefined) {
      where.is_active = isActive === 'true';
    }

    const { count, rows: admins } = await Admin.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    return success(res, {
      admins: admins.map(a => a.toJSON()),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    }, 'تم جلب البيانات بنجاح');

  } catch (err) {
    console.error('❌ Error getting admins:', err);
    return errorResponse(res, 'حدث خطأ أثناء جلب البيانات', 500);
  }
};

// ======================================
// 6. تحديث مسؤول (Super Admin فقط)
// ======================================
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, role, isActive } = req.body;

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return errorResponse(res, 'المسؤول غير موجود', 404);
    }

    // تحديث البيانات
    if (fullName) admin.full_name = fullName;
    if (email) admin.email = email;
    if (role) admin.role = role;
    if (isActive !== undefined) admin.is_active = isActive;

    await admin.save();

    // تسجيل في AuditLog
    await AuditLog.log({
      admin_id: req.admin.id,
      action: 'update',
      entity_type: 'admin',
      entity_id: admin.id,
      details: { fullName, email, role, isActive },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    return success(res, admin.toJSON(), 'تم تحديث المسؤول بنجاح');

  } catch (err) {
    console.error('❌ Error updating admin:', err);
    return errorResponse(res, 'حدث خطأ أثناء تحديث المسؤول', 500);
  }
};

// ======================================
// 7. حذف مسؤول (Super Admin فقط)
// ======================================
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return errorResponse(res, 'المسؤول غير موجود', 404);
    }

    // منع حذف نفسه
    if (admin.id === req.admin.id) {
      return errorResponse(res, 'لا يمكنك حذف نفسك', 400);
    }

    // تسجيل في AuditLog قبل الحذف
    await AuditLog.log({
      admin_id: req.admin.id,
      action: 'delete',
      entity_type: 'admin',
      entity_id: admin.id,
      details: { username: admin.username, email: admin.email },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    await admin.destroy();

    return success(res, null, 'تم حذف المسؤول بنجاح');

  } catch (err) {
    console.error('❌ Error deleting admin:', err);
    return errorResponse(res, 'حدث خطأ أثناء حذف المسؤول', 500);
  }
};

module.exports = {
  login,
  getCurrentAdmin,
  changePassword,
  createAdmin,
  getAllAdmins,
  updateAdmin,
  deleteAdmin
};
