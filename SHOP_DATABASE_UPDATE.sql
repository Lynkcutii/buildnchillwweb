-- ============================================
-- SHOP DATABASE UPDATE - THANH TOÁN & QUẢN LÝ
-- ============================================

-- 1. Tạo bảng categories (danh mục sản phẩm)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tạo bảng products (sản phẩm)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  command TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  display_price TEXT,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Cập nhật bảng orders (thêm thông tin thanh toán)
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_info TEXT,
  ADD COLUMN IF NOT EXISTS payment_proof TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. Tạo index
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_orders_product ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_paid ON orders(status, delivered) WHERE status = 'paid' AND delivered = false;

-- 5. Bật RLS cho categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access for categories"
ON categories FOR SELECT
USING (active = true);

CREATE POLICY "Allow public read all categories"
ON categories FOR SELECT
USING (true);

CREATE POLICY "Allow public insert access for categories"
ON categories FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update access for categories"
ON categories FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete access for categories"
ON categories FOR DELETE
USING (true);

-- 6. Bật RLS cho products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access for products"
ON products FOR SELECT
USING (active = true);

CREATE POLICY "Allow public read all products"
ON products FOR SELECT
USING (true);

CREATE POLICY "Allow public insert access for products"
ON products FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update access for products"
ON products FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete access for products"
ON products FOR DELETE
USING (true);

-- 7. Function tự động update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger cho categories
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger cho products
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Insert dữ liệu mẫu
INSERT INTO categories (name, description, icon, display_order) VALUES
('VIP', 'Các gói VIP với nhiều quyền lợi', '👑', 1),
('Items', 'Vật phẩm trong game', '💎', 2),
('Currency', 'Tiền tệ trong game', '💰', 3)
ON CONFLICT (name) DO NOTHING;

-- 9. Kiểm tra
SELECT 'Categories created' as status;
SELECT 'Products table ready' as status;
SELECT 'Orders table updated' as status;

