# Hướng Dẫn Sửa Lỗi Xóa Liên Hệ và Hiển Thị Ảnh

## Vấn Đề

1. **Xóa liên hệ không hoạt động**: Sau khi xóa và F5, liên hệ vẫn hiện ra
2. **Ảnh không hiển thị**: Admin không thể xem ảnh đính kèm từ người dùng

## Nguyên Nhân

1. Table `contacts` thiếu DELETE policy trong Supabase
2. Schema table `contacts` thiếu các columns: `category`, `image_url`, `status`
3. Storage bucket `contact-images` chưa được tạo

## Cách Sửa

### Bước 1: Cập Nhật Database Schema

1. Mở Supabase Dashboard → **SQL Editor**
2. Copy và chạy file `CONTACT_MIGRATION.sql` (đã có trong project)
   - Hoặc copy nội dung bên dưới:

```sql
-- Thêm các columns còn thiếu
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other',
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Thêm DELETE policy
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contacts' 
    AND policyname = 'Anyone can delete contacts'
  ) THEN
    CREATE POLICY "Anyone can delete contacts" ON contacts
      FOR DELETE USING (true);
  END IF;
END $$;
```

### Bước 2: Tạo Storage Bucket cho Ảnh

1. Vào **Storage** trong menu bên trái Supabase
2. Click **"New bucket"**
3. Tên bucket: `contact-images`
4. **QUAN TRỌNG**: Tích chọn **"Public bucket"** (để có thể truy cập ảnh từ URL)
5. Click **"Create bucket"**

### Bước 3: Cấu Hình Policies cho Storage Bucket

Sau khi tạo bucket `contact-images`:

1. Vào bucket `contact-images`
2. Vào tab **"Policies"**
3. Click **"New policy"**

**Policy 1: Cho phép upload (INSERT)**
- Policy name: `Allow public uploads`
- Allowed operation: `INSERT`
- Target roles: `anon`, `authenticated`
- Policy definition: `true`

**Policy 2: Cho phép đọc (SELECT)**
- Policy name: `Allow public reads`
- Allowed operation: `SELECT`
- Target roles: `anon`, `authenticated`
- Policy definition: `true`

Hoặc bạn có thể dùng SQL Editor để tạo policies:

```sql
-- Cho phép upload ảnh
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'contact-images');

-- Cho phép đọc ảnh
CREATE POLICY "Allow public reads" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'contact-images');
```

### Bước 4: Kiểm Tra Lại

1. Thử xóa một liên hệ trong admin panel
2. F5 lại trang - liên hệ không còn xuất hiện
3. Gửi một liên hệ mới kèm ảnh
4. Vào admin panel xem - ảnh sẽ hiển thị trong modal chi tiết

## Lưu Ý

- Nếu bạn đã có dữ liệu trong table `contacts`, các columns mới sẽ có giá trị mặc định
- Storage bucket phải là **Public** để ảnh có thể truy cập được từ URL
- Nếu vẫn không hiển thị ảnh, kiểm tra console browser để xem lỗi cụ thể




