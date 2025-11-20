// ======================================
// Subscription Model - نموذج الاشتراكات
// ======================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'companies',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  plan: {
    type: DataTypes.ENUM('basic', 'standard', 'premium'),
    allowNull: false,
    defaultValue: 'basic'
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'suspended'),
    allowNull: false,
    defaultValue: 'active'
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  features: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  limits: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  }
}, {
  tableName: 'subscriptions',
  indexes: [
    {
      fields: ['company_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['end_date']
    }
  ]
});

// حساب الأيام المتبقية
Subscription.prototype.getDaysRemaining = function() {
  const today = new Date();
  const endDate = new Date(this.end_date);
  const diffTime = endDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// التحقق من صلاحية الاشتراك
Subscription.prototype.isValid = function() {
  return this.status === 'active' && new Date(this.end_date) > new Date();
};

// التحقق من وجود ميزة
Subscription.prototype.hasFeature = function(feature) {
  return this.features && this.features.includes(feature);
};

// التحقق من الحد
Subscription.prototype.checkLimit = function(limitType, currentValue) {
  if (!this.limits || !this.limits[limitType]) {
    return true;
  }
  return currentValue < this.limits[limitType];
};

// تحديث حالة الاشتراك تلقائياً
Subscription.prototype.updateStatus = function() {
  const endDate = new Date(this.end_date);
  const today = new Date();
  
  if (endDate < today && this.status === 'active') {
    this.status = 'expired';
  }
  
  return this.status;
};

// إضافة daysRemaining وتحويل إلى camelCase عند التحويل لـ JSON
Subscription.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // تحويل إلى camelCase للفرونت إند
  return {
    id: values.id,
    companyId: values.company_id,
    plan: values.plan,
    status: values.status,
    startDate: values.start_date,
    endDate: values.end_date,
    features: values.features,
    limits: values.limits,
    daysRemaining: this.getDaysRemaining(),
    createdAt: values.createdAt,
    updatedAt: values.updatedAt
  };
};

module.exports = Subscription;
