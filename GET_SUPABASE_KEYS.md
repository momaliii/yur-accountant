# كيفية الحصول على Supabase Keys

## نظرة عامة

تحتاج إلى 3 مفاتيح من Supabase:
1. **SUPABASE_URL** - رابط المشروع
2. **SUPABASE_ANON_KEY** - المفتاح العام (لـ Frontend)
3. **SUPABASE_SERVICE_ROLE_KEY** - المفتاح السري (لـ Server) ⚠️

---

## الخطوات التفصيلية

### 1. افتح Supabase Dashboard

1. اذهب إلى [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. سجل الدخول إلى حسابك
3. اختر مشروعك

### 2. افتح Settings → API

1. من القائمة الجانبية، اضغط على **"Settings"** (⚙️)
2. اضغط على **"API"** من القائمة الفرعية

### 3. احصل على Keys

ستجد قسمين رئيسيين:

#### 📍 **Project URL** (في أعلى الصفحة)
```
https://xxxxx.supabase.co
```
- هذا هو **SUPABASE_URL**
- انسخه كاملاً

#### 🔓 **Publishable key** (المفتاح العام)
```
sb_publishable_K2kqSNd4pBmH50vgeSkdCQ_JHm25...
```
- هذا هو **SUPABASE_ANON_KEY** (أو **SUPABASE_PUBLISHABLE_KEY**)
- يبدأ بـ `sb_publishable_`
- انسخه كاملاً (اضغط على أيقونة النسخ 📋)
- ✅ آمن للمشاركة في Frontend code
- ✅ يمكن استخدامه في المتصفح إذا كان RLS مفعل

#### 🔐 **Secret keys** (المفاتيح السرية)
```
sb_secret_e-LTB...
```
- هذا هو **SUPABASE_SERVICE_ROLE_KEY**
- يبدأ بـ `sb_secret_`
- قد يكون مخفياً - اضغط على أيقونة العين 👁️ لإظهاره
- انسخه كاملاً (اضغط على أيقونة النسخ 📋)
- ⚠️ **سري جداً - لا تشاركه أبداً!**
- ⚠️ **لا تضعه في Frontend code**
- ✅ استخدمه فقط في Server (Railway)

---

## الصور التوضيحية

### موقع API Settings:
```
Dashboard
  └── Settings (⚙️)
      └── API
          ├── Project URL (في أعلى الصفحة)
          ├── Publishable key (القسم الأول)
          └── Secret keys (القسم الثاني)
              └── default (أو أي اسم آخر)
                  └── اضغط 👁️ لإظهار المفتاح
                      └── اضغط 📋 لنسخه
```

---

## أين تستخدم كل Key؟

### 1. SUPABASE_URL
- ✅ **Frontend** (`.env` أو `vite.config.js`)
- ✅ **Server** (Railway Environment Variables)

### 2. SUPABASE_ANON_KEY
- ✅ **Frontend** (`.env` أو `vite.config.js`)
- ✅ **Server** (Railway Environment Variables) - للـ login فقط

### 3. SUPABASE_SERVICE_ROLE_KEY
- ❌ **لا تضعه في Frontend أبداً!**
- ✅ **Server فقط** (Railway Environment Variables)
- ⚠️ يتجاوز RLS (Row Level Security)
- ⚠️ يمكنه الوصول لجميع البيانات

---

## إضافة Keys في Railway

### الخطوات:

1. **افتح Railway Dashboard**
   - [https://railway.app/dashboard](https://railway.app/dashboard)

2. **اختر مشروعك** (`keen-trust`)

3. **افتح Service Settings**
   - اضغط على service `web`
   - اضغط على **"Variables"** tab

4. **أضف Environment Variables**

اضغط على **"+ New Variable"** وأضف:

```env
SUPABASE_URL=https://xxxxx.supabase.co
```

```env
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```env
JWT_SECRET=your-super-secret-jwt-key-here
```

5. **Redeploy**
   - بعد إضافة جميع المتغيرات
   - اضغط على **"Deployments"**
   - اضغط على **"..."** → **"Redeploy"**

---

## إضافة Keys في Frontend (.env)

إذا كنت تريد إضافة Keys في Frontend (للتطوير المحلي):

1. أنشئ ملف `.env` في جذر المشروع:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **لا تضف SERVICE_ROLE_KEY في `.env` - Frontend لا يحتاجه!**

---

## التحقق من Keys

### في Supabase Dashboard:
- ✅ Project URL يبدأ بـ `https://`
- ✅ anon key يبدأ بـ `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
- ✅ service_role key يبدأ بـ `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`

### في Railway:
- ✅ جميع المتغيرات موجودة
- ✅ لا توجد أخطاء في Logs
- ✅ Server يعمل بدون أخطاء

---

## أمان Keys

### ✅ DO (افعل):
- ✅ استخدم Service Role Key فقط في Server
- ✅ استخدم Anon Key في Frontend
- ✅ احفظ Keys في Environment Variables
- ✅ استخدم Railway Secrets (مشفرة)

### ❌ DON'T (لا تفعل):
- ❌ لا تشارك Service Role Key أبداً
- ❌ لا تضع Service Role Key في Frontend code
- ❌ لا ترفع Keys إلى GitHub
- ❌ لا تشارك Keys في رسائل أو محادثات

---

## استكشاف الأخطاء

### خطأ: "Supabase not configured"
- تحقق من أن `SUPABASE_URL` و `SUPABASE_SERVICE_ROLE_KEY` موجودة في Railway
- تحقق من أن Keys صحيحة (انسخها كاملة)

### خطأ: "Invalid API key"
- تحقق من أنك نسخت Key كاملاً (بدون مسافات)
- تحقق من أن Key صحيح من Supabase Dashboard

### خطأ: "Permission denied"
- تحقق من أن Server يستخدم Service Role Key (ليس Anon Key)
- تحقق من RLS Policies في Supabase

---

## ملخص سريع

1. **افتح Supabase Dashboard** → Settings → API
2. **انسخ Project URL** → `SUPABASE_URL`
3. **انسخ anon public key** → `SUPABASE_ANON_KEY`
4. **انسخ service_role key** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️
5. **أضفهم في Railway** → Variables tab
6. **Redeploy** → Server

---

**آخر تحديث**: يناير 2025
