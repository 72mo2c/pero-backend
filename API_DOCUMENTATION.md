# 📚 API Documentation - Bero Company SaaS Backend

توثيق شامل لجميع الـ API Endpoints

---

## 🌐 Base URL

```
http://localhost:5000/api/v1/companies
```

---

## 🔓 Public Endpoints

### 1️⃣ التحقق من معرف الشركة

**Endpoint:** `POST /verify`

**الوصف:** التحقق من وجود وصلاحية معرف الشركة

**Request Body:**
```json
{
  "identifier": "string (3-100 chars)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "تم التحقق من المعرف بنجاح",
  "data": {
    "id": "uuid",
    "name": "اسم الشركة",
    "identifier": "company-id",
    "is_active": true,
    "logo": "https://example.com/logo.png",
    "primary_color": "#3B82F6",
    "secondary_color": "#64748B"
  }
}
```

**Error Responses:**
- `404` - معرف الشركة غير موجود
- `401` - الشركة غير مفعلة
- `400` - خطأ في البيانات المدخلة

---

### 2️⃣ تسجيل دخول الشركة

**Endpoint:** `POST /login`

**الوصف:** تسجيل دخول الشركة والحصول على Tokens

**Request Body:**
```json
{
  "identifier": "string (3-100 chars)",
  "password": "string (min 6 chars)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "data": {
    "company": {
      "id": "uuid",
      "name": "اسم الشركة",
      "identifier": "company-id",
      "isActive": true,
      "logo": "https://...",
      "primaryColor": "#3B82F6",
      "secondaryColor": "#64748B",
      "theme": "light"
    },
    "subscription": {
      "id": "uuid",
      "plan": "premium",
      "status": "active",
      "start_date": "2024-01-01",
      "end_date": "2025-01-01",
      "daysRemaining": 365,
      "features": [
        "inventory",
        "sales",
        "purchases",
        "reports",
        "advanced_reports"
      ],
      "limits": {
        "maxUsers": 50,
        "maxProducts": 10000,
        "maxInvoices": 50000,
        "maxWarehouses": 10,
        "maxCustomers": 5000,
        "maxSuppliers": 1000
      }
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

**Error Responses:**
- `401` - معرف أو كلمة مرور خاطئة
- `401` - الشركة غير مفعلة
- `401` - لا يوجد اشتراك نشط
- `400` - خطأ في البيانات

**Rate Limit:** 5 محاولات كل 15 دقيقة

---

### 3️⃣ تجديد Access Token

**Endpoint:** `POST /refresh`

**الوصف:** تجديد Access Token باستخدام Refresh Token

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "تم تجديد Token بنجاح",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

**Error Responses:**
- `401` - Refresh Token غير صالح أو منتهي
- `401` - الشركة غير موجودة أو غير مفعلة
- `400` - Refresh Token مطلوب

---

## 🔒 Protected Endpoints

**يجب إرفاق Access Token في الـ Header:**

```
Authorization: Bearer {accessToken}
```

---

### 4️⃣ جلب تفاصيل الشركة

**Endpoint:** `GET /details`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "company": {
      "id": "uuid",
      "name": "اسم الشركة",
      "identifier": "company-id",
      "isActive": true,
      "logo": "https://...",
      "primaryColor": "#3B82F6",
      "secondaryColor": "#64748B",
      "theme": "light"
    }
  }
}
```

---

### 5️⃣ جلب معلومات الاشتراك

**Endpoint:** `GET /subscription`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "subscription": {
      "id": "uuid",
      "plan": "premium",
      "status": "active",
      "start_date": "2024-01-01",
      "end_date": "2025-01-01",
      "daysRemaining": 365,
      "features": [...],
      "limits": {...}
    }
  }
}
```

---

### 6️⃣ جلب إعدادات الشركة

**Endpoint:** `GET /config`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "company": {
      "id": "uuid",
      "name": "اسم الشركة",
      "identifier": "company-id",
      "logo": "https://...",
      "primaryColor": "#3B82F6",
      "secondaryColor": "#64748B",
      "theme": "light"
    },
    "settings": {
      "language": "ar",
      "timezone": "Asia/Riyadh",
      "currency": "SAR",
      "dateFormat": "DD/MM/YYYY",
      "notifications": {
        "email": true,
        "sms": false,
        "push": true
      }
    }
  }
}
```

---

### 7️⃣ تحديث إعدادات الشركة

**Endpoint:** `PUT /config`

**Request Body:**
```json
{
  "settings": {
    "language": "ar",
    "timezone": "Asia/Riyadh",
    "currency": "SAR",
    "notifications": {
      "email": true,
      "sms": true,
      "push": true
    }
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "تم تحديث الإعدادات بنجاح",
  "data": {
    "settings": {...}
  }
}
```

---

### 8️⃣ تسجيل خروج

**Endpoint:** `POST /logout`

**الوصف:** تسجيل خروج وإلغاء جميع Refresh Tokens

**Success Response (200):**
```json
{
  "success": true,
  "message": "تم تسجيل الخروج بنجاح",
  "data": null
}
```

---

### 9️⃣ التحقق من صلاحية Token

**Endpoint:** `GET /validate`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token صالح",
  "data": {
    "valid": true,
    "companyId": "uuid"
  }
}
```

---

### 🔟 جلب حدود الاستخدام

**Endpoint:** `GET /usage`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "limits": {
      "maxUsers": 50,
      "maxProducts": 10000,
      "maxInvoices": 50000,
      "maxWarehouses": 10,
      "maxCustomers": 5000,
      "maxSuppliers": 1000
    },
    "current": {
      "users": 0,
      "products": 0,
      "invoices": 0,
      "warehouses": 0,
      "customers": 0,
      "suppliers": 0
    }
  }
}
```

---

### 1️⃣1️⃣ فحص حالة الاشتراك

**Endpoint:** `GET /subscription/status`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "isValid": true,
    "status": "active",
    "daysRemaining": 365,
    "endDate": "2025-01-01"
  }
}
```

---

## ❌ Error Responses

### Format:

```json
{
  "success": false,
  "message": "رسالة الخطأ",
  "errors": [] // optional
}
```

### Status Codes:

| Code | الوصف |
|------|-------|
| 200 | Success |
| 400 | Bad Request - خطأ في البيانات |
| 401 | Unauthorized - غير مصرح |
| 403 | Forbidden - ممنوع |
| 404 | Not Found - غير موجود |
| 409 | Conflict - تعارض |
| 429 | Too Many Requests - عدد كبير من الطلبات |
| 500 | Server Error - خطأ في الخادم |

---

## 🔐 Authentication Flow

```
1. User enters identifier
   ↓
2. Frontend calls POST /verify
   ↓
3. User enters password
   ↓
4. Frontend calls POST /login
   ↓
5. Backend returns tokens
   ↓
6. Frontend saves tokens
   ↓
7. Frontend uses accessToken for all requests
   ↓
8. When accessToken expires
   ↓
9. Frontend calls POST /refresh
   ↓
10. Backend returns new tokens
```

---

## 🛡️ Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/verify` | 10 requests / 5 min |
| `/login` | 5 requests / 15 min |
| `/refresh` | 30 requests / 1 min |
| Other endpoints | 30 requests / 1 min |

---

## 📝 Notes

- جميع التواريخ بصيغة ISO 8601
- جميع الاستجابات بصيغة JSON
- Token expiry بالثواني
- يجب استخدام HTTPS في Production
- Rate limiting يمكن تعديله من `.env`

---

**تم التطوير بواسطة: MiniMax Agent**
