-- SAFE VERSION: Uses CREATE TABLE IF NOT EXISTS
-- This won't error if tables already exist

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  name TEXT,
  university TEXT,
  department TEXT,
  course TEXT,
  points INTEGER DEFAULT 0,
  wallet DECIMAL DEFAULT 0,
  cosmetics_purchased TEXT[] DEFAULT '{}',
  profile_complete BOOLEAN DEFAULT FALSE,
  premium_tier TEXT,
  premium_until TIMESTAMP,
  premium_active BOOLEAN DEFAULT FALSE,
  premium_removed_at TIMESTAMP,
  current_streak INTEGER DEFAULT 0,
  week_points INTEGER DEFAULT 0,
  week_sold INTEGER DEFAULT 0,
  week_redeemed INTEGER DEFAULT 0,
  week_referrals INTEGER DEFAULT 0,
  week_logins INTEGER DEFAULT 0,
  daily_spins_remaining INTEGER DEFAULT 3,
  last_spin_reset_date DATE,
  daily_spins_purchased_count INTEGER DEFAULT 0,
  spin_cooldown_until TIMESTAMP,
  last_spin_time TIMESTAMP,
  daily_ads_posted_count INTEGER DEFAULT 0,
  last_ad_posted_at TIMESTAMP,
  active_ads_count_today INTEGER DEFAULT 0,
  points_sold_today INTEGER DEFAULT 0,
  points_sold_this_week INTEGER DEFAULT 0,
  last_point_sell_at TIMESTAMP,
  points_purchased_today INTEGER DEFAULT 0,
  points_purchased_this_week INTEGER DEFAULT 0,
  referral_count_today INTEGER DEFAULT 0,
  last_referral_created_at TIMESTAMP,
  referrer_ip TEXT,
  cosmetic_last_purchased_at TIMESTAMP,
  cosmetic_inventory_count INTEGER DEFAULT 0,
  redemption_cooldown_until TIMESTAMP,
  redemptions_this_week INTEGER DEFAULT 0,
  last_trivia_played_at TIMESTAMP,
  trivia_games_played_today INTEGER DEFAULT 0,
  last_video_ad_at TIMESTAMP,
  videos_watched_today INTEGER DEFAULT 0,
  last_video_id_watched TEXT,
  last_chat_message_at TIMESTAMP,
  chat_messages_this_hour INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  bank_details JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  amount INTEGER,
  base_bonus INTEGER,
  multiplier INTEGER DEFAULT 1,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL,
  mission_name TEXT,
  base_reward INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sponsored_mission_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL,
  brand TEXT,
  base_reward INTEGER,
  points_awarded INTEGER,
  completed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cosmetics_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cosmetic_id TEXT NOT NULL,
  cosmetic_name TEXT,
  price INTEGER,
  purchased_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS point_sell_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_amount INTEGER NOT NULL,
  price_per_point DECIMAL NOT NULL,
  total_price DECIMAL NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  filled_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS point_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_amount INTEGER NOT NULL,
  price_per_point DECIMAL NOT NULL,
  total_price DECIMAL NOT NULL,
  traded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_name TEXT,
  status TEXT DEFAULT 'pending',
  points_used INTEGER,
  naira_value DECIMAL,
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leaderboard_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank INTEGER,
  total_points INTEGER,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS instagram_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_name TEXT,
  verified BOOLEAN DEFAULT FALSE,
  reward_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_amount INTEGER DEFAULT 500,
  claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  timestamp TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS user_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL,
  image TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  university TEXT,
  user_name TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_at TIMESTAMP,
  reviewed_by UUID,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  contacts INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS university_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  university TEXT NOT NULL,
  message TEXT NOT NULL,
  sender_name TEXT,
  sender_avatar TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  participants INTEGER DEFAULT 0,
  engagement DECIMAL DEFAULT 0,
  revenue DECIMAL DEFAULT 0,
  duration INTEGER DEFAULT 30,
  conversion_rate DECIMAL,
  avg_points DECIMAL,
  uac DECIMAL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_name TEXT NOT NULL,
  reward_type TEXT,
  provider TEXT,
  points_used INTEGER,
  naira_value DECIMAL,
  phone_number TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spin_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  result TEXT,
  points_earned INTEGER,
  multiplier TEXT,
  cost INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trivia_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  correct_answers INTEGER,
  total_questions INTEGER,
  points_earned INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS point_buy_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_amount INTEGER NOT NULL,
  price_per_point DECIMAL NOT NULL,
  total_price DECIMAL NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  filled_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS streak_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  points_earned INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, check_in_date)
);

CREATE TABLE IF NOT EXISTS video_ads_watched (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_id TEXT,
  points_earned INTEGER DEFAULT 10,
  watched_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS getting_started_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  task_name TEXT NOT NULL,
  reward_points INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  points_awarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending',
  bank_account TEXT,
  bank_name TEXT,
  account_holder TEXT,
  requested_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  approved_by UUID,
  rejected_reason TEXT
);

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  count_today INTEGER DEFAULT 0,
  count_this_week INTEGER DEFAULT 0,
  last_action_timestamp TIMESTAMP,
  cooldown_until TIMESTAMP,
  reset_at_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_resource_id TEXT,
  resource_type TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'completed',
  error_message TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feature_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT UNIQUE NOT NULL,
  daily_limit INTEGER,
  weekly_limit INTEGER,
  hourly_limit INTEGER,
  cooldown_seconds INTEGER,
  min_requirement_points INTEGER,
  max_per_transaction DECIMAL,
  enabled BOOLEAN DEFAULT TRUE,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_missions_user_id ON daily_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_user_id ON weekly_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_sponsored_missions_user_id ON sponsored_mission_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_cosmetics_user_id ON cosmetics_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_point_orders_user_id ON point_sell_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_point_trades_user_id ON point_trades(seller_id, buyer_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_ads_user_id ON user_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ads_status ON user_ads(status);
CREATE INDEX IF NOT EXISTS idx_university_chat_university ON university_chat_messages(university);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_spin_history_user_id ON spin_history(user_id);
CREATE INDEX IF NOT EXISTS idx_trivia_results_user_id ON trivia_results(user_id);
CREATE INDEX IF NOT EXISTS idx_point_buy_offers_user_id ON point_buy_offers(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_check_ins_user_id ON streak_check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_video_ads_user_id ON video_ads_watched(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_feature ON rate_limits(user_id, feature_name);
CREATE INDEX IF NOT EXISTS idx_rate_limits_cooldown ON rate_limits(cooldown_until);
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target_user ON admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_timestamp ON admin_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_feature_limits_name ON feature_limits(feature_name);

-- Initialize Feature Limits (only if table is empty)
INSERT INTO feature_limits (feature_name, daily_limit, weekly_limit, hourly_limit, cooldown_seconds, min_requirement_points, enabled)
SELECT * FROM (VALUES
  ('spin_wheel_purchase', 10, NULL, NULL, 30, 0, true),
  ('spin_wheel_free', 2, NULL, NULL, 30, 0, true),
  ('marketplace_ad_post', 5, NULL, NULL, 7200, 100, true),
  ('marketplace_ad_active', 5, NULL, NULL, NULL, 100, true),
  ('point_sell_order', NULL, 50000, NULL, 3600, 1000, true),
  ('point_buy_order', NULL, 50000, NULL, NULL, 0, true),
  ('referral_create', 10, NULL, NULL, 86400, 0, true),
  ('cosmetic_purchase', 1, NULL, NULL, 86400, 100, true),
  ('redemption_claim', 1, 5, NULL, 86400, 500, true),
  ('video_ad_watch', 10, NULL, 2, 60, 0, true),
  ('trivia_game_play', 10, NULL, NULL, 300, 0, true),
  ('university_chat_message', NULL, NULL, 20, 30, 0, true)
) AS t(feature_name, daily_limit, weekly_limit, hourly_limit, cooldown_seconds, min_requirement_points, enabled)
WHERE NOT EXISTS (SELECT 1 FROM feature_limits);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsored_mission_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cosmetics_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_sell_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE spin_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_buy_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_ads_watched ENABLE ROW LEVEL SECURITY;
ALTER TABLE getting_started_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_limits ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies (if they don't exist, use DROP IF EXISTS first)
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- (Add remaining policies similarly with DROP IF EXISTS)
DROP POLICY IF EXISTS "System can insert sponsored missions" ON sponsored_mission_completions;
CREATE POLICY "System can insert sponsored missions" ON sponsored_mission_completions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own sponsored missions" ON sponsored_mission_completions;
CREATE POLICY "Users can read own sponsored missions" ON sponsored_mission_completions
  FOR SELECT USING (auth.uid() = user_id);

-- Getting Started Tasks Policies
DROP POLICY IF EXISTS "Users can read own getting started tasks" ON getting_started_tasks;
CREATE POLICY "Users can read own getting started tasks" ON getting_started_tasks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own getting started tasks" ON getting_started_tasks;
CREATE POLICY "Users can insert own getting started tasks" ON getting_started_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own getting started tasks" ON getting_started_tasks;
CREATE POLICY "Users can update own getting started tasks" ON getting_started_tasks
  FOR UPDATE USING (auth.uid() = user_id);

-- Streak Check-ins Policies
DROP POLICY IF EXISTS "Users can insert own check-ins" ON streak_check_ins;
CREATE POLICY "Users can insert own check-ins" ON streak_check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own check-ins" ON streak_check_ins;
CREATE POLICY "Users can read own check-ins" ON streak_check_ins
  FOR SELECT USING (auth.uid() = user_id);

-- Add more policies as needed...
