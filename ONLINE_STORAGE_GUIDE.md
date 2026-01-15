# دليل التخزين الأونلاين

## نظرة عامة

التطبيق يستخدم **Supabase** كحل التخزين الأونلاين الافتراضي مع المزامنة التلقائية.

## الميزات

### ✅ المزامنة التلقائية
- البيانات تُزامن تلقائياً عند إنشاء/تعديل/حذف
- المزامنة تحدث في الخلفية ولا تعطل واجهة المستخدم
- دعم Offline: البيانات تُحفظ محلياً وتُزامن لاحقاً

### ✅ المزامنة الدورية
- مزامنة تلقائية كل X دقائق (افتراضي: 5 دقائق)
- قابلة للتخصيص من الإعدادات

### ✅ حل التعارضات (Conflict Resolution)
- التعامل التلقائي مع التعديلات المتزامنة
- استراتيجيات متعددة: Last Write Wins, Server Wins, Client Wins, Merge

### ✅ دعم Multi-Device
- الوصول للبيانات من أي جهاز بعد تسجيل الدخول
- المزامنة التلقائية بين الأجهزة

---

## إعداد Supabase (مطلوب)

### الخطوة 1: إنشاء مشروع Supabase

1. اذهب إلى [supabase.com](https://supabase.com)
2. أنشئ حساب جديد أو سجل الدخول
3. أنشئ مشروع جديد
4. احفظ:
   - **Project URL** (مثل: `https://xxxxx.supabase.co`)
   - **Anon Key** (من Settings > API)

### الخطوة 2: إعداد الجداول

قم بإنشاء الجداول التالية في Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  payment_model TEXT,
  currency TEXT,
  rating INTEGER,
  risk_level TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Income table
CREATE TABLE income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  client_id UUID REFERENCES clients(id),
  amount DECIMAL NOT NULL,
  currency TEXT,
  payment_method TEXT,
  received_date DATE,
  is_deposit BOOLEAN DEFAULT FALSE,
  is_fixed_portion_only BOOLEAN DEFAULT FALSE,
  tax_category TEXT,
  is_taxable BOOLEAN DEFAULT TRUE,
  tax_rate DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  client_id UUID REFERENCES clients(id),
  amount DECIMAL NOT NULL,
  currency TEXT,
  category TEXT,
  date DATE NOT NULL,
  description TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  parent_recurring_id UUID,
  tax_category TEXT,
  is_tax_deductible BOOLEAN DEFAULT FALSE,
  tax_rate DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Debts table
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  party_name TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  currency TEXT,
  due_date DATE,
  status TEXT,
  paid_amount DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals table
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  target_amount DECIMAL NOT NULL,
  current_amount DECIMAL DEFAULT 0,
  period TEXT,
  period_value TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  client_id UUID REFERENCES clients(id),
  invoice_number TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  currency TEXT,
  issue_date DATE,
  due_date DATE,
  status TEXT,
  items JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Todos table
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  list_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT,
  category TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lists table
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Savings table
CREATE TABLE savings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  currency TEXT,
  initial_amount DECIMAL DEFAULT 0,
  current_amount DECIMAL DEFAULT 0,
  target_amount DECIMAL,
  target_date DATE,
  interest_rate DECIMAL,
  maturity_date DATE,
  start_date DATE,
  quantity DECIMAL,
  price_per_unit DECIMAL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Savings Transactions table
CREATE TABLE savings_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  savings_id UUID REFERENCES savings(id),
  type TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  currency TEXT,
  date DATE NOT NULL,
  price_per_unit DECIMAL,
  quantity DECIMAL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opening Balances table
CREATE TABLE opening_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  period_type TEXT NOT NULL,
  period TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  currency TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_type, period)
);

-- Expected Income table
CREATE TABLE expected_income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  client_id UUID REFERENCES clients(id),
  period TEXT NOT NULL,
  expected_amount DECIMAL NOT NULL,
  currency TEXT,
  notes TEXT,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, client_id, period)
);

-- Enable Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE opening_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE expected_income ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow users to access only their own data)
-- Note: This requires storing user_id from MongoDB in Supabase
CREATE POLICY "Users can view own clients" ON clients FOR SELECT USING (user_id = current_setting('app.user_id', true));
CREATE POLICY "Users can insert own clients" ON clients FOR INSERT WITH CHECK (user_id = current_setting('app.user_id', true));
CREATE POLICY "Users can update own clients" ON clients FOR UPDATE USING (user_id = current_setting('app.user_id', true));
CREATE POLICY "Users can delete own clients" ON clients FOR DELETE USING (user_id = current_setting('app.user_id', true));

-- Repeat for other tables...
-- (For simplicity, you can use a service role key for now, but RLS is recommended for production)
```

### الخطوة 3: إعداد متغيرات البيئة

أضف في ملف `.env` أو في إعدادات Vite:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### الخطوة 4: التحقق من الإعداد

Supabase هو الافتراضي ولا يحتاج تفعيل إضافي. تأكد من:
1. إضافة متغيرات البيئة (`VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY`)
2. إنشاء الجداول في Supabase
3. تسجيل الدخول في التطبيق

---

## المزامنة الدورية

### تفعيل/تعطيل المزامنة الدورية

```javascript
// تفعيل المزامنة الدورية (كل 5 دقائق)
localStorage.setItem('periodicSyncEnabled', 'true');
localStorage.setItem('periodicSyncIntervalMinutes', '5');

// تعطيل المزامنة الدورية
localStorage.setItem('periodicSyncEnabled', 'false');
```

### تغيير الفترة

```javascript
// مزامنة كل 10 دقائق
localStorage.setItem('periodicSyncIntervalMinutes', '10');

// مزامنة كل دقيقة (للتجربة)
localStorage.setItem('periodicSyncIntervalMinutes', '1');
```

---

## حل التعارضات (Conflict Resolution)

### الاستراتيجيات المتاحة

1. **Last Write Wins** (افتراضي) - يستخدم النسخة الأحدث بناءً على timestamp
2. **Server Wins** - دائماً يستخدم نسخة الخادم
3. **Client Wins** - دائماً يستخدم النسخة المحلية
4. **Merge** - دمج ذكي للنسختين
5. **Manual** - يتطلب قرار يدوي من المستخدم

### تغيير الاستراتيجية

```javascript
import conflictResolution from './services/sync/conflictResolution.js';

// استخدام Last Write Wins
conflictResolution.setDefaultStrategy('last_write_wins');

// استخدام Server Wins
conflictResolution.setDefaultStrategy('server_wins');

// استخدام Client Wins
conflictResolution.setDefaultStrategy('client_wins');

// استخدام Merge
conflictResolution.setDefaultStrategy('merge');

// استخدام Manual (يتطلب قرار يدوي)
conflictResolution.setDefaultStrategy('manual');
```

### تفعيل Conflict Resolution في المزامنة

```javascript
// تفعيل conflict resolution في المزامنة الدورية
localStorage.setItem('useConflictResolution', 'true');

// تعطيل
localStorage.setItem('useConflictResolution', 'false');
```

### استخدام Conflict Resolution يدوياً

```javascript
import syncService from './services/sync/syncService.js';

// مزامنة مع conflict resolution
const result = await syncService.syncWithConflictResolution();

if (result.conflicts > 0) {
  console.log(`تم حل ${result.conflicts} تعارض`);
  console.log('تفاصيل التعارضات:', result.conflictsDetails);
}
```

---

## API Reference

### Sync Service

```javascript
import syncService from './services/sync/syncService.js';

// المزامنة الكاملة (بدون conflict resolution)
await syncService.fullSync();

// المزامنة الكاملة (مع conflict resolution)
await syncService.fullSync(true);

// المزامنة من الخادم
await syncService.syncFromServer();

// المزامنة إلى الخادم
await syncService.syncToServer();

// المزامنة مع conflict resolution
await syncService.syncWithConflictResolution();

// بدء المزامنة الدورية
syncService.startPeriodicSync(5); // كل 5 دقائق

// إيقاف المزامنة الدورية
syncService.stopPeriodicSync();

// الحصول على حالة المزامنة
const status = syncService.getSyncStatus();
```

### Conflict Resolution Service

```javascript
import conflictResolution from './services/sync/conflictResolution.js';

// حل تعارض واحد
const resolution = conflictResolution.resolveConflict(
  localData,
  serverData,
  'client',
  'last_write_wins'
);

// اكتشاف التعارضات
const conflicts = conflictResolution.detectConflicts(
  localClients,
  serverClients,
  'clients'
);

// تغيير الاستراتيجية الافتراضية
conflictResolution.setDefaultStrategy('server_wins');
```

### Supabase Sync Service

```javascript
import supabaseSync from './services/supabase/supabaseSync.js';

// التحقق من التوفر
if (supabaseSync.isAvailable()) {
  // مزامنة entity واحد
  await supabaseSync.syncEntity('client', 'add', clientData);
  
  // مزامنة كل البيانات من Supabase
  await supabaseSync.syncFromSupabase();
}
```

---

## ملاحظات مهمة

1. **الأمان**: تأكد من استخدام Row Level Security (RLS) في Supabase للإنتاج
2. **النسخ الاحتياطي**: البيانات تُحفظ في مكانين: محلياً (IndexedDB) وأونلاين (Supabase)
3. **Offline Mode**: عند عدم وجود اتصال، البيانات تُحفظ محلياً وتُزامن تلقائياً عند عودة الاتصال
4. **Performance**: المزامنة تحدث في الخلفية ولا تعطل واجهة المستخدم

---

## استكشاف الأخطاء

### البيانات لا تُزامن

1. تحقق من تسجيل الدخول
2. تحقق من الاتصال بالإنترنت
3. تحقق من Console للأخطاء
4. تحقق من إعدادات Supabase (`VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY`)

### Supabase لا يعمل

1. تحقق من متغيرات البيئة (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
2. تحقق من إنشاء الجداول في Supabase
3. تحقق من RLS policies
4. تحقق من Console للأخطاء

### التعارضات لا تُحل

1. تحقق من تفعيل `useConflictResolution`
2. تحقق من الاستراتيجية المختارة
3. راجع `conflictsDetails` في نتيجة المزامنة

---

**آخر تحديث**: يناير 2025
