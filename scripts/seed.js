// ======================================
// Seed Script - إنشاء بيانات تجريبية
// ======================================

require('dotenv').config();
const { sequelize, testConnection } = require('../config/database');
const { Company, Subscription, CompanySettings } = require('../models');

const seedData = async () => {
  try {
    console.log('🌱 Starting seed process...\n');

    // الاتصال بقاعدة البيانات
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }

    // مزامنة قاعدة البيانات (حذف البيانات القديمة)
    console.log('🔄 Syncing database (FORCE MODE - All data will be cleared)...');
    await sequelize.sync({ force: true });
    console.log('✅ Database synced\n');

    // ======================================
    // إنشاء شركات تجريبية
    // ======================================

    console.log('📦 Creating test companies...\n');

    // شركة 1 - Premium
    const company1 = await Company.create({
      identifier: 'test-premium',
      password: '123456',
      name: 'شركة الاختبار المميزة',
      is_active: true,
      logo: 'https://via.placeholder.com/100',
      primary_color: '#3B82F6',
      secondary_color: '#64748B',
      theme: 'light'
    });

    await Subscription.create({
      company_id: company1.id,
      plan: 'premium',
      status: 'active',
      start_date: new Date(),
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // سنة من الآن
      features: [
        'inventory',
        'sales',
        'purchases',
        'reports',
        'advanced_reports',
        'integrations',
        'multi_warehouse',
        'custom_fields'
      ],
      limits: {
        maxUsers: 50,
        maxProducts: 10000,
        maxInvoices: 50000,
        maxWarehouses: 10,
        maxCustomers: 5000,
        maxSuppliers: 1000
      }
    });

    await CompanySettings.create({
      company_id: company1.id,
      settings: {
        language: 'ar',
        timezone: 'Asia/Riyadh',
        currency: 'SAR',
        dateFormat: 'DD/MM/YYYY'
      }
    });

    console.log('✅ Company 1 (Premium) created: test-premium / 123456');

    // شركة 2 - Standard
    const company2 = await Company.create({
      identifier: 'test-standard',
      password: '123456',
      name: 'شركة الاختبار القياسية',
      is_active: true,
      logo: 'https://via.placeholder.com/100',
      primary_color: '#10B981',
      secondary_color: '#6B7280',
      theme: 'light'
    });

    await Subscription.create({
      company_id: company2.id,
      plan: 'standard',
      status: 'active',
      start_date: new Date(),
      end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 أشهر
      features: [
        'inventory',
        'sales',
        'purchases',
        'reports',
        'multi_warehouse'
      ],
      limits: {
        maxUsers: 10,
        maxProducts: 5000,
        maxInvoices: 10000,
        maxWarehouses: 5,
        maxCustomers: 1000,
        maxSuppliers: 500
      }
    });

    await CompanySettings.create({
      company_id: company2.id,
      settings: {
        language: 'ar',
        timezone: 'Asia/Riyadh',
        currency: 'SAR',
        dateFormat: 'DD/MM/YYYY'
      }
    });

    console.log('✅ Company 2 (Standard) created: test-standard / 123456');

    // شركة 3 - Basic
    const company3 = await Company.create({
      identifier: 'test-basic',
      password: '123456',
      name: 'شركة الاختبار الأساسية',
      is_active: true,
      logo: 'https://via.placeholder.com/100',
      primary_color: '#F59E0B',
      secondary_color: '#9CA3AF',
      theme: 'light'
    });

    await Subscription.create({
      company_id: company3.id,
      plan: 'basic',
      status: 'active',
      start_date: new Date(),
      end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 أشهر
      features: [
        'inventory',
        'sales',
        'purchases',
        'reports'
      ],
      limits: {
        maxUsers: 3,
        maxProducts: 1000,
        maxInvoices: 5000,
        maxWarehouses: 1,
        maxCustomers: 500,
        maxSuppliers: 100
      }
    });

    await CompanySettings.create({
      company_id: company3.id,
      settings: {
        language: 'ar',
        timezone: 'Asia/Riyadh',
        currency: 'SAR',
        dateFormat: 'DD/MM/YYYY'
      }
    });

    console.log('✅ Company 3 (Basic) created: test-basic / 123456');

    // شركة 4 - Expired Subscription
    const company4 = await Company.create({
      identifier: 'test-expired',
      password: '123456',
      name: 'شركة الاختبار المنتهية',
      is_active: true,
      logo: 'https://via.placeholder.com/100',
      primary_color: '#EF4444',
      secondary_color: '#9CA3AF',
      theme: 'light'
    });

    await Subscription.create({
      company_id: company4.id,
      plan: 'basic',
      status: 'expired',
      start_date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // قبل 4 أشهر
      end_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // انتهى قبل شهر
      features: [
        'inventory',
        'sales'
      ],
      limits: {
        maxUsers: 3,
        maxProducts: 1000,
        maxInvoices: 5000,
        maxWarehouses: 1,
        maxCustomers: 500,
        maxSuppliers: 100
      }
    });

    await CompanySettings.create({
      company_id: company4.id,
      settings: {
        language: 'ar',
        timezone: 'Asia/Riyadh',
        currency: 'SAR',
        dateFormat: 'DD/MM/YYYY'
      }
    });

    console.log('✅ Company 4 (Expired) created: test-expired / 123456');

    // شركة 5 - Inactive
    const company5 = await Company.create({
      identifier: 'test-inactive',
      password: '123456',
      name: 'شركة الاختبار غير المفعلة',
      is_active: false,
      logo: 'https://via.placeholder.com/100',
      primary_color: '#6B7280',
      secondary_color: '#9CA3AF',
      theme: 'light'
    });

    await Subscription.create({
      company_id: company5.id,
      plan: 'basic',
      status: 'suspended',
      start_date: new Date(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      features: [],
      limits: {}
    });

    console.log('✅ Company 5 (Inactive) created: test-inactive / 123456');

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('📋 Test Companies:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. test-premium  / 123456 (Premium - Active)');
    console.log('2. test-standard / 123456 (Standard - Active)');
    console.log('3. test-basic    / 123456 (Basic - Active)');
    console.log('4. test-expired  / 123456 (Basic - Expired)');
    console.log('5. test-inactive / 123456 (Inactive)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

// تشغيل
seedData();
