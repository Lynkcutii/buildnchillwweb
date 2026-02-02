-- FIX SCRIPT FOR BUILDNCHILL
-- Run this in Supabase SQL Editor

-- 1. Ensure recharges table is correct
CREATE TABLE IF NOT EXISTS public.recharges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount BIGINT NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL,
    proof_image TEXT,
    status TEXT DEFAULT 'pending' NOT NULL,
    admin_id UUID REFERENCES public.profiles(id),
    discord_message_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist
ALTER TABLE public.recharges ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.recharges ADD COLUMN IF NOT EXISTS discord_message_id TEXT;
ALTER TABLE public.recharges ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 2. Storage Setup (Bucket & Policies)
-- IMPORTANT: Bucket creation via SQL might be restricted, if it fails, please create 'recharges' bucket manually in Supabase Dashboard.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('recharges', 'recharges', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'recharges');
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'recharges' AND auth.role() = 'authenticated');

-- 3. Fix Wallet Transactions Constraints
-- Drop the check constraint if it exists to allow flexibility
ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_type_check 
CHECK (type IN ('recharge', 'purchase', 'admin_adjustment', 'refund'));

-- 4. Update process_wallet_purchase for AUTOMATIC delivery
CREATE OR REPLACE FUNCTION public.process_wallet_purchase(
    p_user_id UUID,
    p_product_id UUID,
    p_mc_username TEXT
) RETURNS JSONB AS $$
DECLARE
    v_wallet_id UUID;
    v_balance BIGINT;
    v_price BIGINT;
    v_product_name TEXT;
    v_command TEXT;
    v_category_id UUID;
    v_order_id UUID := gen_random_uuid();
    v_notify_msg TEXT;
BEGIN
    -- Get product info
    SELECT name, price, command, category_id INTO v_product_name, v_price, v_command, v_category_id 
    FROM public.products WHERE id = p_product_id;

    IF v_product_name IS NULL THEN
        RAISE EXCEPTION 'Product not found';
    END IF;

    -- Get wallet info
    SELECT id, balance INTO v_wallet_id, v_balance FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

    IF v_balance < v_price THEN
        RAISE EXCEPTION 'Insufficient balance. You need % but have %', v_price, v_balance;
    END IF;

    -- Update balance
    UPDATE public.wallets SET balance = v_balance - v_price, updated_at = now() WHERE id = v_wallet_id;

    -- Log transaction
    INSERT INTO public.wallet_transactions (wallet_id, amount, balance_before, balance_after, type, note)
    VALUES (v_wallet_id, -v_price, v_balance, v_balance - v_price, 'purchase', 'Bought product: ' || v_product_name);

    -- Create order (mark as PAID and DELIVERED automatically)
    INSERT INTO public.orders (id, mc_username, product, product_id, category_id, command, price, status, delivered, payment_method, notes, paid_at)
    VALUES (v_order_id, p_mc_username, v_product_name, p_product_id, v_category_id, 
            REPLACE(REPLACE(v_command, '{username}', p_mc_username), '{user_name}', p_mc_username), 
            v_price, 'paid', true, 'wallet', 'Paid via internal wallet. Auto-delivered.', now());

    -- Insert into pending_commands for Minecraft Plugin to execute
    INSERT INTO public.pending_commands (command, mc_username, status)
    VALUES (REPLACE(REPLACE(v_command, '{username}', p_mc_username), '{user_name}', p_mc_username), p_mc_username, 'pending');

    -- Send in-game notification
    v_notify_msg := '{"text":"","extra":[{"text":"[","color":"dark_gray"},{"text":"\ud83e\udeb8","color":"light_purple","bold":true},{"text":"]","color":"dark_gray"},{"text":" BnC-Shop","color":"light_purple","bold":true},{"text":" \u2192 ","color":"dark_gray"},{"text":"Giao thành công đơn hàng ","color":"green"},{"text":"' || v_product_name || '","color":"aqua"},{"text":". Cảm ơn bạn đã ủng hộ!","color":"green"}]}';
    
    INSERT INTO public.pending_commands (command, mc_username, status)
    VALUES ('tellraw ' || p_mc_username || ' ' || v_notify_msg, p_mc_username, 'pending');

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'new_balance', v_balance - v_price
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC: Fix approve_recharge relationship error
CREATE OR REPLACE FUNCTION public.approve_recharge(
    p_recharge_id UUID,
    p_admin_id UUID
) RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_amount BIGINT;
    v_status TEXT;
BEGIN
    -- Get recharge info
    SELECT user_id, amount, status INTO v_user_id, v_amount, v_status 
    FROM public.recharges WHERE id = p_recharge_id FOR UPDATE;

    IF v_status != 'pending' THEN
        RAISE EXCEPTION 'Recharge is not pending';
    END IF;

    -- Update recharge status
    UPDATE public.recharges 
    SET status = 'approved', admin_id = p_admin_id, updated_at = now() 
    WHERE id = p_recharge_id;

    -- Adjust balance
    PERFORM public.admin_adjust_balance(v_user_id, v_amount, 'recharge', 'Approved recharge: ' || p_recharge_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
