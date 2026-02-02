-- 1. Create pending_commands table for Minecraft Plugin
CREATE TABLE IF NOT EXISTS public.pending_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mc_username TEXT NOT NULL,
    command TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    discord_message_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.pending_commands ENABLE ROW LEVEL SECURITY;

-- 3. Policies for pending_commands
CREATE POLICY "Allow public read for pending_commands" ON public.pending_commands FOR SELECT USING (true);
CREATE POLICY "Allow public insert for pending_commands" ON public.pending_commands FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for pending_commands" ON public.pending_commands FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete for pending_commands" ON public.pending_commands FOR DELETE USING (true);

-- 4. Re-create process_wallet_purchase to ensure it uses pending_commands
-- DROP FUNCTION first to avoid "cannot change return type" error
DROP FUNCTION IF EXISTS public.process_wallet_purchase(UUID, UUID, TEXT);

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

    IF v_balance IS NULL THEN
        RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
    END IF;

    IF v_balance < v_price THEN
        RAISE EXCEPTION 'Insufficient balance. You need % but have %', v_price, v_balance;
    END IF;

    -- Update balance
    UPDATE public.wallets SET balance = v_balance - v_price, updated_at = now() WHERE id = v_wallet_id;

    -- Log transaction
    INSERT INTO public.wallet_transactions (wallet_id, amount, balance_before, balance_after, type, note)
    VALUES (v_wallet_id, -v_price, v_balance, v_balance - v_price, 'purchase', 'Bought product: ' || v_product_name);

    -- Create order record
    INSERT INTO public.orders (
        id, mc_username, product, product_id, category_id, 
        command, price, status, delivered, payment_method, notes
    )
    VALUES (
        v_order_id, p_mc_username, v_product_name, p_product_id, v_category_id,
        v_command, v_price, 'delivered', true, 'wallet', 'Thanh toán bằng ví nội bộ (Tự động)'
    );

    -- Insert into pending_commands for Minecraft Plugin to execute
    INSERT INTO public.pending_commands (command, mc_username, status)
    VALUES (REPLACE(REPLACE(v_command, '{username}', p_mc_username), '{user_name}', p_mc_username), p_mc_username, 'pending');

    -- Send in-game notification via tellraw
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
