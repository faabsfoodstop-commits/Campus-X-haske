-- Day 1 Migration: Games Infrastructure + Typing Master + QuickFire Trivia
-- Simplified for Supabase compatibility

-- ============================================================================
-- 1. COSMETICS SYSTEM (Shared across all games)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cosmetics_catalog (
  id BIGSERIAL PRIMARY KEY,
  game_id VARCHAR(50) NOT NULL,
  cosmetic_type VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_tokens INT NOT NULL,
  rarity VARCHAR(20) DEFAULT 'common',
  preview_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_id, name)
);

CREATE TABLE IF NOT EXISTS user_cosmetics (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cosmetic_id BIGINT NOT NULL REFERENCES cosmetics_catalog(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_equipped BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, cosmetic_id)
);

-- ============================================================================
-- 2. GLOBAL LEADERBOARDS (Shared across all games)
-- ============================================================================

CREATE TABLE IF NOT EXISTS game_leaderboards (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id VARCHAR(50) NOT NULL,
  leaderboard_type VARCHAR(50),
  rank_position INT,
  score INT,
  campus_id INT,
  period_start DATE,
  period_end DATE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, game_id, leaderboard_type, period_start)
);

-- ============================================================================
-- 3. PAYOUT LEDGER (Shared across all games)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payout_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id VARCHAR(50) NOT NULL,
  payout_type VARCHAR(50),
  tokens_awarded INT NOT NULL,
  tournament_id BIGINT,
  reason TEXT,
  awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  claimed_at TIMESTAMP
);

-- ============================================================================
-- 4. FRAUD DETECTION (Shared across all games)
-- ============================================================================

CREATE TABLE IF NOT EXISTS fraud_reports (
  id BIGSERIAL PRIMARY KEY,
  game_id VARCHAR(50) NOT NULL,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  report_type VARCHAR(50),
  evidence JSONB,
  severity_score FLOAT DEFAULT 0,
  is_confirmed BOOLEAN DEFAULT FALSE,
  action_taken VARCHAR(100),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. GAMING SESSIONS (Shared across all games)
-- ============================================================================

CREATE TABLE IF NOT EXISTS gaming_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id VARCHAR(50) NOT NULL,
  session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_end TIMESTAMP,
  session_duration_seconds INT,
  total_rounds INT,
  avg_score_per_round FLOAT,
  device_fingerprint VARCHAR(255),
  ip_address VARCHAR(45),
  is_suspicious BOOLEAN DEFAULT FALSE
);

-- ============================================================================
-- 6. NOTIFICATIONS (Shared across all games)
-- ============================================================================

CREATE TABLE IF NOT EXISTS game_notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id VARCHAR(50) NOT NULL,
  notification_type VARCHAR(50),
  title VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. TOKEN LEDGER (Shared across all games)
-- ============================================================================

CREATE TABLE IF NOT EXISTS token_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL,
  amount INT NOT NULL,
  reference_id BIGINT,
  reference_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TYPING MASTER TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS typing_tournaments (
  id BIGSERIAL PRIMARY KEY,
  tournament_type VARCHAR(20) NOT NULL,
  difficulty_level VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'open',
  prize_pool_tokens INT,
  total_matches INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS typing_matches (
  id BIGSERIAL PRIMARY KEY,
  tournament_id BIGINT NOT NULL REFERENCES typing_tournaments(id) ON DELETE CASCADE,
  player1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text_prompt_id BIGINT NOT NULL,
  player1_wpm INT,
  player1_accuracy_percent FLOAT,
  player1_completion_time_ms INT,
  player1_typos INT,
  player2_wpm INT,
  player2_accuracy_percent FLOAT,
  player2_completion_time_ms INT,
  player2_typos INT,
  winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  loser_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS typing_prompts (
  id BIGSERIAL PRIMARY KEY,
  difficulty_level VARCHAR(20) NOT NULL,
  category VARCHAR(50),
  text_content TEXT NOT NULL,
  character_count INT NOT NULL,
  estimated_wpm INT,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS typing_leaderboard (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campus_id INT,
  total_matches INT DEFAULT 0,
  total_wins INT DEFAULT 0,
  win_rate_percent FLOAT DEFAULT 0,
  best_wpm INT DEFAULT 0,
  avg_wpm_all_time FLOAT DEFAULT 0,
  current_rank INT,
  period_type VARCHAR(20),
  period_start DATE,
  period_end DATE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, period_type, period_start)
);

CREATE TABLE IF NOT EXISTS typing_user_stats (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_matches INT DEFAULT 0,
  total_wins INT DEFAULT 0,
  total_losses INT DEFAULT 0,
  best_wpm INT DEFAULT 0,
  avg_accuracy_percent FLOAT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  tokens_earned INT DEFAULT 0,
  tokens_spent INT DEFAULT 0,
  preferred_difficulty VARCHAR(20) DEFAULT 'medium',
  last_match_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- QUICKFIRE TRIVIA TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS trivia_questions (
  id BIGSERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  difficulty_level VARCHAR(20) NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option_id VARCHAR(5) NOT NULL,
  explanation TEXT,
  usage_count INT DEFAULT 0,
  correct_answer_rate FLOAT DEFAULT 0.5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS trivia_rounds (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  round_type VARCHAR(20) NOT NULL,
  difficulty_level VARCHAR(20) DEFAULT 'mixed',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  final_score INT DEFAULT 0,
  question_count INT DEFAULT 10,
  correct_answers INT DEFAULT 0,
  accuracy_percent FLOAT DEFAULT 0,
  streak_max INT DEFAULT 0,
  tokens_spent INT,
  tokens_earned INT,
  rank_in_daily INT,
  campus_id INT,
  is_bonus_eligible BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS trivia_responses (
  id BIGSERIAL PRIMARY KEY,
  round_id BIGINT NOT NULL REFERENCES trivia_rounds(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES trivia_questions(id) ON DELETE CASCADE,
  selected_option_id VARCHAR(5),
  is_correct BOOLEAN,
  response_time_ms INT,
  points_earned INT,
  streak_at_time INT,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trivia_daily_winners (
  id BIGSERIAL PRIMARY KEY,
  round_date DATE NOT NULL,
  rank INT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  final_score INT,
  tokens_awarded INT,
  claimed_at TIMESTAMP,
  campus_id INT,
  UNIQUE(round_date, rank)
);

CREATE TABLE IF NOT EXISTS trivia_leaderboard (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campus_id INT,
  period_type VARCHAR(20),
  period_start DATE,
  period_end DATE,
  total_rounds INT DEFAULT 0,
  best_score INT DEFAULT 0,
  total_points INT DEFAULT 0,
  accuracy_percent FLOAT DEFAULT 0,
  current_rank INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, period_type, period_start)
);

CREATE TABLE IF NOT EXISTS trivia_user_stats (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_rounds INT DEFAULT 0,
  total_points INT DEFAULT 0,
  avg_accuracy FLOAT DEFAULT 0,
  best_score INT DEFAULT 0,
  favorite_category VARCHAR(50),
  total_wins INT DEFAULT 0,
  tokens_earned INT DEFAULT 0,
  tokens_spent INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PAYOUT STORED PROCEDURES
-- ============================================================================

CREATE OR REPLACE FUNCTION award_typing_payout(
  p_user_id UUID,
  p_match_id BIGINT,
  p_tokens_amount INT,
  p_reason VARCHAR
) RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO payout_ledger (user_id, game_id, payout_type, tokens_awarded, tournament_id, reason)
  VALUES (p_user_id, 'typing', 'match_win', p_tokens_amount, p_match_id, p_reason);

  UPDATE user_profiles
  SET token_balance = token_balance + p_tokens_amount
  WHERE id = p_user_id;

  INSERT INTO token_ledger (user_id, transaction_type, amount, reference_id, reference_type)
  VALUES (p_user_id, 'payout', p_tokens_amount, p_match_id, 'typing_match');

  INSERT INTO game_notifications (user_id, game_id, notification_type, title, message, metadata)
  VALUES (p_user_id, 'typing', 'tournament_result', 'Match Win!',
          'You won ' || p_tokens_amount || ' tokens!',
          jsonb_build_object('amount', p_tokens_amount, 'match_id', p_match_id));

  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION award_trivia_payout(
  p_user_id UUID,
  p_round_id BIGINT,
  p_tokens_amount INT,
  p_reason VARCHAR
) RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO payout_ledger (user_id, game_id, payout_type, tokens_awarded, tournament_id, reason)
  VALUES (p_user_id, 'trivia', 'daily_winner', p_tokens_amount, p_round_id, p_reason);

  UPDATE user_profiles
  SET token_balance = token_balance + p_tokens_amount
  WHERE id = p_user_id;

  INSERT INTO token_ledger (user_id, transaction_type, amount, reference_id, reference_type)
  VALUES (p_user_id, 'payout', p_tokens_amount, p_round_id, 'trivia_round');

  INSERT INTO game_notifications (user_id, game_id, notification_type, title, message, metadata)
  VALUES (p_user_id, 'trivia', 'tournament_result', 'Daily Winner!',
          'You earned ₦' || (p_tokens_amount * 0.10)::INT || ' today!',
          jsonb_build_object('amount', p_tokens_amount, 'round_id', p_round_id));

  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- LEADERBOARD UPDATE TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_typing_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO typing_leaderboard (
    user_id, total_matches, total_wins, win_rate_percent,
    best_wpm, current_rank, period_type, period_start, period_end, updated_at
  )
  SELECT
    NEW.user_id,
    COUNT(*) as total_matches,
    COUNT(*) FILTER (WHERE winner_id = NEW.user_id) as total_wins,
    COALESCE((COUNT(*) FILTER (WHERE winner_id = NEW.user_id)::FLOAT / NULLIF(COUNT(*), 0)) * 100, 0) as win_rate,
    MAX(CASE WHEN winner_id = NEW.user_id THEN player1_wpm ELSE player2_wpm END) as best_wpm,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as current_rank,
    'all_time',
    CURRENT_DATE - INTERVAL '1 month',
    CURRENT_DATE,
    CURRENT_TIMESTAMP
  FROM typing_matches
  WHERE (player1_id = NEW.user_id OR player2_id = NEW.user_id) AND completed_at IS NOT NULL
  GROUP BY NEW.user_id
  ON CONFLICT (user_id, period_type, period_start)
  DO UPDATE SET
    total_matches = EXCLUDED.total_matches,
    total_wins = EXCLUDED.total_wins,
    win_rate_percent = EXCLUDED.win_rate_percent,
    best_wpm = EXCLUDED.best_wpm,
    current_rank = EXCLUDED.current_rank,
    updated_at = CURRENT_TIMESTAMP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER typing_leaderboard_update
AFTER UPDATE ON typing_matches
FOR EACH ROW
WHEN (OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL)
EXECUTE FUNCTION update_typing_leaderboard();

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE cosmetics_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cosmetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE gaming_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia_daily_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia_user_stats ENABLE ROW LEVEL SECURITY;

-- User can only see their own cosmetics
CREATE POLICY "Users can view their own cosmetics" ON user_cosmetics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cosmetics" ON user_cosmetics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Cosmetics catalog is public
CREATE POLICY "Cosmetics catalog is public" ON cosmetics_catalog
  FOR SELECT USING (true);

-- Users can only see their own stats
CREATE POLICY "Users can view own typing stats" ON typing_user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own trivia stats" ON trivia_user_stats
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON game_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON game_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Leaderboards are public
CREATE POLICY "Leaderboards are public" ON game_leaderboards
  FOR SELECT USING (true);

-- Users can only see their own payout history
CREATE POLICY "Users can view own payouts" ON payout_ledger
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own token ledger
CREATE POLICY "Users can view own token ledger" ON token_ledger
  FOR SELECT USING (auth.uid() = user_id);

-- Typing matches - users can see matches they participated in
CREATE POLICY "Users can view their typing matches" ON typing_matches
  FOR SELECT USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Trivia rounds - users can only see their own
CREATE POLICY "Users can view their trivia rounds" ON trivia_rounds
  FOR SELECT USING (auth.uid() = user_id);

-- Trivia responses - users can only see their own
CREATE POLICY "Users can view their trivia responses" ON trivia_responses
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM trivia_rounds WHERE id = trivia_responses.round_id
    )
  );

-- Trivia questions are public
CREATE POLICY "Trivia questions are public" ON trivia_questions
  FOR SELECT USING (is_active = true);

-- Typing prompts are public
CREATE POLICY "Typing prompts are public" ON typing_prompts
  FOR SELECT USING (is_active = true);
