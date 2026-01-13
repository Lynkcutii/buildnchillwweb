-- Thêm cột slug vào bảng news
ALTER TABLE news ADD COLUMN IF NOT EXISTS slug TEXT;

-- Cập nhật slug cho các bài viết hiện tại (nếu có)
-- Lưu ý: Bạn có thể cần cập nhật thủ công nếu tiêu đề có dấu phức tạp, 
-- hoặc chạy code cập nhật từ Admin sau khi xong.
UPDATE news SET slug = id::text WHERE slug IS NULL;

-- Tạo index để tìm kiếm theo slug nhanh hơn
CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);
