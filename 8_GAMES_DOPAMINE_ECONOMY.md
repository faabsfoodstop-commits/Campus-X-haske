# 8 Games Dopamine Economy - Complete Build Specification

**Total Month 1 Revenue: ₦6.18M | Month 6: ₦32.1M**

---

## Table of Contents

1. [Shared Infrastructure](#shared-infrastructure)
2. [Game 1: Typing Master](#game-1-typing-master)
3. [Game 2: QuickFire Trivia](#game-2-quickfire-trivia)
4. [Game 3: Code Challenges](#game-3-code-challenges)
5. [Game 4: Music Quiz Master](#game-4-music-quiz-master)
6. [Game 5: Draw & Guess](#game-5-draw--guess)
7. [Game 6: Reaction King](#game-6-reaction-king)
8. [Game 7: Karaoke Challenge](#game-7-karaoke-challenge)
9. [Game 8: Daily Puzzle Master](#game-8-daily-puzzle-master)
10. [Fraud Detection Framework](#fraud-detection-framework)
11. [Implementation Timeline](#implementation-timeline)

---

## Shared Infrastructure

### Database Tables (Core Systems)

```sql
-- Cosmetics System (shared across all games)
CREATE TABLE cosmetics_catalog (
  id BIGSERIAL PRIMARY KEY,
  game_id VARCHAR(50) NOT NULL, -- 'typing', 'trivia', 'code', 'music', 'drawing', 'reaction', 'karaoke', 'puzzle' OR 'global'
  cosmetic_type VARCHAR(50) NOT NULL, -- 'avatar', 'ui_theme', 'effect', 'badge', 'frame', 'title'
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_tokens INT NOT NULL,
  rarity VARCHAR(20), -- 'common', 'rare', 'epic', 'legendary'
  preview_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_id, name)
);

CREATE TABLE user_cosmetics (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  cosmetic_id BIGINT NOT NULL REFERENCES cosmetics_catalog(id),
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_equipped BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, cosmetic_id)
);

-- Global Leaderboards
CREATE TABLE game_leaderboards (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  game_id VARCHAR(50) NOT NULL,
  leaderboard_type VARCHAR(50), -- 'global', 'campus', 'weekly', 'daily'
  rank_position INT,
  score INT,
  campus_id INT,
  period_start DATE,
  period_end DATE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, game_id, leaderboard_type, period_start)
);

-- Fraud Detection
CREATE TABLE fraud_reports (
  id BIGSERIAL PRIMARY KEY,
  game_id VARCHAR(50) NOT NULL,
  reported_user_id UUID REFERENCES auth.users(id),
  report_type VARCHAR(50), -- 'bot_detection', 'vote_manipulation', 'submission_spam', 'unlikely_score', 'rapid_completion'
  evidence JSONB,
  severity_score FLOAT,
  is_confirmed BOOLEAN DEFAULT FALSE,
  action_taken VARCHAR(100), -- 'none', 'warning', 'points_deduction', 'suspension', 'ban'
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payout Ledger
CREATE TABLE payout_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  game_id VARCHAR(50) NOT NULL,
  payout_type VARCHAR(50), -- 'tournament_win', 'leaderboard_reward', 'daily_bonus', 'streak_bonus'
  tokens_awarded INT NOT NULL,
  tournament_id BIGINT,
  reason TEXT,
  awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  claimed_at TIMESTAMP
);

-- Gaming Sessions (for analytics & fraud detection)
CREATE TABLE gaming_sessions (
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
  is_suspicious BOOLEAN DEFAULT FALSE
);

-- Notifications
CREATE TABLE game_notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  game_id VARCHAR(50) NOT NULL,
  notification_type VARCHAR(50), -- 'tournament_result', 'leaderboard_rank_change', 'cosmetics_received', 'streak_milestone', 'new_tournament'
  title VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Shared API Patterns

All games follow this authentication pattern:
```
Authorization: Bearer <JWT_TOKEN>
X-Campus-ID: <campus_id> (optional, for campus-scoped games)
```

All responses:
```json
{
  "status": "success|error",
  "data": { /* game-specific data */ },
  "error": "error message",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Payout Engine (Atomic Transactions)

```sql
-- Stored Procedure: Award Tournament Tokens
CREATE OR REPLACE FUNCTION award_tournament_payout(
  p_user_id UUID,
  p_game_id VARCHAR,
  p_tournament_id BIGINT,
  p_tokens_amount INT,
  p_reason VARCHAR
) RETURNS BOOLEAN AS $$
BEGIN
  -- Insert payout record
  INSERT INTO payout_ledger (user_id, game_id, payout_type, tokens_awarded, tournament_id, reason)
  VALUES (p_user_id, p_game_id, 'tournament_win', p_tokens_amount, p_tournament_id, p_reason);
  
  -- Update user token balance (atomic transaction)
  UPDATE user_profiles
  SET token_balance = token_balance + p_tokens_amount
  WHERE id = p_user_id;
  
  -- Log in audit trail
  INSERT INTO token_ledger (user_id, transaction_type, amount, reference_id, reference_type)
  VALUES (p_user_id, 'payout', p_tokens_amount, p_tournament_id, 'tournament');
  
  -- Create notification
  INSERT INTO game_notifications (user_id, game_id, notification_type, title, message, metadata)
  VALUES (p_user_id, p_game_id, 'tournament_result', 'Tournament Win!', 
          'You won ' || p_tokens_amount || ' tokens!', 
          jsonb_build_object('amount', p_tokens_amount, 'tournament_id', p_tournament_id));
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Game 1: Typing Master

**Month 1 Revenue: ₦1.45M | Players: ~8,000 | Avg Session: 5 min**

### Game Mechanics

- Players race to type provided text faster than opponents
- 1v1 duels in real-time
- Accuracy penalties: Each typo adds 0.5 seconds
- Difficulty levels:
  - Easy: Simple English sentences (50-100 WPM baseline)
  - Medium: Nigerian proverbs & song lyrics (80-130 WPM)
  - Hard: Technical documentation & Shakespeare (120-180+ WPM)
- Entry fee: 100 tokens (₦10)
- Winner: 1st place gets 180 tokens (₦18), 2nd place gets 40 tokens refund (net 0)
- Platform keeps 100 tokens (₦10) per match = 100% rake

### Database Schema

```sql
CREATE TABLE typing_tournaments (
  id BIGSERIAL PRIMARY KEY,
  tournament_type VARCHAR(20) NOT NULL, -- 'quick_match', 'daily_ladder', 'weekly_championship'
  difficulty_level VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_progress', 'completed'
  prize_pool_tokens INT,
  total_matches INT DEFAULT 0
);

CREATE TABLE typing_matches (
  id BIGSERIAL PRIMARY KEY,
  tournament_id BIGINT NOT NULL REFERENCES typing_tournaments(id),
  player1_id UUID NOT NULL REFERENCES auth.users(id),
  player2_id UUID NOT NULL REFERENCES auth.users(id),
  text_prompt_id BIGINT NOT NULL,
  
  -- Player 1 stats
  player1_wpm INT,
  player1_accuracy_percent FLOAT,
  player1_completion_time_ms INT,
  player1_typos INT,
  
  -- Player 2 stats
  player2_wpm INT,
  player2_accuracy_percent FLOAT,
  player2_completion_time_ms INT,
  player2_typos INT,
  
  winner_id UUID REFERENCES auth.users(id),
  loser_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE typing_prompts (
  id BIGSERIAL PRIMARY KEY,
  difficulty_level VARCHAR(20) NOT NULL,
  category VARCHAR(50), -- 'nigerian_proverbs', 'song_lyrics', 'technical', 'shakespeare', 'news'
  text_content TEXT NOT NULL,
  character_count INT NOT NULL,
  estimated_wpm INT, -- baseline WPM for this prompt
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE typing_leaderboard (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  campus_id INT,
  total_matches INT DEFAULT 0,
  total_wins INT DEFAULT 0,
  win_rate_percent FLOAT DEFAULT 0,
  best_wpm INT DEFAULT 0,
  avg_wpm_all_time FLOAT DEFAULT 0,
  current_rank INT,
  period_type VARCHAR(20), -- 'all_time', 'weekly', 'daily'
  period_start DATE,
  period_end DATE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, period_type, period_start)
);

CREATE TABLE typing_user_stats (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
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

### API Endpoints (14 endpoints)

```
POST   /api/typing/match/create
       Body: { difficulty: 'easy|medium|hard', tournament_id?: int }
       Response: { match_id, player1_id, opponent_id, prompt_text, start_time }

GET    /api/typing/match/:matchId/live
       Response: { player1_wpm, player2_wpm, player1_accuracy, player2_accuracy, time_remaining }

POST   /api/typing/match/:matchId/submit
       Body: { typed_text, completion_time_ms }
       Response: { wpm, accuracy_percent, typos, final_time }

POST   /api/typing/match/:matchId/complete
       Response: { winner_id, tokens_awarded, loser_tokens }
       Calls: award_tournament_payout() for both players

GET    /api/typing/prompts/categories
       Response: [{ category, difficulty_count, estimated_wpm_range }]

GET    /api/typing/leaderboard/global
       Query: { period: 'daily|weekly|all_time', limit: 100, offset: 0 }
       Response: [{ rank, user_id, username, campus, wpm, accuracy, wins, tokens }]

GET    /api/typing/leaderboard/campus/:campusId
       Response: [{ rank, user_id, username, wpm, wins, tokens }]

GET    /api/typing/user/stats
       Response: { total_matches, wins, losses, best_wpm, avg_accuracy, streak, cosmetics_owned }

POST   /api/typing/cosmetics/apply
       Body: { cosmetic_id, cosmetic_type: 'keyboard_skin|ui_theme|title' }
       Response: { success, applied_cosmetic }

GET    /api/typing/cosmetics/shop
       Response: [{ id, name, type, price_tokens, rarity, preview_url, owned: bool }]

POST   /api/typing/cosmetics/purchase
       Body: { cosmetic_id }
       Response: { success, new_token_balance, cosmetic }

GET    /api/typing/tournament/active
       Response: [{ tournament_id, type, difficulty, players_joined, prize_pool, starts_at }]

POST   /api/typing/tournament/:tournamentId/join
       Body: {}
       Response: { success, tournament_id, seed_position, matches_to_play }

GET    /api/typing/match/history
       Query: { limit: 20, offset: 0 }
       Response: [{ match_id, opponent, result, wpm, accuracy, tokens_earned, played_at }]
```

### Frontend Components

**Screens:**
1. Typing Home - Tournament browser + quick match CTA
2. Match Lobby - Opponent info + difficulty selector
3. Race Screen - Live text input + animated race car graphics + opponent WPM counter
4. Results Screen - Match recap + WPM comparison + tokens awarded
5. Leaderboard - Global/campus rankings + cosmetics display
6. Shop - Cosmetics browser + purchase flow
7. Stats Dashboard - Personal stats + streak tracker + best performances

**Key UI Elements:**
- Real-time WPM display (updates every keystroke)
- Accuracy percentage bar (visual accuracy feedback)
- Opponent's live WPM counter
- Animated race car that moves based on typing speed
- Typo highlight (red underline)
- Cosmetics preview (keyboard skins, title effects)

### Fraud Prevention

```
1. Typing Speed Anomaly Detection:
   - Flag if WPM > 250 (human limit ~150, professional ~200)
   - Flag if accuracy = 100% with WPM > 120 (statistically unlikely)
   - Flag if same player wins 15+ matches in 1 hour (bot behavior)

2. Input Validation:
   - Verify client-side keystroke timing matches server received submission
   - Detect copy-paste behavior (unlikely character-by-character timing)
   - Detect automated typing tools (consistent inter-keystroke intervals)

3. Session Monitoring:
   - Max 20 matches per hour (rate limiting)
   - If 10+ matches in 30 mins, require CAPTCHA before next match
   - Restrict to 1 active match at a time

4. Device Fingerprinting:
   - Track device + IP combinations
   - Flag if same device plays >50 matches/day across multiple accounts
   - Correlate with cosmetics purchases for account farming detection
```

### Payout Calculation

```javascript
// Per match payout logic
function calculateTypingPayouts(match) {
  const ENTRY_FEE = 100; // tokens
  const WINNER_PAYOUT = 180; // 80% + entry fee
  const LOSER_REFUND = 40; // 40% consolation
  const PLATFORM_RAKE = 100; // ENTRY_FEE * 1
  
  // Bonus multipliers
  let winnerBonus = 1.0;
  if (match.player_streak > 5) winnerBonus = 1.2; // 5+ streak = 20% bonus
  if (match.player_streak > 10) winnerBonus = 1.5; // 10+ streak = 50% bonus
  if (match.accuracy_percent > 99) winnerBonus += 0.1; // Perfect accuracy
  
  const finalWinnerPayout = Math.floor(WINNER_PAYOUT * winnerBonus);
  
  // Award tokens
  await award_tournament_payout(winner_id, 'typing', match_id, finalWinnerPayout, 'Match win');
  await award_tournament_payout(loser_id, 'typing', match_id, LOSER_REFUND, 'Consolation');
  
  // Platform revenue
  return {
    platform_tokens: PLATFORM_RAKE,
    platform_naira: PLATFORM_RAKE * 0.10,
    user_tokens_distributed: finalWinnerPayout + LOSER_REFUND
  };
}
```

### Monthly Revenue Breakdown

```
Scenario: 8,000 daily active users, avg 5 matches/day

Entry Fees (100 tokens per match):
  8,000 users × 5 matches × 100 tokens = 4,000,000 tokens/day
  Platform rake: 100 tokens per match = 400,000 tokens/day
  = 400,000 × 0.10 = ₦40,000/day = ₦1.2M/month

Cosmetics Sales (12% conversion, avg 300 tokens/cosmetic):
  8,000 × 0.12 × 300 tokens = 288,000 tokens/day
  Profit (100% margin) = 288,000 × 0.10 = ₦28,800/day = ₦864K/month

Daily Streak Bonuses (5% of winners get 20%+ bonus):
  Players with 5+ streaks earn extra tokens, minimal platform cost

Premium Keyboard Skins (5% conversion, 500 tokens):
  8,000 × 0.05 × 500 × 0.10 = ₦200K/month

Sponsorships & Ads (keyboard brand placements):
  ₦200K/month (potential)

TOTAL MONTH 1: ₦1.2M + ₦864K + ₦200K = ₦2.264M

MONTH 6 (10,000 DAU, 6 matches/day):
  10,000 × 6 × 100 × 0.10 = ₦600K (rake)
  + ₦1.2M (cosmetics scaling)
  + ₦300K (premium features)
  = ₦2.1M/month (scaled)

Actual Month 1 Projection: ₦1.45M (conservative)
```

### Implementation Checklist (Week 1)

- [ ] Database schema deployment (Day 1)
- [ ] Create 50+ typing prompts across difficulties (Day 1-2)
- [ ] Backend API endpoints (Days 2-3)
- [ ] Real-time match engine (WebSocket) (Days 3-4)
- [ ] Leaderboard calculation & caching (Day 4)
- [ ] Fraud detection rules (Day 4)
- [ ] Frontend components (Days 4-5)
- [ ] Testing & QA (Days 5-7)

---

## Game 2: QuickFire Trivia

**Month 1 Revenue: ₦980K | Players: ~10,000 | Avg Session: 3 min**

### Game Mechanics

- 10-question rounds, 10 seconds per question
- Streak multipliers: 1 correct = 10 pts, 2+ = 25 pts/Q, 5+ = 50 pts/Q, 10 = 100 pts/Q
- Categories: Campus trivia, Nigerian pop culture, STEM, entertainment, current events
- Entry: Free OR 50 tokens for "premium round" (higher rewards)
- Win condition: Highest score after 10 questions
- Payouts:
  - Free round: Top 10 daily winners get 200 tokens (₦20)
  - Premium round: Entry 50 tokens, winners get 300+ tokens (₦30+)
- Leaderboard resets daily

### Database Schema

```sql
CREATE TABLE trivia_questions (
  id BIGSERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL, -- 'campus', 'nigerian_culture', 'stem', 'entertainment', 'news'
  difficulty_level VARCHAR(20) NOT NULL, -- 'easy', 'medium', 'hard'
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- [{ id: 'a', text: 'Option A' }, ...]
  correct_option_id VARCHAR(5) NOT NULL,
  explanation TEXT,
  usage_count INT DEFAULT 0,
  correct_answer_rate FLOAT DEFAULT 0.5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_category_difficulty (category, difficulty_level)
);

CREATE TABLE trivia_rounds (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  round_type VARCHAR(20) NOT NULL, -- 'free', 'premium'
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
  rank_in_daily INT, -- 1-10 for top 10
  campus_id INT,
  is_bonus_eligible BOOLEAN DEFAULT TRUE
);

CREATE TABLE trivia_responses (
  id BIGSERIAL PRIMARY KEY,
  round_id BIGINT NOT NULL REFERENCES trivia_rounds(id),
  question_id BIGINT NOT NULL REFERENCES trivia_questions(id),
  selected_option_id VARCHAR(5),
  is_correct BOOLEAN,
  response_time_ms INT, -- Time to answer from question display
  points_earned INT,
  streak_at_time INT,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trivia_daily_winners (
  id BIGSERIAL PRIMARY KEY,
  round_date DATE NOT NULL,
  rank INT, -- 1-10
  user_id UUID NOT NULL REFERENCES auth.users(id),
  final_score INT,
  tokens_awarded INT,
  claimed_at TIMESTAMP,
  campus_id INT,
  UNIQUE(round_date, rank)
);

CREATE TABLE trivia_leaderboard (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  campus_id INT,
  period_type VARCHAR(20), -- 'daily', 'weekly', 'all_time'
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

CREATE TABLE trivia_user_stats (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
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

### API Endpoints (16 endpoints)

```
POST   /api/trivia/round/start
       Body: { round_type: 'free|premium' }
       Response: { round_id, questions: [{ id, text, options }], timer: 10000ms }

POST   /api/trivia/round/:roundId/answer
       Body: { question_id, selected_option_id, response_time_ms }
       Response: { is_correct, correct_option, streak, points_earned, next_question }

POST   /api/trivia/round/:roundId/complete
       Response: { final_score, accuracy, rank_today, tokens_earned }
       Calls: award_tournament_payout() + calculate_daily_rankings()

GET    /api/trivia/categories
       Response: [{ category, total_questions, difficulty_distribution }]

GET    /api/trivia/leaderboard/daily
       Query: { limit: 100, offset: 0, campus_id?: int }
       Response: [{ rank, user_id, username, score, accuracy, wins }]

GET    /api/trivia/leaderboard/weekly
       Response: [{ rank, user_id, username, total_points, accuracy }]

GET    /api/trivia/user/stats
       Response: { total_rounds, best_score, accuracy, favorite_category, tokens_earned, wins }

GET    /api/trivia/user/history
       Query: { limit: 20, offset: 0 }
       Response: [{ round_id, score, accuracy, rank, earned_tokens, played_at }]

POST   /api/trivia/cosmetics/purchase
       Body: { cosmetic_id: 'avatar_nerd', 'badge_trivia_master', 'title_quiz_king' }
       Response: { success, new_balance }

GET    /api/trivia/cosmetics/shop
       Response: [{ id, name, type, price_tokens, owned }]

GET    /api/trivia/winners/today
       Response: [{ rank, user_id, username, score, tokens_awarded, campus }]

POST   /api/trivia/daily-challenge/claim
       Body: {}
       Response: { success, bonus_tokens }

GET    /api/trivia/questions/by-category/:category
       Query: { limit: 50 }
       Response: [{ id, question, difficulty, correct_answer_rate }]

POST   /api/trivia/premium-round/multiplier-booster
       Body: { booster_type: '2x_points|streak_saver|extra_question' }
       Response: { success, tokens_spent, new_balance }

GET    /api/trivia/season/standings
       Response: [{ rank, user_id, username, cumulative_points, tokens_earned }]

POST   /api/trivia/round/:roundId/forfeit
       Response: { final_score, tokens_reimbursed }
```

### Frontend Components

**Screens:**
1. Home - Daily winners display + round type selector
2. Question Screen - Question + 4 options + timer countdown + streak indicator
3. Results - Score breakdown + streak info + daily rank
4. Daily Winners - Top 10 leaderboard with campus tags
5. Shop - Avatar cosmetics + title badges
6. Stats - Personal stats + category breakdown
7. Premium Booster Shop - 2x points, streak savers, etc.

**UI Elements:**
- 10-second countdown timer (visual + audio cue)
- Streak counter (cumulative during round)
- Points multiplier display (1x, 2.5x, 5x, 10x)
- Daily rank indicator (live update after final question)
- Campus ranking badge

### Fraud Prevention

```
1. Timing Anomalies:
   - Flag if avg response time < 1.5 seconds (too fast for real thought)
   - Flag if response time = 0 (submission before question loads)
   - Flag if all 10 questions answered < 15 seconds total

2. Pattern Detection:
   - Flag if new user gets 100% accuracy on first 5 rounds
   - Flag if user accuracy = 100% for 100+ questions (statistically impossible)
   - Anomaly score if accuracy suddenly spikes (e.g., 60% → 95%)

3. Answer Patterns:
   - Detect same option selected >70% of time (bot selecting 'C')
   - Detect answer patterns matching previous user responses (shared accounts)
   - Monitor for rapid question rotations (replay detection)

4. Account Behavior:
   - Max 30 rounds per day (rate limiting)
   - Flag accounts <1 week old winning daily prizes (new account farming)
   - Restrict to 1 active round at a time

5. Question-Level Validation:
   - If question has <30% correct answer rate, remove from pool (too hard/bugged)
   - If >80% of users answer question wrong, flag for review
```

### Payout Calculation

```javascript
function calculateTriviaPayouts(round) {
  // Base calculation
  const ACCURACY = round.correct_answers / 10;
  const BASE_POINTS = round.correct_answers * 10 + (round.streak_max * 5);
  
  // Streak multiplier
  let STREAK_MULTIPLIER = 1.0;
  if (round.streak_max >= 5) STREAK_MULTIPLIER = 2.5; // 5+ streak
  if (round.streak_max === 10) STREAK_MULTIPLIER = 10; // Perfect!
  
  const FINAL_SCORE = Math.floor(BASE_POINTS * STREAK_MULTIPLIER);
  
  // Determine if eligible for daily prize (top 10)
  const DAILY_RANK = await getDailyRank(round.user_id, round.final_score, round.campus_id);
  
  let TOKENS_EARNED = 0;
  
  if (DAILY_RANK <= 10) {
    // Payout structure for top 10
    const PAYOUTS = [500, 400, 300, 250, 200, 180, 160, 150, 140, 130]; // tokens
    TOKENS_EARNED = PAYOUTS[DAILY_RANK - 1];
  } else {
    // Participation rewards (50% of players get tokens)
    if (FINAL_SCORE >= 250) TOKENS_EARNED = 50;
    if (FINAL_SCORE >= 400) TOKENS_EARNED = 100;
    if (FINAL_SCORE >= 600) TOKENS_EARNED = 200;
  }
  
  // Premium round cost
  const TOKENS_SPENT = round.round_type === 'premium' ? 50 : 0;
  
  return {
    tokens_earned: TOKENS_EARNED,
    tokens_net: TOKENS_EARNED - TOKENS_SPENT,
    daily_rank: DAILY_RANK,
    platform_revenue: TOKENS_SPENT * 0.10 // Platform keeps all premium entry fees
  };
}
```

### Monthly Revenue

```
Scenario: 10,000 daily active users, avg 2 rounds/day

Premium Round Entry (50 tokens):
  20% conversion (2,000 users) × 50 tokens × 2 rounds = 200,000 tokens/day
  = 200,000 × 0.10 = ₦20,000/day = ₦600K/month

Cosmetics (Trivia-themed avatars, badges):
  12% conversion × 300 tokens avg = 360,000 tokens/day
  = 360,000 × 0.10 = ₦36,000/day = ₦1.08M/month

Booster Purchases (2x points, streak saver):
  5% conversion × 100 tokens = 5,000 tokens/day
  = 5,000 × 0.10 = ₦500/day = ₦15K/month

Sponsorships (Brand quiz packs - "Samsung QuickFire"):
  ₦300K/month

TOTAL MONTH 1: ₦600K + ₦1.08M + ₦15K + ₦300K = ₦1.995M

MONTH 6 (15,000 DAU, 3 rounds/day):
  = ₦3.5M (scaled at ~75% growth)

Actual Month 1 Projection: ₦980K (conservative - lower cosmetics conversion)
```

### Implementation Checklist (Week 2)

- [ ] Database schema + 2,000 questions (Day 1)
- [ ] Question categorization & difficulty balancing (Day 1-2)
- [ ] Backend API + round engine (Days 2-3)
- [ ] Leaderboard & daily winner calculation (Day 3)
- [ ] Fraud detection rules + anomaly scorer (Day 4)
- [ ] Frontend components (Days 4-5)
- [ ] Testing (Days 5-7)

---

## Game 3: Code Challenges

**Month 1 Revenue: ₦1.2M | Players: ~2,000 (CS-focused) | Avg Session: 10 min**

### Game Mechanics

- 1v1 programming duels: Solve data structure/algorithm problem in 5-10 minutes
- Difficulty: Easy (sorting, arrays), Medium (linked lists, trees), Hard (dynamic programming, graphs)
- Languages: Python, JavaScript, C++
- Win condition: Correct solution, fastest time (binary scoring: correct=win, wrong=loss)
- Entry: 300 tokens (₦30) for premium, free practice rounds
- Rewards: Winner gets 900 tokens (₦90), loser gets 0
- Cosmetics: IDE themes, language-specific badges, "Algorithm Master" titles

### Database Schema

```sql
CREATE TABLE code_problems (
  id BIGSERIAL PRIMARY KEY,
  difficulty_level VARCHAR(20) NOT NULL, -- 'easy', 'medium', 'hard'
  category VARCHAR(50) NOT NULL, -- 'sorting', 'linked_lists', 'dp', 'graphs', 'arrays'
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  constraints TEXT,
  example_input JSONB,
  example_output TEXT,
  test_cases JSONB NOT NULL, -- [{ input: {...}, output: "expected" }, ...]
  time_limit_seconds INT DEFAULT 10,
  memory_limit_mb INT DEFAULT 256,
  usage_count INT DEFAULT 0,
  success_rate FLOAT DEFAULT 0.3,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE code_solutions (
  id BIGSERIAL PRIMARY KEY,
  problem_id BIGINT NOT NULL REFERENCES code_problems(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  language VARCHAR(20) NOT NULL, -- 'python', 'javascript', 'cpp'
  code_text TEXT NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  execution_time_ms INT,
  memory_used_mb INT,
  test_cases_passed INT,
  test_cases_total INT,
  is_correct BOOLEAN,
  score INT, -- 0-100
  feedback TEXT -- Runtime errors, failed test cases
);

CREATE TABLE code_duels (
  id BIGSERIAL PRIMARY KEY,
  problem_id BIGINT NOT NULL REFERENCES code_problems(id),
  player1_id UUID NOT NULL REFERENCES auth.users(id),
  player2_id UUID NOT NULL REFERENCES auth.users(id),
  time_limit_seconds INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Player 1
  player1_language VARCHAR(20),
  player1_solution_id BIGINT REFERENCES code_solutions(id),
  player1_is_correct BOOLEAN,
  player1_completion_time_ms INT,
  player1_score INT,
  
  -- Player 2
  player2_language VARCHAR(20),
  player2_solution_id BIGINT REFERENCES code_solutions(id),
  player2_is_correct BOOLEAN,
  player2_completion_time_ms INT,
  player2_score INT,
  
  winner_id UUID REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'in_progress' -- 'in_progress', 'completed', 'abandoned'
);

CREATE TABLE code_user_stats (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  total_duels INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  win_rate FLOAT DEFAULT 0,
  preferred_language VARCHAR(20),
  best_time_ms INT,
  avg_completion_time_ms FLOAT,
  problems_solved INT DEFAULT 0,
  tokens_earned INT DEFAULT 0,
  tokens_spent INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE code_practice_rounds (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  problem_id BIGINT NOT NULL REFERENCES code_problems(id),
  language VARCHAR(20),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP,
  is_correct BOOLEAN,
  attempts INT DEFAULT 1,
  score INT
);
```

### API Endpoints (18 endpoints)

```
GET    /api/code/problems?difficulty=easy&category=sorting
       Response: [{ id, title, category, description, time_limit }]

GET    /api/code/problems/:problemId
       Response: { id, title, description, constraints, examples, time_limit }

POST   /api/code/duel/create
       Body: { difficulty: 'easy|medium|hard', language: 'python|javascript|cpp' }
       Response: { duel_id, opponent_id, problem_id, problem_statement, timer: 600000ms }

POST   /api/code/duel/:duelId/submit
       Body: { language, code_text }
       Response: { tests_passed, tests_total, execution_time, memory_used, is_correct, feedback }
       Runs: Automated test case execution

POST   /api/code/duel/:duelId/complete
       Response: { winner_id, tokens_awarded, loser_tokens }
       Calls: award_tournament_payout()

POST   /api/code/practice/start
       Body: { problem_id }
       Response: { practice_session_id, problem, timer }

POST   /api/code/practice/:sessionId/submit
       Body: { language, code_text }
       Response: { tests_passed, is_correct, feedback, solution_analysis }

GET    /api/code/languages/supported
       Response: [{ language: 'python', version: '3.11', sandbox_available: true }]

GET    /api/code/leaderboard/global
       Query: { limit: 100 }
       Response: [{ rank, user_id, username, wins, win_rate, problems_solved, tokens }]

GET    /api/code/user/stats
       Response: { total_duels, wins, losses, problems_solved, best_time, preferred_language }

GET    /api/code/user/solutions
       Query: { problem_id?, limit: 20 }
       Response: [{ problem_id, language, score, execution_time, submitted_at }]

POST   /api/code/cosmetics/purchase
       Body: { cosmetic_id: 'ide_theme_dark_mode|badge_algorithm_master' }
       Response: { success, new_balance }

GET    /api/code/cosmetics/shop
       Response: [{ id, name, type, price_tokens, preview_url }]

POST   /api/code/tournament/register
       Body: { difficulty: 'easy|medium|hard' }
       Response: { tournament_id, match_count, prize_pool }

GET    /api/code/tournament/:tournamentId/bracket
       Response: { matches: [{ player1, player2, scheduled_time, result? }] }

GET    /api/code/problem/:problemId/analytics
       Response: { attempt_count, success_rate, avg_execution_time, common_mistakes }

POST   /api/code/hint/purchase
       Body: { problem_id, hint_level: 1|2|3 }
       Response: { hint_text, tokens_spent }

GET    /api/code/tutorials
       Response: [{ id, topic: 'linked_lists', difficulty, duration_min, tokens_cost }]
```

### Frontend Components

**Screens:**
1. Problem Browser - Filterable list by difficulty/category
2. Code Editor - Split view (problem | code editor | test results)
3. Duel Lobby - Opponent info + problem preview
4. Live Duel - Shared timer, show when opponent completes
5. Results - Win/loss + execution time comparison + tokens
6. Leaderboard - Global + language-specific
7. Tutorial - Video tutorials with code examples
8. Practice Mode - Solve problems without competition

**Key UI Elements:**
- VS Code-style code editor with syntax highlighting
- Real-time test output (pass/fail for each test case)
- Timer countdown (visual urgency)
- Opponent completion notification (red alert if they submit)
- Memory/execution time tracker

### Fraud Prevention

```
1. Code Plagiarism Detection:
   - Compare submitted code with previous solutions in database (Levenshtein distance)
   - Flag if >80% similarity with another user's solution
   - Compare with public solutions online (GitHub API checks)

2. Execution Anomalies:
   - Flag if same code produces different results (environmental tampering)
   - Flag if execution time < 10ms (solution didn't actually run)
   - Validate output matches expected format (not just lucky guess)

3. Pattern Detection:
   - Flag if new account wins first 10 duels (impossible)
   - Flag if user suddenly solves "hard" problems after struggling with "easy"
   - Detect account boosting (player A always paired with player B, A always wins)

4. Session Monitoring:
   - Verify user stays within sandbox environment (no external API calls)
   - Detect if code makes network requests (potential cheating)
   - Restrict to 1 active duel at a time

5. Language-Specific:
   - Python: Detect eval() or exec() calls (code injection attempts)
   - JavaScript: Detect fetch() or XMLHttpRequest (external data fetching)
   - All: Disallow file system access, network calls, environment variable access
```

### Payout Calculation

```javascript
function calculateCodePayouts(duel) {
  const ENTRY_FEE = 300; // tokens
  const WINNER_PAYOUT = 900; // 3x entry fee
  const PLATFORM_RAKE = 300; // 100% of entry fee
  
  // Bonus: Faster completion time
  let SPEED_BONUS = 0;
  if (winner.completion_time_ms < 60000) SPEED_BONUS = 200; // Under 1 min = +200
  if (winner.completion_time_ms < 30000) SPEED_BONUS = 500; // Under 30s = +500
  
  // Bonus: Difficult problem solved
  let DIFFICULTY_BONUS = 0;
  if (duel.problem.difficulty === 'hard') DIFFICULTY_BONUS = 300;
  if (duel.problem.difficulty === 'medium') DIFFICULTY_BONUS = 100;
  
  const FINAL_PAYOUT = WINNER_PAYOUT + SPEED_BONUS + DIFFICULTY_BONUS;
  
  // Platform revenue
  return {
    tokens_awarded: FINAL_PAYOUT,
    platform_tokens: ENTRY_FEE,
    platform_naira: ENTRY_FEE * 0.10,
    loser_tokens: 0 // No consolation in skill games
  };
}
```

### Monthly Revenue

```
Scenario: 2,000 daily active users (CS/tech focus), avg 2 duels/day

Entry Fees (300 tokens per duel):
  2,000 × 2 × 300 = 1,200,000 tokens/day
  Platform rake: 300 tokens per duel = 600,000 tokens/day
  = 600,000 × 0.10 = ₦60,000/day = ₦1.8M/month

Cosmetics (IDE themes, badges):
  8% conversion × 500 tokens = 80,000 tokens/day
  = 80,000 × 0.10 = ₦8,000/day = ₦240K/month

Hints & Tutorials (premium content):
  3% conversion × 150 tokens = 12,000 tokens/day
  = 12,000 × 0.10 = ₦1,200/day = ₦36K/month

Sponsorships (Tech brand partnerships - IDEs, coding bootcamps):
  ₦200K/month

TOTAL MONTH 1: ₦1.8M + ₦240K + ₦36K + ₦200K = ₦2.276M

MONTH 6 (4,000 DAU, 2.5 duels/day, higher entry):
  = ₦2.8M (scaled)

Actual Month 1 Projection: ₦1.2M (conservative - niche audience)
```

### Implementation Checklist (Week 2-3)

- [ ] Database schema + 100 coding problems (Day 1)
- [ ] Code sandbox setup (Docker containers for Python/JS/C++) (Days 2-3)
- [ ] Backend API + test case execution engine (Days 3-5)
- [ ] Plagiarism detection system (Day 5)
- [ ] Frontend code editor (Days 5-6)
- [ ] Fraud detection rules (Day 6)
- [ ] Testing & QA (Days 6-7)

---

## Game 4: Music Quiz Master

**Month 1 Revenue: ₦980K | Players: ~12,000 | Avg Session: 4 min**

### Game Mechanics

- Hear 3-second song clip, identify song name + artist (2-part question)
- Categories: Afrobeats (Wizkard, Rema, Burna), Naija Rap, International, K-pop, Classics
- Streaks & combos: 5 correct = 2x points, 10 correct = 3x points
- Entry: 100 tokens (₦10) per 10-song round
- Winner (daily): Top scorer each day in each category gets 400 tokens
- Leaderboard: Daily per category
- Cosmetics: Speaker effects, album art frames, "Ears of Destiny" badges

### Database Schema

```sql
CREATE TABLE music_catalog (
  id BIGSERIAL PRIMARY KEY,
  song_title VARCHAR(150) NOT NULL,
  artist_name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'afrobeats', 'naija_rap', 'international', 'kpop', 'classics'
  release_year INT,
  audio_clip_url VARCHAR(255) NOT NULL, -- S3 URL, 3-second clip
  audio_clip_duration_ms INT,
  clip_start_timestamp_seconds INT, -- Where in song the clip starts
  difficulty_estimate VARCHAR(20) DEFAULT 'medium',
  recognition_rate FLOAT DEFAULT 0.5,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE music_rounds (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  category VARCHAR(50) NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  final_score INT DEFAULT 0,
  song_count INT DEFAULT 10,
  correct_answers INT DEFAULT 0,
  accuracy_percent FLOAT DEFAULT 0,
  streak_max INT DEFAULT 0,
  tokens_spent INT,
  tokens_earned INT,
  daily_rank INT,
  campus_id INT
);

CREATE TABLE music_responses (
  id BIGSERIAL PRIMARY KEY,
  round_id BIGINT NOT NULL REFERENCES music_rounds(id),
  music_id BIGINT NOT NULL REFERENCES music_catalog(id),
  user_song_answer VARCHAR(150),
  user_artist_answer VARCHAR(150),
  is_correct BOOLEAN,
  response_time_ms INT,
  points_earned INT,
  streak_at_time INT,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE music_daily_winners (
  id BIGSERIAL PRIMARY KEY,
  round_date DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  rank INT,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  final_score INT,
  tokens_awarded INT,
  campus_id INT,
  UNIQUE(round_date, category, rank)
);

CREATE TABLE music_user_stats (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  total_rounds INT DEFAULT 0,
  total_points INT DEFAULT 0,
  avg_accuracy FLOAT DEFAULT 0,
  favorite_category VARCHAR(50),
  total_wins INT DEFAULT 0,
  tokens_earned INT DEFAULT 0,
  tokens_spent INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints (14 endpoints)

```
POST   /api/music/round/start
       Body: { category: 'afrobeats|naija_rap|international|kpop|classics' }
       Response: { round_id, audio_clip_url, timer: 15000ms, song_number: 1 }

POST   /api/music/round/:roundId/answer
       Body: { song_title, artist_name }
       Response: { is_correct, correct_answers: { song, artist }, points, streak }

POST   /api/music/round/:roundId/complete
       Response: { final_score, accuracy, daily_rank, tokens_earned }

GET    /api/music/categories
       Response: [{ category, total_songs, daily_winner_tokens }]

GET    /api/music/leaderboard/daily/:category
       Query: { limit: 100 }
       Response: [{ rank, user_id, username, score, accuracy, tokens }]

GET    /api/music/leaderboard/all-categories
       Response: [{ rank, user_id, username, total_points, favorite_category, cosmetics }]

GET    /api/music/winners/today
       Response: [{ category, rank: 1, user_id, username, score, tokens_awarded }]

GET    /api/music/user/stats
       Response: { total_rounds, points, accuracy, favorite_category, wins, tokens_earned }

GET    /api/music/user/history
       Query: { limit: 20, offset: 0 }
       Response: [{ round_id, category, score, rank, tokens_earned, played_at }]

POST   /api/music/cosmetics/purchase
       Body: { cosmetic_id }
       Response: { success, new_balance, cosmetic_equipped }

GET    /api/music/cosmetics/shop
       Response: [{ id, name, type, price_tokens, category }]

GET    /api/music/new-releases
       Response: [{ song_id, title, artist, category, added_at }]

POST   /api/music/playlist/create-challenge
       Body: { category, playlist_name, song_ids: [1,2,3...] }
       Response: { playlist_id, token_price, shared_link }

GET    /api/music/trending
       Query: { timeframe: 'today|weekly|all_time' }
       Response: [{ song_id, title, artist, play_count, accuracy_rate }]
```

### Frontend Components

**Screens:**
1. Category Selector - Browse by genre with category stats
2. Music Round - Audio player + guess form (Song Title + Artist)
3. Results Screen - Correct answer + clip replay + points
4. Daily Winners - Top scorer in each category
5. Leaderboard - All-category rankings + cosmetics display
6. Shop - Speaker effects, album art frames
7. New Releases - Recently added songs

**Key UI Elements:**
- Audio player with play/replay button
- Text input for song name + artist
- Auto-complete suggestions (artist names)
- Guess timer (starts at song end)
- Streak counter with visual progression
- Daily rank badge

### Fraud Prevention

```
1. Timing Anomalies:
   - Flag if response submitted before audio plays (30+ second clip = enough time)
   - Flag if response time < 2 seconds (too fast for human listening)
   - Flag if user guesses correct answer before hearing full clip

2. Pattern Detection:
   - Flag if 100% accuracy on new songs (<10 plays in system)
   - Flag if user accuracy suddenly jumps 40+ points
   - Detect if same incorrect answer across multiple users (shared account/bot)

3. Session Monitoring:
   - Max 20 rounds per day (rate limiting)
   - If 15+ rounds in 1 hour, require CAPTCHA
   - Restrict to 1 active round at a time

4. Audio Fingerprinting:
   - Verify audio clip integrity (hasn't been tampered with)
   - Detect if user is using SoundHound/Shazam (API calls from device)
   - Monitor device audio-in during rounds (potential Shazam detection)

5. Answer Validation:
   - Fuzzy string matching (typos acceptable): "Burna Boy" vs "Burna boy" = correct
   - But flag excessive auto-correct (more than 3 character differences)
   - Whitelist common artist name variations ("Drake" vs "Drake Aubrey Graham")
```

### Payout Calculation

```javascript
function calculateMusicPayouts(round) {
  const BASE_POINTS = round.correct_answers * 10;
  
  // Streak multiplier
  let STREAK_MULTIPLIER = 1.0;
  if (round.streak_max >= 5) STREAK_MULTIPLIER = 2.0;
  if (round.streak_max >= 10) STREAK_MULTIPLIER = 3.0;
  
  const FINAL_SCORE = Math.floor(BASE_POINTS * STREAK_MULTIPLIER);
  
  // Determine daily rank in category
  const DAILY_RANK = await getDailyRankByCategory(round.user_id, round.category, FINAL_SCORE);
  
  let TOKENS_EARNED = 0;
  if (DAILY_RANK === 1) TOKENS_EARNED = 400;
  if (DAILY_RANK === 2) TOKENS_EARNED = 300;
  if (DAILY_RANK === 3) TOKENS_EARNED = 200;
  if (DAILY_RANK === 4) TOKENS_EARNED = 150;
  if (DAILY_RANK === 5) TOKENS_EARNED = 100;
  
  const TOKENS_SPENT = 100;
  const NET = TOKENS_EARNED - TOKENS_SPENT;
  
  return {
    tokens_earned: TOKENS_EARNED,
    tokens_spent: TOKENS_SPENT,
    net: NET,
    platform_revenue: TOKENS_SPENT * 0.10
  };
}
```

### Monthly Revenue

```
Scenario: 12,000 daily active users, avg 3 rounds/day

Entry Fees (100 tokens per round):
  12,000 × 3 × 100 = 3,600,000 tokens/day
  Platform rake: 100 tokens per round = 1,200,000 tokens/day
  = 1,200,000 × 0.10 = ₦120,000/day = ₦3.6M/month

Cosmetics (Speaker effects, album frames):
  15% conversion × 400 tokens = 720,000 tokens/day
  = 720,000 × 0.10 = ₦72,000/day = ₦2.16M/month

Premium Playlists (User-created themed playlists):
  5% conversion × 200 tokens = 12,000 tokens/day
  = 12,000 × 0.10 = ₦1,200/day = ₦36K/month

Music Label Sponsorships (Afrobeats labels pay for song placement):
  ₦500K/month

TOTAL MONTH 1: ₦3.6M + ₦2.16M + ₦36K + ₦500K = ₦6.296M

MONTH 6 (18,000 DAU, 4 rounds/day):
  = ₦9.5M (scaled at ~50%)

Actual Month 1 Projection: ₦980K (conservative - audio infrastructure cost not included)
```

### Implementation Checklist (Week 3)

- [ ] Database schema + 1,000 songs across categories (Day 1)
- [ ] Audio clip preprocessing + S3 upload (Days 1-2)
- [ ] Backend API + answer validation (Days 2-3)
- [ ] Fuzzy string matching for artist/song names (Day 3)
- [ ] Fraud detection + timing analysis (Day 4)
- [ ] Frontend audio player + guess form (Days 4-5)
- [ ] Leaderboard calculations (Day 5)
- [ ] Testing & QA (Days 5-7)

---

## Game 5: Draw & Guess

**Month 1 Revenue: ₦680K | Players: ~5,000 | Avg Session: 8 min**

### Game Mechanics

- Pictionary-style: Player draws something, 4 others guess in real-time (30 seconds)
- Campus themes: "Exam Season," "Broke Student," "NYSC Training," "Naija Jollof Wars"
- Voting: After round, players vote on best drawing + best guess
- Entry: 150 tokens (₦15) per game
- Rewards:
  - Best drawing: 300 tokens
  - Best guess: 150 tokens
  - Correct guesser: 100 tokens
  - Participation: 50 tokens (if contributed)
- Cosmetics: Custom brushes, drawing effects, "Artist" badges

### Database Schema

```sql
CREATE TABLE draw_sessions (
  id BIGSERIAL PRIMARY KEY,
  session_host_id UUID NOT NULL REFERENCES auth.users(id),
  theme VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'waiting', -- 'waiting', 'drawing', 'guessing', 'voting', 'completed'
  max_players INT DEFAULT 5,
  current_players INT DEFAULT 0,
  draw_time_seconds INT DEFAULT 45,
  guess_time_seconds INT DEFAULT 30
);

CREATE TABLE draw_participants (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES draw_sessions(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  role VARCHAR(20), -- 'drawer', 'guesser'
  is_active BOOLEAN DEFAULT TRUE,
  tokens_spent INT DEFAULT 150
);

CREATE TABLE draw_drawings (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES draw_sessions(id),
  artist_id UUID NOT NULL REFERENCES auth.users(id),
  drawing_svg TEXT NOT NULL, -- SVG data
  drawing_image_url VARCHAR(255), -- PNG render
  theme VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  brush_cosmetic_id BIGINT REFERENCES cosmetics_catalog(id),
  submission_time_ms INT
);

CREATE TABLE draw_guesses (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES draw_sessions(id),
  drawing_id BIGINT NOT NULL REFERENCES draw_drawings(id),
  guesser_id UUID NOT NULL REFERENCES auth.users(id),
  guess_text VARCHAR(100),
  is_correct BOOLEAN,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  guess_time_ms INT
);

CREATE TABLE draw_round_results (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES draw_sessions(id),
  best_drawing_artist_id UUID REFERENCES auth.users(id),
  best_drawing_votes INT,
  best_guess_guesser_id UUID REFERENCES auth.users(id),
  best_guess_votes INT,
  correct_guesses_count INT,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE draw_user_stats (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  total_sessions INT DEFAULT 0,
  best_drawings_won INT DEFAULT 0,
  best_guesses_won INT DEFAULT 0,
  correct_guesses INT DEFAULT 0,
  voting_participation_rate FLOAT DEFAULT 0,
  tokens_earned INT DEFAULT 0,
  tokens_spent INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints (16 endpoints)

```
POST   /api/draw/session/create
       Body: { theme: 'exam_season|broke_student|nysc|jollof_wars' }
       Response: { session_id, theme, join_code, wait_for_players: 4 }

POST   /api/draw/session/:sessionId/join
       Body: {}
       Response: { session_id, role: 'drawer|guesser', players_joined, start_time }

GET    /api/draw/session/:sessionId/live
       Response: { drawing_svg, guesses_so_far: 3, timer: 25000ms, role }

POST   /api/draw/session/:sessionId/draw
       Body: { svg_strokes: [...] }
       Response: { success, drawing_id, saved }

POST   /api/draw/session/:sessionId/guess
       Body: { guess_text }
       Response: { is_correct, points_earned, other_guesses_count }

POST   /api/draw/session/:sessionId/vote-best-drawing
       Body: { drawing_id }
       Response: { success, vote_recorded }

POST   /api/draw/session/:sessionId/vote-best-guess
       Body: { guess_id }
       Response: { success, vote_recorded }

POST   /api/draw/session/:sessionId/complete
       Response: { best_drawing_artist, best_guess_guesser, tokens_distributed: {...} }

GET    /api/draw/themes
       Response: [{ theme_id, name, description, monthly_plays }]

GET    /api/draw/user/stats
       Response: { total_sessions, best_drawings, best_guesses, voting_rate, tokens_earned }

GET    /api/draw/leaderboard/artists
       Response: [{ rank, user_id, username, best_drawings_won, cosmetics }]

GET    /api/draw/leaderboard/guessers
       Response: [{ rank, user_id, username, best_guesses, correct_guesses }]

POST   /api/draw/cosmetics/brushes/purchase
       Body: { brush_id }
       Response: { success, new_balance, brush_equipped }

GET    /api/draw/cosmetics/brushes
       Response: [{ id, name, color, style, price_tokens, effects }]

GET    /api/draw/gallery/trending
       Query: { timeframe: 'daily|weekly', limit: 20 }
       Response: [{ drawing_id, artist, theme, votes, timestamp }]

POST   /api/draw/session/:sessionId/leave
       Response: { success, refund_tokens }
```

### Frontend Components

**Screens:**
1. Session Lobby - Wait for players, theme preview
2. Drawing Canvas - Real-time canvas with brush options, timer
3. Guess Screen - Live drawing, guess input (repeat guess detection)
4. Results & Voting - Show all drawings, vote for best + best guess
5. Leaderboard - Artists + Guessers rankings
6. Gallery - Trending drawings + user submissions
7. Cosmetics Shop - Brush collection

**Key UI Elements:**
- HTML5 canvas for drawing
- Brush color/size selector with cosmetics
- Real-time sync of drawing strokes to all players
- Guess input + "Already guessed that" warning
- Voting UI (tap to vote, vote count display)
- Artist/Guesser badges on leaderboard

### Fraud Prevention

```
1. Drawing Validation:
   - Require minimum number of strokes (5+) to prevent empty submissions
   - Flag if drawing submitted too quickly (<5 seconds)
   - Detect if drawing is identical to previous drawings (plagiarism)

2. Guess Manipulation:
   - Flag if same guess repeated 50+ times by one user (spam)
   - Detect if user guesses all 10 possible answers in sequence (bot testing)
   - Monitor for offensive/inappropriate guesses (content moderation)

3. Voting Integrity:
   - Flag if user votes for same artist every session (collusion)
   - Implement cooldown: Can't vote for same person >2x in 24 hours
   - Weight votes based on account age (new accounts = less weight)

4. Session Monitoring:
   - Require active participation (must guess at least 2 answers)
   - Flag if user joins session but doesn't draw/guess
   - Max 30 sessions per day per user

5. Content Moderation:
   - Blur inappropriate drawings before display
   - Flag offensive text in guesses
   - Cache-block users who violate content policy 3x
```

### Payout Calculation

```javascript
function calculateDrawPayouts(session) {
  const ENTRY_FEE = 150; // tokens
  
  let EARNINGS = {
    best_drawing_artist: 0,
    best_guess_guesser: 0,
    correct_guessers: [],
    participation: 0
  };
  
  // Best drawing (most votes)
  EARNINGS.best_drawing_artist = 300; // Fixed reward
  
  // Best guess (most votes)
  EARNINGS.best_guess_guesser = 150;
  
  // Correct guesses (if theme had correct answers)
  const CORRECT_GUESSES = session.correct_guesses;
  const PAYOUT_PER_CORRECT = Math.floor(100 / Math.max(CORRECT_GUESSES, 1));
  EARNINGS.correct_guessers = Array(CORRECT_GUESSES).fill(PAYOUT_PER_CORRECT);
  
  // Participation reward (if contributed 2+ guesses)
  EARNINGS.participation = 50;
  
  // Platform revenue
  const TOTAL_ENTRY_FEES = session.current_players * ENTRY_FEE;
  const TOTAL_PAYOUTS = 300 + 150 + (PAYOUT_PER_CORRECT * CORRECT_GUESSES) + (50 * session.current_players);
  const PLATFORM_RAKE = TOTAL_ENTRY_FEES - TOTAL_PAYOUTS;
  
  return {
    best_drawing: 300,
    best_guess: 150,
    correct_per_person: PAYOUT_PER_CORRECT,
    participation: 50,
    platform_rake: PLATFORM_RAKE,
    platform_naira: (PLATFORM_RAKE * 0.10)
  };
}
```

### Monthly Revenue

```
Scenario: 5,000 daily active users, avg 2 sessions/day (5 players per session)

Entry Fees (150 tokens per session):
  (5,000 / 5) × 2 × 150 = 300,000 tokens/day
  Platform rake: ~50 tokens per session (after payouts) = 10,000 tokens/day
  = 10,000 × 0.10 = ₦1,000/day = ₦30K/month

Cosmetics (Brush skins, effects):
  20% conversion × 350 tokens = 350,000 tokens/day
  = 350,000 × 0.10 = ₦35,000/day = ₦1.05M/month

Premium Brush Packs (Limited edition artist collaborations):
  5% conversion × 500 tokens = 50,000 tokens/day
  = 50,000 × 0.10 = ₦5,000/day = ₦150K/month

Campus Art Competitions (Monthly themed competitions with prizes):
  ₦400K/month sponsorship

TOTAL MONTH 1: ₦30K + ₦1.05M + ₦150K + ₦400K = ₦1.63M

MONTH 6 (8,000 DAU, 2.5 sessions/day):
  = ₦2.4M (scaled)

Actual Month 1 Projection: ₦680K (conservative - lower cosmetics demand)
```

### Implementation Checklist (Week 4)

- [ ] Database schema (Day 1)
- [ ] Drawing canvas + stroke sync (Days 1-2)
- [ ] Session management + player queue (Days 2-3)
- [ ] Real-time WebSocket for multi-player (Days 3-4)
- [ ] Voting system + payout calculation (Day 4)
- [ ] Fraud detection + content moderation (Day 5)
- [ ] Frontend components (Days 5-6)
- [ ] Testing & QA (Days 6-7)

---

## Game 6: Reaction King

**Month 1 Revenue: ₦2.1M | Players: ~15,000 | Avg Session: 2 min**

### Game Mechanics

- Tap-to-react: Visual/audio stimulus appears, tap as fast as possible
- Stimulus types: Color change, sound cue, emoji flash, pattern recognition
- Leaderboard: Global + campus-specific
- Entry: 50 tokens (₦5) - LOW FRICTION for ultra-quick games
- Rewards: Winner (fastest tap) gets 150 tokens, participation gets 0
- Cosmetics: Custom UI skins, reaction particle effects, "Fast Hands" badges

### Database Schema

```sql
CREATE TABLE reaction_challenges (
  id BIGSERIAL PRIMARY KEY,
  challenge_type VARCHAR(50), -- 'simple_tap', 'color_change', 'sound_cue', 'pattern'
  stimulus_duration_ms INT DEFAULT 500,
  reaction_window_ms INT DEFAULT 3000,
  min_valid_reaction_ms INT DEFAULT 50,
  max_valid_reaction_ms INT DEFAULT 2500,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usage_count INT DEFAULT 0
);

CREATE TABLE reaction_duels (
  id BIGSERIAL PRIMARY KEY,
  challenge_id BIGINT NOT NULL REFERENCES reaction_challenges(id),
  player1_id UUID NOT NULL REFERENCES auth.users(id),
  player2_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  player1_reaction_ms INT,
  player1_valid BOOLEAN,
  
  player2_reaction_ms INT,
  player2_valid BOOLEAN,
  
  winner_id UUID REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'waiting'
);

CREATE TABLE reaction_user_stats (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  total_duels INT DEFAULT 0,
  wins INT DEFAULT 0,
  fastest_reaction_ms INT DEFAULT 9999,
  avg_reaction_ms FLOAT DEFAULT 0,
  win_rate FLOAT DEFAULT 0,
  tokens_earned INT DEFAULT 0,
  tokens_spent INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reaction_leaderboard (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  campus_id INT,
  fastest_reaction_ms INT,
  win_count INT,
  total_duels INT,
  current_rank INT,
  period_type VARCHAR(20), -- 'daily', 'weekly', 'all_time'
  period_start DATE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, period_type, period_start)
);
```

### API Endpoints (12 endpoints)

```
POST   /api/reaction/duel/create
       Body: { challenge_type: 'simple_tap|color_change|sound_cue|pattern' }
       Response: { duel_id, opponent_found: bool, waiting_for: 'player2|start', timer: 5000ms }

GET    /api/reaction/duel/:duelId/start-stimulus
       Response: { stimulus: 'tap_indicator', challenge_type, stimulus_duration_ms }
       (Triggers stimulus display on client)

POST   /api/reaction/duel/:duelId/react
       Body: { reaction_time_ms }
       Response: { valid: bool, opponent_reacted: bool, opponent_time_ms }

POST   /api/reaction/duel/:duelId/complete
       Response: { winner_id, tokens_awarded, reaction_times: { p1, p2 } }

GET    /api/reaction/leaderboard/global
       Query: { metric: 'fastest|wins', limit: 100 }
       Response: [{ rank, user_id, username, fastest_reaction, wins, tokens }]

GET    /api/reaction/leaderboard/campus/:campusId
       Response: [{ rank, user_id, username, fastest_reaction_ms, wins }]

GET    /api/reaction/user/stats
       Response: { total_duels, wins, fastest_reaction_ms, avg_reaction, win_rate }

GET    /api/reaction/user/history
       Query: { limit: 50 }
       Response: [{ duel_id, opponent, result, reaction_time, timestamp }]

POST   /api/reaction/cosmetics/purchase
       Body: { cosmetic_id: 'ui_theme_neon|particle_effect_spark' }
       Response: { success, new_balance }

GET    /api/reaction/cosmetics/shop
       Response: [{ id, name, type, price_tokens, effect_preview }]

GET    /api/reaction/training/mode
       Response: { training_session_id, stimuli: [...] }
       (Practice mode - free, no rewards)

GET    /api/reaction/leaderboard/trending
       Query: { timeframe: 'today|week|month' }
       Response: [{ rank, user_id, fastest_reaction, improvement_vs_yesterday }]
```

### Frontend Components

**Screens:**
1. Home - Top 10 fastest reactions + "Play Now" button
2. Waiting Lobby - Searching for opponent + fastest reaction display
3. Challenge Screen - Stimulus display area + "Ready?" button
4. Stimulus Display - Visual or audio cue
5. React Tap Area - Large tap zone (Fitts' Law UX)
6. Results - Reaction time comparison + winner announcement
7. Leaderboard - Global fastest reactions + campus rankings
8. Training Mode - Practice without spending tokens

**Key UI Elements:**
- Minimalist UI (faster perception = advantage)
- Large tap zone (no fine motor skills needed)
- Instant visual feedback on tap (color change)
- Real-time reaction time display
- Fastest reaction badge + "Campus Champion" title

### Fraud Prevention

```
1. Reaction Time Validation:
   - Flag if reaction time < 50ms (impossible for human)
   - Flag if reaction time > 2500ms (outside reaction window)
   - Flag if reaction submitted before stimulus (client time manipulation)

2. Pattern Detection:
   - Flag if reactions consistently <150ms (bot assistance likely)
   - Flag if reactions always within 200-210ms (automated response)
   - Detect if same device achieves <100ms across 50+ duels (impossible)

3. Session Monitoring:
   - Max 200 duels per day (rate limiting)
   - If 100+ duels in 1 hour, require manual verification (bot behavior)
   - Restrict to 1 active duel at a time

4. Device Fingerprinting:
   - Track device + IP combinations
   - Flag if multiple accounts from same device all top 100 (account farming)
   - Monitor for emulator usage (different touch latency)

5. Temporal Validation:
   - Verify server-to-client latency consistency
   - Detect if network lag is being exploited (delaying response submission)
   - Compare reported reaction time vs. server-measured time delta
```

### Payout Calculation

```javascript
function calculateReactionPayouts(duel) {
  const ENTRY_FEE = 50; // tokens
  const WINNER_PAYOUT = 150; // 3x entry fee
  const PLATFORM_RAKE = 50; // 100% of entry fee
  
  // Bonus: Sub-200ms reaction
  let SPEED_BONUS = 0;
  if (winner.reaction_ms < 200) SPEED_BONUS = 100;
  if (winner.reaction_ms < 150) SPEED_BONUS = 200;
  
  const FINAL_PAYOUT = WINNER_PAYOUT + SPEED_BONUS;
  
  return {
    tokens_awarded: FINAL_PAYOUT,
    platform_tokens: PLATFORM_RAKE,
    platform_naira: PLATFORM_RAKE * 0.10,
    loser_tokens: 0
  };
}
```

### Monthly Revenue

```
Scenario: 15,000 daily active users, avg 30 duels/day (5 min sessions)

Entry Fees (50 tokens per duel):
  15,000 × 30 × 50 = 22,500,000 tokens/day
  Platform rake: 50 tokens per duel = 750,000 tokens/day
  = 750,000 × 0.10 = ₦75,000/day = ₦2.25M/month

Cosmetics (UI themes, particle effects):
  25% conversion × 200 tokens = 750,000 tokens/day
  = 750,000 × 0.10 = ₦75,000/day = ₦2.25M/month

Speed Bonuses (Infrastructure cost):
  Negligible platform cost (rewards drawn from entry fees)

TOTAL MONTH 1: ₦2.25M + ₦2.25M = ₦4.5M

MONTH 6 (25,000 DAU, 40 duels/day, higher cosmetics):
  = ₦7.2M (scaled at 60%)

Actual Month 1 Projection: ₦2.1M (conservative - lower participation)
```

### Implementation Checklist (Week 4)

- [ ] Database schema (Day 1)
- [ ] Stimulus engine (visual + audio triggers) (Days 1-2)
- [ ] Backend API + duel matching (Days 2-3)
- [ ] Real-time reaction submission + validation (Days 3-4)
- [ ] Fraud detection + bot detection (Day 4)
- [ ] Frontend minimal UI (Day 4-5)
- [ ] Testing & QA (Days 5-7)

---

## Game 7: Karaoke Challenge

**Month 1 Revenue: ₦1.1M | Players: ~3,000 | Avg Session: 5 min**

### Game Mechanics

- Record yourself singing provided song snippet (15-30 seconds)
- Community votes on: Accuracy (hits notes), energy (confidence), performance
- Campus fame system: Trending singers featured on campus leaderboard
- Entry: 200 tokens (₦20) per challenge
- Rewards: Top daily singer gets 800 tokens, 2nd-5th place scaled down
- Cosmetics: Microphone skins, stage effects, "Performer" badges
- Categories: Afrobeats hits, Naija classics, international pop

### Database Schema

```sql
CREATE TABLE karaoke_tracks (
  id BIGSERIAL PRIMARY KEY,
  song_title VARCHAR(150) NOT NULL,
  artist_name VARCHAR(150) NOT NULL,
  category VARCHAR(50), -- 'afrobeats', 'naija_classics', 'international', 'current_hits'
  audio_backing_track_url VARCHAR(255), -- S3 URL to karaoke track
  original_song_url VARCHAR(255), -- Reference audio
  snippet_start_seconds INT,
  snippet_duration_seconds INT DEFAULT 30,
  difficulty_level VARCHAR(20), -- 'easy', 'medium', 'hard'
  key_and_tempo TEXT, -- "C Major 120 BPM"
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE karaoke_submissions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  track_id BIGINT NOT NULL REFERENCES karaoke_tracks(id),
  audio_recording_url VARCHAR(255), -- S3 URL
  video_recording_url VARCHAR(255), -- Optional video
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration_seconds INT,
  mic_quality_score FLOAT, -- 0-100 based on clarity analysis
  pitch_accuracy_percent FLOAT, -- AI analysis
  energy_level_percent FLOAT, -- Loudness/confidence analysis
  total_votes INT DEFAULT 0,
  accuracy_votes INT DEFAULT 0,
  energy_votes INT DEFAULT 0,
  performance_votes INT DEFAULT 0,
  daily_rank INT,
  campus_id INT
);

CREATE TABLE karaoke_votes (
  id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL REFERENCES karaoke_submissions(id),
  voter_id UUID NOT NULL REFERENCES auth.users(id),
  vote_category VARCHAR(20), -- 'accuracy', 'energy', 'performance'
  vote_value INT CHECK (vote_value >= 1 AND vote_value <= 5),
  voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(submission_id, voter_id, vote_category)
);

CREATE TABLE karaoke_daily_winners (
  id BIGSERIAL PRIMARY KEY,
  round_date DATE NOT NULL,
  rank INT,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  submission_id BIGINT NOT NULL REFERENCES karaoke_submissions(id),
  final_score FLOAT,
  tokens_awarded INT,
  campus_id INT,
  UNIQUE(round_date, rank)
);

CREATE TABLE karaoke_user_stats (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  total_submissions INT DEFAULT 0,
  total_wins INT DEFAULT 0,
  avg_accuracy FLOAT DEFAULT 0,
  avg_energy FLOAT DEFAULT 0,
  total_votes_received INT DEFAULT 0,
  campus_fame_score INT DEFAULT 0,
  tokens_earned INT DEFAULT 0,
  tokens_spent INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints (16 endpoints)

```
GET    /api/karaoke/tracks
       Query: { category: 'afrobeats|naija_classics|international', difficulty?: 'easy|medium|hard' }
       Response: [{ id, title, artist, category, difficulty, duration, backing_track_url }]

GET    /api/karaoke/tracks/:trackId
       Response: { id, title, artist, backing_track_url, snippet_duration, key_tempo }

POST   /api/karaoke/submission/start
       Body: { track_id }
       Response: { session_id, backing_track_url, snippet_start_time, instructions }

POST   /api/karaoke/submission/upload
       Body: { session_id, audio_file: blob }
       Response: { submission_id, audio_url, processing: true }

GET    /api/karaoke/submission/:submissionId/analysis
       Response: { pitch_accuracy, energy_level, mic_quality, ready_for_voting: bool }
       (Waits for AI analysis to complete)

POST   /api/karaoke/submission/:submissionId/publish
       Response: { success, submission_live }

GET    /api/karaoke/submissions/today
       Query: { limit: 50, category?: 'afrobeats' }
       Response: [{ submission_id, artist_name, track_title, accuracy, energy, votes_so_far }]

POST   /api/karaoke/submission/:submissionId/vote
       Body: { vote_category: 'accuracy|energy|performance', vote_value: 1-5 }
       Response: { success, your_vote_recorded }

GET    /api/karaoke/leaderboard/daily
       Query: { campus_id?, limit: 20 }
       Response: [{ rank, user_id, username, song_title, avg_score, tokens_earned }]

GET    /api/karaoke/leaderboard/campus-fame/:campusId
       Response: [{ rank, user_id, username, fame_score, submissions_count }]

GET    /api/karaoke/winners/today
       Response: [{ rank, user_id, username, song_title, final_score, tokens_awarded }]

GET    /api/karaoke/user/stats
       Response: { total_submissions, wins, avg_accuracy, avg_energy, fame_score, tokens_earned }

GET    /api/karaoke/user/submissions
       Query: { limit: 20 }
       Response: [{ submission_id, track_title, date, accuracy, energy, votes, rank }]

POST   /api/karaoke/cosmetics/purchase
       Body: { cosmetic_id: 'microphone_gold|stage_effect_spotlight' }
       Response: { success, new_balance }

GET    /api/karaoke/cosmetics/shop
       Response: [{ id, name, type, price_tokens, preview_url }]

GET    /api/karaoke/trending
       Query: { timeframe: 'today|week', campus_id?, limit: 20 }
       Response: [{ submission_id, artist_name, song_title, votes, views }]
```

### Frontend Components

**Screens:**
1. Track Selection - Browse by category + difficulty + preview clips
2. Recording Setup - Instructions + backing track preview + mic check
3. Recording Screen - Backing track playback + amplitude meter + recording timer
4. Recording Review - Playback of recording + submission confirmation
5. Today's Submissions - Browsable feed of submissions + voting
6. Daily Winners - Top 10 rankings by day
7. Campus Fame - Trending singers on your campus + social profiles
8. Shop - Microphone skins, stage effects

**Key UI Elements:**
- Audio waveform display during recording
- Backing track synchronized with recording
- Amplitude/confidence meter during recording
- Vote buttons (1-5 stars per category)
- Artist name badge + campus affiliation
- Trending indicator ("🔥 Trending on your campus")

### Fraud Prevention

```
1. Audio Validation:
   - Verify audio duration is 15-30 seconds (not longer, not shorter)
   - Check audio is genuine recording (not copied from previous submission)
   - Detect if audio matches original backing track (not lip-syncing)

2. Pitch Analysis:
   - AI speech recognition to verify singing (not talking/humming)
   - Detect if pitch accuracy is 99%+ (impossible - likely AI-generated)
   - Flag if same person's pitch accuracy jumps 40+ points between submissions

3. Voting Manipulation:
   - Flag if same account votes on all submissions in 10 minutes (bot voting)
   - Implement cooldown: Can't vote on >100 submissions per day
   - Weight votes based on account age (new accounts = less weight)

4. Submission Patterns:
   - Flag if new account submits 50+ recordings in 1 day (bot farming)
   - Restrict to max 5 submissions per day per user
   - Monitor for same song submitted 100+ times (spam detection)

5. Account Integrity:
   - Require verified phone number to submit karaoke (reduces throwaway accounts)
   - Require campus email verification for campus fame leaderboard
```

### Payout Calculation

```javascript
function calculateKaraokePayouts(submission) {
  const ENTRY_FEE = 200; // tokens
  
  // Calculate final score from votes (0-100)
  const ACCURACY_SCORE = (submission.accuracy_votes / submission.total_votes) * 100;
  const ENERGY_SCORE = (submission.energy_votes / submission.total_votes) * 100;
  const PERFORMANCE_SCORE = (submission.performance_votes / submission.total_votes) * 100;
  
  const FINAL_SCORE = (ACCURACY_SCORE * 0.4) + (ENERGY_SCORE * 0.3) + (PERFORMANCE_SCORE * 0.3);
  
  // Determine daily rank
  const DAILY_RANK = await getDailyRank(submission.user_id, FINAL_SCORE, submission.campus_id);
  
  let TOKENS_EARNED = 0;
  const PAYOUTS = [800, 600, 400, 250, 150, 100, 75, 60, 50, 40];
  
  if (DAILY_RANK <= 10) {
    TOKENS_EARNED = PAYOUTS[DAILY_RANK - 1];
  }
  
  return {
    tokens_earned: TOKENS_EARNED,
    tokens_spent: ENTRY_FEE,
    net: TOKENS_EARNED - ENTRY_FEE,
    platform_revenue: ENTRY_FEE * 0.10
  };
}
```

### Monthly Revenue

```
Scenario: 3,000 daily active users, avg 2 submissions/day

Entry Fees (200 tokens per submission):
  3,000 × 2 × 200 = 1,200,000 tokens/day
  Platform rake: 200 tokens per submission = 200,000 tokens/day
  = 200,000 × 0.10 = ₦20,000/day = ₦600K/month

Cosmetics (Microphone skins, stage effects):
  18% conversion × 400 tokens = 216,000 tokens/day
  = 216,000 × 0.10 = ₦21,600/day = ₦648K/month

Premium Tracks (New Afrobeats releases - exclusive):
  10% conversion × 300 tokens = 90,000 tokens/day
  = 90,000 × 0.10 = ₦9,000/day = ₦270K/month

Artist & Music Label Sponsorships:
  ₦600K/month (Afrobeats labels pay for song placements)

TOTAL MONTH 1: ₦600K + ₦648K + ₦270K + ₦600K = ₦2.118M

MONTH 6 (5,000 DAU, 3 submissions/day):
  = ₦3.5M (scaled)

Actual Month 1 Projection: ₦1.1M (conservative - audio processing costs)
```

### Implementation Checklist (Week 5)

- [ ] Database schema + 200 karaoke tracks (Days 1-2)
- [ ] Audio processing infrastructure (Days 2-3)
- [ ] Pitch accuracy AI integration (Days 3-4)
- [ ] Recording + upload backend (Days 4-5)
- [ ] Voting system + payout calculation (Day 5)
- [ ] Frontend recording UI + review (Days 5-6)
- [ ] Fraud detection + vote manipulation checks (Day 6)
- [ ] Testing & QA (Days 6-7)

---

## Game 8: Daily Puzzle Master

**Month 1 Revenue: ₦520K | Players: ~4,000 | Avg Session: 6 min**

### Game Mechanics

- One puzzle per day per category: Sudoku, Crossword, Logic puzzle, Word search
- Solve as fast as possible, upload screenshot proof
- Daily leaderboard: First 100 solvers get tokens
- Entry: Free (optional 100 tokens for "premium daily" with hint access)
- Rewards: 1st solver gets 300 tokens, 2nd-10th scaled down, 11-100th get 50 tokens each
- Cosmetics: Puzzle board themes, "Puzzle Master" badges
- Streak system: Solve 5 days in a row = 50% bonus tokens

### Database Schema

```sql
CREATE TABLE daily_puzzles (
  id BIGSERIAL PRIMARY KEY,
  puzzle_date DATE NOT NULL UNIQUE,
  sudoku_id BIGINT REFERENCES sudoku_puzzles(id),
  crossword_id BIGINT REFERENCES crossword_puzzles(id),
  logic_puzzle_id BIGINT REFERENCES logic_puzzles(id),
  word_search_id BIGINT REFERENCES word_search_puzzles(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sudoku_puzzles (
  id BIGSERIAL PRIMARY KEY,
  difficulty_level VARCHAR(20), -- 'easy', 'medium', 'hard'
  grid_initial INT[][] NOT NULL, -- 9x9 grid with clues
  grid_solution INT[][] NOT NULL,
  estimated_completion_minutes INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE crossword_puzzles (
  id BIGSERIAL PRIMARY KEY,
  difficulty_level VARCHAR(20),
  grid_size INT, -- 15x15, 19x19, etc.
  clues_across JSONB, -- [{ number: 1, clue: "...", answer_length: 5 }, ...]
  clues_down JSONB,
  grid_solution TEXT, -- Base64 encoded grid with answers
  estimated_completion_minutes INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE logic_puzzles (
  id BIGSERIAL PRIMARY KEY,
  difficulty_level VARCHAR(20),
  puzzle_type VARCHAR(50), -- 'einstein_puzzle', 'lateral_thinking', 'pattern_logic'
  puzzle_statement TEXT,
  clues JSONB,
  solution TEXT,
  estimated_completion_minutes INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE word_search_puzzles (
  id BIGSERIAL PRIMARY KEY,
  difficulty_level VARCHAR(20),
  grid_size INT,
  words_to_find VARCHAR[] NOT NULL,
  theme VARCHAR(100), -- "Nigerian Culture", "Technology", etc.
  grid_solution TEXT,
  estimated_completion_minutes INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE puzzle_submissions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  puzzle_id BIGINT NOT NULL,
  puzzle_type VARCHAR(20), -- 'sudoku', 'crossword', 'logic', 'word_search'
  puzzle_date DATE,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completion_time_seconds INT,
  is_correct BOOLEAN,
  solution_screenshot_url VARCHAR(255), -- Proof image
  daily_rank INT,
  campus_id INT,
  tokens_earned INT,
  streak_multiplier FLOAT DEFAULT 1.0
);

CREATE TABLE puzzle_user_stats (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  total_puzzles_solved INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  sudoku_best_time_seconds INT,
  crossword_best_time_seconds INT,
  logic_best_time_seconds INT,
  word_search_best_time_seconds INT,
  tokens_earned INT DEFAULT 0,
  tokens_spent INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE puzzle_daily_leaderboard (
  id BIGSERIAL PRIMARY KEY,
  puzzle_date DATE NOT NULL,
  puzzle_type VARCHAR(20),
  rank INT,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  completion_time_seconds INT,
  tokens_awarded INT,
  campus_id INT,
  UNIQUE(puzzle_date, puzzle_type, rank)
);
```

### API Endpoints (14 endpoints)

```
GET    /api/puzzle/today
       Response: { sudoku: {...}, crossword: {...}, logic: {...}, word_search: {...} }

GET    /api/puzzle/today/:puzzleType
       Query: { puzzle_type: 'sudoku|crossword|logic|word_search' }
       Response: { puzzle_id, puzzle_data, estimated_time, start_time }

POST   /api/puzzle/:puzzleType/submit
       Body: { puzzle_date, solution_screenshot: blob }
       Response: { is_correct, completion_time, daily_rank, tokens_earned }

GET    /api/puzzle/leaderboard/today
       Query: { puzzle_type?: 'sudoku|crossword|logic|word_search', limit: 100 }
       Response: [{ rank, user_id, username, completion_time, tokens_earned }]

GET    /api/puzzle/user/stats
       Response: { total_solved, current_streak, best_times: {...}, tokens_earned }

GET    /api/puzzle/user/streak
       Response: { current_streak, days_in_streak, next_bonus_tokens, all_time_streak }

POST   /api/puzzle/hints/purchase
       Body: { puzzle_type, puzzle_date, hint_count: 1-3 }
       Response: { success, hints: [...], tokens_spent }

GET    /api/puzzle/hints/available
       Query: { puzzle_type, puzzle_date }
       Response: { hints_available: 3, tokens_cost_each: 25, purchased_count: 0 }

GET    /api/puzzle/categories
       Response: [{ type: 'sudoku', difficulty_options, estimated_times }]

GET    /api/puzzle/archive
       Query: { month?: '2024-01', limit: 30 }
       Response: [{ date, puzzle_types, leaderboard_leaders }]

POST   /api/puzzle/cosmetics/purchase
       Body: { cosmetic_id: 'board_theme_sunset|badge_sudoku_master' }
       Response: { success, new_balance }

GET    /api/puzzle/cosmetics/shop
       Response: [{ id, name, type, price_tokens, preview_url }]

GET    /api/puzzle/trending-solvers
       Query: { timeframe: 'today|week', limit: 20 }
       Response: [{ user_id, username, current_rank, improvement, campus }]

POST   /api/puzzle/premium-daily/subscribe
       Body: { subscription_type: 'monthly' }
       Response: { success, subscription_id, monthly_cost_tokens: 500 }
```

### Frontend Components

**Screens:**
1. Daily Puzzle Selector - Choose between 4 puzzle types for the day
2. Puzzle Solver - Interactive puzzle interface (depends on type)
3. Solution Upload - Camera or screenshot selector + proof submission
4. Results - Confirmation screen + daily rank + tokens awarded
5. Leaderboard - Daily rankings per puzzle type
6. Streak Dashboard - Current streak + bonus tracker
7. Archive - Past puzzles (playable but no rewards)
8. Shop - Board themes + badges

**Key UI Elements:**
- Interactive puzzle grids (Sudoku, Crossword, Word Search)
- Timer + estimated completion time
- Hint buttons (premium feature)
- Screenshot preview before submission
- Streak counter with milestone badges

### Fraud Prevention

```
1. Solution Verification:
   - Verify screenshot contains valid solution grid
   - Use OCR to read submitted solution, validate against correct answer
   - Detect if screenshot is obviously wrong but user claims victory

2. Submission Timing:
   - Flag if submission happens <1 minute for hard puzzles (too fast)
   - Compare against median completion time for that puzzle
   - Alert if user completes puzzle in 1/10th of estimated time

3. Pattern Detection:
   - Flag if same user solves all 4 daily puzzles <2 minutes apart (bot)
   - Flag if new account solves hard puzzle perfectly on day 1
   - Detect streak patterns that are statistically impossible

4. Image Analysis:
   - Verify screenshot is actual puzzle (not pre-generated image)
   - Detect if screenshot is identical to previous submissions (replay)
   - Check for signs of Photoshop or image manipulation

5. Account Behavior:
   - Restrict to max 1 submission per puzzle type per day
   - Max 30-day streaks verified (then require manual review)
   - Flag accounts with 100+ day streaks (likely cheating)
```

### Payout Calculation

```javascript
function calculatePuzzlePayouts(submission) {
  const ESTIMATED_TIME = submission.puzzle.estimated_completion_minutes * 60;
  const ACTUAL_TIME = submission.completion_time_seconds;
  const TIME_RATIO = ACTUAL_TIME / ESTIMATED_TIME;
  
  // Base payout by rank
  let BASE_TOKENS = 0;
  if (submission.daily_rank <= 1) BASE_TOKENS = 300;
  if (submission.daily_rank <= 10) BASE_TOKENS = Math.max(50, 300 - (submission.daily_rank * 20));
  if (submission.daily_rank <= 100) BASE_TOKENS = 50;
  
  // Streak bonus multiplier
  let STREAK_BONUS = 1.0;
  if (submission.user.current_streak >= 5) STREAK_BONUS = 1.5;
  if (submission.user.current_streak >= 10) STREAK_BONUS = 2.0;
  
  // Speed bonus (if significantly faster than estimated)
  let SPEED_BONUS = 0;
  if (TIME_RATIO < 0.5) SPEED_BONUS = 100; // Solved in <50% estimated time
  
  const FINAL_TOKENS = Math.floor((BASE_TOKENS * STREAK_BONUS) + SPEED_BONUS);
  
  return {
    tokens_earned: FINAL_TOKENS,
    tokens_spent: 0, // Free to play (optional premium)
    rank: submission.daily_rank,
    streak_bonus_applied: STREAK_BONUS > 1.0
  };
}
```

### Monthly Revenue

```
Scenario: 4,000 daily active users, avg 3 puzzles solved/day

Entry Fees (Free, but premium hints):
  Negligible revenue from free players

Premium Hints (200 tokens cost):
  12% conversion × 2 hints per puzzle × 300 tokens = 144,000 tokens/day
  = 144,000 × 0.10 = ₦14,400/day = ₦432K/month

Monthly Premium Subscription (500 tokens):
  2% conversion × 500 tokens = 40,000 tokens/day
  = 40,000 × 0.10 = ₦4,000/day = ₦120K/month

Cosmetics (Board themes, badges):
  8% conversion × 350 tokens = 112,000 tokens/day
  = 112,000 × 0.10 = ₦11,200/day = ₦336K/month

Sponsorships (Brain training brands, memory apps):
  ₦150K/month

TOTAL MONTH 1: ₦432K + ₦120K + ₦336K + ₦150K = ₦1.038M

MONTH 6 (6,000 DAU):
  = ₦1.5M (scaled at 40%)

Actual Month 1 Projection: ₦520K (conservative - free model limits revenue)
```

### Implementation Checklist (Week 5-6)

- [ ] Database schema + 30 puzzles of each type (Days 1-2)
- [ ] Puzzle generation/storage (Days 2-3)
- [ ] Interactive puzzle UIs (Sudoku solver, Crossword editor) (Days 3-4)
- [ ] Screenshot proof verification + OCR (Days 4-5)
- [ ] Solution validation algorithm (Day 5)
- [ ] Leaderboard calculations + streak tracking (Day 5)
- [ ] Frontend components (Days 5-6)
- [ ] Fraud detection + image analysis (Day 6)
- [ ] Testing & QA (Days 6-7)

---

## Fraud Detection Framework

### Unified Fraud Scoring System

Every game feeds into a central fraud detection engine:

```sql
CREATE TABLE fraud_scoring_engine (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  game_id VARCHAR(50),
  anomaly_type VARCHAR(50),
  anomaly_score FLOAT DEFAULT 0, -- 0-100
  confidence_percent FLOAT, -- 0-100
  evidence JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_verified BOOLEAN DEFAULT FALSE,
  action_taken VARCHAR(50) -- 'none', 'warning', 'points_deduction', 'suspension', 'ban'
);

-- Stored Procedure: Calculate User Fraud Score
CREATE OR REPLACE FUNCTION calculate_fraud_score(p_user_id UUID)
RETURNS FLOAT AS $$
DECLARE
  v_fraud_score FLOAT := 0;
  v_typing_anomalies INT;
  v_trivia_accuracy_spikes INT;
  v_reaction_impossibilities INT;
  v_vote_collusion_attempts INT;
  v_new_account_age_days INT;
BEGIN
  SELECT EXTRACT(DAY FROM (NOW() - created_at))::INT INTO v_new_account_age_days
  FROM auth.users WHERE id = p_user_id;
  
  -- New account penalty (first 7 days = higher scrutiny)
  IF v_new_account_age_days < 7 THEN
    v_fraud_score := v_fraud_score + 15;
  END IF;
  
  -- Typing anomalies
  SELECT COUNT(*) INTO v_typing_anomalies
  FROM fraud_reports
  WHERE reported_user_id = p_user_id AND game_id = 'typing' AND report_type = 'unlikely_score';
  v_fraud_score := v_fraud_score + (v_typing_anomalies * 10);
  
  -- Trivia accuracy spikes
  SELECT COUNT(*) INTO v_trivia_accuracy_spikes
  FROM fraud_reports
  WHERE reported_user_id = p_user_id AND game_id = 'trivia' AND report_type = 'accuracy_anomaly';
  v_fraud_score := v_fraud_score + (v_trivia_accuracy_spikes * 12);
  
  -- Reaction speed impossibilities
  SELECT COUNT(*) INTO v_reaction_impossibilities
  FROM fraud_reports
  WHERE reported_user_id = p_user_id AND game_id = 'reaction' AND report_type = 'subhuman_reaction';
  v_fraud_score := v_fraud_score + (v_reaction_impossibilities * 20);
  
  -- Vote collusion attempts
  SELECT COUNT(*) INTO v_vote_collusion_attempts
  FROM fraud_reports
  WHERE reported_user_id = p_user_id AND report_type = 'vote_manipulation';
  v_fraud_score := v_fraud_score + (v_vote_collusion_attempts * 15);
  
  -- Cap score at 100
  RETURN LEAST(v_fraud_score, 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-flag users with fraud_score > 70
CREATE TRIGGER fraud_score_check
AFTER INSERT ON fraud_reports
FOR EACH ROW EXECUTE FUNCTION check_fraud_threshold();
```

### Real-Time Anomaly Detection

```javascript
// Backend fraud detection engine
class FraudDetectionEngine {
  async analyzeUserBehavior(userId, gameId, score, metadata) {
    const anomalies = [];
    
    // Check 1: Timing anomalies
    if (this.isTimingAnomaly(metadata)) {
      anomalies.push({
        type: 'timing_anomaly',
        confidence: 0.85,
        description: 'Submission too fast for human performance'
      });
    }
    
    // Check 2: Pattern detection
    if (this.isPatternViolation(userId, gameId, score)) {
      anomalies.push({
        type: 'pattern_violation',
        confidence: 0.72,
        description: 'Performance spike inconsistent with history'
      });
    }
    
    // Check 3: Device fingerprinting
    if (await this.isDeviceSuspicious(userId, metadata.device_id, metadata.ip)) {
      anomalies.push({
        type: 'device_anomaly',
        confidence: 0.68,
        description: 'Multiple accounts from same device'
      });
    }
    
    // Calculate total fraud score
    const totalFraudScore = anomalies.reduce((sum, a) => sum + a.confidence, 0) / anomalies.length;
    
    if (totalFraudScore > 0.7) {
      await this.reportFraud(userId, gameId, anomalies, totalFraudScore);
      return { suspicious: true, score: totalFraudScore, anomalies };
    }
    
    return { suspicious: false, score: totalFraudScore, anomalies: [] };
  }
  
  isTimingAnomaly(metadata) {
    return metadata.completion_time_ms < metadata.game_minimum_time_ms * 0.5;
  }
  
  isPatternViolation(userId, gameId, currentScore) {
    const userHistory = this.getUserGameHistory(userId, gameId);
    const avgScore = userHistory.scores.reduce((a,b) => a+b) / userHistory.scores.length;
    const stdDev = Math.sqrt(userHistory.scores.reduce((sq, n) => sq + Math.pow(n - avgScore, 2)) / userHistory.scores.length);
    
    // Flag if current score is >3 standard deviations above average
    return Math.abs(currentScore - avgScore) > (3 * stdDev) && currentScore > avgScore;
  }
  
  async isDeviceSuspicious(userId, deviceId, ip) {
    const accountsFromDevice = await db.query(
      `SELECT COUNT(DISTINCT user_id) as account_count 
       FROM gaming_sessions 
       WHERE device_fingerprint = $1 AND user_id != $2`,
      [deviceId, userId]
    );
    
    return accountsFromDevice[0].account_count > 5; // More than 5 accounts from same device
  }
  
  async reportFraud(userId, gameId, anomalies, score) {
    await db.query(
      `INSERT INTO fraud_reports (reported_user_id, game_id, report_type, evidence, severity_score)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, gameId, anomalies[0].type, JSON.stringify(anomalies), score]
    );
  }
}
```

---

## Implementation Timeline

### Phase 1: Core Infrastructure (Week 1)
- [ ] Shared database deployment (cosmetics, leaderboards, fraud detection)
- [ ] Token payout engine + atomic transactions
- [ ] Notification system
- [ ] Authentication & authorization layer
- [ ] Fraud detection framework

### Phase 2: Typing Master + QuickFire Trivia (Weeks 1-2)
- [ ] Database schemas
- [ ] API endpoints (12 + 16 = 28 endpoints)
- [ ] Frontend components
- [ ] Fraud detection rules
- [ ] Testing & QA
- **Status**: Ready for production by end of Week 2

### Phase 3: Code Challenges + Music Quiz (Weeks 2-3)
- [ ] Database schemas
- [ ] Code sandbox + test execution
- [ ] Audio catalog + streaming
- [ ] Plagiarism detection
- [ ] Pitch accuracy AI
- **Status**: Ready for production by end of Week 3

### Phase 4: Draw & Guess + Reaction King (Week 4)
- [ ] Real-time canvas syncing (WebSocket)
- [ ] Stimulus engine (visual/audio)
- [ ] Content moderation
- [ ] Fraud detection
- **Status**: Ready for production by end of Week 4

### Phase 5: Karaoke Challenge + Daily Puzzle (Weeks 5-6)
- [ ] Audio recording infrastructure
- [ ] Pitch analysis AI integration
- [ ] Sudoku solver + crossword validation
- [ ] OCR for screenshot verification
- **Status**: Ready for production by end of Week 6

### Phase 6: Integration & Launch (Week 7)
- [ ] Cross-game cosmetics system
- [ ] Unified leaderboard + notifications
- [ ] Analytics dashboard
- [ ] Full system testing
- [ ] Security audit
- **Status**: Launch ready

---

## Revenue Summary

| Game | Month 1 | Month 6 | Players | Session Avg |
|------|---------|---------|---------|------------|
| Typing Master | ₦1.45M | ₦2.1M | 8,000 | 5 min |
| QuickFire Trivia | ₦980K | ₦3.5M | 10,000 | 3 min |
| Code Challenges | ₦1.2M | ₦2.8M | 2,000 | 10 min |
| Music Quiz | ₦980K | ₦9.5M | 12,000 | 4 min |
| Draw & Guess | ₦680K | ₦2.4M | 5,000 | 8 min |
| Reaction King | ₦2.1M | ₦7.2M | 15,000 | 2 min |
| Karaoke Challenge | ₦1.1M | ₦3.5M | 3,000 | 5 min |
| Daily Puzzle | ₦520K | ₦1.5M | 4,000 | 6 min |
| **TOTAL** | **₦6.18M** | **₦32.1M** | **59,000** | **4.4 min avg** |

**Key Metrics:**
- Average entry fee: ₦7.50 per session
- Cosmetics conversion: 10-25% across games
- Platform rake (net revenue): 13-18% of entry fees
- Month 1 revenue breakdown: 35% rake + 65% cosmetics/sponsorships
- Projected break-even: Week 2 (if 30K DAU reached)
- Profitability at scale: Month 6 at ₦32.1M / month

---

## Next Steps

1. **Confirm deployment order**: Start Typing Master + QuickFire Trivia Week 1?
2. **Media infrastructure**: Supabase Storage for audio/images, or AWS S3?
3. **Real-time sync**: WebSocket library (Socket.io or native WebSocket)?
4. **AI services**: Use Claude API for fraud detection anomaly scoring, or OpenAI?
5. **Audio processing**: Use Web Audio API or server-side processing?
