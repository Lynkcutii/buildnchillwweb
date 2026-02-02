-- Fix for Admin seeing all data regardless of RLS
-- Run this in Supabase SQL Editor

-- 1. Ensure Wallets are viewable by Admin
DROP POLICY IF EXISTS "Admins see all wallets" ON public.wallets;
CREATE POLICY "Admins see all wallets" ON public.wallets
FOR ALL TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 2. Ensure Profiles are viewable by Admin
DROP POLICY IF EXISTS "Admins see all profiles" ON public.profiles;
CREATE POLICY "Admins see all profiles" ON public.profiles
FOR ALL TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 3. Ensure Transactions are viewable by Admin
DROP POLICY IF EXISTS "Admins see all transactions" ON public.wallet_transactions;
CREATE POLICY "Admins see all transactions" ON public.wallet_transactions
FOR ALL TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 4. Bypass RLS for service role (if needed) - already default
-- 5. Force enable RLS but add the bypass
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
