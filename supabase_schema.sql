-- ========================================================
-- AUTO CASH Supabase Schema & Financial Security Hardening
-- Version: 2.0 (Zero Financial Discrepancy & 100% ACID Integrity)
-- Instructions: Copy and run this script in the Supabase SQL Editor.
-- ========================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  total_spent NUMERIC NOT NULL DEFAULT 0,
  vip_tier TEXT NOT NULL DEFAULT 'vip1',
  role TEXT NOT NULL DEFAULT 'user',
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ساندان سەۋىيەسىدە قالدۇق پۇلنىڭ نۆلدىن تۆۋەن چۈشۈپ كېتىشىنى مۇتلەق قۇلۇپلاش
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS check_balance_non_negative;
ALTER TABLE public.users ADD CONSTRAINT check_balance_non_negative CHECK (balance >= 0);

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

-- 5. Create Idempotency Records Table (قوش چەكمە ۋە تەكرار زاكازدىن مۇداپىئەلىنىش)
CREATE TABLE IF NOT EXISTS public.idempotency_records (
  key TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  order_id TEXT,
  response_body JSONB,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_email ON public.orders(user_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON public.deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON public.deposits(status);
CREATE INDEX IF NOT EXISTS idx_idempotency_created_at ON public.idempotency_records(created_at);

-- ========================================================
-- 6. ACID TRANSACTION STORED PROCEDURES (RPC FUNCTIONS)
-- ========================================================

-- A) پۇل تەستىقلاش، قۇلۇپلاش ۋە زاكاز پۈتۈش ACID ترانزاكسىيە فۇنكسىيەسى
CREATE OR REPLACE FUNCTION public.deduct_balance_and_create_order(
  p_idempotency_key TEXT,
  p_user_id TEXT,
  p_user_email TEXT,
  p_service_id TEXT,
  p_service_name TEXT,
  p_package_title TEXT,
  p_amount NUMERIC,
  p_target_account TEXT,
  p_order_id TEXT,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_existing_idempotency RECORD;
  v_order RECORD;
BEGIN
  -- 1) Idempotency Key تەكشۈرۈش
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    SELECT * INTO v_existing_idempotency 
    FROM public.idempotency_records 
    WHERE key = p_idempotency_key;

    IF FOUND THEN
      IF v_existing_idempotency.status = 'COMPLETED' THEN
        RETURN jsonb_build_object(
          'success', true,
          'message', 'Order already processed (idempotent)',
          'is_cached', true,
          'orderId', v_existing_idempotency.order_id,
          'data', v_existing_idempotency.response_body
        );
      ELSE
        RAISE EXCEPTION 'TRANSACTION_IN_PROGRESS: تەلەپ ھازىر بىر تەرەپ قىلىنىۋاتىدۇ، تەكرار باسماڭ!';
      END IF;
    END IF;

    -- قۇلۇپ خاتىرىلەش
    INSERT INTO public.idempotency_records (key, user_id, order_id, status)
    VALUES (p_idempotency_key, p_user_id, p_order_id, 'IN_PROGRESS');
  END IF;

  -- 2) ئابونت رېتىنى مەخسۇس قۇلۇپلاش (Row-Level Exclusive Lock)
  -- باشقا پاراللېل تەلەپلەر مۇشۇ ترانزاكسىيە تۈگىگۈچە كۈتۈپ تۇرىدۇ
  SELECT balance INTO v_current_balance
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND: ئابونت ھېساباتى تېپىلمىدى';
  END IF;

  -- 3) قالدۇق پۇلنىڭ يېتىش-يەتمەسلىكىنى تەكشۈرۈش
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_FUNDS: قالدۇق پۇل يەتمىدى! مەۋجۇت: %, تەلەپ: %', v_current_balance, p_amount;
  END IF;

  -- 4) قالدۇق پۇلنى كېمەيتىش ۋە ئومۇمىي سەرپىياتنى يېڭىلاش
  v_new_balance := v_current_balance - p_amount;

  UPDATE public.users
  SET 
    balance = v_new_balance,
    total_spent = total_spent + p_amount
  WHERE id = p_user_id;

  -- 5) زاكازنى ساندانغا قىستۇرۇش
  INSERT INTO public.orders (
    id,
    user_id,
    user_email,
    service_id,
    service_name,
    package_title,
    amount,
    target_account,
    status,
    details,
    created_at
  )
  VALUES (
    p_order_id,
    p_user_id,
    p_user_email,
    p_service_id,
    p_service_name,
    p_package_title,
    p_amount,
    p_target_account,
    'processing',
    p_details,
    NOW()
  )
  RETURNING * INTO v_order;

  -- 6) Idempotency قۇلۇپىنى مۇۋەپپەقىيەتلىك دەپ يېڭىلاش
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    UPDATE public.idempotency_records
    SET 
      status = 'COMPLETED',
      response_body = jsonb_build_object('orderId', v_order.id, 'newBalance', v_new_balance)
    WHERE key = p_idempotency_key;
  END IF;

  -- 7) نەتىجىنى قايتۇرۇش
  RETURN jsonb_build_object(
    'success', true,
    'order', row_to_json(v_order),
    'newBalance', v_new_balance
  );

EXCEPTION WHEN OTHERS THEN
  -- خاتالىق بولغاندا قۇلۇپنى بوشىتىش
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    DELETE FROM public.idempotency_records WHERE key = p_idempotency_key;
  END IF;
  RAISE;
END;
$$;

-- B) زاكاز مەغلۇپ بولغاندا پۇلنى ئاپتوماتىك قايتۇرۇش ACID فۇنكسىيەسى
CREATE OR REPLACE FUNCTION public.refund_order_balance(
  p_order_id TEXT,
  p_reason TEXT DEFAULT 'External Provider Error'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_user RECORD;
  v_new_balance NUMERIC;
BEGIN
  -- زاكازنى تەكشۈرۈش ۋە قۇلۇپلاش
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND: زاكاز تېپىلمىدى';
  END IF;

  -- ئاللىقاچان قايتۇرۇلغان بولسا تەكرار قايتۇرماسلىق
  IF v_order.status = 'refunded' OR v_order.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Order already refunded or cancelled');
  END IF;

  -- ئابونت قالدۇقىنى قۇلۇپلاپ ئەسلىگە كەلتۈرۈش
  IF v_order.user_id IS NOT NULL THEN
    SELECT * INTO v_user
    FROM public.users
    WHERE id = v_order.user_id
    FOR UPDATE;

    IF FOUND THEN
      v_new_balance := v_user.balance + v_order.amount;
      
      UPDATE public.users
      SET 
        balance = v_new_balance,
        total_spent = GREATEST(0, total_spent - v_order.amount)
      WHERE id = v_order.user_id;
    END IF;
  END IF;

  -- زاكاز ھالىتىنى 'refunded' كە ئۆزگەرتىش
  UPDATE public.orders
  SET 
    status = 'refunded',
    details = jsonb_set(COALESCE(details, '{}'::jsonb), '{refundReason}', to_jsonb(p_reason))
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'orderId', p_order_id,
    'refundedAmount', v_order.amount,
    'newBalance', v_new_balance
  );
END;
$$;

-- ========================================================
-- 7. ROW LEVEL SECURITY (RLS) HARDENING
-- ========================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_records ENABLE ROW LEVEL SECURITY;

-- كونا ئوچۇق سىياسەتلەرنى بىكار قىلىش
DROP POLICY IF EXISTS "Public Full Access Users" ON public.users;
DROP POLICY IF EXISTS "Public Full Access Orders" ON public.orders;
DROP POLICY IF EXISTS "Public Full Access Deposits" ON public.deposits;
DROP POLICY IF EXISTS "Public Full Access Settings" ON public.system_settings;
DROP POLICY IF EXISTS "Deny Direct Public Mutation Users" ON public.users;
DROP POLICY IF EXISTS "Deny Direct Public Mutation Orders" ON public.orders;
DROP POLICY IF EXISTS "Deny Direct Public Mutation Deposits" ON public.deposits;
DROP POLICY IF EXISTS "Deny Direct Public Mutation Settings" ON public.system_settings;

-- پەقەت server-side (service_role) ۋە security definer فۇنكسىيەلەرگىلا تولۇق ھوقۇق بېرىش
CREATE POLICY "Allow Service Role Users" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow Service Role Orders" ON public.orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow Service Role Deposits" ON public.deposits FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow Service Role Settings" ON public.system_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow Service Role Idempotency" ON public.idempotency_records FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ========================================================
-- 8. DEFAULT SEED DATA
-- ========================================================
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

-- Seed Admin User
INSERT INTO public.users (
  id, name, email, phone, password_hash, salt, balance, total_spent, vip_tier, role, is_banned, created_at
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
