-- ========================================================
-- AUTO CASH Supabase Schema & Initial Data
-- Instructions: Copy and run this script in the Supabase SQL Editor.
-- ========================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  total_spent NUMERIC NOT NULL DEFAULT 0,
  vip_tier TEXT NOT NULL DEFAULT 'vip1',
  role TEXT NOT NULL DEFAULT 'user',
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_email TEXT,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  package_title TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  target_account TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Deposits Table
CREATE TABLE IF NOT EXISTS public.deposits (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'شامكەش (Sham Cash)',
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  date TEXT NOT NULL,
  tx_id TEXT,
  reviewed_at TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  admin_pin TEXT NOT NULL DEFAULT '9960996',
  shamcash_address TEXT NOT NULL DEFAULT 'efe8a2b200d66411c7c7e296369cbba8',
  whatsapp_number TEXT NOT NULL DEFAULT '+963 984 373 459',
  telegram_username TEXT NOT NULL DEFAULT 'autocash_UYGHUR',
  site_name TEXT NOT NULL DEFAULT 'AUTO CASH',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_email ON public.orders(user_email);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON public.deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON public.deposits(status);

-- Enable Row Level Security (RLS) & open public policy for anon/service key
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Full Access Users" ON public.users;
CREATE POLICY "Public Full Access Users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Full Access Orders" ON public.orders;
CREATE POLICY "Public Full Access Orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Full Access Deposits" ON public.deposits;
CREATE POLICY "Public Full Access Deposits" ON public.deposits FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Full Access Settings" ON public.system_settings;
CREATE POLICY "Public Full Access Settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

-- 5. Seed Default Data (Safe with ON CONFLICT)
INSERT INTO public.system_settings (id, admin_pin, shamcash_address, whatsapp_number, telegram_username, site_name)
VALUES (
  'global',
  '9960996',
  'efe8a2b200d66411c7c7e296369cbba8',
  '+963 984 373 459',
  'autocash_UYGHUR',
  'AUTO CASH'
)
ON CONFLICT (id) DO UPDATE SET
  shamcash_address = EXCLUDED.shamcash_address,
  admin_pin = EXCLUDED.admin_pin;

-- Seed Admin User (Password: admin2026)
INSERT INTO public.users (
  id,
  name,
  email,
  phone,
  password_hash,
  salt,
  balance,
  total_spent,
  vip_tier,
  role,
  is_banned,
  created_at
)
VALUES (
  'USR-1170',
  'Killer 0996',
  'dronemax0996@gmail.com',
  '+963 984 373 459',
  '546f466d4d7f758342769a1a9c33b261741856208a94ab9a4ee38f31df1d7ea7bf533f4849578aa5f477082f998eb28dabd45bd6acde0428ed8435e4b552f2c9',
  'bea28beefea99d1d09165aeed8cb61f5',
  120.50,
  45.00,
  'vip2',
  'admin',
  false,
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Seed Sample Customer
INSERT INTO public.users (
  id,
  name,
  email,
  phone,
  password_hash,
  salt,
  balance,
  total_spent,
  vip_tier,
  role,
  is_banned,
  created_at
)
VALUES (
  'USR-1171',
  'خېرىدار',
  'client@autocash.shop',
  '+963 999 123 456',
  '03c809e0750fc3ae754c0e6417774136423984b655979d3434676579fc68a05c31fdf790eb72df3b9da1ca719ba488d55d28a30f365ae763548e6580f55b1182',
  '0343a41ba16198bb6e87f8aa8b665c82',
  25.00,
  12.50,
  'vip1',
  'user',
  false,
  NOW()
)
ON CONFLICT (email) DO NOTHING;
