# 🚀 Quick Start - Minecraft Shop System

## Tóm Tắt Nhanh

Hệ thống shop Minecraft 100% FREE, không cần backend riêng.

## 3 Bước Chính

### 1️⃣ Supabase (5 phút)

```sql
-- Chạy file SHOP_SETUP.sql trong Supabase SQL Editor
-- Lấy URL và anon key từ Settings > API
```

### 2️⃣ Frontend (5 phút)

```bash
# Thêm vào .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Deploy Netlify
npm run build
netlify deploy --prod
```

### 3️⃣ Plugin (10 phút)

```bash
cd MinecraftShopPlugin
mvn clean package
# Copy JAR vào server/plugins/
# Chỉnh sửa config.yml
# Restart server
```

## File Quan Trọng

- `SHOP_SETUP.sql` - SQL tạo bảng Supabase
- `src/pages/Shop.jsx` - Trang shop React
- `MinecraftShopPlugin/` - Plugin Java
- `MINECRAFT_SHOP_GUIDE.md` - Hướng dẫn chi tiết

## Test Nhanh

1. Tạo order trên web `/shop`
2. Đợi 10-20 giây
3. Kiểm tra player nhận item trong game

## Cần Giúp?

Xem `MINECRAFT_SHOP_GUIDE.md` để biết chi tiết và troubleshooting.

