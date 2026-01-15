# إعداد Railway للـ Server

## ✅ تم التحديث: Server الآن يستخدم Supabase فقط!

Server تم تحديثه لاستخدام **Supabase** بدلاً من MongoDB. لا حاجة لـ MongoDB بعد الآن.

## الحل: إضافة Environment Variables في Railway

### الخطوات:

1. **افتح Railway Dashboard**
   - اذهب إلى: https://railway.app/dashboard
   - اختر مشروعك (`keen-trust`)

2. **افتح Service Settings**
   - اضغط على service `web`
   - اضغط على **"Variables"** tab

3. **أضف Environment Variables**

أضف المتغيرات التالية:

```env
# Supabase Configuration (مطلوب)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here

# JWT Secret (لـ authentication)
JWT_SECRET=your-super-secret-jwt-key-here
```

### كيفية الحصول على Supabase Credentials:

1. **افتح Supabase Dashboard**
   - اذهب إلى: https://supabase.com/dashboard
   - اختر مشروعك

2. **احصل على URL و Keys**
   - اضغط على **"Settings"** (⚙️) → **"API"**
   - انسخ **"Project URL"** → هذا هو `SUPABASE_URL`
   - انسخ **"anon" key** → هذا هو `SUPABASE_ANON_KEY`
   - انسخ **"service_role" key** (⚠️ **سرية!**) → هذا هو `SUPABASE_SERVICE_ROLE_KEY`

3. **أضفها في Railway**
   - في Railway → Variables tab
   - أضف `SUPABASE_URL` و `SUPABASE_SERVICE_ROLE_KEY`

---

## متغيرات أخرى قد تحتاجها

```env
# CORS Origin (إذا كان لديك domain محدد)
CORS_ORIGIN=https://yourdomain.com

# Port (افتراضي: 3000)
PORT=3000

# Email Service (إذا كنت تستخدم nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

---

## بعد إضافة المتغيرات

1. **Redeploy** الـ service:
   - اضغط على **"Deployments"**
   - اضغط على **"..."** → **"Redeploy"**

2. **تحقق من Logs**:
   - يجب أن ترى: `Supabase connected successfully`
   - لا يجب أن ترى: `MongoDB connection error` أو `Supabase not configured`

---

## ملاحظات مهمة

- ✅ **Server يستخدم Supabase Auth** للـ authentication (login/register)
- ✅ **Frontend يستخدم Supabase** للـ data storage (لا يمر عبر server)
- ✅ **لا حاجة لـ MongoDB** - تم إزالته تماماً
- ⚠️ **Service Role Key سرية** - لا تشاركها أبداً!

---

## Supabase Tables المطلوبة

تأكد من إنشاء الجداول التالية في Supabase:

1. **`plans`** - للخطط (Free, Basic, etc.)
2. **`subscriptions`** - للاشتراكات
3. **`sessions`** (اختياري) - للجلسات
4. **`audit_logs`** (اختياري) - للسجلات الأمنية

راجع `ONLINE_STORAGE_GUIDE.md` للحصول على SQL scripts لإنشاء الجداول.

---

**آخر تحديث**: يناير 2025
