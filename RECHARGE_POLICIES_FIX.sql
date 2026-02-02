-- Ensure recharges table has correct columns and policies
ALTER TABLE public.recharges ADD COLUMN IF NOT EXISTS discord_message_id TEXT;

-- Enable RLS
ALTER TABLE public.recharges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can create own recharges" ON public.recharges;
DROP POLICY IF EXISTS "Users can see own recharges" ON public.recharges;
DROP POLICY IF EXISTS "Users can update own recharges" ON public.recharges;
DROP POLICY IF EXISTS "Admin can see all recharges" ON public.recharges;
DROP POLICY IF EXISTS "Admin can update all recharges" ON public.recharges;

-- Create policies
CREATE POLICY "Users can create own recharges" ON public.recharges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can see own recharges" ON public.recharges
    FOR SELECT USING (auth.uid() = user_id);

-- This policy is CRITICAL for saving discord_message_id from the client
CREATE POLICY "Users can update own recharges" ON public.recharges
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admin can see all recharges" ON public.recharges
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
