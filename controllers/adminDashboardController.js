// ======================================
// Admin Dashboard Controller - الإحصائيات
// ======================================

const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Company, Subscription, Admin, AuditLog } = require('../models');
const { success, error: errorResponse } = require('../utils/responseHelper');

// ======================================
// 1. الحصول على إحصائيات اللوحة الرئيسية
// ======================================
const getDashboardStats = async (req, res) => {
  try {
    // إحصائيات الشركات
    const totalCompanies = await Company.count();
    const activeCompanies = await Company.count({ where: { is_active: true } });
    const inactiveCompanies = totalCompanies - activeCompanies;

    // إحصائيات الاشتراكات
    const activeSubscriptions = await Subscription.count({ where: { status: 'active' } });
    const expiredSubscriptions = await Subscription.count({ where: { status: 'expired' } });
    const cancelledSubscriptions = await Subscription.count({ where: { status: 'cancelled' } });
    const trialSubscriptions = await Subscription.count({ where: { status: 'trial' } });

    // إحصائيات الخطط
    const subscriptionsByPlan = await Subscription.findAll({
      attributes: [
        'plan',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['plan']
    });

    // إحصائيات الاشتراكات المنتهية قريباً (خلال 30 يوم)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringSubscriptions = await Subscription.count({
      where: {
        status: 'active',
        end_date: {
          [Op.between]: [new Date(), thirtyDaysFromNow]
        }
      }
    });

    // إحصائيات المسؤولين
    const totalAdmins = await Admin.count();
    const activeAdmins = await Admin.count({ where: { is_active: true } });

    // آخر الشركات المسجلة
    const recentCompanies = await Company.findAll({
      include: [
        {
          model: Subscription,
          as: 'subscription'
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    // آخر العمليات الإدارية
    const recentActivities = await AuditLog.findAll({
      include: [
        {
          model: Admin,
          as: 'admin',
          attributes: ['id', 'username', 'full_name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // إحصائيات الشركات الجديدة (آخر 30 يوم)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newCompaniesLast30Days = await Company.count({
      where: {
        created_at: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    return success(res, {
      companies: {
        total: totalCompanies,
        active: activeCompanies,
        inactive: inactiveCompanies,
        newLast30Days: newCompaniesLast30Days
      },
      subscriptions: {
        active: activeSubscriptions,
        expired: expiredSubscriptions,
        cancelled: cancelledSubscriptions,
        trial: trialSubscriptions,
        expiringIn30Days: expiringSubscriptions,
        byPlan: subscriptionsByPlan.map(s => ({
          plan: s.plan,
          count: parseInt(s.getDataValue('count'))
        }))
      },
      admins: {
        total: totalAdmins,
        active: activeAdmins
      },
      recentCompanies: recentCompanies.map(c => ({
        ...c.toJSON(),
        subscription: c.subscription ? c.subscription.toJSON() : null
      })),
      recentActivities: recentActivities.map(a => ({
        ...a.toJSON(),
        admin: a.admin ? {
          id: a.admin.id,
          username: a.admin.username,
          fullName: a.admin.full_name
        } : null
      }))
    }, 'تم جلب الإحصائيات بنجاح');

  } catch (err) {
    console.error('❌ Error getting dashboard stats:', err);
    return errorResponse(res, 'حدث خطأ أثناء جلب الإحصائيات', 500);
  }
};

// ======================================
// 2. إحصائيات الشركات حسب الوقت
// ======================================
const getCompaniesTimeline = async (req, res) => {
  try {
    const { period = '7days' } = req.query;

    let dateFrom = new Date();
    let groupBy;

    // تحديد الفترة الزمنية
    switch (period) {
      case '7days':
        dateFrom.setDate(dateFrom.getDate() - 7);
        groupBy = sequelize.fn('DATE', sequelize.col('created_at'));
        break;
      case '30days':
        dateFrom.setDate(dateFrom.getDate() - 30);
        groupBy = sequelize.fn('DATE', sequelize.col('created_at'));
        break;
      case '12months':
        dateFrom.setMonth(dateFrom.getMonth() - 12);
        groupBy = sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at'));
        break;
      default:
        dateFrom.setDate(dateFrom.getDate() - 7);
        groupBy = sequelize.fn('DATE', sequelize.col('created_at'));
    }

    const timeline = await Company.findAll({
      attributes: [
        [groupBy, 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        created_at: {
          [Op.gte]: dateFrom
        }
      },
      group: [groupBy],
      order: [[groupBy, 'ASC']],
      raw: true
    });

    return success(res, {
      period,
      data: timeline
    }, 'تم جلب البيانات بنجاح');

  } catch (err) {
    console.error('❌ Error getting companies timeline:', err);
    return errorResponse(res, 'حدث خطأ أثناء جلب البيانات', 500);
  }
};

// ======================================
// 3. الحصول على سجل العمليات
// ======================================
const getAuditLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      adminId, 
      action, 
      entityType,
      dateFrom,
      dateTo 
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // فلترة حسب المسؤول
    if (adminId) {
      where.admin_id = adminId;
    }

    // فلترة حسب نوع العملية
    if (action) {
      where.action = action;
    }

    // فلترة حسب نوع الكيان
    if (entityType) {
      where.entity_type = entityType;
    }

    // فلترة حسب التاريخ
    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) where.created_at[Op.gte] = new Date(dateFrom);
      if (dateTo) where.created_at[Op.lte] = new Date(dateTo);
    }

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: Admin,
          as: 'admin',
          attributes: ['id', 'username', 'full_name', 'avatar']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    return success(res, {
      logs: logs.map(l => ({
        ...l.toJSON(),
        admin: l.admin ? {
          id: l.admin.id,
          username: l.admin.username,
          fullName: l.admin.full_name,
          avatar: l.admin.avatar
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
    console.error('❌ Error getting audit logs:', err);
    return errorResponse(res, 'حدث خطأ أثناء جلب البيانات', 500);
  }
};

// ======================================
// 4. إحصائيات الإيرادات (تقديري)
// ======================================
const getRevenueStats = async (req, res) => {
  try {
    // أسعار الخطط (يمكن تخزينها في قاعدة البيانات لاحقاً)
    const planPrices = {
      trial: 0,
      basic: 99,
      standard: 199,
      premium: 399,
      enterprise: 999
    };

    const subscriptionsByPlan = await Subscription.findAll({
      where: { status: 'active' },
      attributes: [
        'plan',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['plan']
    });

    let totalRevenue = 0;
    const revenueByPlan = subscriptionsByPlan.map(s => {
      const plan = s.plan;
      const count = parseInt(s.getDataValue('count'));
      const price = planPrices[plan] || 0;
      const revenue = count * price;
      totalRevenue += revenue;

      return {
        plan,
        count,
        pricePerMonth: price,
        totalRevenue: revenue
      };
    });

    return success(res, {
      totalRevenue,
      revenueByPlan,
      currency: 'SAR'
    }, 'تم جلب إحصائيات الإيرادات بنجاح');

  } catch (err) {
    console.error('❌ Error getting revenue stats:', err);
    return errorResponse(res, 'حدث خطأ أثناء جلب الإحصائيات', 500);
  }
};

module.exports = {
  getDashboardStats,
  getCompaniesTimeline,
  getAuditLogs,
  getRevenueStats
};
