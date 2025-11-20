// ======================================
// Seed Admin - إنشاء مسؤول أولي
// ======================================

require('dotenv').config();
const { Admin } = require('../models');
const { syncDatabase } = require('../config/database');

const seedAdmins = async () => {
  try {
    console.log('🌱 Starting admin seed...\n');

    // مزامنة قاعدة البيانات
    await syncDatabase(false);

    // حذف المسؤولين الموجودين (للتطوير فقط)
    // await Admin.destroy({ where: {}, force: true });
    // console.log('🗑️  Cleared existing admins\n');

    // إنشاء Super Admin
    const superAdmin = await Admin.findOrCreate({
      where: { username: 'superadmin' },
      defaults: {
        username: 'superadmin',
        email: 'superadmin@bero.com',
        password: 'superadmin123', // سيتم تشفيرها تلقائياً
        full_name: 'Super Administrator',
        role: 'super_admin',
        is_active: true
      }
    });

    if (superAdmin[1]) {
      console.log('✅ Super Admin created:');
      console.log('   Username: superadmin');
      console.log('   Email: superadmin@bero.com');
      console.log('   Password: superadmin123');
      console.log('   Role: super_admin\n');
    } else {
      console.log('ℹ️  Super Admin already exists\n');
    }

    // إنشاء Admin عادي
    const regularAdmin = await Admin.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        email: 'admin@bero.com',
        password: 'admin123', // سيتم تشفيرها تلقائياً
        full_name: 'Regular Administrator',
        role: 'admin',
        is_active: true
      }
    });

    if (regularAdmin[1]) {
      console.log('✅ Regular Admin created:');
      console.log('   Username: admin');
      console.log('   Email: admin@bero.com');
      console.log('   Password: admin123');
      console.log('   Role: admin\n');
    } else {
      console.log('ℹ️  Regular Admin already exists\n');
    }

    console.log('🎉 Admin seed completed successfully!\n');
    console.log('📝 You can now login with:');
    console.log('   Super Admin: superadmin / superadmin123');
    console.log('   Regular Admin: admin / admin123\n');

  } catch (error) {
    console.error('❌ Error seeding admins:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

// تشغيل السكريبت
seedAdmins();
