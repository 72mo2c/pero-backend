// ======================================
// CompanySettings Model - نموذج إعدادات الشركة
// ======================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CompanySettings = sequelize.define('CompanySettings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'companies',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  settings: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      language: 'ar',
      timezone: 'Asia/Riyadh',
      currency: 'SAR',
      dateFormat: 'DD/MM/YYYY',
      notifications: {
        email: true,
        sms: false,
        push: true
      },
      features: {
        inventory: true,
        sales: true,
        purchases: true,
        reports: true
      }
    }
  }
}, {
  tableName: 'company_settings',
  indexes: [
    {
      unique: true,
      fields: ['company_id']
    }
  ]
});

// الحصول على إعداد معين
CompanySettings.prototype.getSetting = function(key) {
  return this.settings && this.settings[key] ? this.settings[key] : null;
};

// تحديث إعداد معين
CompanySettings.prototype.updateSetting = function(key, value) {
  if (!this.settings) {
    this.settings = {};
  }
  this.settings[key] = value;
  this.changed('settings', true);
  return this.settings;
};

module.exports = CompanySettings;
