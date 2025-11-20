// ======================================
// RefreshToken Model - نموذج Refresh Tokens
// ======================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RefreshToken = sequelize.define('RefreshToken', {
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
  token: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  is_revoked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, {
  tableName: 'refresh_tokens',
  indexes: [
    {
      fields: ['company_id']
    },
    {
      fields: ['token']
    },
    {
      fields: ['expires_at']
    }
  ]
});

// التحقق من صلاحية Token
RefreshToken.prototype.isValid = function() {
  return !this.is_revoked && new Date(this.expires_at) > new Date();
};

// إلغاء Token
RefreshToken.prototype.revoke = async function() {
  this.is_revoked = true;
  await this.save();
};

// حذف Tokens المنتهية (Static Method)
RefreshToken.cleanExpiredTokens = async function() {
  const result = await RefreshToken.destroy({
    where: {
      expires_at: {
        [sequelize.Sequelize.Op.lt]: new Date()
      }
    }
  });
  
  console.log(`🗑️ Cleaned ${result} expired refresh tokens`);
  return result;
};

module.exports = RefreshToken;
