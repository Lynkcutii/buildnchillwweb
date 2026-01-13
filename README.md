# 🧧 BuildnChill Minecraft - Lunar New Year 2026 🏮

<div align="center">
  <img src="public/favicon.ico" width="100" height="100" alt="BuildnChill Logo">
  <h3>✨ Trải nghiệm Minecraft chuyên nghiệp - Chào đón Xuân Bính Ngọ 🐎 ✨</h3>
  <p align="center">
    <img src="https://img.shields.io/badge/React-18.x-61DAFB?logo=react" alt="React">
    <img src="https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite" alt="Vite">
    <img src="https://img.shields.io/badge/Supabase-DB-3ECF8E?logo=supabase" alt="Supabase">
    <img src="https://img.shields.io/badge/Framer_Motion-UI-FF69B4?logo=framer" alt="Framer Motion">
    <img src="https://img.shields.io/badge/Discord-Sync-5865F2?logo=discord" alt="Discord">
  </p>
</div>

---

## 🌟 Giới Thiệu
**BuildnChill Website** là nền tảng quản trị và cửa hàng trực tuyến dành riêng cho server Minecraft BuildnChill. Ứng dụng được xây dựng trên nền tảng React hiện đại, tích hợp hệ thống dữ liệu thời gian thực và giao diện tùy biến theo chủ đề Tết Bính Ngọ 2026.

## 🚀 Tính Năng Nổi Bật

### 🧧 Giao Diện Tết Bính Ngọ 2026
- **Tet-Theme Sync**: Đồng bộ toàn bộ nút bấm, thẻ bài và hiệu ứng theo tông màu Đỏ May Mắn & Vàng Sang Trọng.
- **Hiệu ứng Hoạt Ảnh**: Pháo hoa, hoa mai và hoa đào rơi mượt mà với Framer Motion.
- **Modal Chuyên Nghiệp**: Nút đóng (X) phong cách bao lì xì, tạo trải nghiệm người dùng độc đáo.

### 🛡️ Hệ Thống Quản Trị Thông Minh
- **Soft Delete (Xóa Mềm)**: Dữ liệu (Tin tức, Đơn hàng, Liên hệ, Sản phẩm) không bao giờ bị mất hoàn toàn, được bảo toàn trong database với trạng thái `is_deleted`.
- **Dashboard Thống Kê**: Biểu đồ doanh thu theo ngày, tháng, năm và quản lý sản phẩm bán chạy.
- **Quản lý Cửa Hàng**: CRUD (Thêm, Sửa, Xóa) Danh mục và Sản phẩm dễ dàng.

### 🤖 Đồng Bộ Discord & Game
- **Discord Webhook**: Tự động thông báo đơn hàng mới, cập nhật trạng thái đơn hàng (Đã thanh toán/Đã giao) trực tiếp lên server Discord.
- **Minecraft Command Queue**: Tự động đưa lệnh vào hàng chờ (`pending_commands`) để Plugin thực thi trong game ngay khi đơn hàng được xác nhận.

## 🛠️ Công Nghệ Sử Dụng
- **Frontend**: React 18, Vite, Framer Motion, React Icons.
- **Styling**: CSS3 (Custom Tet Theme), Bootstrap 5.
- **Backend-as-a-Service**: Supabase (Database, Auth, Storage, Real-time).
- **Automation**: Discord Webhook API, Playwright (E2E Testing).

---

## 📦 Cài Đặt & Khởi Chạy

### 1. Cài đặt Dependencies
```bash
npm install
```

### 2. Cấu hình Môi trường
Tạo file `.env` tại thư mục gốc và cấu hình key Supabase:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Setup Database
Chạy các scripts migration theo thứ tự:
1. `SHOP_SETUP.sql`
2. `SOFT_DELETE_MIGRATION.sql`
3. `UPDATE_SLUG_COLUMN.sql`

### 4. Khởi chạy Development
```bash
npm run dev
```

## 📁 Cấu Trúc Thư Mục Chính
```text
src/
├── components/   # Các thành phần giao diện (Navbar, Footer, Shop, Admin)
├── context/      # Quản lý trạng thái ứng dụng (DataContext)
├── pages/        # Các trang chính (Home, Shop, News, Admin, Login)
├── styles/       # Hệ thống CSS (tet-theme.css, shop-tet.css)
└── utils/        # Hàm hỗ trợ (helpers, slugify)
```

---

<div align="center">
  <p>Chúc bạn một năm mới Bính Ngọ an khang, thịnh vượng! 🧧🐎</p>
  <p><b>BuildnChill Development Team</b></p>
</div>
