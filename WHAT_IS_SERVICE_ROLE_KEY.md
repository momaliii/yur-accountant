# ما هو SUPABASE_SERVICE_ROLE_KEY؟

## نظرة عامة

`SUPABASE_SERVICE_ROLE_KEY` هو **مفتاح سري قوي** يمنح Server صلاحيات كاملة للوصول إلى Supabase **بدون قيود**.

---

## الفرق بين Keys

### 1. **SUPABASE_ANON_KEY** (المفتاح العام)
```javascript
// مثال: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**الخصائص:**
- ✅ **آمن للمشاركة** في Frontend code
- ✅ **يخضع لـ RLS** (Row Level Security)
- ✅ **محدود الصلاحيات** - يمكنه فقط الوصول للبيانات المسموح بها
- ✅ **آمن** - حتى لو تم سرقته، لا يمكنه الوصول لجميع البيانات

**الاستخدام:**
- Frontend (React, Vue, etc.)
- Mobile apps
- Public APIs

**مثال:**
```javascript
// Frontend - آمن
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// يمكنه فقط قراءة/كتابة البيانات المسموح بها حسب RLS
```

---

### 2. **SUPABASE_SERVICE_ROLE_KEY** (المفتاح السري)
```javascript
// مثال: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**الخصائص:**
- ⚠️ **سري جداً** - لا تشاركه أبداً!
- ⚠️ **يتجاوز RLS** - يمكنه الوصول لجميع البيانات
- ⚠️ **صلاحيات كاملة** - يمكنه قراءة/كتابة/حذف أي شيء
- ⚠️ **خطير** - إذا تم سرقته، يمكنه الوصول لجميع البيانات

**الاستخدام:**
- Server فقط (Node.js, Python, etc.)
- Backend APIs
- Admin operations
- Server-side authentication

**مثال:**
```javascript
// Server - خطير إذا استُخدم في Frontend!
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
// يمكنه الوصول لجميع البيانات بدون قيود
```

---

## لماذا نحتاج Service Role Key في Server؟

### المشكلة:
Server يحتاج إلى:
1. **إنشاء مستخدمين** (register) - يتطلب صلاحيات إدارية
2. **التحقق من المستخدمين** (login) - يحتاج الوصول لـ Auth
3. **إدارة الاشتراكات** - يحتاج الوصول لجميع الاشتراكات
4. **إدارة Plans** - يحتاج الوصول لجميع الخطط

### الحل:
Service Role Key يعطي Server **صلاحيات إدارية كاملة**:
- ✅ يمكنه إنشاء/تعديل/حذف أي مستخدم
- ✅ يمكنه الوصول لجميع البيانات
- ✅ يمكنه تجاوز RLS policies

---

## مثال عملي

### Scenario: User Registration

#### مع Anon Key (❌ لا يعمل):
```javascript
// Frontend يحاول إنشاء مستخدم
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});
// ✅ يعمل - لكن محدود بصلاحيات المستخدم
```

#### مع Service Role Key (✅ يعمل):
```javascript
// Server ينشئ مستخدم
const { data, error } = await supabase.auth.admin.createUser({
  email: 'user@example.com',
  password: 'password123',
  email_confirm: true // يمكن Server تأكيد البريد تلقائياً
});
// ✅ يعمل - Server لديه صلاحيات إدارية
```

---

## الأمان

### ⚠️ قواعد مهمة:

#### ✅ DO (افعل):
- ✅ استخدم Service Role Key **فقط في Server**
- ✅ احفظه في **Environment Variables** (Railway, Vercel, etc.)
- ✅ **لا ترفعه إلى GitHub** - أضفه في `.gitignore`
- ✅ استخدمه فقط للعمليات الإدارية

#### ❌ DON'T (لا تفعل):
- ❌ **لا تضعه في Frontend code**
- ❌ **لا تشاركه** في رسائل أو محادثات
- ❌ **لا تضعه في `.env`** الذي يُرفع إلى GitHub
- ❌ **لا تستخدمه في Client-side code**

---

## أين أضعه؟

### ✅ في Server (Railway):
```env
# Railway Environment Variables
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### ✅ في Server (Local - .env):
```env
# .env (لا يُرفع إلى GitHub)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### ❌ في Frontend (.env):
```env
# ❌ لا تفعل هذا!
VITE_SUPABASE_SERVICE_ROLE_KEY=... # خطير!
```

---

## كيف أحصل عليه؟

### الخطوات:

1. **افتح Supabase Dashboard**
   - [https://supabase.com/dashboard](https://supabase.com/dashboard)

2. **Settings → API**
   - اضغط على ⚙️ Settings
   - اضغط على API

3. **انسخ Service Role Key**
   - ابحث عن **"service_role"** key
   - انسخه كاملاً

4. **أضفه في Railway**
   - Railway Dashboard → Variables
   - أضف `SUPABASE_SERVICE_ROLE_KEY`

---

## مقارنة سريعة

| الميزة | Anon Key | Service Role Key |
|--------|----------|------------------|
| **الأمان** | ✅ آمن | ⚠️ سري |
| **RLS** | ✅ يخضع لـ RLS | ❌ يتجاوز RLS |
| **الصلاحيات** | محدودة | كاملة |
| **الاستخدام** | Frontend | Server فقط |
| **المشاركة** | ✅ آمن | ❌ لا تشارك |

---

## مثال في الكود

### Server (server/config/supabase.js):
```javascript
// ✅ صحيح - Server يستخدم Service Role Key
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// يمكنه الآن:
await supabase.auth.admin.createUser({...});
await supabase.from('subscriptions').select('*'); // بدون قيود RLS
```

### Frontend (src/services/supabase/supabaseClient.js):
```javascript
// ✅ صحيح - Frontend يستخدم Anon Key
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// محدود بصلاحيات المستخدم و RLS
await supabase.from('clients').select('*').eq('user_id', userId);
```

---

## ملخص

**SUPABASE_SERVICE_ROLE_KEY** هو:
- 🔑 **مفتاح سري** يعطي صلاحيات كاملة
- ⚠️ **خطير** إذا استُخدم في Frontend
- ✅ **مطلوب** في Server للعمليات الإدارية
- 🔒 **يجب حمايته** - لا تشاركه أبداً

**القاعدة الذهبية:**
> Service Role Key = Server فقط
> Anon Key = Frontend

---

**آخر تحديث**: يناير 2025
