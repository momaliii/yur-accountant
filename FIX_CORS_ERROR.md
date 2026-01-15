# إصلاح خطأ CORS

## المشكلة

```
Access to fetch at 'https://web-production-9522e.up.railway.app/api/auth/login' 
from origin 'http://localhost:5173' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## السبب

Server في Railway لا يسمح للـ Frontend (الذي يعمل على `localhost:5173`) بالاتصال به بسبب CORS policy.

## الحل

### الطريقة 1: إضافة CORS_ORIGIN في Railway (موصى به)

1. **افتح Railway Dashboard**
   - [https://railway.app/dashboard](https://railway.app/dashboard)
   - مشروعك → service `web` → **"Variables"** tab

2. **أضف Environment Variable:**
   ```env
   CORS_ORIGIN=http://localhost:5173,https://your-production-domain.com
   ```
   
   **أو للسماح للجميع (للتطوير فقط):**
   ```env
   CORS_ORIGIN=*
   ```

3. **Redeploy**
   - اضغط على **"Deployments"**
   - اضغط على **"..."** → **"Redeploy"**

---

### الطريقة 2: تحديث Server Code

إذا لم تكن `CORS_ORIGIN` موجودة، Server يستخدم `*` كافتراضي. لكن قد تحتاج إلى تحديث الكود:

**في `server/index.js`:**
```javascript
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
});
```

---

## التحقق من الإعداد

### 1. تحقق من Environment Variables في Railway

يجب أن يكون لديك:
```env
CORS_ORIGIN=http://localhost:5173
```

أو:
```env
CORS_ORIGIN=*
```

### 2. تحقق من Server Logs

بعد Redeploy، افتح **"Deploy Logs"** وتأكد من:
- ✅ Server يعمل بدون أخطاء
- ✅ لا توجد أخطاء CORS

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

## إعدادات CORS الموصى بها

### للتطوير المحلي:
```env
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

### للإنتاج:
```env
CORS_ORIGIN=https://your-production-domain.com
```

### للتطوير والإنتاج معاً:
```env
CORS_ORIGIN=http://localhost:5173,https://your-production-domain.com
```

---

## استكشاف الأخطاء

### خطأ: "No 'Access-Control-Allow-Origin' header"
- ✅ تحقق من أن `CORS_ORIGIN` موجودة في Railway Variables
- ✅ تحقق من أن Server تم Redeploy بعد إضافة المتغير
- ✅ جرب `CORS_ORIGIN=*` للتأكد من أن CORS يعمل

### خطأ: "CORS policy: No 'Access-Control-Allow-Credentials'"
- ✅ تأكد من أن `credentials: true` موجود في CORS config
- ✅ تأكد من أن `CORS_ORIGIN` لا يحتوي على `*` (يجب أن يكون domain محدد)

### خطأ: "Preflight request doesn't pass"
- ✅ تأكد من أن Server يدعم OPTIONS requests
- ✅ تأكد من أن CORS middleware يعمل بشكل صحيح

---

## ملخص سريع

1. ✅ **افتح Railway** → Variables
2. ✅ **أضف:** `CORS_ORIGIN=http://localhost:5173` أو `CORS_ORIGIN=*`
3. ✅ **Redeploy**
4. ✅ **جرب تسجيل الدخول مرة أخرى**

---

**آخر تحديث**: يناير 2025
