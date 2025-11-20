// ======================================
// Company Model - نموذج الشركة
// ======================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  identifier: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 100]
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [6, 255]
    }
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  logo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  primary_color: {
    type: DataTypes.STRING(20),
    defaultValue: '#3B82F6',
    allowNull: true
  },
  secondary_color: {
    type: DataTypes.STRING(20),
    defaultValue: '#64748B',
    allowNull: true
  },
  theme: {
    type: DataTypes.ENUM('light', 'dark'),
    defaultValue: 'light',
    allowNull: false
  }
}, {
  tableName: 'companies',
  indexes: [
    {
      unique: true,
      fields: ['identifier']
    },
    {
      fields: ['is_active']
    }
  ]
});

// Hash password قبل الحفظ
Company.beforeCreate(async (company) => {
  if (company.password) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    company.password = await bcrypt.hash(company.password, rounds);
  }
});

// Hash password عند التحديث
Company.beforeUpdate(async (company) => {
  if (company.changed('password')) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    company.password = await bcrypt.hash(company.password, rounds);
  }
});

// مقارنة كلمة المرور
Company.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// إخفاء كلمة المرور عند التحويل لـ JSON
Company.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = Company;
