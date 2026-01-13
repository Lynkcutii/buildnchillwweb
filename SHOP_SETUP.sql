-- ============================================
-- MINECRAFT SHOP SYSTEM - SUPABASE SETUP
-- ============================================
-- Hướng dẫn: Chạy SQL này trong Supabase SQL Editor

-- 1. Tạo bảng orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mc_username TEXT NOT NULL,
  product TEXT NOT NULL,
  command TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'delivered')),
  delivered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tạo index để tối ưu query
CREATE INDEX IF NOT EXISTS idx_orders_status_delivered ON orders(status, delivered) WHERE status = 'paid' AND delivered = false;
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- 3. Bật Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 4. Tạo policy cho SELECT (cho phép đọc tất cả orders - plugin cần đọc)
CREATE POLICY "Allow public read access for orders"
ON orders FOR SELECT
USING (true);

-- 5. Tạo policy cho INSERT (cho phép tạo order mới - frontend cần)
CREATE POLICY "Allow public insert access for orders"
ON orders FOR INSERT
WITH CHECK (true);

-- 6. Tạo policy cho UPDATE (cho phép cập nhật order - plugin cần update delivered)
CREATE POLICY "Allow public update access for orders"
ON orders FOR UPDATE
USING (true)
WITH CHECK (true);

-- 7. Kiểm tra bảng đã tạo thành công
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- ============================================
-- HƯỚNG DẪN BẬT REST API
-- ============================================
-- 1. Vào Supabase Dashboard
-- 2. Settings > API
-- 3. Copy "Project URL" và "anon public" key
-- 4. Thêm vào file .env của React:
--    VITE_SUPABASE_URL=https://your-project.supabase.co
--    VITE_SUPABASE_ANON_KEY=your-anon-key
--
-- 5. REST API tự động bật khi có RLS policy
--    Plugin sẽ dùng: GET /rest/v1/orders?status=eq.paid&delivered=eq.false
--                    PATCH /rest/v1/orders?id=eq.{id}

-- ============================================
-- TEST QUERY
-- ============================================
-- Test insert order
-- INSERT INTO orders (mc_username, product, command, status, delivered)
-- VALUES ('TestPlayer', 'VIP Basic', 'lp user TestPlayer parent set vip', 'paid', false);

-- Test select orders cần xử lý
-- SELECT * FROM orders WHERE status = 'paid' AND delivered = false ORDER BY created_at ASC;

-- Test update order
-- UPDATE orders SET delivered = true, status = 'delivered' WHERE id = 'your-order-id';

