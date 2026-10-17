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
SET search_path = public
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_existing_idempotency RECORD;
  v_order RECORD;
BEGIN
  -- 0) سومما مۇسبەت بولۇشى شەرت (مەنپىي سومما قالدۇقنى ئاشۇرۇۋېتەتتى)
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT: سومما خاتا';
  END IF;

  -- 1) Idempotency Key تەكشۈرۈش
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    SELECT * INTO v_existing_idempotency
    FROM public.idempotency_records
    WHERE key = p_idempotency_key;

    IF FOUND THEN
      IF v_existing_idempotency.user_id <> p_user_id THEN
        RAISE EXCEPTION 'IDEMPOTENCY_KEY_CONFLICT: بۇ ئاچقۇچ باشقا ئابونتقا تەۋە';
      END IF;
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
-- (p_force قوشۇلغاچقا كونا ئىمزانى ئاۋۋال ئۆچۈرىمىز)
DROP FUNCTION IF EXISTS public.refund_order_balance(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.refund_order_balance(
  p_order_id TEXT,
  p_reason TEXT DEFAULT 'External Provider Error',
  p_force BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- تاماملانغان زاكازنىڭ پۇلىنى ئاپتوماتىك قايتۇرماسلىق (باشقۇرغۇچى p_force بىلەنلا قىلالايدۇ)
  IF v_order.status NOT IN ('processing', 'pending', 'pending_provider', 'failed') AND NOT p_force THEN
    RETURN jsonb_build_object('success', false, 'message', 'ORDER_NOT_REFUNDABLE');
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

-- C) باشقۇرغۇچى قالدۇق ئۆزگەرتىشى (ئاتوم: balance = balance + delta)
CREATE OR REPLACE FUNCTION public.adjust_user_balance(
  p_user_id TEXT,
  p_delta NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance NUMERIC;
BEGIN
  UPDATE public.users
  SET balance = balance + p_delta
  WHERE id = p_user_id
  RETURNING balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND: ئابونت تېپىلمىدى';
  END IF;

  RETURN jsonb_build_object('success', true, 'newBalance', v_new_balance);
END;
$$;

-- D) پۇل كىرگۈزۈشنى تەستىقلاش/رەت قىلىش (قۇلۇپ + بىر قېتىملا، قوش كىرگۈزۈش يوق)
CREATE OR REPLACE FUNCTION public.review_deposit(
  p_deposit_id TEXT,
  p_status TEXT,
  p_reviewed_at TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deposit RECORD;
  v_user_id TEXT;
BEGIN
  IF p_status NOT IN ('completed', 'rejected') THEN
    RAISE EXCEPTION 'INVALID_STATUS';
  END IF;

  SELECT * INTO v_deposit
  FROM public.deposits
  WHERE id = p_deposit_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'DEPOSIT_NOT_FOUND';
  END IF;

  IF v_deposit.status <> 'pending' THEN
    RAISE EXCEPTION 'DEPOSIT_ALREADY_REVIEWED';
  END IF;

  IF p_status = 'completed' THEN
    v_user_id := v_deposit.user_id;
    IF v_user_id IS NULL THEN
      SELECT id INTO v_user_id FROM public.users WHERE email = lower(v_deposit.user_email);
    END IF;
    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'USER_NOT_FOUND';
    END IF;

    UPDATE public.users
    SET balance = balance + v_deposit.amount
    WHERE id = v_user_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'USER_NOT_FOUND';
    END IF;
  END IF;

  UPDATE public.deposits
  SET status = p_status, reviewed_at = p_reviewed_at
  WHERE id = p_deposit_id
  RETURNING * INTO v_deposit;

  RETURN jsonb_build_object('success', true, 'deposit', row_to_json(v_deposit));
END;
$$;

-- RPC فۇنكسىيەلىرىنى پەقەت server (service_role) غىلا ئوچۇق قىلىش.
-- بولمىسا ئاممىۋى anon ئاچقۇچى بىلەن ھەرقانداق كىشى بىۋاسىتە چاقىرالايدۇ.
REVOKE EXECUTE ON FUNCTION public.deduct_balance_and_create_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refund_order_balance(TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.adjust_user_balance(TEXT, NUMERIC) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.review_deposit(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_balance_and_create_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_order_balance(TEXT, TEXT, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.adjust_user_balance(TEXT, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.review_deposit(TEXT, TEXT, TEXT) TO service_role;

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
-- قايتا ئىجرا قىلىنغاندا "already exists" خاتالىقى چىقماسلىقى ئۈچۈن
DROP POLICY IF EXISTS "Allow Service Role Users" ON public.users;
DROP POLICY IF EXISTS "Allow Service Role Orders" ON public.orders;
DROP POLICY IF EXISTS "Allow Service Role Deposits" ON public.deposits;
DROP POLICY IF EXISTS "Allow Service Role Settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow Service Role Idempotency" ON public.idempotency_records;

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
-- قايتا ئىجرا قىلغاندا ئۆزگەرتىلگەن PIN ۋە تەڭشەكلەرنى قاپلىۋەتمەسلىك
ON CONFLICT (id) DO NOTHING;

-- ئەسكەرتىش: ئىلگىرىكى نەشرى 'dronemax0996@gmail.com' ھېساباتىنى ئاممىغا مەلۇم
-- شىفىر بىلەن قۇرغان. ئەگەر ئۇ ھېسابات ساندانىڭىزدا بولسا، شىفىرىنى دەرھال ئۆزگەرتىڭ.

-- ========================================================
-- 9. PROVIDER CATALOG (syria4game) & FULFILMENT
-- ========================================================
CREATE TABLE IF NOT EXISTS public.provider_categories (
  id BIGINT PRIMARY KEY,
  parent_id BIGINT,
  root_id BIGINT,
  depth INT NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  image TEXT,
  last_seen_run_id BIGINT,
  removed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_provider_categories_parent ON public.provider_categories(parent_id);

CREATE TABLE IF NOT EXISTS public.provider_products (
  id BIGINT PRIMARY KEY,
  category_id BIGINT NOT NULL,
  parent_id BIGINT,
  category_name TEXT,
  name TEXT NOT NULL,
  cost_price NUMERIC(20,10) NOT NULL,
  prev_cost_price NUMERIC(20,10),
  price_changed_at TIMESTAMPTZ,
  currency TEXT NOT NULL DEFAULT 'USD',
  available BOOLEAN NOT NULL DEFAULT TRUE,
  product_type TEXT,
  input_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  params JSONB NOT NULL DEFAULT '[]'::jsonb,
  qty_values JSONB,
  image TEXT,
  category_image TEXT,
  last_seen_run_id BIGINT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_provider_products_category ON public.provider_products(category_id) WHERE removed_at IS NULL;

-- باشقۇرغۇچى ئۆزگەرتىشلىرى ئايرىم جەدۋەلدە: sync ئۇلارنى ھەرگىز قاپلىۋەتمەيدۇ
CREATE TABLE IF NOT EXISTS public.catalog_overrides (
  scope TEXT NOT NULL CHECK (scope IN ('category', 'product')),
  target_id BIGINT NOT NULL,
  storefront_category TEXT CHECK (storefront_category IN ('games','apps','balance','social','numbers','crypto','accounts','cards','ai')),
  hidden BOOLEAN,
  custom_name TEXT,
  custom_description TEXT,
  custom_image TEXT,
  custom_badge TEXT,
  markup_percent NUMERIC CHECK (markup_percent IS NULL OR (markup_percent >= 0 AND markup_percent <= 500)),
  input_fields_override JSONB,
  sort_order INT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (scope, target_id)
);

CREATE TABLE IF NOT EXISTS public.provider_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  catalog_source TEXT NOT NULL DEFAULT 'legacy' CHECK (catalog_source IN ('legacy', 'provider')),
  global_markup_percent NUMERIC NOT NULL DEFAULT 15 CHECK (global_markup_percent >= 0 AND global_markup_percent <= 500),
  min_profit_usd NUMERIC NOT NULL DEFAULT 0.01 CHECK (min_profit_usd >= 0),
  min_order_usd NUMERIC NOT NULL DEFAULT 0.10 CHECK (min_order_usd >= 0),
  price_max_age_minutes INT NOT NULL DEFAULT 30,
  show_unavailable BOOLEAN NOT NULL DEFAULT FALSE,
  low_balance_threshold_usd NUMERIC NOT NULL DEFAULT 20,
  max_pending_hours INT NOT NULL DEFAULT 24,
  orders_paused BOOLEAN NOT NULL DEFAULT FALSE,
  orders_paused_reason TEXT,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_sync_stats JSONB,
  last_sync_error TEXT,
  last_balance NUMERIC,
  last_balance_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO public.provider_settings (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.provider_sync_runs (
  id BIGSERIAL PRIMARY KEY,
  trigger TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  stats JSONB,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.provider_calls (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT,
  endpoint TEXT NOT NULL,
  url_redacted TEXT,
  http_status INT,
  duration_ms INT,
  outcome TEXT,
  error_code INT,
  response_body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_provider_calls_order ON public.provider_calls(order_id);
CREATE INDEX IF NOT EXISTS idx_provider_calls_created ON public.provider_calls(created_at DESC);

CREATE TABLE IF NOT EXISTS public.cron_locks (
  name TEXT PRIMARY KEY,
  locked_until TIMESTAMPTZ NOT NULL,
  holder TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_inflight ON public.orders(status, created_at)
  WHERE status IN ('pending_provider', 'processing');

-- Cron / sync قۇلۇپى: بىرلا ۋاقىتتا پەقەت بىر ئىجراچى
CREATE OR REPLACE FUNCTION public.acquire_cron_lock(p_name TEXT, p_ttl_seconds INT, p_holder TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.cron_locks (name, locked_until, holder)
  VALUES (p_name, NOW() + make_interval(secs => p_ttl_seconds), p_holder)
  ON CONFLICT (name) DO UPDATE
    SET locked_until = EXCLUDED.locked_until, holder = EXCLUDED.holder
    WHERE public.cron_locks.locked_until < NOW();
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_cron_lock(p_name TEXT, p_holder TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.cron_locks WHERE name = p_name AND holder = p_holder;
$$;

-- زاكاز ھالىتىنى ئاتوم ئالماشتۇرۇش + details نى بىرلەشتۈرۈش (read-modify-write يوق)
CREATE OR REPLACE FUNCTION public.transition_order(p_order_id TEXT, p_from TEXT[], p_to TEXT, p_patch JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
BEGIN
  UPDATE public.orders
  SET
    status = COALESCE(p_to, status),
    details = COALESCE(details, '{}'::jsonb) || COALESCE(p_patch, '{}'::jsonb)
  WHERE id = p_order_id AND status = ANY(p_from)
  RETURNING * INTO v_order;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false);
  END IF;
  RETURN jsonb_build_object('success', true, 'order', row_to_json(v_order));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.acquire_cron_lock(TEXT, INT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.release_cron_lock(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.transition_order(TEXT, TEXT[], TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_cron_lock(TEXT, INT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_cron_lock(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.transition_order(TEXT, TEXT[], TEXT, JSONB) TO service_role;

ALTER TABLE public.provider_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow Service Role Provider Categories" ON public.provider_categories;
DROP POLICY IF EXISTS "Allow Service Role Provider Products" ON public.provider_products;
DROP POLICY IF EXISTS "Allow Service Role Catalog Overrides" ON public.catalog_overrides;
DROP POLICY IF EXISTS "Allow Service Role Provider Settings" ON public.provider_settings;
DROP POLICY IF EXISTS "Allow Service Role Provider Sync Runs" ON public.provider_sync_runs;
DROP POLICY IF EXISTS "Allow Service Role Provider Calls" ON public.provider_calls;
DROP POLICY IF EXISTS "Allow Service Role Cron Locks" ON public.cron_locks;
CREATE POLICY "Allow Service Role Provider Categories" ON public.provider_categories FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow Service Role Provider Products" ON public.provider_products FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow Service Role Catalog Overrides" ON public.catalog_overrides FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow Service Role Provider Settings" ON public.provider_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow Service Role Provider Sync Runs" ON public.provider_sync_runs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow Service Role Provider Calls" ON public.provider_calls FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow Service Role Cron Locks" ON public.cron_locks FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ========================================================
-- 10. (ئىختىيارىي) Vercel Hobby دا زاكاز ھالىتىنى ھەر 2 مىنۇتتا تەكشۈرۈش
-- Supabase Dashboard → Database → Extensions دىن pg_cron ۋە pg_net نى ئېچىپ،
-- <domain> ۋە <CRON_SECRET> نى ئالماشتۇرۇپ ئىجرا قىلىڭ:
--
-- select cron.schedule('autocash-poll-orders', '*/2 * * * *',
--   $cron$ select net.http_get(
--     url := 'https://<domain>/api/cron/poll-orders',
--     headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
--   ) $cron$);
-- ========================================================
