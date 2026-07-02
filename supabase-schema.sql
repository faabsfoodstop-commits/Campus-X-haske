-- ============================================
-- SUPABASE DATABASE SCHEMA FOR CAMPUS-X-HASKE
-- ============================================

-- Users Table
CREATE TABLE users (
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
  current_streak INTEGER DEFAULT 0,
  week_points INTEGER DEFAULT 0,
  week_sold INTEGER DEFAULT 0,
  week_redeemed INTEGER DEFAULT 0,
  week_referrals INTEGER DEFAULT 0,
  week_logins INTEGER DEFAULT 0,
  daily_spins_remaining INTEGER DEFAULT 3,
  last_spin_reset_date DATE,
  is_admin BOOLEAN DEFAULT FALSE,
  bank_details JSONB,
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
  created_at TIMESTAMP DEFAULT NOW(),
  timestamp TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'pending'
);

-- User Ads Table (Marketplace)
CREATE TABLE user_ads (
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

-- University Chat Messages Table
CREATE TABLE university_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  university TEXT NOT NULL,
  message TEXT NOT NULL,
  sender_name TEXT,
  sender_avatar TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Campaigns Table (Brand Partnerships)
CREATE TABLE campaigns (
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

-- Point Marketplace Purchases Table
CREATE TABLE purchases (
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

-- Spin History Table
CREATE TABLE spin_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  result TEXT,
  points_earned INTEGER,
  multiplier TEXT,
  cost INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trivia Results Table
CREATE TABLE trivia_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  correct_answers INTEGER,
  total_questions INTEGER,
  points_earned INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Point Buy Offers Table
CREATE TABLE point_buy_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_amount INTEGER NOT NULL,
  price_per_point DECIMAL NOT NULL,
  total_price DECIMAL NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  filled_at TIMESTAMP
);

-- Streak Check-ins Table
CREATE TABLE streak_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  points_earned INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Video Ads Watched Table
CREATE TABLE video_ads_watched (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_id TEXT,
  points_earned INTEGER DEFAULT 10,
  watched_at TIMESTAMP DEFAULT NOW()
);

-- Withdrawals Table (Admin)
CREATE TABLE withdrawals (
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
CREATE INDEX idx_user_ads_user_id ON user_ads(user_id);
CREATE INDEX idx_user_ads_status ON user_ads(status);
CREATE INDEX idx_university_chat_university ON university_chat_messages(university);
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_spin_history_user_id ON spin_history(user_id);
CREATE INDEX idx_trivia_results_user_id ON trivia_results(user_id);
CREATE INDEX idx_point_buy_offers_user_id ON point_buy_offers(user_id);
CREATE INDEX idx_streak_check_ins_user_id ON streak_check_ins(user_id);
CREATE INDEX idx_video_ads_user_id ON video_ads_watched(user_id);
CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);

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
ALTER TABLE user_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE spin_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_buy_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_ads_watched ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

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

-- RLS Policies for user ads
CREATE POLICY "Users can read all approved ads" ON user_ads
  FOR SELECT USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Users can insert own ads" ON user_ads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ads" ON user_ads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ads" ON user_ads
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for university chat
CREATE POLICY "Users can read messages from their university" ON university_chat_messages
  FOR SELECT USING (true);

CREATE POLICY "Users can insert messages in their university" ON university_chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for purchases
CREATE POLICY "Users can read own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases" ON purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for spin history
CREATE POLICY "Users can read own spin history" ON spin_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spin history" ON spin_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for trivia results
CREATE POLICY "Users can read own trivia results" ON trivia_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trivia results" ON trivia_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for point buy offers
CREATE POLICY "Users can read all point buy offers" ON point_buy_offers
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own buy offers" ON point_buy_offers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for streak check-ins
CREATE POLICY "Users can read own check-ins" ON streak_check_ins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check-ins" ON streak_check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for video ads watched
CREATE POLICY "Users can read own video watches" ON video_ads_watched
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video watches" ON video_ads_watched
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for withdrawals
CREATE POLICY "Users can read own withdrawals" ON withdrawals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawals" ON withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Database Trigger for automatic user creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
