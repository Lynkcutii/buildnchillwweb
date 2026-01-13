-- Migration script to add is_deleted column for soft delete
-- Run this in Supabase SQL Editor

-- 1. Table: news
ALTER TABLE news ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 2. Table: contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 3. Table: orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 4. Table: products
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 5. Table: categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_news_is_deleted ON news(is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_contacts_is_deleted ON contacts(is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_orders_is_deleted ON orders(is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_products_is_deleted ON products(is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_categories_is_deleted ON categories(is_deleted) WHERE is_deleted = false;
