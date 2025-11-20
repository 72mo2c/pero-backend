// ======================================
// Admin Routes - مسارات المسؤولين
// ======================================

const express = require('express');
const router = express.Router();
const { verifyAdminToken, requireSuperAdmin } = require('../middleware/adminAuth');

// Controllers
const adminController = require('../controllers/adminController');
const adminCompanyController = require('../controllers/adminCompanyController');
const adminSubscriptionController = require('../controllers/adminSubscriptionController');
const adminDashboardController = require('../controllers/adminDashboardController');

// ======================================
// مسارات تسجيل الدخول (لا تحتاج توكن)
// ======================================
router.post('/login', adminController.login);

// ======================================
// مسارات المسؤولين (تحتاج توكن)
// ======================================

// الحصول على معلومات المسؤول الحالي
router.get('/me', verifyAdminToken, adminController.getCurrentAdmin);

// تغيير كلمة المرور
router.post('/change-password', verifyAdminToken, adminController.changePassword);

// إدارة المسؤولين (Super Admin فقط)
router.get('/admins', verifyAdminToken, requireSuperAdmin, adminController.getAllAdmins);
router.post('/admins', verifyAdminToken, requireSuperAdmin, adminController.createAdmin);
router.put('/admins/:id', verifyAdminToken, requireSuperAdmin, adminController.updateAdmin);
router.delete('/admins/:id', verifyAdminToken, requireSuperAdmin, adminController.deleteAdmin);

// ======================================
// مسارات إدارة الشركات
// ======================================

// CRUD operations
router.get('/companies', verifyAdminToken, adminCompanyController.getAllCompanies);
router.get('/companies/:id', verifyAdminToken, adminCompanyController.getCompanyById);
router.post('/companies', verifyAdminToken, adminCompanyController.createCompany);
router.put('/companies/:id', verifyAdminToken, adminCompanyController.updateCompany);
router.delete('/companies/:id', verifyAdminToken, requireSuperAdmin, adminCompanyController.deleteCompany);

// تبديل حالة الشركة
router.patch('/companies/:id/toggle-status', verifyAdminToken, adminCompanyController.toggleCompanyStatus);

// ======================================
// مسارات إدارة الاشتراكات
// ======================================

// CRUD operations
router.get('/subscriptions', verifyAdminToken, adminSubscriptionController.getAllSubscriptions);
router.get('/subscriptions/:id', verifyAdminToken, adminSubscriptionController.getSubscriptionById);
router.put('/subscriptions/:id', verifyAdminToken, adminSubscriptionController.updateSubscription);
router.delete('/subscriptions/:id', verifyAdminToken, requireSuperAdmin, adminSubscriptionController.deleteSubscription);

// عمليات خاصة
router.post('/subscriptions/:id/renew', verifyAdminToken, adminSubscriptionController.renewSubscription);
router.post('/subscriptions/:id/cancel', verifyAdminToken, adminSubscriptionController.cancelSubscription);

// ======================================
// مسارات لوحة التحكم والإحصائيات
// ======================================

// إحصائيات اللوحة الرئيسية
router.get('/dashboard/stats', verifyAdminToken, adminDashboardController.getDashboardStats);

// إحصائيات الشركات حسب الوقت
router.get('/dashboard/companies-timeline', verifyAdminToken, adminDashboardController.getCompaniesTimeline);

// إحصائيات الإيرادات
router.get('/dashboard/revenue', verifyAdminToken, adminDashboardController.getRevenueStats);

// سجل العمليات
router.get('/audit-logs', verifyAdminToken, adminDashboardController.getAuditLogs);

module.exports = router;
