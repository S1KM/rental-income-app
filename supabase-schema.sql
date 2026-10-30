-- ====================================================================
-- RENTAL INCOME & PROPERTY MANAGER - SUPABASE DATABASE SCHEMA
-- ====================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your Project -> Click on "SQL Editor" in the left sidebar
-- 3. Paste this entire script and click "Run" (Ctrl+Enter / Cmd+Enter)
-- 4. Copy your Project URL & Anon Key from Project Settings -> API
-- ====================================================================

-- 1. Properties Table
CREATE TABLE IF NOT EXISTS public.properties (
    id TEXT PRIMARY KEY,
    building TEXT NOT NULL DEFAULT 'Sagarpur',
    building_type TEXT DEFAULT 'Residential',
    name TEXT NOT NULL,
    address TEXT,
    type TEXT DEFAULT '1 BHK Residential Flat',
    super_area NUMERIC DEFAULT 0,
    carpet_area NUMERIC DEFAULT 0,
    common_area NUMERIC DEFAULT 0,
    rent NUMERIC NOT NULL DEFAULT 12000,
    deposit NUMERIC NOT NULL DEFAULT 24000,
    upic TEXT,
    meter_no TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tenants Table
CREATE TABLE IF NOT EXISTS public.tenants (
    id TEXT PRIMARY KEY,
    unit TEXT NOT NULL,
    name TEXT NOT NULL,
    mobile TEXT,
    email TEXT,
    rent NUMERIC NOT NULL DEFAULT 12000,
    os_amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Active',
    start_date TEXT,
    end_date TEXT,
    tenant_id_number TEXT,
    perm_address TEXT,
    is_b2b BOOLEAN DEFAULT FALSE,
    business_name TEXT DEFAULT '',
    gstin TEXT DEFAULT '',
    pan TEXT DEFAULT '',
    billing_address TEXT DEFAULT '',
    increment_period TEXT DEFAULT 'Every Year',
    increment_pct NUMERIC DEFAULT 10,
    lock_in_period TEXT DEFAULT '1 Year (12 Months)',
    lease_period TEXT DEFAULT '3 Years (36 Months)',
    b2b_increment_clause TEXT DEFAULT '',
    area_sq_ft NUMERIC DEFAULT 0,
    rent_per_sq_ft NUMERIC DEFAULT 0,
    cam_rate_per_sq_ft NUMERIC DEFAULT 0,
    cam_amount NUMERIC DEFAULT 0,
    auto_bill_cam_separate BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ledger Installments Table (Multi-date rent payments)
CREATE TABLE IF NOT EXISTS public.ledger_installments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    prop_id TEXT NOT NULL,
    cycle TEXT NOT NULL,
    installment_index INT DEFAULT 0,
    date TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    mode TEXT DEFAULT 'UPI',
    ref TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Landlord Settings Table
CREATE TABLE IF NOT EXISTS public.landlord_settings (
    id TEXT PRIMARY KEY DEFAULT 'primary',
    name TEXT NOT NULL DEFAULT 'Rajesh Sharma',
    pan TEXT DEFAULT 'ABCPS1234D',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT 'abcltd9925@gmail.com',
    address TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlord_settings ENABLE ROW LEVEL SECURITY;

-- Anonymous Access Policies (for Web Client with Anon Public Key)
DROP POLICY IF EXISTS "Allow anon all on properties" ON public.properties;
CREATE POLICY "Allow anon all on properties" ON public.properties FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on tenants" ON public.tenants;
CREATE POLICY "Allow anon all on tenants" ON public.tenants FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on ledger_installments" ON public.ledger_installments;
CREATE POLICY "Allow anon all on ledger_installments" ON public.ledger_installments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on landlord_settings" ON public.landlord_settings;
CREATE POLICY "Allow anon all on landlord_settings" ON public.landlord_settings FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime (Optional - for live multi-device sync)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.properties, public.tenants, public.ledger_installments, public.landlord_settings;
COMMIT;
