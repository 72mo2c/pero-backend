// ======================================
// Bero Company SaaS Backend Server
// ======================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Database
const { sequelize, testConnection, syncDatabase } = require('./config/database');

// Routes
const companyRoutes = require('./routes/companyRoutes');

// Middleware
const { generalLimiter } = require('./middleware/rateLimiter');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// ======================================
// Middleware Configuration
// ======================================

// Security Headers
app.use(helmet());

// CORS Configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate Limiting
app.use(generalLimiter);

// ======================================
// Routes
// ======================================

// Health Check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/v1/companies', companyRoutes);

// Root Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bero Company SaaS Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      companies: '/api/v1/companies'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'المسار غير موجود',
    path: req.path
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'خطأ في الخادم',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ======================================
// Database Connection & Server Start
// ======================================

const startServer = async () => {
  try {
    console.log('🚀 Starting Bero Company SaaS Backend...\n');

    // اختبار الاتصال بقاعدة البيانات
    console.log('📊 Connecting to PostgreSQL database...');
    const isConnected = await testConnection();

    if (!isConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // مزامنة قاعدة البيانات (إنشاء الجداول)
    console.log('🔄 Synchronizing database...');
    await syncDatabase(false); // false = لا تحذف البيانات

    // بدء الخادم
    app.listen(PORT, () => {
      console.log('\n✅ Server started successfully!');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 API URL: http://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`📚 API Docs: http://localhost:${PORT}/api/v1/companies`);
      console.log('\n🎉 Ready to accept requests!\n');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// التعامل مع الإغلاق بشكل صحيح
process.on('SIGTERM', async () => {
  console.log('\n⚠️ SIGTERM received. Closing server gracefully...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n⚠️ SIGINT received. Closing server gracefully...');
  await sequelize.close();
  process.exit(0);
});

// بدء التشغيل
startServer();

module.exports = app;
