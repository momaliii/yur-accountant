# إصلاح خطأ "Failed to fetch" في Login

## المشكلة

عند محاولة تسجيل الدخول، تظهر رسالة خطأ:
```
Failed to fetch
```

## السبب

Frontend يحاول الاتصال بـ `http://localhost:3000` لكن Server يعمل على Railway.

## الحل

### الطريقة 1: إضافة Environment Variable في Frontend (موصى به)

1. **أنشئ ملف `.env`** في جذر المشروع (إذا لم يكن موجوداً)

2. **أضف Railway URL (بدون `/api`):**
   ```env
   VITE_API_URL=https://web-production-9522e.up.railway.app
   ```
   
   ⚠️ **مهم:** لا تضيف `/api` في النهاية - الكود يضيفه تلقائياً!

3. **أعد تشغيل Development Server:**
   ```bash
   # أوقف Server (Ctrl+C)
   npm run dev
   ```

4. **جرب تسجيل الدخول مرة أخرى**

---

### الطريقة 2: تحديث vite.config.js

إذا كنت تريد إعدادات دائمة:

1. **افتح `vite.config.js`**

2. **أضف أو عدّل:**
   ```javascript
   export default defineConfig({
     // ... existing config
     define: {
       'import.meta.env.VITE_API_URL': JSON.stringify(
         process.env.VITE_API_URL || 'https://web-production-9522e.up.railway.app'
       ),
     },
   });
   ```

3. **أعد تشغيل Server**

---

### الطريقة 3: استخدام .env.local (للتطوير المحلي)

إذا كنت تريد استخدام Server محلي:

1. **أنشئ `.env.local`:**
   ```env
   VITE_API_URL=http://localhost:3000
   ```

2. **تأكد من أن Server المحلي يعمل:**
   ```bash
   npm run server
   ```

3. **أعد تشغيل Frontend:**
   ```bash
   npm run dev
   ```

---

## التحقق من الإعداد

### 1. تحقق من Railway URL

- افتح Railway Dashboard
- مشروعك → service `web`
- انسخ URL من **"Settings"** → **"Domains"**
- يجب أن يكون مثل: `https://web-production-9522e.up.railway.app`

### 2. تحقق من أن Server يعمل

- افتح Railway Dashboard → **"Deployments"**
- تأكد من أن آخر deployment **"Successful"**
- افتح **"Deploy Logs"** وتأكد من عدم وجود أخطاء

### 3. اختبر API مباشرة

افتح في المتصفح:
```
https://web-production-9522e.up.railway.app/health
```

يجب أن ترى:
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

---

## استكشاف الأخطاء

### خطأ: "Failed to fetch"
- ✅ تحقق من أن `VITE_API_URL` صحيح في `.env`
- ✅ تحقق من أن Server يعمل على Railway
- ✅ تحقق من CORS settings في Server

### خطأ: "Network error"
- ✅ تحقق من اتصال الإنترنت
- ✅ تحقق من أن Railway URL صحيح
- ✅ جرب فتح URL مباشرة في المتصفح

### خطأ: "CORS error"
- ✅ تحقق من `CORS_ORIGIN` في Railway Environment Variables
- ✅ أضف Frontend URL في `CORS_ORIGIN`

---

## إعدادات CORS في Railway

إذا كنت تحصل على CORS error:

1. **افتح Railway → Variables**
2. **أضف:**
   ```env
   CORS_ORIGIN=https://your-frontend-domain.com,http://localhost:5173
   ```
   أو للسماح للجميع (للتطوير فقط):
   ```env
   CORS_ORIGIN=*
   ```

3. **Redeploy**

---

## ملخص سريع

1. ✅ **أنشئ `.env`** في جذر المشروع
2. ✅ **أضف:** `VITE_API_URL=https://web-production-9522e.up.railway.app`
3. ✅ **أعد تشغيل:** `npm run dev`
4. ✅ **جرب تسجيل الدخول**

---

**آخر تحديث**: يناير 2025
