# Frontend Environment Variables Setup

## Required Environment Variables

لتفعيل Supabase sync في الـ frontend، يجب إضافة متغيرات البيئة التالية:

### 1. إنشاء ملف `.env` في root directory

أنشئ ملف `.env` في نفس المجلد الذي يحتوي على `package.json`:

```bash
# Frontend Environment Variables

# Supabase Configuration (Required for online sync)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API URL (Backend server)
VITE_API_URL=https://web-production-9522e.up.railway.app/api

# App Version (Optional)
VITE_APP_VERSION=1.0.0
```

### 2. الحصول على Supabase Keys

1. اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. اختر مشروعك
3. اذهب إلى **Settings** → **API**
4. انسخ:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### 3. مثال على ملف `.env`:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=https://web-production-9522e.up.railway.app/api
```

### 4. إعادة تشغيل Development Server

بعد إضافة المتغيرات، أعد تشغيل الـ dev server:

```bash
npm run dev
```

### ملاحظات مهمة:

- ⚠️ **لا ترفع ملف `.env` إلى GitHub** - يجب أن يكون في `.gitignore`
- ✅ ملف `.env` محلي فقط - لا يؤثر على Railway
- 🔄 بعد تغيير `.env`، يجب إعادة تشغيل الـ dev server

### التحقق من الإعداد:

بعد إضافة المتغيرات وإعادة التشغيل، يجب أن ترى في الـ console:
- ✅ `Supabase connected successfully` (بدلاً من `Supabase not configured`)
- ✅ Sync من الـ server يعمل بدون أخطاء

---

## Troubleshooting

### خطأ: "Supabase not configured"

**الحل:**
1. تأكد من وجود ملف `.env` في root directory
2. تأكد من أن المتغيرات تبدأ بـ `VITE_`
3. أعد تشغيل الـ dev server بعد إضافة المتغيرات

### خطأ: "404 Not Found" للـ API routes

هذه الأخطاء طبيعية - الـ routes التالية معطلة حالياً:
- `/api/notifications/unread-count`
- `/api/dashboard/layout`
- `/api/dashboard/widgets`
- `/api/app/updates/check`

التطبيق سيعمل بشكل طبيعي بدونها. تم تحديث الكود لتجاهل هذه الأخطاء بشكل صامت.
