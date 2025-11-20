// ======================================
// Admin Subscription Controller - إدارة الاشتراكات
// ======================================

const { Op } = require('sequelize');
const { Subscription, Company, AuditLog } = require('../models');
const { success, error: errorResponse } = require('../utils/responseHelper');

// ======================================
// 1. الحصول على جميع الاشتراكات
// ======================================
const getAllSubscriptions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      plan, 
      status 
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};
    const companyWhere = {};

    // فلترة حسب الخطة
    if (plan) {
      where.plan = plan;
    }

    // فلترة حسب الحالة
    if (status) {
      where.status = status;
    }

    // فلترة حسب البحث في اسم الشركة
    if (search) {
      companyWhere[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { identifier: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: subscriptions } = await Subscription.findAndCountAll({
      where,
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'identifier', 'email', 'logo'],
          where: Object.keys(companyWhere).length > 0 ? companyWhere : undefined,
          required: Object.keys(companyWhere).length > 0
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      distinct: true
    });

    return success(res, {
      subscriptions: subscriptions.map(s => ({
        ...s.toJSON(),
        company: s.company ? {
          id: s.company.id,
          name: s.company.name,
          identifier: s.company.identifier,
          email: s.company.email,
          logo: s.company.logo
        } : null
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    }, 'تم جلب البيانات بنجاح');

  } catch (err) {
    console.error('❌ Error getting subscriptions:', err);
    return errorResponse(res, 'حدث خطأ أثناء جلب البيانات', 500);
  }
};

// ======================================
// 2. الحصول على اشتراك محدد
// ======================================
const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findByPk(id, {
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'identifier', 'email', 'logo']
        }
      ]
    });

    if (!subscription) {
      return errorResponse(res, 'الاشتراك غير موجود', 404);
    }

    return success(res, {
      ...subscription.toJSON(),
      company: subscription.company ? {
        id: subscription.company.id,
        name: subscription.company.name,
        identifier: subscription.company.identifier,
        email: subscription.company.email,
        logo: subscription.company.logo
      } : null
    }, 'تم جلب البيانات بنجاح');

  } catch (err) {
    console.error('❌ Error getting subscription:', err);
    return errorResponse(res, 'حدث خطأ أثناء جلب البيانات', 500);
  }
};

// ======================================
// 3. تحديث اشتراك
// ======================================
const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      plan,
      status,
      startDate,
      endDate,
      features,
      limits
    } = req.body;

    const subscription = await Subscription.findByPk(id);
    if (!subscription) {
      return errorResponse(res, 'الاشتراك غير موجود', 404);
    }

    // تحديث البيانات
    if (plan) subscription.plan = plan;
    if (status) subscription.status = status;
    if (startDate) subscription.start_date = new Date(startDate);
    if (endDate) subscription.end_date = new Date(endDate);
    if (features) subscription.features = features;
    if (limits) subscription.limits = limits;

    await subscription.save();

    // تسجيل في AuditLog
    await AuditLog.log({
      admin_id: req.admin.id,
      action: 'update',
      entity_type: 'subscription',
      entity_id: subscription.id,
      details: { plan, status, startDate, endDate },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    // جلب الاشتراك المحدث مع العلاقات
    const updatedSubscription = await Subscription.findByPk(id, {
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'identifier', 'email', 'logo']
        }
      ]
    });

    return success(res, {
      ...updatedSubscription.toJSON(),
      company: updatedSubscription.company ? {
        id: updatedSubscription.company.id,
        name: updatedSubscription.company.name,
        identifier: updatedSubscription.company.identifier,
        email: updatedSubscription.company.email,
        logo: updatedSubscription.company.logo
      } : null
    }, 'تم تحديث الاشتراك بنجاح');

  } catch (err) {
    console.error('❌ Error updating subscription:', err);
    return errorResponse(res, 'حدث خطأ أثناء تحديث الاشتراك', 500);
  }
};

// ======================================
// 4. تجديد اشتراك
// ======================================
const renewSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { months = 1, plan } = req.body;

    const subscription = await Subscription.findByPk(id);
    if (!subscription) {
      return errorResponse(res, 'الاشتراك غير موجود', 404);
    }

    // حساب تاريخ الانتهاء الجديد
    const currentEndDate = subscription.end_date ? new Date(subscription.end_date) : new Date();
    const newEndDate = new Date(currentEndDate);
    newEndDate.setMonth(newEndDate.getMonth() + parseInt(months));

    // تحديث الاشتراك
    subscription.status = 'active';
    subscription.end_date = newEndDate;
    if (plan) subscription.plan = plan;

    await subscription.save();

    // تسجيل في AuditLog
    await AuditLog.log({
      admin_id: req.admin.id,
      action: 'renew',
      entity_type: 'subscription',
      entity_id: subscription.id,
      details: { months, newEndDate, plan },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    return success(res, subscription.toJSON(), `تم تجديد الاشتراك لمدة ${months} شهر بنجاح`);

  } catch (err) {
    console.error('❌ Error renewing subscription:', err);
    return errorResponse(res, 'حدث خطأ أثناء تجديد الاشتراك', 500);
  }
};

// ======================================
// 5. إلغاء اشتراك
// ======================================
const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findByPk(id);
    if (!subscription) {
      return errorResponse(res, 'الاشتراك غير موجود', 404);
    }

    subscription.status = 'cancelled';
    await subscription.save();

    // تسجيل في AuditLog
    await AuditLog.log({
      admin_id: req.admin.id,
      action: 'cancel',
      entity_type: 'subscription',
      entity_id: subscription.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    return success(res, subscription.toJSON(), 'تم إلغاء الاشتراك بنجاح');

  } catch (err) {
    console.error('❌ Error cancelling subscription:', err);
    return errorResponse(res, 'حدث خطأ أثناء إلغاء الاشتراك', 500);
  }
};

// ======================================
// 6. حذف اشتراك
// ======================================
const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findByPk(id);
    if (!subscription) {
      return errorResponse(res, 'الاشتراك غير موجود', 404);
    }

    // تسجيل في AuditLog قبل الحذف
    await AuditLog.log({
      admin_id: req.admin.id,
      action: 'delete',
      entity_type: 'subscription',
      entity_id: subscription.id,
      details: { plan: subscription.plan, companyId: subscription.company_id },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    await subscription.destroy();

    return success(res, null, 'تم حذف الاشتراك بنجاح');

  } catch (err) {
    console.error('❌ Error deleting subscription:', err);
    return errorResponse(res, 'حدث خطأ أثناء حذف الاشتراك', 500);
  }
};

module.exports = {
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscription,
  renewSubscription,
  cancelSubscription,
  deleteSubscription
};
