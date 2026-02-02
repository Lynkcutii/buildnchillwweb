-- 0. Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create Profiles table (if not exists)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    balance BIGINT DEFAULT 0 NOT NULL CHECK (balance >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Wallet Transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
    amount BIGINT NOT NULL,
    balance_before BIGINT NOT NULL,
    balance_after BIGINT NOT NULL,
    type TEXT NOT NULL, -- 'recharge', 'purchase', 'admin_adjustment', 'refund'
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Recharges table
CREATE TABLE IF NOT EXISTS public.recharges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount BIGINT NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL,
    proof_image TEXT,
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'approved', 'rejected'
    admin_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. RPC: Admin Adjust Balance
CREATE OR REPLACE FUNCTION public.admin_adjust_balance(
    p_user_id UUID,
    p_amount BIGINT,
    p_type TEXT,
    p_note TEXT
) RETURNS VOID AS $$
DECLARE
    v_wallet_id UUID;
    v_old_balance BIGINT;
    v_new_balance BIGINT;
BEGIN
    -- Get wallet info
    SELECT id, balance INTO v_wallet_id, v_old_balance FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
    
    IF v_wallet_id IS NULL THEN
        RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
    END IF;

    v_new_balance := v_old_balance + p_amount;

    IF v_new_balance < 0 THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Update balance
    UPDATE public.wallets SET balance = v_new_balance, updated_at = now() WHERE id = v_wallet_id;

    -- Log transaction
    INSERT INTO public.wallet_transactions (wallet_id, amount, balance_before, balance_after, type, note)
    VALUES (v_wallet_id, p_amount, v_old_balance, v_new_balance, p_type, p_note);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: Approve Recharge
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

-- 7. Trigger to create wallet on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (user_id, balance)
    VALUES (NEW.id, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

-- 7.5. Trigger to create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, role)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), 
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recharges ENABLE ROW LEVEL SECURITY;

-- Profiles: Users see own, Admin sees all
CREATE POLICY "Users can see own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin can see all profiles" ON public.profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Wallets: Users see own, Admin sees all
CREATE POLICY "Users can see own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can see all wallets" ON public.wallets FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Transactions: Users see own, Admin sees all
CREATE POLICY "Users can see own transactions" ON public.wallet_transactions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.wallets WHERE id = wallet_id AND user_id = auth.uid())
);
CREATE POLICY "Admin can see all transactions" ON public.wallet_transactions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 9. RPC: Process Wallet Purchase
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

    -- Create order
    INSERT INTO public.orders (id, mc_username, product, product_id, category_id, command, price, status, delivered, payment_method, notes)
    VALUES (v_order_id, p_mc_username, v_product_name, p_product_id, v_category_id, 
            REPLACE(REPLACE(v_command, '{username}', p_mc_username), '{user_name}', p_mc_username), 
            v_price, 'paid', false, 'wallet', 'Paid via internal wallet');

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

-- 10. RPC: Admin Force Update User Password
-- This allows an admin (checked via profiles.role) to update any user's password
CREATE OR REPLACE FUNCTION public.admin_force_update_password(
    p_user_id UUID,
    p_new_password TEXT
) RETURNS JSONB AS $$
DECLARE
    v_admin_role TEXT;
BEGIN
    -- Check if the executor is an admin
    SELECT role INTO v_admin_role FROM public.profiles WHERE id = auth.uid();
    
    IF v_admin_role != 'admin' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Only admins can perform this action');
    END IF;

    -- Update the password in auth.users
    -- This requires the function to be SECURITY DEFINER and have permissions
    UPDATE auth.users 
    SET encrypted_password = crypt(p_new_password, gen_salt('bf'))
    WHERE id = p_user_id;

    RETURN jsonb_build_object('success', true, 'message', 'Password updated successfully');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create Carousel Images table
CREATE TABLE IF NOT EXISTS public.carousel_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Carousel Images
ALTER TABLE public.carousel_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can see active carousel images" ON public.carousel_images FOR SELECT USING (is_active = true);
CREATE POLICY "Admin can manage all carousel images" ON public.carousel_images FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
