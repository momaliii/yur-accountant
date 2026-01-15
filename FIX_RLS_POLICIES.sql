-- ============================================
-- Script لإصلاح RLS Policies
-- ============================================
-- قم بتشغيل هذا إذا كانت الجداول تظهر "UNRESTRICTED"
-- هذا يعني أن RLS غير مفعل أو Policies غير موجودة

-- 1. تفعيل RLS على جميع الجداول
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. حذف Policies القديمة (إذا كانت موجودة)
DROP POLICY IF EXISTS "Plans are viewable by everyone" ON plans;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;

-- 3. إنشاء Policies جديدة

-- Plans: Public read access (everyone can see plans)
CREATE POLICY "Plans are viewable by everyone" ON plans
  FOR SELECT
  USING (true);

-- Subscriptions: Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Sessions: Users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Audit logs: Users can only see their own audit logs
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- ملاحظة مهمة:
-- ============================================
-- Server يستخدم Service Role Key الذي يتجاوز RLS
-- لذلك Server يمكنه الوصول لجميع البيانات
-- Frontend يستخدم Anon Key الذي يخضع لـ RLS
-- لذلك Frontend يمكنه فقط رؤية بياناته الخاصة
-- ============================================
