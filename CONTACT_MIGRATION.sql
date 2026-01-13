-- Migration script để cập nhật table contacts
-- Chạy script này trong SQL Editor của Supabase nếu bạn đã tạo table contacts trước đó

-- Thêm các columns còn thiếu
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other',
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Cập nhật ràng buộc trạng thái
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS check_status;
ALTER TABLE contacts ADD CONSTRAINT check_status CHECK (status IN ('pending', 'processing', 'resolved'));

-- Thêm DELETE policy nếu chưa có
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
