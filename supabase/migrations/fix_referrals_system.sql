-- Fix referral system: add missing columns and correct RLS policies

-- Add referral_code to users table for fast lookup
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code text;

-- Backfill referral_code for existing users (first 8 chars of UUID, uppercase)
UPDATE users SET referral_code = UPPER(SUBSTRING(id::text, 1, 8)) WHERE referral_code IS NULL;

-- Index for fast referral code lookup
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- Add missing columns to referrals table
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referee_name text;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referee_email text;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS points_awarded boolean DEFAULT false;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS reward int DEFAULT 500;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Fix INSERT policy: referee (new user) inserts the row at signup, not referrer
DROP POLICY IF EXISTS "Users can insert referrals" ON referrals;
CREATE POLICY "Users can insert referrals" ON referrals
  FOR INSERT WITH CHECK (auth.uid() = referee_id);

-- Allow referrer to update (mark points_awarded = true when they claim)
DROP POLICY IF EXISTS "Users can update referrals" ON referrals;
CREATE POLICY "Users can update referrals" ON referrals
  FOR UPDATE USING (auth.uid() = referrer_id);
