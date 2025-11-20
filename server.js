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
// Database Connection & Server Initialization
// ======================================

let isDatabaseInitialized = false;

const initializeDatabase = async () => {
  if (isDatabaseInitialized) return true;
  
  try {
    console.log('📊 Connecting to PostgreSQL database...');
    const isConnected = await testConnection();

    if (!isConnected) {
      console.error('❌ Failed to connect to database');
      return false;
    }

    console.log('🔄 Synchronizing database...');
    await syncDatabase(false); // false = لا تحذف البيانات
    
    isDatabaseInitialized = true;
    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
};

// Initialize database on cold start (for Vercel)
initializeDatabase().then(success => {
  if (success) {
    console.log('🚀 Bero Company SaaS Backend initialized successfully!');
  } else {
    console.log('⚠️ Backend running with database connection issues');
  }
});

// ======================================
// Vercel Serverless Export
// ======================================

module.exports = app;

// ======================================
// Local Development Only
// ======================================

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  
  const startLocalServer = async () => {
    try {
      console.log('🚀 Starting local server...');
      
      const dbSuccess = await initializeDatabase();
      if (!dbSuccess) {
        console.log('⚠️ Starting server with database issues...');
      }

      app.listen(PORT, () => {
        console.log('\n✅ Local server started successfully!');
        console.log(`📡 Server running on port ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
        console.log(`🔗 API URL: http://localhost:${PORT}`);
        console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
        console.log('\n🎉 Ready to accept requests!\n');
      });

    } catch (error) {
      console.error('❌ Failed to start local server:', error.message);
      process.exit(1);
    }
  };

  startLocalServer();
}