-- Fix for server_status permissions to allow updating from client side
-- Run this in Supabase SQL Editor

-- 1. Ensure server_status table exists and has initial data
-- CREATE TABLE IF NOT EXISTS public.server_status (
--   id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
--   status TEXT DEFAULT 'Offline',
--   players TEXT DEFAULT '0',
--   max_players TEXT DEFAULT '500',
--   version TEXT DEFAULT '1.20.4',
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- 2. Allow any authenticated user to update server status
-- (Since this is just public metadata, it's safe to let the app update it)
DROP POLICY IF EXISTS "Allow authenticated users to update server status" ON public.server_status;
CREATE POLICY "Allow authenticated users to update server status" ON public.server_status
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Allow everyone to read server status
DROP POLICY IF EXISTS "Allow public read server status" ON public.server_status;
CREATE POLICY "Allow public read server status" ON public.server_status
FOR SELECT TO public
USING (true);

-- 4. Add a trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_server_status_updated_at ON public.server_status;
CREATE TRIGGER update_server_status_updated_at
BEFORE UPDATE ON public.server_status
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
