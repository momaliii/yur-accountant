# فحص إعداد Supabase

> **لحذف البيانات القديمة من Supabase**: راجع `SUPABASE_DELETE_DATA.md`

## الخطوات للتحقق من أن كل شيء يعمل:

### 1. تأكد من ملف `.env`

أنشئ ملف `.env` في المجلد الرئيسي مع:

```env
VITE_SUPABASE_URL=https://sktuvfvylxxbossjmasq.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_K2kqSNd4pBmH50vgeSkdCQ_JHm25tHH
```

### 2. إعادة تشغيل خادم التطوير

```bash
# أوقف الخادم الحالي (Ctrl+C)
npm run dev
```

### 3. التحقق من Console

افتح Console المتصفح (F12) وتحقق من:

✅ **يجب أن ترى:**
- لا توجد رسالة "Supabase credentials not configured"
- عند تسجيل الدخول: "User authenticated, syncing from server..."
- "Sync from server successful" (إذا كان هناك بيانات في Supabase)

❌ **إذا رأيت:**
- "Supabase not configured" → تحقق من ملف `.env` وأعد تشغيل الخادم
- "Supabase sync failed" → تحقق من:
  - الجداول موجودة في Supabase
  - RLS policies صحيحة
  - user_id موجود في البيانات

### 4. اختبار المزامنة

1. **سجل الدخول** في التطبيق
2. **أنشئ عميل جديد** (أو أي بيانات)
3. **افتح Console** وتحقق من:
   - "Background sync error" لا يظهر
   - البيانات تظهر في Supabase Dashboard

### 5. التحقق من Supabase Dashboard

1. اذهب إلى Supabase Dashboard
2. افتح **Table Editor**
3. تحقق من أن الجداول موجودة
4. عند إنشاء بيانات في التطبيق، يجب أن تظهر في الجداول

### 6. اختبار Multi-Device

1. **جهاز 1**: سجل الدخول وأنشئ بيانات
2. **جهاز 2**: سجل الدخول بنفس الحساب
3. **النتيجة المتوقعة**: البيانات تظهر تلقائياً على الجهاز 2

---

## استكشاف الأخطاء

### المشكلة: "Supabase not configured"

**الحل:**
1. تحقق من ملف `.env` موجود في المجلد الرئيسي
2. تحقق من القيم صحيحة (بدون مسافات إضافية)
3. أعد تشغيل خادم التطوير

### المشكلة: "Error syncing to Supabase"

**الحل:**
1. تحقق من Console للأخطاء التفصيلية
2. تحقق من RLS policies في Supabase
3. تأكد من أن `user_id` يُضاف للبيانات

### المشكلة: البيانات لا تظهر في Supabase

**الحل:**
1. تحقق من Console للأخطاء
2. تحقق من أن الجداول موجودة
3. تحقق من RLS policies تسمح بالكتابة
4. تحقق من أن `user_id` موجود في البيانات

---

## ملاحظات مهمة

1. **RLS Policies**: تأكد من إعداد Row Level Security بشكل صحيح
2. **user_id**: يجب أن يكون `user_id` موجوداً في كل سجل (يُضاف تلقائياً)
3. **النسخ الاحتياطي**: البيانات تُحفظ في مكانين:
   - محلياً (IndexedDB) - للوصول السريع
   - أونلاين (Supabase) - للوصول من أي جهاز

---

**آخر تحديث**: يناير 2025
