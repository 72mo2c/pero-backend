// ======================================
// Database Configuration - PostgreSQL (External)
// ======================================

const { Sequelize } = require('sequelize');
require('dotenv').config();

// إنشاء اتصال Sequelize مع PostgreSQL خارجية
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// اختبار الاتصال
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    return false;
  }
};

// مزامنة قاعدة البيانات
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log(`✅ Database synchronized ${force ? '(FORCE MODE - All data cleared!)' : 'successfully'}`);
  } catch (error) {
    console.error('❌ Database sync failed:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};
