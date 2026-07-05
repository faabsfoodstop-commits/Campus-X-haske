# Week 1 Deployment Plan: Typing Master + QuickFire Trivia

**Timeline**: 7 days | **Target Revenue**: ₦2.425M Month 1 | **Target DAU**: 18,000

## Real-Time Sync Decision: Supabase Realtime

**Why Supabase Realtime (Winner):**
- ✅ Built into Supabase (zero extra cost)
- ✅ Native PostgreSQL LISTEN/NOTIFY integration
- ✅ Auto-scaling with Supabase infrastructure
- ✅ <100ms latency for leaderboard updates
- ✅ Handles multi-player synchronization natively
- ❌ Socket.io = separate Node.js server ($20-50/month extra) + maintenance overhead

**Implementation Pattern:**
```javascript
// Client-side subscription
const { data, error } = supabase
  .from('typing_matches')
  .on('*', payload => {
    setLiveMatch(payload.new);
  })
  .subscribe();
```

---

## Day 1: Database Deployment

### Morning (Hours 1-4): Core Infrastructure

Deploy shared infrastructure tables:

```sql
-- 1. Cosmetics System
CREATE TABLE IF NOT EXISTS cosmetics_catalog (
  id BIGSERIAL PRIMARY KEY,
  game_id VARCHAR(50) NOT NULL,
  cosmetic_type VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_tokens INT NOT NULL,
  rarity VARCHAR(20),
  preview_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_id, name),
  INDEX idx_game_cosmetics (game_id)
);

-- 2. Leaderboards
CREATE TABLE IF NOT EXISTS game_leaderboards (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  game_id VARCHAR(50) NOT NULL,
  leaderboard_type VARCHAR(50),
  rank_position INT,
  score INT,
  campus_id INT,
  period_start DATE,
  period_end DATE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, game_id, leaderboard_type, period_start),
  INDEX idx_game_leaderboard (game_id, period_start)
);

-- 3. Payout Ledger
CREATE TABLE IF NOT EXISTS payout_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  game_id VARCHAR(50) NOT NULL,
  payout_type VARCHAR(50),
  tokens_awarded INT NOT NULL,
  tournament_id BIGINT,
  reason TEXT,
  awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  claimed_at TIMESTAMP,
  INDEX idx_user_payouts (user_id, game_id)
);

-- 4. Fraud Reports
CREATE TABLE IF NOT EXISTS fraud_reports (
  id BIGSERIAL PRIMARY KEY,
  game_id VARCHAR(50) NOT NULL,
  reported_user_id UUID REFERENCES auth.users(id),
  report_type VARCHAR(50),
  evidence JSONB,
  severity_score FLOAT,
  is_confirmed BOOLEAN DEFAULT FALSE,
  action_taken VARCHAR(100),
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_fraud (reported_user_id, game_id)
);

-- 5. Gaming Sessions
CREATE TABLE IF NOT EXISTS gaming_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  game_id VARCHAR(50) NOT NULL,
  session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_end TIMESTAMP,
  session_duration_seconds INT,
  total_rounds INT,
  avg_score_per_round FLOAT,
  device_fingerprint VARCHAR(255),
  ip_address VARCHAR(45),
  is_suspicious BOOLEAN DEFAULT FALSE,
  INDEX idx_session_user (user_id, game_id)
);

-- 6. Notifications
CREATE TABLE IF NOT EXISTS game_notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  game_id VARCHAR(50) NOT NULL,
  notification_type VARCHAR(50),
  title VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_notifications (user_id, is_read)
);

-- 7. Token Ledger (if not already exists)
CREATE TABLE IF NOT EXISTS token_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  transaction_type VARCHAR(50),
  amount INT NOT NULL,
  reference_id BIGINT,
  reference_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_tokens (user_id, created_at)
);
```

### Afternoon (Hours 5-8): Typing Master Tables

```sql
CREATE TABLE IF NOT EXISTS typing_tournaments (
  id BIGSERIAL PRIMARY KEY,
  tournament_type VARCHAR(20) NOT NULL,
  difficulty_level VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'open',
  prize_pool_tokens INT,
  total_matches INT DEFAULT 0,
  INDEX idx_tournament_status (status, created_at)
);

CREATE TABLE IF NOT EXISTS typing_matches (
  id BIGSERIAL PRIMARY KEY,
  tournament_id BIGINT NOT NULL REFERENCES typing_tournaments(id) ON DELETE CASCADE,
  player1_id UUID NOT NULL REFERENCES auth.users(id),
  player2_id UUID NOT NULL REFERENCES auth.users(id),
  text_prompt_id BIGINT NOT NULL,
  player1_wpm INT,
  player1_accuracy_percent FLOAT,
  player1_completion_time_ms INT,
  player1_typos INT,
  player2_wpm INT,
  player2_accuracy_percent FLOAT,
  player2_completion_time_ms INT,
  player2_typos INT,
  winner_id UUID REFERENCES auth.users(id),
  loser_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  INDEX idx_match_players (player1_id, player2_id),
  INDEX idx_match_status (completed_at)
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
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_prompt_difficulty (difficulty_level)
);

CREATE TABLE IF NOT EXISTS typing_leaderboard (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
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
  UNIQUE(user_id, period_type, period_start),
  INDEX idx_leaderboard_rank (current_rank)
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
```

---

## Day 2: Trivia Tables

```sql
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
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_question_category (category, difficulty_level),
  INDEX idx_question_active (is_active)
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
  is_bonus_eligible BOOLEAN DEFAULT TRUE,
  INDEX idx_round_user (user_id),
  INDEX idx_round_completed (completed_at)
);

CREATE TABLE IF NOT EXISTS trivia_responses (
  id BIGSERIAL PRIMARY KEY,
  round_id BIGINT NOT NULL REFERENCES trivia_rounds(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES trivia_questions(id),
  selected_option_id VARCHAR(5),
  is_correct BOOLEAN,
  response_time_ms INT,
  points_earned INT,
  streak_at_time INT,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_response_round (round_id)
);

CREATE TABLE IF NOT EXISTS trivia_daily_winners (
  id BIGSERIAL PRIMARY KEY,
  round_date DATE NOT NULL,
  rank INT,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  final_score INT,
  tokens_awarded INT,
  claimed_at TIMESTAMP,
  campus_id INT,
  UNIQUE(round_date, rank),
  INDEX idx_winner_date (round_date)
);

CREATE TABLE IF NOT EXISTS trivia_leaderboard (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
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
  UNIQUE(user_id, period_type, period_start),
  INDEX idx_trivia_leaderboard (period_start, current_rank)
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
```

---

## Day 3: Stored Procedures + Triggers

```sql
-- Payout Function (Typing Master)
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

-- Payout Function (Trivia)
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

-- Leaderboard Update Trigger (Typing)
CREATE OR REPLACE FUNCTION update_typing_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO typing_leaderboard (user_id, total_matches, total_wins, win_rate_percent, 
                                   best_wpm, current_rank, period_type, period_start, period_end)
  SELECT 
    NEW.user_id,
    COUNT(*),
    COUNT(*) FILTER (WHERE winner_id = NEW.user_id),
    (COUNT(*) FILTER (WHERE winner_id = NEW.user_id)::FLOAT / COUNT(*)) * 100,
    MAX(CASE WHEN winner_id = NEW.user_id THEN player1_wpm ELSE player2_wpm END),
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC),
    'all_time',
    CURRENT_DATE - INTERVAL '1 month',
    CURRENT_DATE
  FROM typing_matches
  WHERE (player1_id = NEW.user_id OR player2_id = NEW.user_id) AND completed_at IS NOT NULL
  GROUP BY NEW.user_id
  ON CONFLICT (user_id, period_type, period_start) 
  DO UPDATE SET
    total_matches = EXCLUDED.total_matches,
    total_wins = EXCLUDED.total_wins,
    win_rate_percent = EXCLUDED.win_rate_percent,
    best_wpm = EXCLUDED.best_wpm,
    updated_at = CURRENT_TIMESTAMP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER typing_leaderboard_update
AFTER UPDATE ON typing_matches
FOR EACH ROW
WHEN (OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL)
EXECUTE FUNCTION update_typing_leaderboard();
```

---

## Days 4-5: Backend API Development

### Typing Master (12 endpoints)

```javascript
// Day 4 Tasks (Backend)
- POST /api/typing/match/create - Match initialization
- GET /api/typing/match/:matchId/live - Real-time match sync (Supabase Realtime)
- POST /api/typing/match/:matchId/submit - Submission validation
- POST /api/typing/match/:matchId/complete - Winner determination + payout
- GET /api/typing/prompts/categories - Prompt browser
- GET /api/typing/leaderboard/global - Global rankings
- GET /api/typing/leaderboard/campus/:campusId - Campus rankings
- GET /api/typing/user/stats - Personal statistics
- POST /api/typing/cosmetics/apply - Equip cosmetics
- GET /api/typing/cosmetics/shop - Shop browser
- POST /api/typing/cosmetics/purchase - Purchase flow
- GET /api/typing/match/history - Match history
```

### QuickFire Trivia (16 endpoints)

```javascript
// Day 5 Tasks (Backend)
- POST /api/trivia/round/start - Round initialization
- POST /api/trivia/round/:roundId/answer - Answer submission
- POST /api/trivia/round/:roundId/complete - Round completion + ranking
- GET /api/trivia/categories - Category browser
- GET /api/trivia/leaderboard/daily - Daily rankings
- GET /api/trivia/leaderboard/weekly - Weekly rankings
- GET /api/trivia/user/stats - Personal stats
- GET /api/trivia/user/history - Round history
- POST /api/trivia/cosmetics/purchase - Purchase cosmetics
- GET /api/trivia/cosmetics/shop - Shop browser
- GET /api/trivia/winners/today - Daily winners announcement
- POST /api/trivia/daily-challenge/claim - Claim bonuses
- POST /api/trivia/premium-round/multiplier-booster - Booster purchase
- GET /api/trivia/season/standings - Season leaderboard
- POST /api/trivia/round/:roundId/forfeit - Forfeit mechanics
```

**Implementation Approach (Days 4-5):**
- Use Supabase client library for all database operations
- Implement Supabase Realtime subscriptions for live leaderboard updates
- Use Supabase RLS (Row-Level Security) for user data isolation
- Stored procedures called via `supabase.rpc()` for atomic transactions

---

## Days 6-7: Frontend Components + Testing

### Day 6: Frontend Components

**Typing Master UI:**
- Home screen (tournament browser + quick match)
- Match lobby (opponent info)
- Race screen (real-time WPM display + opponent counter)
- Results screen (comparison + tokens awarded)
- Leaderboard (global + campus)
- Cosmetics shop

**QuickFire Trivia UI:**
- Home screen (daily winners + round type selector)
- Question screen (timer + 4 options)
- Results screen (rank + tokens)
- Daily winners display
- Cosmetics shop
- Stats dashboard

**Key Implementation Details:**
- Use Supabase Realtime for live leaderboard updates (<100ms latency)
- WebSocket NOT needed (Supabase Realtime handles it)
- All cosmetics loaded from `cosmetics_catalog` table
- Real-time notifications via `game_notifications` table

### Day 7: QA + Launch Preparation

**Testing Checklist:**
- [ ] Create 50+ typing prompts across difficulties
- [ ] Create 2,000 trivia questions (500 per category × 4 categories)
- [ ] Test match creation + real-time sync (Supabase Realtime)
- [ ] Test payout calculations (atomic transactions via stored procedures)
- [ ] Test fraud detection rules (timing anomalies, pattern detection)
- [ ] Load test with 1,000 concurrent users
- [ ] Verify leaderboard updates within 30 seconds
- [ ] Test cosmetics purchase flow
- [ ] Verify all notifications fire correctly
- [ ] Security: Test RLS policies prevent cross-user data access

---

## Deployment Checklist

### Database Layer (Supabase)
- [ ] All shared infrastructure tables deployed
- [ ] Typing Master tables deployed + indexes created
- [ ] Trivia tables deployed + indexes created
- [ ] Stored procedures deployed (payout functions)
- [ ] Triggers deployed (leaderboard updates)
- [ ] RLS policies configured for all tables
- [ ] Realtime subscriptions enabled for key tables

### Backend (Node.js + Supabase)
- [ ] All 28 API endpoints implemented
- [ ] Fraud detection engine running
- [ ] Token payout system atomic + tested
- [ ] Leaderboard calculation logic verified
- [ ] Error handling + logging configured
- [ ] Rate limiting enabled (100 matches/day per user for Typing)

### Frontend (React)
- [ ] All components created + styled
- [ ] Supabase Realtime subscriptions working
- [ ] Live leaderboard updates (<100ms)
- [ ] Cosmetics rendering working
- [ ] Notifications displaying correctly
- [ ] Analytics tracking configured

### Security
- [ ] JWT authentication verified
- [ ] RLS policies tested
- [ ] CORS configured
- [ ] Input validation on all endpoints
- [ ] Fraud detection running in background

---

## Cost Breakdown (Week 1)

| Service | Cost | Notes |
|---------|------|-------|
| Supabase (DB + Storage + Realtime) | $25/month | Included tier covers Week 1 |
| Supabase Realtime | $0 | Built-in, no extra cost |
| Backend Server (EC2 t3.small) | $8/month | Runs API endpoints |
| CDN (for cosmetics images) | $5/month | Supabase Storage + CloudFlare |
| **TOTAL** | **$38/month** | Scales linearly with DAU |

**Projected Revenue Week 1:** ₦600K (conservative) → **ROI: 1,579%**

---

## Success Metrics (Week 1-2)

| Metric | Target | Success Threshold |
|--------|--------|-------------------|
| DAU | 18,000 | 12,000+ |
| Typing Matches/Day | 40,000 | 25,000+ |
| Trivia Rounds/Day | 60,000 | 40,000+ |
| Revenue/Day | ₦115K | ₦80K+ |
| Fraud Detection Rate | <1% | <2% |
| Leaderboard Latency | <100ms | <500ms |
| User Retention (Day 7) | 40% | 30%+ |

---

## Next Actions (TODAY)

1. ✅ Confirm: Start Typing Master + Trivia Week 1
2. ✅ Confirm: Use Supabase Storage
3. ✅ Confirm: Use Supabase Realtime (free, integrated)
4. 📋 **Ready to deploy?** Begin Day 1 database deployment now

**Estimated Time to Revenue-Ready**: 7 days
**Go-Live Date**: End of Week 1
**First Revenue**: Day 8
