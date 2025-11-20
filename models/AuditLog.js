// ======================================
// AuditLog Model - سجل العمليات الإدارية
// ======================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  admin_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'admins',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'نوع العملية: create, update, delete, login, etc.'
  },
  entity_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'نوع الكيان: company, subscription, admin, etc.'
  },
  entity_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'معرف الكيان المتأثر'
  },
  details: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'تفاصيل العملية'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  underscored: true,
  updatedAt: false // لا نحتاج updatedAt للسجلات
});

// ======================================
// Static Methods
// ======================================

// تسجيل عملية جديدة
AuditLog.log = async function(data) {
  try {
    await this.create(data);
  } catch (error) {
    console.error('❌ Error logging audit:', error);
  }
};

// تحويل إلى JSON
AuditLog.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  return {
    id: values.id,
    adminId: values.admin_id,
    action: values.action,
    entityType: values.entity_type,
    entityId: values.entity_id,
    details: values.details,
    ipAddress: values.ip_address,
    userAgent: values.user_agent,
    createdAt: values.created_at
  };
};

module.exports = AuditLog;
