// ======================================
// Admin Model - نموذج المسؤولين
// ======================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 50]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [6, 100]
    }
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  role: {
    type: DataTypes.ENUM('super_admin', 'admin'),
    defaultValue: 'admin',
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'admins',
  timestamps: true,
  underscored: true,
  hooks: {
    // تشفير كلمة المرور قبل الحفظ
    beforeCreate: async (admin) => {
      if (admin.password) {
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(admin.password, salt);
      }
    },
    beforeUpdate: async (admin) => {
      if (admin.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(admin.password, salt);
      }
    }
  }
});

// ======================================
// Instance Methods
// ======================================

// التحقق من كلمة المرور
Admin.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// تحديث آخر تسجيل دخول
Admin.prototype.updateLastLogin = async function() {
  this.last_login = new Date();
  await this.save();
};

// تحويل إلى JSON (إخفاء كلمة المرور)
Admin.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  
  return {
    id: values.id,
    username: values.username,
    email: values.email,
    fullName: values.full_name,
    role: values.role,
    isActive: values.is_active,
    lastLogin: values.last_login,
    avatar: values.avatar,
    createdAt: values.created_at,
    updatedAt: values.updated_at
  };
};

module.exports = Admin;
