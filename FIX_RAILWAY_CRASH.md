# إصلاح مشكلة Crash في Railway

## المشكلة

Server في Railway يتعطل مع الخطأ:
```
MongoDB connection error: MongooseServerSelectionError: connect ECONNREFUSED ::1:27017
```

## السبب

Railway يستخدم **كود قديم** لا يزال يحاول الاتصال بـ MongoDB.

## الحل

### الخطوة 1: تأكد من رفع التحديثات إلى GitHub

✅ تم رفع التحديثات إلى GitHub بنجاح.

### الخطوة 2: Redeploy في Railway

1. **افتح Railway Dashboard**
   - [https://railway.app/dashboard](https://railway.app/dashboard)
   - اختر مشروعك (`keen-trust`)

2. **افتح Deployments**
   - اضغط على service `web`
   - اضغط على **"Deployments"** tab

3. **Redeploy**
   - اضغط على **"..."** بجانب آخر deployment
   - اختر **"Redeploy"**
   - أو اضغط على **"Deploy"** → **"Redeploy"**

### الخطوة 3: تحقق من Environment Variables

قبل Redeploy، تأكد من إضافة Environment Variables:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
JWT_SECRET=your-secret-key
```

**الموقع:**
- Railway Dashboard → service `web` → **"Variables"** tab

### الخطوة 4: تحقق من Logs

بعد Redeploy، تحقق من Logs:

**يجب أن ترى:**
```
Supabase connected successfully
```

**لا يجب أن ترى:**
```
MongoDB connection error
```

---

## إذا استمرت المشكلة

### 1. تحقق من آخر Commit في GitHub

- تأكد من أن آخر commit يحتوي على التحديثات
- Commit hash: `7d32221` أو أحدث

### 2. Force Redeploy

- في Railway → Deployments
- اضغط على **"..."** → **"Redeploy"**
- أو احذف deployment القديم وأنشئ واحد جديد

### 3. تحقق من Build Logs

- في Railway → Deployments → آخر deployment
- اضغط على **"Build Logs"**
- تأكد من أن Build نجح بدون أخطاء

### 4. تحقق من Deploy Logs

- في Railway → Deployments → آخر deployment
- اضغط على **"Deploy Logs"**
- ابحث عن أخطاء في بداية التشغيل

---

## ملاحظات مهمة

### ⚠️ Environment Variables مطلوبة

بدون Environment Variables التالية، Server سيفشل:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`

### ✅ الكود محدث

الكود المحلي محدث ولا يستخدم MongoDB. المشكلة فقط في Railway الذي يستخدم كود قديم.

---

## الخطوات السريعة

1. ✅ **GitHub**: تم رفع التحديثات
2. ⏳ **Railway**: قم بـ Redeploy
3. ⏳ **Environment Variables**: تأكد من إضافتها
4. ⏳ **Logs**: تحقق من أن Server يعمل

---

**آخر تحديث**: يناير 2025
