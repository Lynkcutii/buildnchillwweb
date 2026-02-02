# Hướng dẫn nâng cấp Hệ thống Ví & Auth (Tet 2026)

## 1. Cấu trúc File mới
- `src/pages/Auth.jsx`: Trang đăng nhập/đăng ký.
- `src/hooks/useWallet.js`: Quản lý số dư và nạp tiền.
- `src/components/WalletCard.jsx`: Hiển thị số dư nhanh.

## 2. Các thay đổi quan trọng

### Cập nhật `src/pages/Shop.jsx`
- Thêm state `paymentMethod` ('bank' hoặc 'wallet').
- Tại hàm `handleOrder`:
  - Nếu chọn `wallet`: Sau khi tạo đơn hàng, gọi RPC `process_wallet_purchase`.
  - Nếu chọn `bank`: Giữ nguyên luồng cũ.

### Cập nhật `src/pages/Admin.jsx`
- Thêm tab "Quản lý Ví".
- Thêm chức năng điều chỉnh số dư: 
  `supabase.rpc('admin_adjust_balance', { target_user, amount, reason })`.

## 3. RLS Policies (Cần cấu hình trên Dashboard)
- `profiles`: `auth.uid() = id` (Select/Update).
- `wallets`: `auth.uid() = user_id` (Select).
- `wallet_transactions`: `wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid())` (Select).

## 4. Lưu ý bảo mật
- Luôn sử dụng `BIGINT` cho tiền tệ để tránh sai số dấu phẩy động.
- Mọi thao tác trừ tiền **bắt buộc** gọi qua hàm RPC đã tạo ở Bước 1.
