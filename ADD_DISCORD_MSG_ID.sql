-- Migration để lưu trữ Discord Message ID cho Liên hệ
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS discord_message_id TEXT;
