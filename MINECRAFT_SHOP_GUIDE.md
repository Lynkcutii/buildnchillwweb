# 🎮 Hướng Dẫn Setup Hệ Thống Shop Minecraft 100% FREE

## 📋 Tổng Quan

Hệ thống shop Minecraft hoàn toàn miễn phí, không cần backend riêng, không cần VPS, không cần dịch vụ bên thứ 3.

**Kiến trúc:**
- **Frontend**: React (deploy Netlify)
- **Database**: Supabase (free tier)
- **Game Server**: Minecraft Java (Paper/Spigot)
- **Giao tiếp**: Plugin polling Supabase REST API

---

## 🗂️ Mục Lục

1. [Setup Supabase](#1-setup-supabase)
2. [Setup Frontend React](#2-setup-frontend-react)
3. [Build & Deploy Plugin](#3-build--deploy-plugin)
4. [Cấu Hình Plugin](#4-cấu-hình-plugin)
5. [Test Hệ Thống](#5-test-hệ-thống)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Setup Supabase

### Bước 1: Tạo Supabase Project

1. Truy cập [https://supabase.com](https://supabase.com)
2. Đăng ký/Đăng nhập (miễn phí)
3. Tạo project mới
4. Chờ project khởi tạo (2-3 phút)

### Bước 2: Tạo Bảng Orders

1. Vào **SQL Editor** trong Supabase Dashboard
2. Copy toàn bộ nội dung file `SHOP_SETUP.sql`
3. Paste vào SQL Editor và chạy (Run)
4. Kiểm tra bảng đã tạo:
   - Vào **Table Editor** > xem bảng `orders`

### Bước 3: Lấy API Keys

1. Vào **Settings** > **API**
2. Copy các giá trị sau:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (key dài)

### Bước 4: Kiểm Tra REST API

REST API tự động bật khi có RLS policy. Test bằng cách:

```bash
# Test GET (thay YOUR_URL và YOUR_KEY)
curl -X GET "YOUR_URL/rest/v1/orders?status=eq.paid&delivered=eq.false" \
  -H "apikey: YOUR_KEY" \
  -H "Authorization: Bearer YOUR_KEY"
```

Nếu trả về `[]` là OK (chưa có order nào).

---

## 2. Setup Frontend React

### Bước 1: Cấu Hình Environment Variables

1. Tạo file `.env` trong thư mục gốc project (nếu chưa có)
2. Thêm các biến sau:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Lưu ý:** Thay `your-project` và `your-anon-key-here` bằng giá trị thật từ Supabase.

### Bước 2: Test Local

```bash
npm install
npm run dev
```

Mở browser: `http://localhost:5173/shop`

### Bước 3: Deploy Netlify

#### Cách 1: Deploy qua Netlify Dashboard

1. Truy cập [https://app.netlify.com](https://app.netlify.com)
2. Đăng nhập với GitHub/GitLab/Bitbucket
3. **Add new site** > **Import an existing project**
4. Chọn repository của bạn
5. Cấu hình build:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Thêm Environment Variables:
   - Vào **Site settings** > **Environment variables**
   - Thêm:
     - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
     - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`
7. **Deploy site**

#### Cách 2: Deploy qua Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

### Bước 4: Kiểm Tra Deploy

1. Truy cập URL Netlify của bạn
2. Vào trang `/shop`
3. Test tạo order

---

## 3. Build & Deploy Plugin

### Bước 1: Cài Đặt Maven

**Windows:**
1. Download Maven: [https://maven.apache.org/download.cgi](https://maven.apache.org/download.cgi)
2. Giải nén vào `C:\Program Files\Apache\maven`
3. Thêm vào PATH:
   - `C:\Program Files\Apache\maven\bin`
4. Test: `mvn --version`

**Linux/Mac:**
```bash
# Ubuntu/Debian
sudo apt install maven

# Mac
brew install maven
```

### Bước 2: Build Plugin

```bash
cd MinecraftShopPlugin
mvn clean package
```

File JAR sẽ được tạo tại:
```
MinecraftShopPlugin/target/MinecraftShopPlugin-1.0.0.jar
```

### Bước 3: Deploy Plugin vào Server

1. Copy file JAR vào thư mục `plugins` của server:
   ```
   your-server/plugins/MinecraftShopPlugin-1.0.0.jar
   ```
2. Restart server hoặc dùng lệnh:
   ```
   /reload
   ```
   (Khuyến nghị: restart server)

### Bước 4: Kiểm Tra Plugin Đã Load

Xem console server, sẽ thấy:
```
[INFO] ========================================
[INFO] Minecraft Shop Plugin đang khởi động...
[INFO] ========================================
```

Nếu có lỗi, xem phần [Troubleshooting](#6-troubleshooting).

---

## 4. Cấu Hình Plugin

### Bước 1: Chỉnh Sửa Config

Sau khi plugin chạy lần đầu, file `config.yml` sẽ được tạo tại:
```
your-server/plugins/MinecraftShopPlugin/config.yml
```

Mở file và chỉnh sửa:

```yaml
supabase:
  url: "https://your-project.supabase.co"  # Thay bằng URL thật
  anon_key: "your-anon-key-here"           # Thay bằng key thật

poll:
  interval_seconds: 15  # Khoảng thời gian poll (10-20 giây)
```

### Bước 2: Reload Plugin

```bash
/reload
```

Hoặc restart server.

### Bước 3: Kiểm Tra Logs

Xem console server, sẽ thấy:
```
[INFO] Supabase URL: https://your-project.supabase.co
[INFO] Poll interval: 15 giây
[INFO] ========================================
[INFO] Minecraft Shop Plugin đã sẵn sàng!
[INFO] ========================================
```

---

## 5. Test Hệ Thống

### Checklist Test Từ Đầu Đến Cuối

#### ✅ Test 1: Tạo Order từ Web

1. Mở trang shop trên web: `https://your-site.netlify.app/shop`
2. Nhập:
   - **Tên Minecraft**: `TestPlayer` (hoặc tên player thật)
   - **Chọn sản phẩm**: `VIP Basic`
3. Click **Thanh Toán (Miễn Phí)**
4. Kiểm tra:
   - ✅ Hiển thị thông báo thành công
   - ✅ Form được reset

#### ✅ Test 2: Kiểm Tra Order trong Supabase

1. Vào Supabase Dashboard > **Table Editor** > `orders`
2. Tìm order vừa tạo:
   - ✅ `status` = `paid`
   - ✅ `delivered` = `false`
   - ✅ `mc_username` = `TestPlayer`
   - ✅ `command` có chứa tên player

#### ✅ Test 3: Plugin Xử Lý Order

1. Đợi 10-20 giây (hoặc theo `interval_seconds` trong config)
2. Xem console server, sẽ thấy:
   ```
   [INFO] Tìm thấy 1 order(s) cần xử lý.
   [INFO] ========================================
   [INFO] Xử lý order: [order-id]
   [INFO] Player: TestPlayer
   [INFO] Product: VIP Basic
   [INFO] Command: lp user TestPlayer parent set vip
   [INFO] ========================================
   [INFO] Command đã được thực thi thành công!
   [INFO] Order [order-id] đã được cập nhật thành công!
   ```
3. Kiểm tra trong game:
   - ✅ Player nhận được item/quyền
   - ✅ Hoặc kiểm tra bằng lệnh: `/lp user TestPlayer info`

#### ✅ Test 4: Kiểm Tra Order Đã Được Cập Nhật

1. Vào Supabase > `orders`
2. Tìm order vừa xử lý:
   - ✅ `status` = `delivered`
   - ✅ `delivered` = `true`

#### ✅ Test 5: Test Không Phát Trùng

1. Tạo order mới với cùng player
2. Đợi plugin xử lý
3. Tạo order thứ 2 ngay sau đó
4. Kiểm tra:
   - ✅ Chỉ order đầu tiên được xử lý
   - ✅ Order thứ 2 vẫn ở trạng thái `paid` (sẽ được xử lý sau)

---

## 6. Troubleshooting

### ❌ Lỗi: "LỖI: Chưa cấu hình Supabase!"

**Nguyên nhân:** Chưa chỉnh sửa `config.yml`

**Giải pháp:**
1. Mở `plugins/MinecraftShopPlugin/config.yml`
2. Thay `your-project` và `your-anon-key` bằng giá trị thật
3. Reload plugin: `/reload`

---

### ❌ Lỗi: "HTTP Error: 401" hoặc "HTTP Error: 403"

**Nguyên nhân:** 
- API key sai
- RLS policy chưa đúng

**Giải pháp:**
1. Kiểm tra lại `anon_key` trong `config.yml`
2. Kiểm tra RLS policies trong Supabase:
   - Vào **Authentication** > **Policies** > `orders`
   - Đảm bảo có 3 policies: SELECT, INSERT, UPDATE
3. Chạy lại SQL trong `SHOP_SETUP.sql` nếu cần

---

### ❌ Lỗi: "Lỗi parse JSON"

**Nguyên nhân:** Response từ Supabase không đúng format

**Giải pháp:**
1. Kiểm tra Supabase URL đúng chưa
2. Test REST API bằng curl (xem phần Setup Supabase)
3. Xem logs chi tiết trong console server

---

### ❌ Order Không Được Xử Lý

**Nguyên nhân có thể:**
1. Plugin chưa chạy
2. Poll interval quá dài
3. Order đã được xử lý trước đó

**Giải pháp:**
1. Kiểm tra plugin đã enable: `/plugins`
2. Xem logs: `[INFO] Tìm thấy X order(s) cần xử lý.`
3. Kiểm tra order trong Supabase: `status='paid'` và `delivered=false`
4. Giảm `interval_seconds` trong config nếu cần

---

### ❌ Command Không Được Thực Thi

**Nguyên nhân:**
- Command sai format
- Plugin/permission chưa có

**Giải pháp:**
1. Kiểm tra command trong Supabase `orders` table
2. Test command thủ công trong game console
3. Đảm bảo plugin/permission đã được cài (ví dụ: LuckPerms cho lệnh `lp`)

---

### ❌ Frontend: "Lỗi: Không thể tạo đơn hàng"

**Nguyên nhân:**
- Environment variables chưa set
- Supabase URL/key sai

**Giải pháp:**
1. Kiểm tra `.env` file (local) hoặc Netlify Environment Variables (production)
2. Đảm bảo:
   - `VITE_SUPABASE_URL` bắt đầu bằng `https://`
   - `VITE_SUPABASE_ANON_KEY` là key đầy đủ
3. Restart dev server: `npm run dev`

---

## 📝 Tùy Chỉnh Sản Phẩm

### Thêm Sản Phẩm Mới

Mở file `src/pages/Shop.jsx`, tìm mảng `products` và thêm:

```javascript
{
  id: 'product_id',
  name: 'Tên Sản Phẩm',
  description: 'Mô tả sản phẩm',
  command: 'give {username} item amount',  // {username} sẽ được thay thế
  price: 'FREE'
}
```

**Lưu ý:** 
- `{username}` sẽ được thay bằng tên player
- Command phải đúng format Minecraft command

### Ví Dụ Commands:

```javascript
// Give item
command: 'give {username} diamond 64'

// Set permission (cần LuckPerms)
command: 'lp user {username} parent set vip'

// Give money (cần Vault + Economy plugin)
command: 'eco give {username} 10000'

// Teleport
command: 'tp {username} 0 100 0'

// Custom command
command: 'customshop give {username} vip_package'
```

---

## 🔒 Bảo Mật

### RLS Policies

RLS đã được cấu hình để:
- ✅ Cho phép public INSERT (tạo order)
- ✅ Cho phép public SELECT (plugin đọc orders)
- ✅ Cho phép public UPDATE (plugin update delivered)

**Lưu ý:** Vì dùng `anon key`, ai cũng có thể tạo order. Nếu muốn bảo mật hơn:
1. Thêm authentication vào frontend
2. Dùng `service_role` key trong plugin (không khuyến nghị, vì phải giữ bí mật)

---

## 📊 Monitoring

### Xem Logs Plugin

Logs được ghi vào console server. Các mức log:
- `INFO`: Thông tin bình thường
- `WARNING`: Cảnh báo (order đã xử lý, command có thể fail)
- `SEVERE`: Lỗi nghiêm trọng

### Xem Orders trong Supabase

1. Vào **Table Editor** > `orders`
2. Filter theo:
   - `status = 'paid'` - Đang chờ xử lý
   - `status = 'delivered'` - Đã xử lý
   - `delivered = false` - Chưa giao

---

## 🎉 Hoàn Thành!

Hệ thống shop của bạn đã sẵn sàng! 

**Tóm tắt:**
- ✅ Supabase database đã setup
- ✅ Frontend React đã deploy
- ✅ Plugin đã cài và cấu hình
- ✅ Test thành công

**Next Steps:**
- Tùy chỉnh sản phẩm trong `Shop.jsx`
- Thêm validation cho username
- Thêm thông báo trong game khi nhận item
- Tùy chỉnh UI/UX

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra [Troubleshooting](#6-troubleshooting)
2. Xem logs trong console server
3. Kiểm tra Supabase logs (Dashboard > Logs)

**Chúc bạn thành công! 🎮✨**

