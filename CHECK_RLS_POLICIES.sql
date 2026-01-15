-- ============================================
-- Script للتحقق من RLS Policies
-- ============================================
-- قم بتشغيل هذا في Supabase SQL Editor للتحقق من RLS

-- 1. التحقق من RLS على الجداول
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('plans', 'subscriptions', 'sessions', 'audit_logs')
ORDER BY tablename;

-- 2. عرض جميع Policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('plans', 'subscriptions', 'sessions', 'audit_logs')
ORDER BY tablename, policyname;

-- 3. إذا كان RLS غير مفعل، قم بتفعيله:
-- ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
