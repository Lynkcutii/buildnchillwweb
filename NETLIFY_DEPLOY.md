# Hướng Dẫn Deploy Lên Netlify

## Bước 1: Chuẩn Bị Project

1. Đảm bảo project đã build thành công:
```bash
npm run build
```

2. Kiểm tra thư mục `dist` đã được tạo và chứa các file build.

## Bước 2: Tạo Tài Khoản Netlify

1. Truy cập https://www.netlify.com
2. Đăng ký/Đăng nhập bằng GitHub, GitLab, hoặc Email
3. Chọn plan **Free** (đủ dùng cho project này)

## Bước 3: Deploy Từ GitHub (Khuyến Nghị)

### 3.1. Push Code Lên GitHub

1. Tạo repository mới trên GitHub (nếu chưa có)
2. Push code lên GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

**Lưu ý:** Đảm bảo file `.env` đã được thêm vào `.gitignore` (không commit lên GitHub)

### 3.2. Kết Nối GitHub với Netlify

1. Vào Netlify Dashboard
2. Click **"Add new site"** → **"Import an existing project"**
3. Chọn **GitHub** và authorize Netlify
4. Chọn repository của bạn
5. Cấu hình build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Base directory:** (để trống)

### 3.3. Thêm Environment Variables

1. Vào **Site settings** → **Environment variables**
2. Thêm 2 biến sau:
   - `VITE_SUPABASE_URL` = URL Supabase của bạn
   - `VITE_SUPABASE_ANON_KEY` = Anon key Supabase của bạn

3. Click **"Deploy site"**

## Bước 4: Deploy Thủ Công (Manual Deploy)

Nếu không muốn dùng GitHub, bạn có thể deploy thủ công:

1. Build project:
```bash
npm run build
```

2. Vào Netlify Dashboard → **"Add new site"** → **"Deploy manually"**
3. Kéo thả thư mục `dist` vào Netlify
4. Sau khi deploy xong, vào **Site settings** → **Environment variables** để thêm biến môi trường

**Lưu ý:** Với cách này, mỗi lần update bạn phải build và deploy lại thủ công.

## Bước 5: Cấu Hình Domain (Tùy Chọn)

1. Vào **Site settings** → **Domain management**
2. Netlify sẽ tự động tạo domain miễn phí: `your-site-name.netlify.app`
3. Nếu muốn dùng domain riêng:
   - Click **"Add custom domain"**
   - Nhập domain của bạn
   - Làm theo hướng dẫn để cấu hình DNS

## Bước 6: Kiểm Tra Deploy

1. Sau khi deploy xong, Netlify sẽ cung cấp URL: `https://your-site-name.netlify.app`
2. Truy cập URL và kiểm tra website hoạt động
3. Kiểm tra console browser để đảm bảo không có lỗi Supabase

## Bước 7: Continuous Deployment (Tự Động)

Nếu đã kết nối GitHub, mỗi khi bạn push code lên GitHub, Netlify sẽ tự động:
1. Build lại project
2. Deploy phiên bản mới
3. Cập nhật website

Bạn có thể xem logs trong tab **"Deploys"** của Netlify Dashboard.

## Troubleshooting

### Lỗi Build Failed

1. Kiểm tra **Deploy logs** trong Netlify Dashboard
2. Đảm bảo `package.json` có đầy đủ dependencies
3. Kiểm tra build command: `npm run build`

### Lỗi Environment Variables

1. Đảm bảo đã thêm `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`
2. Sau khi thêm, cần **trigger deploy lại** (vào Deploys → Trigger deploy)

### Lỗi 404 trên Routes

1. Tạo file `public/_redirects` với nội dung:
```
/*    /index.html   200
```

2. Hoặc tạo file `netlify.toml` ở thư mục gốc:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Lưu Ý Quan Trọng

1. **Environment Variables:** Luôn thêm vào Netlify, không commit vào code
2. **Build Command:** Phải là `npm run build` (Vite build)
3. **Publish Directory:** Phải là `dist` (output của Vite)
4. **Supabase:** Đảm bảo RLS policies cho phép public read
5. **CORS:** Supabase đã tự động cho phép Netlify domains

## Tài Liệu Tham Khảo

- Netlify Docs: https://docs.netlify.com
- Vite Deployment: https://vitejs.dev/guide/static-deploy.html
- Supabase Docs: https://supabase.com/docs

