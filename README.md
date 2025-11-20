# 🚀 Bero Company SaaS Backend

Backend API كامل لنظام إدارة الشركات SaaS باستخدام **Node.js + Express + PostgreSQL**.

---

## 📋 المحتويات

- [المميزات](#-المميزات)
- [التقنيات المستخدمة](#-التقنيات-المستخدمة)
- [البنية](#-البنية)
- [التثبيت](#-التثبيت)
- [الإعداد](#-الإعداد)
- [API Endpoints](#-api-endpoints)
- [بيانات التجربة](#-بيانات-التجربة)

---

## ✨ المميزات

✅ **نظام مصادقة كامل** - JWT (Access + Refresh Tokens)  
✅ **إدارة الاشتراكات** - خطط متعددة (Basic, Standard, Premium)  
✅ **التحقق من الميزات والحدود** - Feature & Limit Checking  
✅ **حماية متقدمة** - Rate Limiting, Helmet, CORS  
✅ **قاعدة بيانات PostgreSQL** - اتصال خارجي عبر Connection String  
✅ **Validation متقدم** - express-validator  
✅ **تشفير كلمات المرور** - bcrypt  
✅ **Logging** - Morgan  
✅ **11 API Endpoints** - متوافق 100% مع Frontend  

---

## 🛠 التقنيات المستخدمة

| التقنية | الإصدار | الغرض |
|---------|---------|-------|
| Node.js | >=16.0.0 | Runtime |
| Express | 4.18.2 | Web Framework |
| PostgreSQL | - | Database |
| Sequelize | 6.35.0 | ORM |
| JWT | 9.0.2 | Authentication |
| bcrypt | 5.1.1 | Password Hashing |
| express-validator | 7.0.1 | Validation |
| express-rate-limit | 7.1.5 | Rate Limiting |
| helmet | 7.1.0 | Security Headers |
| cors | 2.8.5 | CORS |
| morgan | 1.10.0 | Logging |

---

## 📁 البنية

```
backend/
├── config/
│   └── database.js          # إعدادات قاعدة البيانات
├── models/
│   ├── Company.js           # نموذج الشركة
│   ├── Subscription.js      # نموذج الاشتراكات
│   ├── CompanySettings.js   # نموذج الإعدادات
│   ├── RefreshToken.js      # نموذج Refresh Tokens
│   └── index.js             # تجميع النماذج
├── controllers/
│   └── companyController.js # المتحكم الرئيسي (11 endpoints)
├── routes/
│   └── companyRoutes.js     # المسارات
├── middleware/
│   ├── auth.js              # مصادقة JWT
│   ├── validator.js         # التحقق من البيانات
│   └── rateLimiter.js       # Rate Limiting
├── utils/
│   ├── jwtUtils.js          # أدوات JWT
│   └── responseHelper.js    # مساعد الاستجابات
├── scripts/
│   └── seed.js              # بيانات تجريبية
├── server.js                # الملف الرئيسي
├── package.json
├── .env
└── README.md
```

---

## 📦 التثبيت

### 1️⃣ متطلبات النظام

- Node.js >= 16.0.0
- npm أو yarn
- PostgreSQL Database (خارجية)

### 2️⃣ تثبيت المكتبات

```bash
cd backend
npm install
```

---

## ⚙️ الإعداد

### 1️⃣ إنشاء ملف `.env`

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database (PostgreSQL - External)
DATABASE_URL=postgresql://username:password@hostname:5432/database_name

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=30d

# CORS
CORS_ORIGIN=http://localhost:3000

# Security
BCRYPT_ROUNDS=10
```

### 2️⃣ إنشاء قاعدة البيانات

قم بإنشاء قاعدة بيانات PostgreSQL على الخدمة الخارجية المفضلة لديك:
- **Heroku Postgres**
- **AWS RDS**
- **Supabase**
- **DigitalOcean**
- **Google Cloud SQL**

### 3️⃣ تشغيل الخادم

```bash
# Development Mode
npm run dev

# Production Mode
npm start
```

### 4️⃣ إنشاء بيانات تجريبية

```bash
npm run seed
```

---

## 🔌 API Endpoints

### Base URL: `http://localhost:5000/api/v1/companies`

#### 🔓 Public Endpoints (لا تحتاج مصادقة)

| Method | Endpoint | الوصف |
|--------|----------|-------|
| POST | `/verify` | التحقق من معرف الشركة |
| POST | `/login` | تسجيل دخول الشركة |
| POST | `/refresh` | تجديد Access Token |

#### 🔒 Protected Endpoints (تحتاج Bearer Token)

| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/details` | جلب تفاصيل الشركة |
| GET | `/subscription` | جلب معلومات الاشتراك |
| GET | `/config` | جلب إعدادات الشركة |
| PUT | `/config` | تحديث إعدادات الشركة |
| POST | `/logout` | تسجيل خروج |
| GET | `/validate` | التحقق من صلاحية Token |
| GET | `/usage` | جلب حدود الاستخدام |
| GET | `/subscription/status` | فحص حالة الاشتراك |

---

## 📝 أمثلة الاستخدام

### 1️⃣ التحقق من المعرف

```bash
POST /api/v1/companies/verify
Content-Type: application/json

{
  "identifier": "test-premium"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم التحقق من المعرف بنجاح",
  "data": {
    "id": "uuid",
    "name": "شركة الاختبار المميزة",
    "identifier": "test-premium",
    "is_active": true,
    "logo": "https://...",
    "primary_color": "#3B82F6",
    "secondary_color": "#64748B"
  }
}
```

### 2️⃣ تسجيل الدخول

```bash
POST /api/v1/companies/login
Content-Type: application/json

{
  "identifier": "test-premium",
  "password": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "data": {
    "company": { /* ... */ },
    "subscription": { /* ... */ },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

### 3️⃣ الوصول للـ Protected Endpoints

```bash
GET /api/v1/companies/subscription
Authorization: Bearer {accessToken}
```

---

## 🧪 بيانات التجربة

بعد تشغيل `npm run seed`، ستحصل على 5 شركات تجريبية:

| Identifier | Password | Plan | Status |
|------------|----------|------|--------|
| test-premium | 123456 | Premium | Active (365 days) |
| test-standard | 123456 | Standard | Active (180 days) |
| test-basic | 123456 | Basic | Active (90 days) |
| test-expired | 123456 | Basic | Expired |
| test-inactive | 123456 | Basic | Inactive |

---

## 🔐 الأمان

- ✅ كلمات المرور مشفرة بـ **bcrypt**
- ✅ JWT Tokens مع **Access & Refresh**
- ✅ Rate Limiting على جميع Endpoints
- ✅ Helmet Security Headers
- ✅ CORS Configuration
- ✅ Input Validation
- ✅ SQL Injection Protection (Sequelize ORM)

---

## 📊 قاعدة البيانات

### Tables:

1. **companies** - معلومات الشركات
2. **subscriptions** - الاشتراكات
3. **company_settings** - الإعدادات
4. **refresh_tokens** - Refresh Tokens

### العلاقات:

- Company → Subscription (One-to-One)
- Company → CompanySettings (One-to-One)
- Company → RefreshTokens (One-to-Many)

---

## 🐛 استكشاف الأخطاء

### خطأ في الاتصال بقاعدة البيانات

```bash
❌ Unable to connect to the database
```

**الحل:**
- تحقق من `DATABASE_URL` في `.env`
- تأكد من صحة معلومات الاتصال
- تحقق من إتاحة قاعدة البيانات

### خطأ JWT

```bash
❌ Invalid or expired access token
```

**الحل:**
- استخدم `/refresh` endpoint لتجديد Token
- تحقق من `JWT_SECRET` في `.env`

---

## 📞 الدعم

للمشاكل والأسئلة، يرجى التواصل عبر:
- Email: support@berosystem.com

---

## 📄 الترخيص

MIT License

---

**تم التطوير بواسطة: MiniMax Agent**  
**التاريخ: 2025-11-20**
