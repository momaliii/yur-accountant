-- ============================================
-- Supabase Tables for Server
-- ============================================
-- هذا الملف يحتوي على SQL scripts لإنشاء الجداول المطلوبة للـ Server
-- قم بتشغيل هذا الملف في Supabase SQL Editor
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PLANS TABLE (مطلوب)
-- ============================================
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

-- Indexes for plans
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON plans(is_active);
CREATE INDEX IF NOT EXISTS idx_plans_sort_order ON plans(sort_order);
CREATE INDEX IF NOT EXISTS idx_plans_slug ON plans(slug);

-- ============================================
-- 2. SUBSCRIPTIONS TABLE (مطلوب)
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- References Supabase Auth users
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

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);

-- ============================================
-- 3. SESSIONS TABLE (اختياري)
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- References Supabase Auth users
  token TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Auto-cleanup expired sessions (optional trigger)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. AUDIT_LOGS TABLE (اختياري)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID, -- References Supabase Auth users (nullable for system actions)
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);

-- ============================================
-- ROW LEVEL SECURITY (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

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
-- TRIGGERS for updated_at
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA (Optional - Default Plans)
-- ============================================

-- Insert default plans if they don't exist
INSERT INTO plans (name, slug, description, price, currency, features, limits, is_active, is_default, trial_days, sort_order)
VALUES 
  (
    'Free',
    'free',
    'Perfect for getting started. Basic features with limited usage.',
    '{"monthly": 0, "yearly": 0}'::jsonb,
    'USD',
    '[
      {"name": "Basic Dashboard", "included": true},
      {"name": "Client Management", "included": true, "limit": 5},
      {"name": "Income Tracking", "included": true, "limit": 50},
      {"name": "Expense Tracking", "included": true, "limit": 50},
      {"name": "Basic Reports", "included": true}
    ]'::jsonb,
    '{
      "clients": 5,
      "incomeEntries": 50,
      "expenseEntries": 50,
      "invoices": 10,
      "storage": 100,
      "apiCalls": 1000
    }'::jsonb,
    true,
    true,
    0,
    1
  ),
  (
    'Basic',
    'basic',
    'For growing businesses. More features and higher limits.',
    '{"monthly": 5, "yearly": 50}'::jsonb,
    'USD',
    '[
      {"name": "Full Dashboard", "included": true},
      {"name": "Unlimited Clients", "included": true},
      {"name": "Unlimited Income Tracking", "included": true},
      {"name": "Unlimited Expense Tracking", "included": true},
      {"name": "Advanced Reports", "included": true},
      {"name": "Invoice Management", "included": true},
      {"name": "Goal Tracking", "included": true},
      {"name": "Savings Management", "included": true},
      {"name": "Priority Support", "included": true}
    ]'::jsonb,
    '{
      "clients": null,
      "incomeEntries": null,
      "expenseEntries": null,
      "invoices": null,
      "storage": 1000,
      "apiCalls": 10000
    }'::jsonb,
    true,
    false,
    14,
    2
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- DONE!
-- ============================================
-- تم إنشاء جميع الجداول بنجاح
-- يمكنك الآن استخدام Server مع Supabase
-- ============================================
