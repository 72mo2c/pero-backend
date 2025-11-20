// ======================================
// Models Index - تجميع النماذج والعلاقات
// ======================================

const Company = require('./Company');
const Subscription = require('./Subscription');
const CompanySettings = require('./CompanySettings');
const RefreshToken = require('./RefreshToken');
const Admin = require('./Admin');
const AuditLog = require('./AuditLog');

// ======================================
// تعريف العلاقات بين النماذج
// ======================================

// Company -> Subscription (One-to-One)
Company.hasOne(Subscription, {
  foreignKey: 'company_id',
  as: 'subscription',
  onDelete: 'CASCADE'
});

Subscription.belongsTo(Company, {
  foreignKey: 'company_id',
  as: 'company'
});

// Company -> CompanySettings (One-to-One)
Company.hasOne(CompanySettings, {
  foreignKey: 'company_id',
  as: 'settings',
  onDelete: 'CASCADE'
});

CompanySettings.belongsTo(Company, {
  foreignKey: 'company_id',
  as: 'company'
});

// Company -> RefreshTokens (One-to-Many)
Company.hasMany(RefreshToken, {
  foreignKey: 'company_id',
  as: 'refreshTokens',
  onDelete: 'CASCADE'
});

RefreshToken.belongsTo(Company, {
  foreignKey: 'company_id',
  as: 'company'
});

// Admin -> AuditLogs (One-to-Many)
Admin.hasMany(AuditLog, {
  foreignKey: 'admin_id',
  as: 'auditLogs',
  onDelete: 'CASCADE'
});

AuditLog.belongsTo(Admin, {
  foreignKey: 'admin_id',
  as: 'admin'
});

// ======================================
// تصدير النماذج
// ======================================

module.exports = {
  Company,
  Subscription,
  CompanySettings,
  RefreshToken,
  Admin,
  AuditLog
};
