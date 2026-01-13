# Hướng Dẫn Cài Đặt Supabase

## Bước 1: Tạo Tài Khoản Supabase

1. Truy cập https://supabase.com
2. Đăng ký/Đăng nhập tài khoản
3. Tạo một project mới (chọn plan Free)

## Bước 2: Lấy Thông Tin Kết Nối

1. Vào **Project Settings** (biểu tượng bánh răng)
2. Vào tab **API**
3. Copy 2 giá trị sau:
   - **Project URL** (ví dụ: `https://xxxxx.supabase.co`)
   - **anon public key** (key dài)

## Bước 3: Tạo File .env

Tạo file `.env` ở thư mục gốc của project với nội dung:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Lưu ý:** Thay `xxxxx` bằng URL thực tế của bạn.

## Bước 4: Tạo Tables trong Supabase

Vào **SQL Editor** trong Supabase và chạy các câu lệnh sau:

### 1. Table `news` (Tin tức)

```sql
CREATE TABLE news (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  image TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo index cho date để query nhanh hơn
CREATE INDEX idx_news_date ON news(date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Policy: Mọi người đều có thể đọc
CREATE POLICY "Anyone can read news" ON news
  FOR SELECT USING (true);

-- Policy: Chỉ admin mới có thể insert/update/delete
-- (Bạn sẽ cần tạo authentication sau nếu muốn bảo mật hơn)
CREATE POLICY "Anyone can insert news" ON news
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update news" ON news
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete news" ON news
  FOR DELETE USING (true);
```

### 2. Table `server_status` (Trạng thái server)

```sql
CREATE TABLE server_status (
  id BIGSERIAL PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'Online',
  players TEXT NOT NULL DEFAULT '0',
  max_players TEXT NOT NULL DEFAULT '500',
  version TEXT NOT NULL DEFAULT '1.20.4',
  uptime TEXT NOT NULL DEFAULT '99.9%',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chỉ có 1 record duy nhất
INSERT INTO server_status (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE server_status ENABLE ROW LEVEL SECURITY;

-- Policy: Mọi người đều có thể đọc
CREATE POLICY "Anyone can read server_status" ON server_status
  FOR SELECT USING (true);

-- Policy: Mọi người đều có thể update
CREATE POLICY "Anyone can update server_status" ON server_status
  FOR UPDATE USING (true);
```

### 3. Table `contacts` (Liên hệ từ người dùng)

```sql
CREATE TABLE contacts (
  id BIGSERIAL PRIMARY KEY,
  ign TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  category TEXT DEFAULT 'other',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Mọi người đều có thể insert (gửi liên hệ)
CREATE POLICY "Anyone can insert contacts" ON contacts
  FOR INSERT WITH CHECK (true);

-- Policy: Mọi người đều có thể đọc (để admin xem)
CREATE POLICY "Anyone can read contacts" ON contacts
  FOR SELECT USING (true);

-- Policy: Mọi người đều có thể update (để đánh dấu đã đọc)
CREATE POLICY "Anyone can update contacts" ON contacts
  FOR UPDATE USING (true);

-- Policy: Mọi người đều có thể delete (để admin xóa)
CREATE POLICY "Anyone can delete contacts" ON contacts
  FOR DELETE USING (true);

### 4. Table `site_settings` (Cài đặt website)

```sql
CREATE TABLE site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  server_ip TEXT DEFAULT 'play.buildnchill.com',
  server_version TEXT DEFAULT '1.20.4',
  contact_email TEXT DEFAULT 'contact@buildnchill.com',
  contact_phone TEXT DEFAULT '+1 (234) 567-890',
  discord_url TEXT DEFAULT 'https://discord.gg/buildnchill',
  site_title TEXT DEFAULT 'BuildnChill',
  maintenance_mode BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default settings
INSERT INTO site_settings (id, discord_url) VALUES (1, 'https://discord.gg/buildnchill')
ON CONFLICT (id) DO UPDATE SET discord_url = EXCLUDED.discord_url;

-- Enable Row Level Security (RLS)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Mọi người đều có thể đọc
CREATE POLICY "Anyone can read site_settings" ON site_settings
  FOR SELECT USING (true);

-- Policy: Mọi người đều có thể update (để admin sửa)
CREATE POLICY "Anyone can update site_settings" ON site_settings
  FOR UPDATE USING (true);
```

### 5. Table `shop_items` (Items trong shop - Tùy chọn)

```sql
CREATE TABLE shop_items (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'VND',
  minecraft_command TEXT NOT NULL, -- Lệnh để give item (ví dụ: "give {player} diamond 1")
  category TEXT DEFAULT 'general',
  enabled BOOLEAN DEFAULT TRUE,
  stock INTEGER DEFAULT -1, -- -1 = unlimited
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;

-- Policy: Mọi người đều có thể đọc items enabled
CREATE POLICY "Anyone can read shop_items" ON shop_items
  FOR SELECT USING (enabled = TRUE);

-- Policy: Chỉ admin mới có thể insert/update/delete
CREATE POLICY "Anyone can manage shop_items" ON shop_items
  FOR ALL USING (true);
```

### 6. Table `shop_orders` (Đơn hàng - Tùy chọn)

```sql
CREATE TABLE shop_orders (
  id BIGSERIAL PRIMARY KEY,
  user_ign TEXT NOT NULL, -- Tên game của người chơi
  user_email TEXT,
  user_phone TEXT,
  item_id INTEGER REFERENCES shop_items(id),
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'VND',
  payment_method TEXT, -- 'vnpay', 'momo', 'paypal', etc.
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'cancelled'
  payment_transaction_id TEXT, -- ID từ payment gateway
  minecraft_command TEXT NOT NULL, -- Lệnh đã được format với IGN
  command_executed BOOLEAN DEFAULT FALSE, -- Đã gửi lệnh vào server chưa
  command_executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Mọi người có thể tạo order
CREATE POLICY "Anyone can create orders" ON shop_orders
  FOR INSERT WITH (true);

-- Policy: Mọi người có thể xem orders
CREATE POLICY "Anyone can view orders" ON shop_orders
  FOR SELECT USING (true);

-- Policy: Chỉ admin mới có thể update
CREATE POLICY "Anyone can update orders" ON shop_orders
  FOR UPDATE USING (true);
```

**Lưu ý:** Tables `shop_items` và `shop_orders` là tùy chọn, chỉ cần tạo nếu bạn muốn sử dụng tính năng Shop. Xem thêm `SHOP_SYSTEM_SETUP.md` để biết chi tiết.

## Bước 5: Tạo Storage Bucket cho Ảnh Liên Hệ

1. Vào **Storage** trong menu bên trái
2. Click **"New bucket"**
3. Tên bucket: `contact-images`
4. Tích chọn **"Public bucket"** (để có thể truy cập ảnh từ URL)
5. Click **"Create bucket"**
6. Sau khi tạo, vào bucket `contact-images`, vào tab **"Policies"**
7. Tạo policy mới với các settings:
   - Policy name: `Allow public uploads`
   - Allowed operation: `INSERT`
   - Target roles: `anon`, `authenticated`
   - Policy definition: `true`
8. Tạo thêm policy:
   - Policy name: `Allow public reads`
   - Allowed operation: `SELECT`
   - Target roles: `anon`, `authenticated`
   - Policy definition: `true`

## Bước 6: Khởi Động Lại Server

Sau khi tạo file `.env`, khởi động lại dev server:

```bash
npm run dev
```

## Lưu Ý Bảo Mật

- File `.env` đã được thêm vào `.gitignore` để không commit lên Git
- `anon key` là public key, an toàn để dùng ở client-side
- Nếu muốn bảo mật hơn, bạn có thể tạo authentication và dùng service role key ở server-side

## Kiểm Tra Kết Nối

Sau khi setup xong, mở browser console và kiểm tra xem có lỗi kết nối Supabase không.

