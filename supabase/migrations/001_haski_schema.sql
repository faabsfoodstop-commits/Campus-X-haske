-- HASKii Core Schema - Phase 1

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  university VARCHAR(255),
  department VARCHAR(255),
  course VARCHAR(255),
  points BIGINT DEFAULT 0,
  wallet BIGINT DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  referral_code VARCHAR(20) UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  profile_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_check_in DATE
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  amount BIGINT NOT NULL,
  description TEXT,
  mission_id UUID,
  reward_id UUID,
  related_user_id UUID REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create streak check-ins table
CREATE TABLE IF NOT EXISTS streak_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  points_awarded BIGINT DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, check_in_date)
);

-- Create daily missions table
CREATE TABLE IF NOT EXISTS daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL,
  points_earned BIGINT DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, mission_id, DATE(created_at))
);

-- Create missions table (catalog)
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  points_reward BIGINT NOT NULL,
  difficulty VARCHAR(50),
  type VARCHAR(50),
  icon VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create activity log table
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create getting started tasks table
CREATE TABLE IF NOT EXISTS getting_started_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id VARCHAR(50) NOT NULL,
  points_awarded BIGINT DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, task_id)
);

-- Create video ads watched table
CREATE TABLE IF NOT EXISTS video_ads_watched (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_id VARCHAR(50) NOT NULL,
  watch_date DATE NOT NULL,
  watched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  points_earned BIGINT DEFAULT 0,
  UNIQUE(user_id, ad_id, watch_date)
);

-- Create redemptions table
CREATE TABLE IF NOT EXISTS redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_id VARCHAR(50) NOT NULL,
  points_spent BIGINT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  provider VARCHAR(100),
  reward_name VARCHAR(255),
  reward_code VARCHAR(100),
  failure_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referee_email VARCHAR(255),
  referee_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  referrer_points BIGINT DEFAULT 500,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_streak_check_ins_user_id ON streak_check_ins(user_id);
CREATE INDEX idx_daily_missions_user_id ON daily_missions(user_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_getting_started_tasks_user_id ON getting_started_tasks(user_id);
CREATE INDEX idx_video_ads_watched_user_id ON video_ads_watched(user_id);
CREATE INDEX idx_video_ads_watched_date ON video_ads_watched(watch_date);
CREATE INDEX idx_redemptions_user_id ON redemptions(user_id);
CREATE INDEX idx_redemptions_status ON redemptions(status);
CREATE INDEX idx_redemptions_created_at ON redemptions(created_at);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_status ON referrals(status);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE getting_started_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_ads_watched ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id OR is_admin = TRUE);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE
  ));

-- RLS Policies for streak_check_ins
CREATE POLICY "Users can view own check-ins" ON streak_check_ins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check-ins" ON streak_check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for daily_missions
CREATE POLICY "Users can view own missions" ON daily_missions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own missions" ON daily_missions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for activity_log
CREATE POLICY "Users can view own activity" ON activity_log
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for getting_started_tasks
CREATE POLICY "Users can view own tasks" ON getting_started_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON getting_started_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for video_ads_watched
CREATE POLICY "Users can view own watched ads" ON video_ads_watched
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert ad watches" ON video_ads_watched
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for redemptions
CREATE POLICY "Users can view own redemptions" ON redemptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert redemptions" ON redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for referrals
CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Users can insert referrals" ON referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- Missions seed data
INSERT INTO missions (title, description, points_reward, difficulty, type, icon) VALUES
  ('Watch Ad', 'Watch a 30-second video ad', 5, 'easy', 'video', '▶️'),
  ('Instagram Follow', 'Follow our Instagram account', 50, 'medium', 'social', '📷'),
  ('Invite Friend', 'Refer a friend to HASKii', 100, 'medium', 'referral', '👥'),
  ('Trivia Challenge', 'Answer 5 trivia questions correctly', 20, 'medium', 'trivia', '🧠'),
  ('Complete Profile', 'Fill out all profile information', 100, 'easy', 'onboarding', '👤'),
  ('First Redemption', 'Redeem points for airtime', 50, 'hard', 'redemption', '💰'),
  ('Weekly Check-In', 'Check in 7 days in a row', 200, 'hard', 'streak', '🔥')
ON CONFLICT DO NOTHING;
