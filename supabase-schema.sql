-- ============================================
-- SUPABASE DATABASE SCHEMA FOR CAMPUS-X-HASKE
-- ============================================

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  university TEXT,
  department TEXT,
  course TEXT,
  points INTEGER DEFAULT 0,
  wallet DECIMAL DEFAULT 0,
  cosmetics_purchased TEXT[] DEFAULT '{}',
  profile_complete BOOLEAN DEFAULT FALSE,
  premium_tier TEXT,
  premium_until TIMESTAMP,
  current_streak INTEGER DEFAULT 0,
  week_points INTEGER DEFAULT 0,
  week_sold INTEGER DEFAULT 0,
  week_redeemed INTEGER DEFAULT 0,
  week_referrals INTEGER DEFAULT 0,
  week_logins INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions Table (Audit Log)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  amount INTEGER,
  base_bonus INTEGER,
  multiplier INTEGER DEFAULT 1,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Daily Missions Table
CREATE TABLE daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL,
  mission_name TEXT,
  base_reward INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Weekly Challenges Table
CREATE TABLE weekly_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sponsored Missions Table
CREATE TABLE sponsored_mission_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL,
  brand TEXT,
  base_reward INTEGER,
  points_awarded INTEGER,
  completed_at TIMESTAMP DEFAULT NOW()
);

-- Cosmetics Purchases Table
CREATE TABLE cosmetics_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cosmetic_id TEXT NOT NULL,
  cosmetic_name TEXT,
  price INTEGER,
  purchased_at TIMESTAMP DEFAULT NOW()
);

-- Point Sell Orders Table
CREATE TABLE point_sell_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_amount INTEGER NOT NULL,
  price_per_point DECIMAL NOT NULL,
  total_price DECIMAL NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  filled_at TIMESTAMP
);

-- Point Trades Table
CREATE TABLE point_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_amount INTEGER NOT NULL,
  price_per_point DECIMAL NOT NULL,
  total_price DECIMAL NOT NULL,
  traded_at TIMESTAMP DEFAULT NOW()
);

-- Redemptions Table
CREATE TABLE redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_name TEXT,
  status TEXT DEFAULT 'pending',
  points_used INTEGER,
  naira_value DECIMAL,
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP
);

-- Leaderboard Stats Table
CREATE TABLE leaderboard_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank INTEGER,
  total_points INTEGER,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Instagram Follows Table
CREATE TABLE instagram_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_name TEXT,
  verified BOOLEAN DEFAULT FALSE,
  reward_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Referrals Table
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_amount INTEGER DEFAULT 500,
  claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_daily_missions_user_id ON daily_missions(user_id);
CREATE INDEX idx_weekly_challenges_user_id ON weekly_challenges(user_id);
CREATE INDEX idx_sponsored_missions_user_id ON sponsored_mission_completions(user_id);
CREATE INDEX idx_cosmetics_user_id ON cosmetics_purchases(user_id);
CREATE INDEX idx_point_orders_user_id ON point_sell_orders(user_id);
CREATE INDEX idx_point_trades_user_id ON point_trades(seller_id, buyer_id);
CREATE INDEX idx_redemptions_user_id ON redemptions(user_id);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);

-- Row Level Security (RLS) - Enable it
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsored_mission_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cosmetics_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_sell_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for transactions (users see own)
CREATE POLICY "Users can read own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for daily missions
CREATE POLICY "Users can read own missions" ON daily_missions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own missions" ON daily_missions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Similar policies for other tables...
-- (abbreviated for space)
