-- Enable real-time for relevant tables
-- Run this in your Supabase SQL Editor

-- 1. Enable replication for the public schema tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recharges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;

-- 2. Repair any missing wallets for existing users
-- This ensures that everyone in the profiles table has a matching wallet
INSERT INTO public.wallets (user_id, balance)
SELECT id, 0 FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.wallets)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Verify that RLS is correctly allowing admins to see and manage wallets
DROP POLICY IF EXISTS "Admin can see all wallets" ON public.wallets;
CREATE POLICY "Admin can see all wallets" ON public.wallets 
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admin can see all transactions" ON public.wallet_transactions;
CREATE POLICY "Admin can see all transactions" ON public.wallet_transactions 
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
