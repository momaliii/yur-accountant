# كيفية حذف البيانات القديمة من Supabase

## الطريقة 1: حذف من Supabase Dashboard (الأسهل)

### الخطوات:

1. **افتح Supabase Dashboard**
   - اذهب إلى: https://supabase.com/dashboard
   - اختر مشروعك

2. **افتح Table Editor**
   - من القائمة الجانبية، اضغط على **"Table Editor"**
   - أو اذهب إلى: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor`

3. **اختر الجدول**
   - اختر أي جدول (مثل `clients`, `income`, `expenses`, إلخ)

4. **حذف البيانات**
   - **حذف سجل واحد**: اضغط على السطر، ثم اضغط على أيقونة الحذف (🗑️)
   - **حذف جميع البيانات**: 
     - اضغط على "..." في أعلى الجدول
     - اختر "Delete all rows" أو "Truncate table"
     - ⚠️ **تحذير**: هذا سيحذف جميع البيانات في الجدول!

---

## الطريقة 2: استخدام SQL Editor (لحذف محدد)

### الخطوات:

1. **افتح SQL Editor**
   - من القائمة الجانبية، اضغط على **"SQL Editor"**
   - أو اذهب إلى: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql`

2. **حذف جميع البيانات من جدول محدد**

```sql
-- حذف جميع العملاء
DELETE FROM clients WHERE user_id = 'YOUR_USER_ID';

-- حذف جميع الدخل
DELETE FROM income WHERE user_id = 'YOUR_USER_ID';

-- حذف جميع المصروفات
DELETE FROM expenses WHERE user_id = 'YOUR_USER_ID';

-- حذف جميع الديون
DELETE FROM debts WHERE user_id = 'YOUR_USER_ID';

-- حذف جميع الأهداف
DELETE FROM goals WHERE user_id = 'YOUR_USER_ID';

-- حذف جميع الفواتير
DELETE FROM invoices WHERE user_id = 'YOUR_USER_ID';

-- حذف جميع المهام
DELETE FROM todos WHERE user_id = 'YOUR_USER_ID';

-- حذف جميع القوائم
DELETE FROM lists WHERE user_id = 'YOUR_USER_ID';

-- حذف جميع المدخرات
DELETE FROM savings WHERE user_id = 'YOUR_USER_ID';

-- حذف جميع معاملات المدخرات
DELETE FROM savings_transactions WHERE user_id = 'YOUR_USER_ID';

-- حذف جميع الأرصدة الافتتاحية
DELETE FROM opening_balances WHERE user_id = 'YOUR_USER_ID';

-- حذف جميع الدخل المتوقع
DELETE FROM expected_income WHERE user_id = 'YOUR_USER_ID';
```

3. **حذف جميع البيانات (جميع الجداول)**

```sql
-- حذف جميع البيانات من جميع الجداول
DELETE FROM expected_income WHERE user_id = 'YOUR_USER_ID';
DELETE FROM opening_balances WHERE user_id = 'YOUR_USER_ID';
DELETE FROM savings_transactions WHERE user_id = 'YOUR_USER_ID';
DELETE FROM savings WHERE user_id = 'YOUR_USER_ID';
DELETE FROM lists WHERE user_id = 'YOUR_USER_ID';
DELETE FROM todos WHERE user_id = 'YOUR_USER_ID';
DELETE FROM invoices WHERE user_id = 'YOUR_USER_ID';
DELETE FROM goals WHERE user_id = 'YOUR_USER_ID';
DELETE FROM debts WHERE user_id = 'YOUR_USER_ID';
DELETE FROM expenses WHERE user_id = 'YOUR_USER_ID';
DELETE FROM income WHERE user_id = 'YOUR_USER_ID';
DELETE FROM clients WHERE user_id = 'YOUR_USER_ID';
```

**ملاحظة**: استبدل `'YOUR_USER_ID'` بـ user_id الخاص بك (يمكنك رؤيته في Console المتصفح عند تسجيل الدخول)

---

## الطريقة 3: حذف جميع البيانات (بدون user_id)

إذا أردت حذف **جميع** البيانات من جميع الجداول (لجميع المستخدمين):

```sql
-- ⚠️ تحذير: هذا سيحذف جميع البيانات من جميع المستخدمين!

TRUNCATE TABLE expected_income CASCADE;
TRUNCATE TABLE opening_balances CASCADE;
TRUNCATE TABLE savings_transactions CASCADE;
TRUNCATE TABLE savings CASCADE;
TRUNCATE TABLE lists CASCADE;
TRUNCATE TABLE todos CASCADE;
TRUNCATE TABLE invoices CASCADE;
TRUNCATE TABLE goals CASCADE;
TRUNCATE TABLE debts CASCADE;
TRUNCATE TABLE expenses CASCADE;
TRUNCATE TABLE income CASCADE;
TRUNCATE TABLE clients CASCADE;
```

---

## الطريقة 4: حذف البيانات القديمة فقط (مع MongoDB ObjectIds)

إذا أردت حذف البيانات التي تحتوي على MongoDB ObjectIds (24 حرف) بدلاً من UUIDs:

```sql
-- حذف السجلات التي تحتوي على IDs غير صحيحة (MongoDB ObjectIds)
-- UUIDs الصحيحة تكون 36 حرف مع شرطات: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx

-- حذف العملاء ب IDs غير صحيحة
DELETE FROM clients 
WHERE LENGTH(id::text) != 36 
   OR id::text NOT LIKE '%-%-%-%-%';

-- حذف الدخل ب IDs غير صحيحة
DELETE FROM income 
WHERE LENGTH(id::text) != 36 
   OR id::text NOT LIKE '%-%-%-%-%';

-- حذف المصروفات ب IDs غير صحيحة
DELETE FROM expenses 
WHERE LENGTH(id::text) != 36 
   OR id::text NOT LIKE '%-%-%-%-%';

-- وهكذا لباقي الجداول...
```

---

## بعد الحذف

بعد حذف البيانات القديمة:

1. **أعد تحميل التطبيق**
2. **انتظر حتى يكتمل sync**
3. **تحقق من Supabase Dashboard** - يجب أن ترى البيانات الجديدة مع UUIDs صحيحة

---

## ملاحظات مهمة

- ⚠️ **احتفظ بنسخة احتياطية** قبل الحذف إذا كنت تريد استرجاع البيانات
- ✅ **الحذف آمن** - البيانات المحلية (IndexedDB) لن تتأثر
- 🔄 **بعد الحذف**، سيتم إنشاء سجلات جديدة في Supabase عند sync التالي
- 📝 **user_id**: يمكنك رؤيته في Console المتصفح عند تسجيل الدخول

---

**آخر تحديث**: يناير 2025
