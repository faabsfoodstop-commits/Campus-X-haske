-- Add active cosmetic columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_frame text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_badge text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_title text;
