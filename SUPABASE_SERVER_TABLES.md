# إنشاء جداول Supabase للـ Server

## نظرة عامة

هذا الدليل يشرح كيفية إنشاء الجداول المطلوبة في Supabase للـ Server.

## الجداول المطلوبة

1. **`plans`** - للخطط (Free, Basic, etc.) - **مطلوب**
2. **`subscriptions`** - للاشتراكات - **مطلوب**
3. **`sessions`** - للجلسات - **اختياري**
4. **`audit_logs`** - للسجلات الأمنية - **اختياري**

---

## الخطوات

### 1. افتح Supabase SQL Editor

1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك
3. اضغط على **"SQL Editor"** من القائمة الجانبية
4. اضغط على **"New query"**

### 2. انسخ والصق SQL Script

افتح ملف `server/supabase_tables.sql` وانسخ كل المحتوى والصقه في SQL Editor.

**أو** انسخ من هنا:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  price JSONB DEFAULT '{"monthly": 0, "yearly": 0}'::jsonb,
  currency TEXT DEFAULT 'USD',
  features JSONB DEFAULT '[]'::jsonb,
  limits JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  is_highlighted BOOLEAN DEFAULT false,
  trial_days INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial', 'past_due')),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  amount DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  auto_renew BOOLEAN DEFAULT true,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table (optional)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table (optional)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON plans(is_active);
CREATE INDEX IF NOT EXISTS idx_plans_slug ON plans(slug);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
```

### 3. تشغيل SQL Script

1. اضغط على **"Run"** أو `Ctrl+Enter` (Windows/Linux) أو `Cmd+Enter` (Mac)
2. انتظر حتى تظهر رسالة **"Success"**

### 4. التحقق من الجداول

1. اضغط على **"Table Editor"** من القائمة الجانبية
2. يجب أن ترى الجداول التالية:
   - `plans`
   - `subscriptions`
   - `sessions` (إذا أضفتها)
   - `audit_logs` (إذا أضفتها)

---

## Row Level Security (RLS)

الـ SQL script يتضمن RLS policies تلقائياً:

- **Plans**: يمكن للجميع قراءتها (public)
- **Subscriptions**: المستخدمون يمكنهم رؤية/تعديل اشتراكاتهم فقط
- **Sessions**: المستخدمون يمكنهم رؤية/حذف جلساتهم فقط
- **Audit Logs**: المستخدمون يمكنهم رؤية سجلاتهم فقط

---

## البيانات الافتراضية

الـ SQL script يقوم تلقائياً بإدراج خطتين افتراضيتين:

1. **Free Plan** - مجاني
2. **Basic Plan** - $5/شهر أو $50/سنة

---

## ملاحظات مهمة

### ⚠️ Service Role Key

- Server يستخدم **Service Role Key** للوصول إلى الجداول
- Service Role Key **يتجاوز RLS** - استخدمه بحذر!
- لا تشارك Service Role Key أبداً

### ✅ Anon Key

- Frontend يستخدم **Anon Key**
- Anon Key **يخضع لـ RLS**
- آمن للمشاركة في Frontend code

### 🔒 Security

- تأكد من تفعيل RLS على جميع الجداول
- راجع RLS policies حسب احتياجاتك
- استخدم Service Role Key فقط في Server

---

## التحقق من الإعداد

بعد إنشاء الجداول، تحقق من:

1. ✅ الجداول موجودة في Table Editor
2. ✅ RLS مفعل على جميع الجداول
3. ✅ Indexes موجودة
4. ✅ Plans الافتراضية موجودة (Free و Basic)

---

## استكشاف الأخطاء

### خطأ: "relation already exists"
- الجدول موجود بالفعل
- استخدم `DROP TABLE IF EXISTS table_name;` ثم أعد التشغيل

### خطأ: "permission denied"
- تأكد من أنك تستخدم Service Role Key في Server
- تحقق من RLS policies

### خطأ: "extension uuid-ossp does not exist"
- Supabase يدعم UUID تلقائياً
- يمكنك إزالة `CREATE EXTENSION` إذا لزم الأمر

---

## الملفات

- **`server/supabase_tables.sql`** - SQL script كامل
- **`SUPABASE_SERVER_TABLES.md`** - هذا الدليل

---

**آخر تحديث**: يناير 2025
