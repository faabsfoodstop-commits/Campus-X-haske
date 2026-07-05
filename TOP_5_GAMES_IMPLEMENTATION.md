# Top 5 Games Implementation Specification

**Status:** Ready for Development  
**Version:** 1.0  
**Last Updated:** 2026-07-05  
**Estimated Build Time:** 8-12 weeks  
**Revenue Potential:** ₦15M-₦35M/month across all 5 games

---

## Table of Contents

1. [Game 1: Meme Battles](#game-1-meme-battles)
2. [Game 2: Freestyle Rap Battles](#game-2-freestyle-rap-battles)
3. [Game 3: Sports Prediction League](#game-3-sports-prediction-league)
4. [Game 4: Exam Predictions](#game-4-exam-predictions)
5. [Game 5: Gaming Tournaments](#game-5-gaming-tournaments)
6. [Cross-Game Infrastructure](#cross-game-infrastructure)
7. [Implementation Timeline](#implementation-timeline)
8. [Revenue & Metrics](#revenue--metrics)

---

## GAME 1: Meme Battles

### Overview

Daily meme creation competition where users edit provided templates and compete for tokens through community voting.

**Why First:** Free entry = massive participation volume = immediate engagement boost

### Mechanics

```
Daily Meme Template Release:
├─ 10am daily: Platform releases meme template
├─ Template: Image + caption guidelines (e.g., "Campus Life Fails")
├─ Users have 24 hours to submit entry

User Submission:
├─ User edits template (add text, stickers, emojis in-app editor)
├─ Add optional caption/context
├─ Submit for competition
├─ Entry is free (no token cost)

Voting & Winners:
├─ Community upvotes (like/heart system, 5-star ratings)
├─ Duration: 24 hours after submission closes
├─ Top 5 daily winner

Payouts (Daily):
├─ #1: 1,000 tokens (₦100)
├─ #2: 600 tokens (₦60)
├─ #3: 400 tokens (₦40)
├─ #4: 300 tokens (₦30)
├─ #5: 200 tokens (₦20)
└─ Total daily payout: 2,500 tokens (₦250)

Monthly Payout:
├─ 30 days × ₦250 = ₦7,500 spent
├─ Platform revenue: ₦0 direct, but high engagement
└─ Secondary revenue: Cosmetics from winners buying status items
```

### Database Schema

```sql
CREATE TABLE meme_templates (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT, -- 'campus_life', 'relationships', 'exams', 'random'
  base_image_url TEXT,
  guidelines TEXT, -- "Add funny caption about failing exams"
  released_at TIMESTAMP DEFAULT NOW(),
  submission_deadline TIMESTAMP,
  voting_deadline TIMESTAMP,
  status TEXT DEFAULT 'active', -- 'active', 'voting', 'completed'
  created_by UUID REFERENCES users(id),
  INDEX (released_at, status)
);

CREATE TABLE meme_submissions (
  id UUID PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES meme_templates(id),
  user_id UUID NOT NULL REFERENCES users(id),
  edited_image_url TEXT, -- Edited version uploaded to Supabase storage
  caption TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  upvote_count INT DEFAULT 0,
  downvote_count INT DEFAULT 0,
  rating_sum BIGINT DEFAULT 0, -- Sum of 1-5 star ratings
  rating_count INT DEFAULT 0,
  average_rating DECIMAL GENERATED ALWAYS AS (
    CASE WHEN rating_count > 0 THEN rating_sum / rating_count ELSE 0 END
  ) STORED,
  rank INT, -- Calculated after voting ends
  INDEX (template_id, average_rating DESC),
  INDEX (user_id, submitted_at)
);

CREATE TABLE meme_votes (
  id UUID PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES meme_submissions(id),
  voter_id UUID NOT NULL REFERENCES users(id),
  vote_type TEXT, -- 'upvote', 'downvote'
  rating INT, -- 1-5 stars
  voted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(submission_id, voter_id), -- Can't vote twice on same meme
  INDEX (submission_id, voted_at)
);

CREATE TABLE meme_battle_winners (
  id UUID PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES meme_templates(id),
  rank INT, -- 1-5
  user_id UUID NOT NULL REFERENCES users(id),
  submission_id UUID NOT NULL REFERENCES meme_submissions(id),
  tokens_won BIGINT,
  announced_at TIMESTAMP DEFAULT NOW(),
  INDEX (template_id, rank)
);
```

### API Endpoints

```
GET    /api/games/memes/template/current       Get today's template
POST   /api/games/memes/submit                 Submit meme entry
GET    /api/games/memes/submissions/:template_id    List submissions for voting
POST   /api/games/memes/vote                   Vote/rate submission
POST   /api/games/memes/finalize/:template_id      Finalize & distribute rewards (admin)
GET    /api/games/memes/winners                Get past winners/leaderboard
GET    /api/games/memes/my-entries             Get user's past entries
```

### UI Components

#### Template Release Card
```
┌─────────────────────────────────────┐
│    TODAY'S MEME BATTLE 🎨            │
├─────────────────────────────────────┤
│                                     │
│ THEME: "Campus Life Fails"          │
│                                     │
│ [TEMPLATE IMAGE]                    │
│ (Shows the base meme template)       │
│                                     │
│ Guidelines:                         │
│ "Add funny caption about campus"   │
│ "Relatable campus fail situations"  │
│                                     │
│ Submissions so far: 234             │
│ Your status: Not submitted yet      │
│                                     │
│ [EDIT & SUBMIT] [VIEW ENTRIES]      │
│                                     │
│ ⏱️  Submissions close in: 12 hours   │
│                                     │
└─────────────────────────────────────┘
```

#### Meme Editor
```
┌─────────────────────────────────────┐
│    EDIT YOUR MEME                   │
├─────────────────────────────────────┤
│                                     │
│ Base Image:                         │
│ [PREVIEW OF TEMPLATE]               │
│                                     │
│ Add Text:                           │
│ ┌───────────────────────────────┐   │
│ │ Type your funny text here...  │   │
│ └───────────────────────────────┘   │
│                                     │
│ Text Options:                       │
│ Font: [Courier v]  Size: [24px v]  │
│ Color: [Black v]   Position: [Top] │
│                                     │
│ Add Stickers:                       │
│ [😂] [😭] [🔥] [💀] [👑]            │
│                                     │
│ Preview:                            │
│ [SHOWS EDITED MEME PREVIEW]         │
│                                     │
│ Caption (Optional):                 │
│ [This is literally me lol]          │
│                                     │
│ [SUBMIT] [CANCEL] [SAVE DRAFT]      │
│                                     │
└─────────────────────────────────────┘
```

#### Voting Feed
```
┌─────────────────────────────────────┐
│    VOTE ON MEMES                    │
├─────────────────────────────────────┤
│ Showing: 234 entries | Sort by: Hot │
│                                     │
│ ENTRY #1 by Ahmed                   │
│ [MEME IMAGE]                        │
│ Caption: "When Prof says attendance" │
│           "doesn't matter..."       │
│                                     │
│ ⭐ ⭐ ⭐ ⭐ ⭐ (4.2/5, 1,234 votes)   │
│ 👍 2,345  👎 45                     │
│                                     │
│ [👍 UPVOTE] [👎 DOWNVOTE] [⭐ RATE]  │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ ENTRY #2 by Zainab                  │
│ [MEME IMAGE]                        │
│ Caption: "Submitting assignment..." │
│           "At 11:59pm"              │
│                                     │
│ ⭐ ⭐ ⭐ ⭐ (4.8/5, 2,100 votes)      │
│ 👍 3,200  👎 20                     │
│                                     │
│ [👍 UPVOTE] [👎 DOWNVOTE] [⭐ RATE]  │
│                                     │
│ [LOAD MORE]                         │
│                                     │
└─────────────────────────────────────┘
```

#### Winner Announcement
```
┌─────────────────────────────────────┐
│ 🎉 MEME BATTLE RESULTS 🎉           │
├─────────────────────────────────────┤
│                                     │
│ Theme: "Campus Life Fails"          │
│ Total entries: 234                  │
│ Total votes cast: 12,450            │
│                                     │
│ 🥇 #1 WINNER: Zainab                │
│    Meme: "Submitting at 11:59pm"   │
│    Rating: 4.8/5 (2,100 votes)     │
│    Prize: 1,000 tokens (₦100) ✓    │
│    [CLAIM REWARD]                  │
│                                     │
│ 🥈 #2: Ahmed                        │
│    Rating: 4.5/5                    │
│    Prize: 600 tokens ✓              │
│                                     │
│ 🥉 #3: Hassan                       │
│    Rating: 4.2/5                    │
│    Prize: 400 tokens ✓              │
│                                     │
│ #4: Chidi (4.0/5) - 300 tokens      │
│ #5: Amara (3.9/5) - 200 tokens      │
│                                     │
│ Next battle: Tomorrow 10am!         │
│ [VIEW ALL ENTRIES] [SHARE RESULTS]  │
│                                     │
└─────────────────────────────────────┘
```

### Fraud Prevention

```
Vote Manipulation:
├─ Limit: Users can only vote once per meme
├─ Detection: Monitor users voting on all entries (100% voting = suspicious)
├─ Action: Flag account for review if >50 votes in 1 hour

Duplicate Accounts:
├─ Detect: Same IP/device creating multiple accounts
├─ Action: Link accounts, prevent voting between linked accounts

Image Issues:
├─ Check: Offensive/NSFW content (AI content moderation)
├─ Action: Auto-reject entries with nude/hate speech
├─ Appeal: Users can appeal rejections

Timing Manipulation:
├─ Track: Submission times (batch submissions = suspicious)
├─ Action: Monitor for bots automatically submitting entries
```

### Monetization Strategy

```
Direct Revenue:
├─ Meme template creation: Free (platform owns templates)
├─ Entries: Free (encourage participation)
├─ Voting: Free (engagement)
└─ Payouts: ₦250/day (₦7.5K/month platform investment)

Indirect Revenue:
├─ Winners buy cosmetics to celebrate: ₦200K/month estimate
├─ Leaderboard cosmetics (past winners get special badge)
├─ Sponsored templates (brands sponsor meme templates)
│  ├─ Example: "Nike Meme Battle" - Nike pays platform
│  ├─ Nike provides template
│  ├─ Brand cosmetics as rewards
│  └─ Platform takes 20% commission = ₦50K+ per sponsored template

Secondary Monetization:
├─ Winning memes become platform assets (can sell as NFT future)
├─ Best memes featured in marketing
├─ Creator program (top 10 meme creators get monthly stipend)

Total Monthly Revenue (Meme Game):
├─ Platform investment (payouts): -₦7.5K
├─ Cosmetics from winners: ₦200K
├─ Sponsored templates: ₦50K+
└─ NET: ₦242.5K/month minimum
```

### Implementation Checklist

```
Week 1:
├─ Design meme editor UI (in-app image editing)
├─ Create database schema
├─ Build template management dashboard (admin)
└─ Setup image upload to Supabase storage

Week 2:
├─ Build submission API endpoints
├─ Build voting system (rate + vote)
├─ Create winner calculation logic
├─ Build UI components (template release, editor, voting, winners)

Week 3:
├─ Content moderation (integrate AI for NSFW detection)
├─ Test voting manipulation prevention
├─ Create daily template release automation
├─ Setup winner notifications + reward distribution

Testing:
├─ Create 50 test accounts
├─ Submit 500 test memes
├─ Vote on all (test manipulation detection)
├─ Verify payouts correct
└─ Test image upload/display quality
```

---

## GAME 2: Freestyle Rap Battles

### Overview

Weekly freestyle rap competition where users record 30-second raps and compete through community voting.

**Why Second:** High engagement + cultural fit (hip-hop huge in Nigeria)

### Mechanics

```
Weekly Rhythm Release:
├─ Monday: Platform releases 3 beat options
├─ Users choose beat and record freestyle
├─ Submission window: Monday-Wednesday

Recording Session:
├─ User listens to beat (in-app player)
├─ Records 30-second freestyle rap (in-app recorder)
├─ Can re-record unlimited times
├─ Submit when ready

Entry Cost: 500 tokens (₦50)

Voting & Community:
├─ Community votes on best rap (Thursday-Sunday)
├─ Rating system (1-5 stars)
├─ Top 10 advance to winner payouts

Payouts (Weekly):
├─ #1: 2,000 tokens (₦200)
├─ #2: 1,200 tokens (₦120)
├─ #3: 800 tokens (₦80)
├─ #4: 600 tokens (₦60)
├─ #5: 500 tokens (₦50)
├─ #6-10: 300 tokens each (₦30)
└─ Total weekly payout: 8,200 tokens (₦820)

Platform Revenue (Per Week):
├─ 200 entries × 500 tokens = 100K tokens (₦10K)
├─ Payout: 8.2K tokens (₦820)
├─ Commission: 2.5% on payouts = 205 tokens (₦20.50)
├─ Platform takes: 100K tokens × 25% = 25K tokens (₦2.5K net)
└─ Weekly revenue: ₦2.5K (₦10K/month)

With secondary monetization (cosmetics, beats):
├─ Beat packs (premium beats): ₦200K/month
├─ Rap cosmetics (chains, microphones): ₦300K/month
└─ TOTAL: ₦500K+/month
```

### Database Schema

```sql
CREATE TABLE rap_beats (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL, -- "Trap Beat 001"
  bpm INT, -- Beats per minute
  genre TEXT, -- 'trap', 'hiphop', 'boom_bap', 'rnb'
  audio_url TEXT, -- Stored in Supabase storage
  difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  created_by UUID REFERENCES users(id), -- Producer
  released_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (released_at, genre)
);

CREATE TABLE rap_challenges (
  id UUID PRIMARY KEY,
  title TEXT, -- "Week 3: Money Talks"
  theme TEXT, -- Optional theme guidance
  beat_ids UUID[], -- Array of beat IDs to choose from
  started_at TIMESTAMP,
  submission_deadline TIMESTAMP,
  voting_deadline TIMESTAMP,
  status TEXT DEFAULT 'submissions', -- 'submissions', 'voting', 'completed'
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (status, voting_deadline)
);

CREATE TABLE rap_submissions (
  id UUID PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES rap_challenges(id),
  user_id UUID NOT NULL REFERENCES users(id),
  beat_id UUID NOT NULL REFERENCES rap_beats(id),
  audio_url TEXT, -- Recording stored in Supabase storage
  duration_seconds INT,
  title TEXT, -- Optional title for the rap
  submitted_at TIMESTAMP DEFAULT NOW(),
  upvote_count INT DEFAULT 0,
  downvote_count INT DEFAULT 0,
  rating_sum BIGINT DEFAULT 0,
  rating_count INT DEFAULT 0,
  average_rating DECIMAL GENERATED ALWAYS AS (
    CASE WHEN rating_count > 0 THEN rating_sum / rating_count ELSE 0 END
  ) STORED,
  rank INT,
  entry_cost_tokens BIGINT DEFAULT 500,
  INDEX (challenge_id, average_rating DESC),
  INDEX (user_id, submitted_at)
);

CREATE TABLE rap_votes (
  id UUID PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES rap_submissions(id),
  voter_id UUID NOT NULL REFERENCES users(id),
  rating INT CHECK (rating >= 1 AND rating <= 5), -- 1-5 stars
  voted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(submission_id, voter_id),
  INDEX (submission_id, voted_at)
);

CREATE TABLE rap_winners (
  id UUID PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES rap_challenges(id),
  rank INT CHECK (rank >= 1 AND rank <= 10),
  user_id UUID NOT NULL REFERENCES users(id),
  submission_id UUID NOT NULL REFERENCES rap_submissions(id),
  tokens_won BIGINT,
  announced_at TIMESTAMP DEFAULT NOW(),
  INDEX (challenge_id, rank)
);

CREATE TABLE beat_purchases (
  id UUID PRIMARY KEY,
  beat_id UUID NOT NULL REFERENCES rap_beats(id),
  user_id UUID NOT NULL REFERENCES users(id),
  purchased_at TIMESTAMP DEFAULT NOW(),
  cost_tokens BIGINT,
  INDEX (user_id, purchased_at)
);
```

### API Endpoints

```
GET    /api/games/rap/challenge/current        Get current challenge
GET    /api/games/rap/beats/:challenge_id      Get available beats
POST   /api/games/rap/beats/:beat_id/preview   Stream beat preview
POST   /api/games/rap/submit                   Upload rap submission
GET    /api/games/rap/submissions/:challenge_id    List raps for voting
POST   /api/games/rap/vote                     Vote on submission
GET    /api/games/rap/winners/:challenge_id    Get results
GET    /api/games/rap/leaderboard              All-time leaderboard
POST   /api/games/rap/beats/:beat_id/purchase  Buy premium beat
```

### UI Components

#### Beat Selection
```
┌─────────────────────────────────────┐
│    CHOOSE YOUR BEAT 🎤              │
├─────────────────────────────────────┤
│                                     │
│ Challenge: "Week 3: Money Talks"    │
│                                     │
│ Available Beats:                    │
│                                     │
│ BEAT 1: "Trap Vibes"                │
│ BPM: 92  Genre: Trap                │
│ [▶️ PREVIEW 30s] [SELECT]            │
│                                     │
│ BEAT 2: "Boom Bap Classic"          │
│ BPM: 85  Genre: Boom Bap            │
│ [▶️ PREVIEW 30s] [SELECT]            │
│                                     │
│ BEAT 3: "RnB Smooth" 👑 PREMIUM     │
│ BPM: 76  Genre: RnB                 │
│ [▶️ PREVIEW 30s] [UNLOCK - 200 tokens]│
│                                     │
│ Selected: Trap Vibes                │
│ [PROCEED TO RECORDING]              │
│                                     │
└─────────────────────────────────────┘
```

#### Recording Session
```
┌─────────────────────────────────────┐
│    RECORD YOUR RAP 🎤               │
├─────────────────────────────────────┤
│                                     │
│ Beat: Trap Vibes (92 BPM)           │
│                                     │
│ ▶️ [BEAT PREVIEW] ⏸ [STOP]          │
│                                     │
│ Recording Status:                   │
│ [READY TO RECORD] [⏹ RECORDING...] │
│                                     │
│ Microphone: 🎤 Active               │
│ Volume: ▓▓▓▓░░░░░░ (60%)            │
│                                     │
│ Time: 00:30 (Max 30 seconds)        │
│                                     │
│ [⏺️ START RECORDING]                 │
│                                     │
│ ------- AFTER RECORDING -------     │
│                                     │
│ Duration: 30 seconds ✓              │
│                                     │
│ Preview (Your Recording):           │
│ [▶️ LISTEN BACK] ⏸ [STOP]           │
│                                     │
│ Title (Optional):                   │
│ [Money Over Everything]             │
│                                     │
│ [RE-RECORD] [SUBMIT ENTRY (₦50)]   │
│                                     │
└─────────────────────────────────────┘
```

#### Voting Feed
```
┌─────────────────────────────────────┐
│    VOTE ON RAPS 🎤                  │
├─────────────────────────────────────┤
│ Showing: 185 entries                │
│ Challenge: "Money Talks"            │
│                                     │
│ RAP #1 by Ahmed                     │
│ Beat: Trap Vibes (92 BPM)           │
│ Duration: 30s                       │
│                                     │
│ [▶️ PLAY RAP]  [PAUSE]               │
│                                     │
│ ⭐ ⭐ ⭐ ⭐ ⭐ (4.6/5, 890 votes)     │
│ 👍 1,234  👎 56                     │
│                                     │
│ [👍 UPVOTE] [👎 DOWNVOTE]           │
│ [⭐ RATE 1-5]  [SHARE]              │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ RAP #2 by Zainab                    │
│ Beat: Boom Bap Classic (85 BPM)     │
│ Duration: 28s                       │
│                                     │
│ [▶️ PLAY RAP]  [PAUSE]               │
│                                     │
│ ⭐ ⭐ ⭐ ⭐ (4.8/5, 1,250 votes)      │
│ 👍 2,100  👎 30                     │
│                                     │
│ [👍 UPVOTE] [👎 DOWNVOTE]           │
│ [⭐ RATE 1-5]  [SHARE]              │
│                                     │
│ [LOAD MORE]                         │
│                                     │
└─────────────────────────────────────┘
```

#### Winner Announcement
```
┌─────────────────────────────────────┐
│🏆 RAP BATTLE WINNERS - WEEK 3 🏆    │
├─────────────────────────────────────┤
│                                     │
│ Theme: "Money Talks"                │
│ Total Entries: 185                  │
│ Total Votes: 12,450                 │
│                                     │
│ 🥇 #1: Zainab                       │
│    Rap: "Money Over Everything"     │
│    Beat: Boom Bap Classic           │
│    Rating: 4.8/5 (1,250 votes)      │
│    Prize: 2,000 tokens (₦200) ✓     │
│                                     │
│ 🥈 #2: Ahmed                        │
│    Rating: 4.6/5                    │
│    Prize: 1,200 tokens (₦120) ✓     │
│                                     │
│ 🥉 #3: Hassan                       │
│    Rating: 4.4/5                    │
│    Prize: 800 tokens (₦80) ✓        │
│                                     │
│ #4: Chidi (4.3/5) - 600 tokens      │
│ #5: Amara (4.1/5) - 500 tokens      │
│ #6-10: [View More]                  │
│                                     │
│ Next Challenge: Week 4 (Monday)     │
│ Topic: "Campus Chronicles"          │
│                                     │
│ [VIEW ALL ENTRIES] [SHARE WINNER]   │
│                                     │
└─────────────────────────────────────┘
```

### Fraud Prevention

```
Audio Manipulation:
├─ Check: Audio length (must be ~30 seconds)
├─ Check: No pre-recorded samples (AI detection)
├─ Action: Flag suspicious audio for review

Vote Manipulation:
├─ Limit: One vote per user per submission
├─ Detection: Monitor voting patterns (same IP voting on all raps)
├─ Action: Remove votes, flag account

Bot Detection:
├─ Check: Human voice detection (must have human speaking)
├─ Check: Silences/pauses (real raps have natural pauses)
├─ Action: Reject submissions that don't pass

Rating Bombing:
├─ Monitor: Sudden spikes in rating changes
├─ Detection: Same user voting multiple times (prevented by unique constraint)
├─ Action: Invalidate suspicious ratings
```

### Monetization Strategy

```
Direct Revenue:
├─ Entry fee: 500 tokens per submission (₦50)
├─ Expected entries/week: 200-300
├─ Weekly revenue: 100K-150K tokens (₦10K-₦15K)
├─ Monthly revenue: ₦40K-₦60K

Premium Beat Packs:
├─ Producers create premium beats (₦200+ per beat)
├─ Users buy exclusive beats to use
├─ Expected: 50 premium beat sales/month
├─ Revenue: ₦10K/month

Cosmetics (Rap-Themed):
├─ "Gold Chain" cosmetic (₦1,000) - winners buy to celebrate
├─ "Microphone" avatar prop (₦500)
├─ "Rap Crew" badge (₦800) - team cosmetics
├─ Expected: 100 cosmetics/month
├─ Revenue: ₦100K/month

Celebrity/Brand Challenges:
├─ Brands sponsor beat challenges
├─ Example: "Afrobeats Challenge" by Spotify
├─ Brand pays platform ₦500K for exposure
├─ Platform gives 30% to winners, keeps 70%
├─ Revenue: ₦350K per brand challenge

Creator Revenue Share:
├─ Top 10 rappers get monthly stipend
├─ ₦1,000 per top rapper = ₦10K
├─ Fund from cosmetics sales

Total Monthly Revenue (Rap Game):
├─ Entry fees: ₦50K
├─ Premium beats: ₦10K
├─ Cosmetics: ₦100K
├─ Brand challenges: ₦350K (seasonal)
├─ NET: ₦510K/month average
```

### Implementation Checklist

```
Week 1:
├─ Setup audio recording & storage (Supabase storage)
├─ Create beat management system
├─ Design database schema
├─ Build beat preview streaming

Week 2:
├─ Build recording UI (in-app audio recorder)
├─ Create submission API
├─ Build voting system
├─ Create winner calculation

Week 3:
├─ Audio validation (check length, quality)
├─ Build leaderboard
├─ Create notifications
├─ Setup payout distribution

Week 4:
├─ Test with 100 submissions
├─ Test voting (fraud detection)
├─ Quality check audio playback
├─ Load testing (multiple simultaneous recordings)
```

---

## GAME 3: Sports Prediction League

### Overview

Daily/weekly sports predictions where users forecast match outcomes and win tokens for correct predictions.

**Why Third:** Football obsession in Nigeria = massive engagement

### Mechanics

```
Daily Fixture Release:
├─ Platform releases fixtures (from API: ESPN, Yahoo Sports)
├─ Users predict outcomes for 5-10 matches
├─ Examples:
│  ├─ "Will Manchester United beat Liverpool?"
│  ├─ "What will be the exact score?" (harder, higher payout)
│  ├─ "Over/Under 2.5 goals?"
│  └─ "Which player scores first?"

Prediction Types:

Type 1: Match Winner (Easiest)
├─ Cost: 100 tokens (₦10)
├─ Prediction: Home/Away/Draw
├─ Win payout: 150 tokens (₦15, 50% profit)
└─ Example: "Man United to beat Liverpool"

Type 2: Exact Score (Hard)
├─ Cost: 200 tokens (₦20)
├─ Prediction: Exact final score
├─ Win payout: 600 tokens (₦60, 200% profit)
└─ Example: "Man United 2-1 Liverpool"

Type 3: Goal Totals (Medium)
├─ Cost: 150 tokens (₦15)
├─ Prediction: Over/Under 2.5 goals
├─ Win payout: 250 tokens (₦25, 66% profit)

Type 4: First Scorer (Hard)
├─ Cost: 200 tokens (₦20)
├─ Prediction: Which player scores first
├─ Win payout: 500 tokens (₦50, 150% profit)

Betting Window:
├─ Open: 24 hours before match
├─ Close: 15 minutes before kickoff
├─ Verification: Automated (match results from ESPN API)
```

### Database Schema

```sql
CREATE TABLE sports_fixtures (
  id UUID PRIMARY KEY,
  sport TEXT, -- 'football', 'basketball', 'tennis'
  league TEXT, -- 'premier_league', 'champions_league', 'laliga'
  home_team TEXT,
  away_team TEXT,
  kickoff_time TIMESTAMP,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'live', 'completed'
  final_score TEXT, -- "2-1" format
  home_goals INT,
  away_goals INT,
  external_fixture_id TEXT, -- ESPN API ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  INDEX (kickoff_time, sport),
  INDEX (status)
);

CREATE TABLE prediction_types (
  id UUID PRIMARY KEY,
  name TEXT, -- 'match_winner', 'exact_score', 'goal_total', 'first_scorer'
  entry_cost_tokens BIGINT,
  description TEXT,
  difficulty TEXT -- 'easy', 'medium', 'hard'
);

CREATE TABLE user_predictions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  fixture_id UUID NOT NULL REFERENCES sports_fixtures(id),
  prediction_type_id UUID NOT NULL REFERENCES prediction_types(id),
  prediction_value TEXT, -- "2-1" or "home" or "over" or "Messi"
  entry_cost_tokens BIGINT,
  status TEXT DEFAULT 'pending', -- 'pending', 'won', 'lost'
  result TEXT, -- Calculated after match ends
  tokens_won BIGINT, -- Set when prediction wins
  placed_at TIMESTAMP DEFAULT NOW(),
  settled_at TIMESTAMP,
  INDEX (user_id, status),
  INDEX (fixture_id, status),
  INDEX (settled_at)
);

CREATE TABLE prediction_leaderboard (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  total_predictions INT DEFAULT 0,
  correct_predictions INT DEFAULT 0,
  win_rate DECIMAL GENERATED ALWAYS AS (
    CASE WHEN total_predictions > 0 
      THEN (correct_predictions::DECIMAL / total_predictions * 100)
      ELSE 0
    END
  ) STORED,
  total_tokens_spent BIGINT DEFAULT 0,
  total_tokens_won BIGINT DEFAULT 0,
  net_profit BIGINT GENERATED ALWAYS AS (total_tokens_won - total_tokens_spent) STORED,
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX (win_rate DESC),
  INDEX (net_profit DESC)
);

CREATE TABLE league_predictions (
  id UUID PRIMARY KEY,
  season TEXT, -- "2024-25"
  league TEXT, -- "Premier League", "Champions League"
  user_id UUID NOT NULL REFERENCES users(id),
  predictions JSONB, -- Array of fixture_id -> prediction
  score INT DEFAULT 0,
  rank INT,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (league, season, rank)
);
```

### API Endpoints

```
GET    /api/games/sports/fixtures              Get available fixtures
GET    /api/games/sports/fixtures/:id          Get fixture details
GET    /api/games/sports/prediction-types      Get prediction types
POST   /api/games/sports/predict                Place prediction
GET    /api/games/sports/my-predictions         Get user's predictions
GET    /api/games/sports/leaderboard            Get all-time leaderboard
GET    /api/games/sports/leaderboard/:league    League-specific leaderboard
POST   /api/games/sports/settle/:fixture_id    Settle predictions (auto via cron)
```

### UI Components

#### Fixtures List
```
┌─────────────────────────────────────┐
│   TODAY'S FOOTBALL FIXTURES ⚽      │
├─────────────────────────────────────┤
│                                     │
│ Premier League (5 matches)          │
│ Champions League (4 matches)        │
│ LaLiga (3 matches)                  │
│                                     │
│ MATCH #1:                           │
│ Manchester United 🔴 vs Liverpool 🔴│
│ 3:00 PM UTC  |  Status: Open ✓     │
│                                     │
│ Prediction Options:                 │
│ ├─ Match Winner: 100 tokens         │
│ ├─ Exact Score: 200 tokens          │
│ ├─ Over/Under 2.5: 150 tokens       │
│ └─ First Scorer: 200 tokens         │
│                                     │
│ My Prediction: (None yet)           │
│ [MAKE PREDICTION]                   │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ MATCH #2:                           │
│ Real Madrid ⚪ vs Barcelona 🔵     │
│ 8:00 PM UTC  |  Status: Open ✓     │
│                                     │
│ [MAKE PREDICTION]                   │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ MATCH #3:                           │
│ Chelsea 🔵 vs Man City 🔵           │
│ 12:30 PM UTC | Status: Closed ✗    │
│ (Match in progress)                 │
│                                     │
│ Your Prediction: Man City Win       │
│ Status: PENDING                     │
│                                     │
└─────────────────────────────────────┘
```

#### Prediction Modal
```
┌─────────────────────────────────────┐
│ PREDICT: Man United vs Liverpool    │
├─────────────────────────────────────┤
│                                     │
│ Match Info:                         │
│ 🔴 Man United (Home)  vs  🔴 Liverpool (Away)
│ Premier League                      │
│ Kickoff: Today 3:00 PM (5 hours)   │
│ Current Odds: 1.95 (Draw), 2.10... │
│                                     │
│ Choose Prediction Type:             │
│                                     │
│ □ Match Winner (100 tokens)         │
│   ├─ Home Win (Man United)          │
│   ├─ Draw                           │
│   └─ Away Win (Liverpool)           │
│                                     │
│ □ Exact Score (200 tokens)          │
│   Home Goals: [2 ▼]                 │
│   Away Goals: [1 ▼]                 │
│   Prediction: 2-1 Man United        │
│                                     │
│ □ Over/Under 2.5 Goals (150 tokens) │
│   ├─ Over 2.5 (2+ goals total)      │
│   └─ Under 2.5 (1 or fewer goals)   │
│                                     │
│ □ First Scorer (200 tokens)         │
│   Player: [Search: Bruno Fernandes] │
│   Selected: Bruno Fernandes         │
│                                     │
│ Your Balance: 5,000 tokens (₦500)  │
│ Selected Type: Match Winner         │
│ Entry Cost: 100 tokens              │
│ Potential Win: 150 tokens (₦15)    │
│                                     │
│ [CONFIRM PREDICTION] [CANCEL]       │
│                                     │
└─────────────────────────────────────┘
```

#### Results & Leaderboard
```
┌─────────────────────────────────────┐
│   RESULTS DASHBOARD 📊              │
├─────────────────────────────────────┤
│                                     │
│ Your Predictions (Today):           │
│ ✓ Won: 3 out of 7 (42.9%)          │
│ ✗ Lost: 4 out of 7                  │
│                                     │
│ Tokens Profit Today: +₦25           │
│ Total This Month: +₦180             │
│ All-Time: +₦1,200                   │
│                                     │
│ ───────────────────────────────     │
│                                     │
│ LEADERBOARD (This Week):            │
│ 🥇 #1: Ahmed - 12 wins, +₦500       │
│ 🥈 #2: Zainab - 10 wins, +₦300     │
│ 🥉 #3: Hassan - 9 wins, +₦200      │
│ 4: Chidi - 8 wins, +₦150           │
│ 5: Amara - 7 wins, +₦100           │
│                                     │
│ Your Rank: #23 (12 wins)            │
│                                     │
│ ───────────────────────────────     │
│                                     │
│ MONTHLY LEADERBOARD:                │
│ [WEEKLY] [MONTHLY] [ALL-TIME]       │
│                                     │
│ Top by Win Rate (Min 20 predictions)│
│ 1. Omar: 68% win rate (25/37)       │
│ 2. Fatima: 65% win rate (20/31)     │
│ 3. Kwame: 62% win rate (23/37)      │
│                                     │
│ [INVITE FRIENDS] [SHARE RESULTS]    │
│                                     │
└─────────────────────────────────────┘
```

### Fraud Prevention

```
Prediction Timing:
├─ Only allow predictions until 15 min before kickoff
├─ Reject predictions placed after match starts
├─ Verify timestamp matches server time (prevent time manipulation)

Result Verification:
├─ Use official ESPN API for results
├─ Cross-check with multiple sources
├─ Never trust user-submitted results
├─ Auto-settle based on final official score

Unusual Patterns:
├─ Monitor: Users consistently predicting correctly (statistically impossible)
├─ Action: Flag account for potential insider information
├─ Flag: Users betting huge amounts on rare outcomes
└─ Action: Manual review for suspicious activity

Rate Limiting:
├─ Max predictions per user: 100/day (prevent spam)
├─ Max bet per match: 10,000 tokens (prevent whale dominance)
└─ Time between predictions: No limit (allow rapid-fire if desired)
```

### Monetization Strategy

```
Direct Revenue Per Match:

Per Prediction:
├─ Match Winner bet: 100 tokens
├─ Platform keeps: 25 tokens (25% house cut)
├─ Paid out to winners: 50 tokens
├─ Net per match: 25 token profit

Monthly Volume:
├─ 10 matches/day average
├─ 80 predictions per match
├─ 800 predictions/day
├─ 24K predictions/month
├─ Revenue: 24K predictions × 25 tokens = 600K tokens (₦60K/month)

Per Prediction Type Breakdown:
├─ Easy (Match Winner): 100 tokens entry → 25 token profit
├─ Medium (Over/Under): 150 tokens entry → 38 token profit
├─ Hard (Exact Score): 200 tokens entry → 50 token profit
├─ Hard (First Scorer): 200 tokens entry → 50 token profit
└─ Weighted average: ~35 tokens profit per prediction

Secondary Revenue:

Premium Leagues (Pay to Access):
├─ Champions League predictions: ₦100/month
├─ EPL + LaLiga bundle: ₦150/month
├─ All leagues access: ₦200/month
├─ Expected subscribers: 5K users
├─ Revenue: ₦1M/month

Expert Tips (Subscription):
├─ "Insider Tips" channel: ₦500/month
├─ Predictions from "verified experts"
├─ Expected: 500 subscribers
├─ Revenue: ₦250K/month

Cosmetics (Victory Skins):
├─ "Lucky Bettor" skin: ₦1,000
├─ "Prediction King" badge: ₦500
├─ Team cosmetics (support Liverpool = red cosmetics)
├─ Expected: 100 cosmetics/month = ₦50K

Total Monthly Revenue (Sports Prediction):
├─ Prediction commissions: ₦60K
├─ Premium leagues: ₦1M
├─ Expert tips: ₦250K
├─ Cosmetics: ₦50K
├─ TOTAL: ₦1.36M/month
```

### Implementation Checklist

```
Week 1:
├─ Integrate with ESPN/Yahoo Sports API
├─ Create fixture sync (auto-import fixtures daily)
├─ Design database schema
└─ Setup automated result fetching

Week 2:
├─ Build prediction placement UI
├─ Create prediction validation logic
├─ Build leaderboard system
└─ Create result settlement automation

Week 3:
├─ Build odds/payout calculations
├─ Create notifications (match starting soon, results)
├─ Setup fraud detection
└─ Create mobile-optimized UI

Week 4:
├─ Test with 1,000 predictions
├─ Verify API sync reliability
├─ Test settlement correctness
├─ Load testing (multiple simultaneous predictions)
```

---

## GAME 4: Exam Predictions

### Overview

Campus-specific predictions where students forecast exam dates, difficulty, and pass rates.

**Why Critical:** Campus-only = defensible + massive engagement (exams affect everyone)

### Mechanics

```
Campus-Specific Predictions:

Only works for UNILAG, OAU, UNIBEN, etc. separately

Prediction Types:

Type 1: Exam Date Guess
├─ "When will Prof. Okafor give MTH 101 exam?"
├─ Entry: 300 tokens (₦30)
├─ Predictions: Select from date range (this week, next week, etc.)
├─ Win payout: 500 tokens (₦50, 66% profit)
├─ Verification: When exam actually happens

Type 2: Exam Difficulty Poll
├─ "Will MTH 101 exam be hard or easy?"
├─ Entry: 100 tokens (₦10)
├─ Predictions: Easy / Medium / Hard
├─ Win payout: 200 tokens (₦20, 100% profit)
├─ Verification: Community consensus after exam (student votes)
└─ Consensus needed: 60% of post-exam voters agree

Type 3: Pass Rate Prediction
├─ "What will be pass rate for MTH 101?"
├─ Entry: 200 tokens (₦20)
├─ Predictions: <40%, 40-60%, >60%
├─ Win payout: 400 tokens (₦40, 100% profit)
├─ Verification: Official results (if platform partners with campus)

Type 4: Exam Content Prediction
├─ "Will CHEM 201 cover organic chemistry?"
├─ Entry: 150 tokens (₦15)
├─ Predictions: Yes / No / Probably
├─ Win payout: 300 tokens (₦30, 100% profit)
└─ Verification: Student consensus post-exam

Type 5: Professor Prediction
├─ "Will Prof. Adeyemi give essay questions or MCQ?"
├─ Entry: 200 tokens (₦20)
├─ Predictions: Essay / MCQ / Mixed
├─ Win payout: 400 tokens (₦40, 100% profit)
└─ Verification: Student reports after exam
```

### Database Schema

```sql
CREATE TABLE campus_courses (
  id UUID PRIMARY KEY,
  campus TEXT, -- 'unilag', 'oau', 'uniben'
  course_code TEXT, -- 'MTH101'
  course_name TEXT, -- 'Calculus I'
  lecturer_name TEXT,
  department TEXT, -- 'Mathematics'
  current_semester TEXT, -- '2024-1'
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (campus, current_semester)
);

CREATE TABLE exam_predictions (
  id UUID PRIMARY KEY,
  campus TEXT NOT NULL,
  course_id UUID NOT NULL REFERENCES campus_courses(id),
  prediction_type TEXT, -- 'date', 'difficulty', 'pass_rate', 'content', 'question_type'
  question TEXT, -- "When will MTH 101 exam be?"
  created_at TIMESTAMP DEFAULT NOW(),
  deadline_date TIMESTAMP, -- When exam should happen (for date predictions)
  resolved_at TIMESTAMP,
  status TEXT DEFAULT 'active', -- 'active', 'resolved', 'cancelled'
  INDEX (campus, course_id, status),
  INDEX (deadline_date)
);

CREATE TABLE exam_prediction_options (
  id UUID PRIMARY KEY,
  exam_prediction_id UUID NOT NULL REFERENCES exam_predictions(id),
  option_text TEXT, -- "This week", "Next week", "Easy", "Hard", etc.
  option_value TEXT, -- Machine-readable value
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (exam_prediction_id)
);

CREATE TABLE user_exam_predictions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  campus TEXT NOT NULL,
  exam_prediction_id UUID NOT NULL REFERENCES exam_predictions(id),
  option_id UUID NOT NULL REFERENCES exam_prediction_options(id),
  entry_cost_tokens BIGINT,
  status TEXT DEFAULT 'pending', -- 'pending', 'won', 'lost'
  tokens_won BIGINT,
  placed_at TIMESTAMP DEFAULT NOW(),
  settled_at TIMESTAMP,
  INDEX (user_id, campus, status),
  INDEX (exam_prediction_id)
);

CREATE TABLE exam_results (
  id UUID PRIMARY KEY,
  exam_prediction_id UUID NOT NULL REFERENCES exam_predictions(id),
  winning_option_id UUID REFERENCES exam_prediction_options(id),
  consensus_percentage INT, -- % of voters who agreed
  verified_by TEXT, -- 'student_consensus' or 'official_records'
  verified_at TIMESTAMP,
  INDEX (exam_prediction_id)
);

CREATE TABLE campus_exam_leaderboard (
  user_id UUID NOT NULL,
  campus TEXT NOT NULL,
  total_predictions INT DEFAULT 0,
  correct_predictions INT DEFAULT 0,
  win_rate DECIMAL,
  total_tokens_won BIGINT DEFAULT 0,
  current_month INT, -- For monthly reset
  current_year INT,
  PRIMARY KEY (user_id, campus, current_year, current_month),
  INDEX (campus, win_rate DESC)
);
```

### API Endpoints

```
GET    /api/games/exams/campus                 Get user's campus
GET    /api/games/exams/courses/:campus        Get courses for campus
GET    /api/games/exams/predictions/:course    Get predictions for course
POST   /api/games/exams/predict                Place exam prediction
GET    /api/games/exams/my-predictions         Get user's predictions
GET    /api/games/exams/leaderboard/:campus    Leaderboard for campus
POST   /api/games/exams/resolve/:prediction_id Resolve prediction
```

### UI Components

#### Course Selection (Campus-Based)
```
┌─────────────────────────────────────┐
│   YOUR CAMPUS 🏫                    │
├─────────────────────────────────────┤
│                                     │
│ You're set to: UNILAG               │
│ [CHANGE CAMPUS]                     │
│                                     │
│ Current Semester: 2024-2            │
│                                     │
│ ───────────────────────────────     │
│                                     │
│ DEPARTMENTS:                        │
│ 📊 Science (45 courses)             │
│ 🎓 Engineering (38 courses)         │
│ 📚 Humanities (52 courses)          │
│ 💼 Business (28 courses)            │
│                                     │
│ POPULAR PREDICTIONS:                │
│                                     │
│ 1️⃣ MTH 101 - Calculus I             │
│    Professor: Adeyemi               │
│    Predictions: 234 active          │
│    [PREDICT]                        │
│                                     │
│ 2️⃣ CHEM 201 - Organic Chemistry     │
│    Professor: Okafor                │
│    Predictions: 189 active          │
│    [PREDICT]                        │
│                                     │
│ 3️⃣ PHY 101 - Physics I              │
│    Professor: Ahmed                 │
│    Predictions: 156 active          │
│    [PREDICT]                        │
│                                     │
│ [VIEW ALL COURSES] [SEARCH]         │
│                                     │
└─────────────────────────────────────┘
```

#### Exam Prediction Options
```
┌─────────────────────────────────────┐
│ EXAM: MTH 101 - CALCULUS I           │
│ Professor: Dr. Adeyemi              │
├─────────────────────────────────────┤
│                                     │
│ PREDICTION 1: Exam Date             │
│ "When will exam be held?"           │
│ Entry Cost: 300 tokens (₦30)        │
│                                     │
│ ☐ This week (by Friday)             │
│ ☐ Next week (Mon-Fri)               │
│ ☐ Week after (following Mon-Fri)    │
│ ☐ During exam block (2+ weeks)      │
│ ☐ Not this semester                 │
│                                     │
│ Your prediction: [Not selected]     │
│ [SELECT DATE]                       │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ PREDICTION 2: Difficulty            │
│ "How hard will the exam be?"        │
│ Entry Cost: 100 tokens (₦10)        │
│                                     │
│ ☐ Very Easy (high pass rate)        │
│ ☐ Easy (most pass)                  │
│ ☐ Moderate (50/50 pass/fail)        │
│ ☐ Hard (low pass rate)              │
│ ☐ Very Hard (brutal)                │
│                                     │
│ Your prediction: Moderate           │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ PREDICTION 3: Question Type         │
│ "What format will questions be?"    │
│ Entry Cost: 200 tokens (₦20)        │
│                                     │
│ ☐ All MCQ                           │
│ ☐ All Essay                         │
│ ☐ Mixed (MCQ + Essay)               │
│ ☐ Practical/Problem-Solving         │
│                                     │
│ Your prediction: [Not selected]     │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ Your Balance: 5,000 tokens (₦500)  │
│                                     │
│ [PLACE ALL PREDICTIONS] [CANCEL]    │
│                                     │
└─────────────────────────────────────┘
```

#### Post-Exam Voting (Verify Results)
```
┌─────────────────────────────────────┐
│ EXAM COMPLETED: MTH 101              │
│ Let's verify the predictions!        │
├─────────────────────────────────────┤
│                                     │
│ QUESTION 1: How difficult was it?   │
│                                     │
│ ☐ Very Easy (5 votes)               │
│ ☐ Easy (23 votes)                   │
│ ✓ Moderate (127 votes) ⭐ LEADING   │
│ ☐ Hard (56 votes)                   │
│ ☐ Very Hard (12 votes)              │
│                                     │
│ Your vote: Moderate                 │
│ [CHANGE VOTE]                       │
│                                     │
│ Based on 223 votes, "Moderate"      │
│ has 57% consensus ✓                 │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ QUESTION 2: What format?            │
│                                     │
│ ☐ All MCQ (34 votes)                │
│ ✓ All Essay (156 votes) ⭐ LEADING  │
│ ☐ Mixed (78 votes)                  │
│ ☐ Practical (8 votes)               │
│                                     │
│ Your vote: All Essay                │
│ [CHANGE VOTE]                       │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ Your Results:                       │
│ ✓ Difficulty Correct (Moderate)     │
│ ✓ Format Correct (All Essay)        │
│ ✗ Date Incorrect (predicted week 1) │
│                                     │
│ Tokens Won: 400                     │
│ [CLAIM REWARD]                      │
│                                     │
└─────────────────────────────────────┘
```

#### Campus Leaderboard
```
┌─────────────────────────────────────┐
│   EXAM PREDICTION LEADERBOARD 🏆    │
│   UNILAG | This Month               │
├─────────────────────────────────────┤
│                                     │
│ By Win Rate (Min 10 predictions):   │
│                                     │
│ 🥇 #1: Ahmed Oladele               │
│    Win Rate: 78% (39/50)            │
│    Tokens Won: ₦2,500              │
│    Status: "Exam Prophet"           │
│                                     │
│ 🥈 #2: Zainab Hassan               │
│    Win Rate: 75% (42/56)            │
│    Tokens Won: ₦2,100              │
│    Status: "Exam Master"            │
│                                     │
│ 🥉 #3: Hassan Adeyemi              │
│    Win Rate: 72% (38/53)            │
│    Tokens Won: ₦1,900              │
│    Status: "Exam Expert"            │
│                                     │
│ 4: Chidi Okonkwo - 68% (34/50)      │
│ 5: Amara Nwankwo - 66% (33/50)      │
│ 6-10: [See More]                    │
│                                     │
│ Your Rank: #47                      │
│ Your Win Rate: 62% (31/50)          │
│ Your Title: (Earn 70%+ for title)   │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ This Week Leaderboard:              │
│ (predictions made in last 7 days)   │
│                                     │
│ 1. Ahmed - 85% (17/20)              │
│ 2. Zainab - 80% (16/20)             │
│ 3. Hassan - 75% (15/20)             │
│                                     │
│ [ALL TIME] [THIS MONTH] [THIS WEEK] │
│ [DEPARTMENT LEADERBOARD]            │
│                                     │
└─────────────────────────────────────┘
```

### Fraud Prevention

```
Prediction Deadline:
├─ Lock predictions: 24 hours before exam date
├─ Verify: No predictions after exam starts
└─ Prevent: Late submissions

Consensus Verification:
├─ Require: Min 50 votes to determine consensus
├─ Require: 60% agreement threshold
├─ Manual review: If below 60%, platform decides
└─ Appeal: Users can appeal controversial decisions

Vote Manipulation:
├─ Limit: One vote per campus exam per user
├─ Detection: Same IP voting multiple times (linked accounts)
├─ Action: Remove extra votes, flag account

Exam Legitimacy:
├─ Require: At least 20 students in course to enable predictions
├─ Check: Course exists in official campus records
├─ Verify: Exam actually happened before resolution
└─ Action: Cancel predictions if exam postponed
```

### Monetization Strategy

```
Direct Revenue:

Per-Prediction Entry Fees:
├─ Average prediction: 150 tokens (₦15)
├─ Platform keeps: 25% = 37.5 tokens (₦3.75)
├─ Paid to winner: 100 tokens (₦10)
├─ Expected: 50 predictions/course/semester
├─ Per course revenue: 1,875 tokens (₦187.50) per semester

Volume:
├─ 100 universities
├─ Avg 50 courses/university with predictions
├─ 5,000 courses total
├─ 1 semester = 5,000 × 1,875 tokens = 9.375M tokens (₦937.5K)
├─ Per year (2 semesters): ₦1.875M

Secondary Revenue:

Premium Predictions (Insider Tips):
├─ "Verified Professor Analysis" - ₦500/tip
├─ Platform vets people claiming to be professors
├─ Top predictors verify tips
├─ Expected: 100 tips/month per 100-course campus
├─ Revenue: 100 universities × 100 tips × ₦500 = ₦5M/month

Campus Partnerships:
├─ University pays platform ₦50K/semester
├─ Gets data on exam predictions (helps with scheduling)
├─ 100 universities × ₦50K = ₦5M/month

Cosmetics (Exam-Themed):
├─ "Exam Prophet" badge: ₦1,000
├─ "Honor Roll" cosmetic: ₦800
├─ Department colors (wear your dept): ₦500
├─ Expected: 200 cosmetics/month = ₦100K

Leaderboard Cosmetics:
├─ Top predictor at each campus gets exclusive cosmetic
├─ "UNILAG Prophet 2024" = ultra-rare
├─ Can't be sold (status only)
├─ Incentivizes competition

Total Monthly Revenue (Exam Predictions):
├─ Entry fee commissions: ₦937.5K (annualized)
├─ Premium tips: ₦5M
├─ Campus partnerships: ₦5M
├─ Cosmetics: ₦100K
├─ TOTAL: ₦10.1M/month
```

### Implementation Checklist

```
Week 1:
├─ Setup campus database (list all Nigerian universities)
├─ Integrate with university course databases
├─ Design prediction types
├─ Create database schema

Week 2:
├─ Build course selection UI
├─ Build prediction placement UI
├─ Create consensus calculation logic
├─ Build leaderboard

Week 3:
├─ Build post-exam voting UI
├─ Implement result settlement
├─ Create notifications (exam day reminder, results ready)
└─ Build campus-specific leaderboards

Week 4:
├─ Test with 1 campus (50 courses)
├─ Verify consensus calculation
├─ Test settlement correctness
└─ Expand to 10 campuses, then 100
```

---

## GAME 5: Gaming Tournaments

### Overview

Esports tournaments (PUBG Mobile, Free Fire, FIFA) with bracket-based competitions and weekly tournaments.

**Why Fifth:** Gamer audience = highest LTV, consistent spending

### Mechanics

```
Game Options:
├─ PUBG Mobile (1v1 Arenas, Team matches)
├─ Free Fire (1v1 Elimination, Squad)
├─ FIFA (1v1 Online)
├─ Call of Duty Mobile (1v1 Multiplayer)
└─ Valorant Mobile (upcoming, when available)

Tournament Types:

Type 1: Daily 1v1 Tournaments
├─ Format: Single-elimination bracket (16-32 players)
├─ Entry: 500 tokens (₦50)
├─ Prize Pool: 500 tokens × 32 = 16K tokens (₦1.6K)
│
├─ Payouts:
│  ├─ 1st place: 8,000 tokens (₦800)
│  ├─ 2nd place: 4,000 tokens (₦400)
│  ├─ 3rd place: 2,000 tokens (₦200)
│  └─ 4th place: 1,000 tokens (₦100)
│
├─ Platform cut: 1,000 tokens (₦100)
└─ Frequency: 3x daily (Morning, Afternoon, Evening)

Type 2: Weekly Squad Tournaments
├─ Format: 4v4 team matches
├─ Entry: 1,000 tokens per team (₦100)
├─ Prize Pool: 1,000 × 8 teams = 8K tokens (₦800)
│
├─ Payouts:
│  ├─ 1st place team: 4,000 tokens (split ₦200 per member)
│  ├─ 2nd place team: 2,000 tokens (split ₦100 per member)
│  └─ 3rd place team: 1,000 tokens (split ₦50 per member)
│
├─ Platform cut: 1,000 tokens (₦100)
└─ Frequency: 1x weekly (Sunday)

Type 3: Monthly Championships
├─ Format: 64-player or 16-team championship bracket
├─ Entry: 2,000 tokens (₦200) per player
├─ Prize Pool: 2,000 × 64 = 128K tokens (₦12.8K)
│
├─ Payouts:
│  ├─ Grand champion: 40K tokens (₦4K)
│  ├─ Runner-up: 20K tokens (₦2K)
│  ├─ Semi-finalists: 8K tokens each (₦800)
│  └─ Quarter-finalists: 4K tokens each (₦400)
│
├─ Platform cut: 10K tokens (₦1K)
└─ Frequency: 1x monthly
```

### Database Schema

```sql
CREATE TABLE gaming_tournaments (
  id UUID PRIMARY KEY,
  game TEXT, -- 'pubg_mobile', 'free_fire', 'fifa', etc.
  tournament_type TEXT, -- '1v1', 'squad', 'championship'
  format TEXT, -- 'single_elimination', 'group_stage'
  player_count INT, -- 16, 32, 64, etc.
  team_size INT, -- 1 for 1v1, 4 for squad, etc.
  entry_fee_tokens BIGINT,
  prize_pool_tokens BIGINT,
  platform_fee_tokens BIGINT,
  status TEXT DEFAULT 'registration', -- 'registration', 'in_progress', 'completed'
  scheduled_start TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (game, status, scheduled_start)
);

CREATE TABLE tournament_participants (
  id UUID PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES gaming_tournaments(id),
  player_id UUID REFERENCES users(id),
  team_id UUID,
  team_name TEXT,
  seed_rank INT,
  registered_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'registered', -- 'registered', 'active', 'eliminated'
  INDEX (tournament_id, team_id)
);

CREATE TABLE tournament_matches (
  id UUID PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES gaming_tournaments(id),
  round INT, -- Round number (1, 2, 3, etc.)
  match_number INT,
  player1_id UUID NOT NULL REFERENCES users(id),
  player2_id UUID REFERENCES users(id),
  team1_id UUID,
  team2_id UUID,
  winner_player_id UUID REFERENCES users(id),
  winner_team_id UUID,
  score_p1 INT,
  score_p2 INT,
  match_status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  match_proof_url TEXT, -- Screenshot/video of final score
  scheduled_time TIMESTAMP,
  completed_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (tournament_id, round),
  INDEX (match_status)
);

CREATE TABLE gamer_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  main_game TEXT, -- Favorite game
  game_accounts JSONB, -- {pubg_mobile: "username", free_fire: "user_id", etc.}
  skill_level TEXT, -- 'beginner', 'intermediate', 'advanced', 'pro'
  total_wins INT DEFAULT 0,
  tournament_winnings BIGINT DEFAULT 0, -- Total tokens won
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tournament_leaderboard (
  user_id UUID PRIMARY KEY,
  game TEXT,
  total_tournaments INT DEFAULT 0,
  tournaments_won INT DEFAULT 0,
  win_rate DECIMAL GENERATED ALWAYS AS (
    CASE WHEN total_tournaments > 0 
      THEN (tournaments_won::DECIMAL / total_tournaments * 100)
      ELSE 0
    END
  ) STORED,
  total_tokens_won BIGINT DEFAULT 0,
  INDEX (game, win_rate DESC)
);
```

### API Endpoints

```
GET    /api/games/esports/tournaments          List active tournaments
GET    /api/games/esports/tournaments/:id      Get tournament details
POST   /api/games/esports/register             Register for tournament
GET    /api/games/esports/bracket/:id          Get tournament bracket
POST   /api/games/esports/report-score         Report match result (with proof)
GET    /api/games/esports/leaderboard          Get gamer leaderboard
GET    /api/games/esports/my-profile           Get user's gaming profile
POST   /api/games/esports/link-account         Link game account
```

### UI Components

#### Tournament Listing
```
┌─────────────────────────────────────┐
│   ESPORTS TOURNAMENTS 🎮            │
├─────────────────────────────────────┤
│                                     │
│ ACTIVE TOURNAMENTS:                 │
│                                     │
│ TODAY - DAILY TOURNAMENTS:          │
│                                     │
│ ⚔️ PUBG Mobile 1v1 Arena            │
│    Format: Single Elimination (32)  │
│    Entry: 500 tokens (₦50)          │
│    Prize Pool: 8K tokens            │
│    Registration: OPEN ✓             │
│    Starts: In 2 hours               │
│    [REGISTER NOW]                   │
│                                     │
│ ⚔️ Free Fire 1v1 Ranked             │
│    Format: Single Elimination (16)  │
│    Entry: 500 tokens (₦50)          │
│    Prize Pool: 4K tokens            │
│    Registration: OPEN ✓             │
│    Starts: In 5 hours               │
│    [REGISTER NOW]                   │
│                                     │
│ ⚔️ FIFA 23 1v1 Season               │
│    Format: Best of 3 Matches        │
│    Entry: 1,000 tokens (₦100)      │
│    Prize Pool: 12K tokens           │
│    Registration: OPEN ✓             │
│    Starts: Tonight (8pm)            │
│    [REGISTER NOW]                   │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ UPCOMING THIS WEEK:                 │
│                                     │
│ 🏆 SUNDAY - SQUAD TOURNAMENT        │
│    PUBG Mobile 4v4 Battle            │
│    Entry: 1,000 tokens/team (₦100) │
│    Prize Pool: 32K tokens           │
│    [FORM TEAM] [REGISTER TEAM]      │
│                                     │
│ 🏆 NEXT SUNDAY - MONTHLY CHAMP      │
│    Free Fire 64-Player Championship  │
│    Entry: 2,000 tokens (₦200)      │
│    Prize Pool: 128K tokens          │
│    Registration Opens: Thursday     │
│                                     │
│ [FILTER] [MY TOURNAMENTS]           │
│                                     │
└─────────────────────────────────────┘
```

#### Tournament Registration
```
┌─────────────────────────────────────┐
│ REGISTER: PUBG Mobile 1v1 Arena     │
├─────────────────────────────────────┤
│                                     │
│ Tournament Details:                 │
│ • Format: Single Elimination (32)   │
│ • Entry Fee: 500 tokens (₦50)      │
│ • Prize Pool: 8,000 tokens          │
│ • Starts In: 1 hour 45 minutes      │
│ • Platform: PUBG Mobile (Android)   │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ Your Gaming Profile:                │
│ Game Account: [Link Account?]       │
│ Skill Level: Advanced               │
│ Previous Wins: 23                   │
│ Win Rate: 68%                       │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ Link Your PUBG Account:             │
│ PUBG User ID:                       │
│ [Enter your PUBG Mobile User ID]    │
│                                     │
│ [This is used to verify match wins] │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ Your Balance:                       │
│ Tokens: 5,000 (₦500)               │
│ Entry Fee: 500 tokens (₦50)        │
│ After Payment: 4,500 tokens         │
│                                     │
│ Prize Payouts:                      │
│ 🥇 1st: 4,000 tokens (₦400)        │
│ 🥈 2nd: 2,000 tokens (₦200)        │
│ 🥉 3rd: 1,000 tokens (₦100)        │
│ 4th: 500 tokens (₦50)              │
│                                     │
│ Terms:                              │
│ ☑ I understand the rules            │
│ ☑ I'll provide screenshots of wins  │
│ ☑ I accept that losses are final    │
│                                     │
│ [REGISTER & PAY]  [CANCEL]          │
│                                     │
└─────────────────────────────────────┘
```

#### Live Bracket View
```
┌─────────────────────────────────────┐
│ TOURNAMENT BRACKET - ROUND 1        │
│ PUBG Mobile 1v1 (32 Players)        │
├─────────────────────────────────────┤
│                                     │
│ MATCH 1:                            │
│ Ahmed (9) vs Zainab (24)            │
│ Status: PENDING - Starts in 5 min   │
│ [WATCH LIVE] [REPORT RESULT]        │
│                                     │
│ MATCH 2:                            │
│ Hassan (6) vs Chidi (27)            │
│ Status: IN PROGRESS                 │
│ Lives: Hassan 3 | Chidi 2           │
│ [WATCH LIVE]                        │
│                                     │
│ MATCH 3:                            │
│ Amara (13) vs Kwame (20)            │
│ Status: COMPLETED ✓                 │
│ Winner: Amara                        │
│ [VIEW REPLAY]                       │
│                                     │
│ MATCH 4:                            │
│ Omar (4) vs Fatima (29)             │
│ Status: PENDING                     │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ ROUND PROGRESS:                     │
│ Completed: 4/16 matches             │
│ In Progress: 2/16 matches           │
│ Pending: 10/16 matches              │
│                                     │
│ Estimated Completion: 2 hours       │
│                                     │
│ [ROUND 2 BRACKET] [LEADERBOARD]     │
│                                     │
└─────────────────────────────────────┘
```

#### Report Match Result
```
┌─────────────────────────────────────┐
│ REPORT YOUR WIN                     │
│ Match: Ahmed vs Zainab              │
├─────────────────────────────────────┤
│                                     │
│ Status: PENDING                     │
│ (Waiting for both players to report)│
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ What was the result?                │
│                                     │
│ ☑ I WON (Ahmed wins)                │
│ ☐ I LOST (Zainab wins)              │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ Proof of Victory:                   │
│ [TAKE SCREENSHOT] [UPLOAD IMAGE]    │
│                                     │
│ (Show final scoreboard or result)   │
│                                     │
│ [SUBMIT RESULT]                     │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ Opponent's Report:                  │
│ ⏳ Zainab hasn't reported yet       │
│                                     │
│ [WAIT FOR OPPONENT]                 │
│                                     │
│ (Reports must match or admin review)│
│                                     │
└─────────────────────────────────────┘
```

#### Gamer Profile & Leaderboard
```
┌─────────────────────────────────────┐
│  YOUR GAMING PROFILE 🎮             │
├─────────────────────────────────────┤
│                                     │
│ Ahmed Oladele                       │
│ Level: Advanced                     │
│ Title: "Tournament Legend"          │
│                                     │
│ Linked Accounts:                    │
│ ├─ PUBG Mobile: AhmedOlad_47       │
│ ├─ Free Fire: AhmedOflo9            │
│ └─ FIFA 23: Ahmed_Legend22          │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ STATISTICS (All Time):              │
│ Tournaments Entered: 47             │
│ Tournaments Won: 32                 │
│ Win Rate: 68%                       │
│ Total Earnings: ₦16,000            │
│                                     │
│ By Game:                            │
│ • PUBG Mobile: 23 wins (82%)        │
│ • Free Fire: 6 wins (55%)           │
│ • FIFA 23: 3 wins (43%)             │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ ACHIEVEMENTS:                       │
│ 🏆 Tournament Champion              │
│ 🏆 10-Win Streak                    │
│ 🏆 Monthly Champion (3x)            │
│ 🥇 All-Time Top 10                  │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ RANKING (PUBG Mobile 1v1):          │
│ Global Rank: #47                    │
│ Campus Rank (UNILAG): #3            │
│ Monthly Rank: #12                   │
│                                     │
│ [VIEW FULL LEADERBOARD]             │
│                                     │
└─────────────────────────────────────┘
```

### Fraud Prevention

```
Match Result Verification:
├─ Require: Both players report result
├─ Mismatch: Admin reviews screenshot/video proof
├─ Check: Timestamps match (can't report future matches)
├─ Punishment: False reporting = ban from tournaments

Matchmaking Integrity:
├─ Prevent: Account sharing/boosting (same IP = link accounts)
├─ Prevent: Smurf accounts (new accounts can't play pro tourneys)
├─ Require: Min 2 weeks old, 10 matches in public lobby
├─ Track: Player behavior (AFKing, rage quitting)
└─ Action: Repeatedly AFKing players → Tournament ban

Evidence Review:
├─ Screenshots must show:
│  ├─ Final match result
│  ├─ Player names visible
│  ├─ Match date/time
│  └─ Opponent name matching bracket
│
├─ Video proof must show:
│  ├─ Full match recording
│  ├─ Game start (showing opponent)
│  ├─ Match conclusion
│  └─ Final score clearly visible

Skill-Based Matchmaking:
├─ Rank players by previous tournament performance
├─ Seed tournament bracket (higher seeds face lower seeds initially)
├─ Prevent: #1 vs #2 until final
└─ Result: Fair, competitive matches
```

### Monetization Strategy

```
Direct Revenue:

Entry Fees (Daily):
├─ Daily 1v1 tournaments: 3x daily × 32 players × 500 tokens
├─ = 48K tokens/day = ₦4.8K/day
├─ Platform cut: 25% = ₦1.2K/day
├─ Monthly: ₦36K

Weekly Squad Tournaments:
├─ 1 per week × 8 teams × 1,000 tokens
├─ = 8K tokens/week = ₦800/week
├─ Platform cut: 25% = ₦200/week
├─ Monthly: ₦800

Monthly Championships:
├─ 1 per month × 64 players × 2,000 tokens
├─ = 128K tokens/month = ₦12.8K
├─ Platform cut: 25% = ₦3.2K
├─ Monthly: ₦3.2K

Secondary Revenue:

Premium Features:
├─ Tournament Pass (monthly): ₦500 (unlock priority scheduling)
├─ Expected: 200 subscribers = ₦100K/month
│
├─ Coaching Sessions: Verified pro coaches sell tips
├─ Platform takes 20% commission: ₦50K/month
│
└─ Cosmetics (Gaming-Themed):
   ├─ "Tournament Champion" skin: ₦2,000
   ├─ Gaming peripherals (virtual): ₦1,000
   ├─ "Pro Gamer" badge: ₦800
   └─ Expected: 150 cosmetics/month = ₦150K

Sponsorships & Partnerships:
├─ Gaming brand partnerships (Razer, Corsair)
├─ Prize pools sponsored: ₦500K/month
├─ Platform takes 20% = ₦100K/month
│
├─ Game developer partnerships:
│  └─ Publish new tournaments (platform pays per tournament hosted)
│  └─ Revenue: ₦200K/month

Affiliate Commissions:
├─ When users buy game items in-game (emulator links)
├─ Platform takes 5% commission: ₦50K/month

Total Monthly Revenue (Gaming Tournaments):
├─ Entry fees: ₦40K
├─ Premium features: ₦100K
├─ Coaching commissions: ₦50K
├─ Cosmetics: ₦150K
├─ Sponsorships: ₦100K
├─ Affiliate: ₦50K
└─ TOTAL: ₦490K/month
```

### Implementation Checklist

```
Week 1:
├─ Setup tournament database schema
├─ Create bracket generation algorithm (single elimination)
├─ Build tournament listing UI
└─ Integrate with game APIs (if available) or manual score reporting

Week 2:
├─ Build registration system
├─ Create bracket visualization
├─ Build match scheduling logic
├─ Create notifications (match starting soon, opponent hasn't reported)

Week 3:
├─ Build match reporting system (screenshot upload)
├─ Create admin verification dashboard
├─ Build payout automation
└─ Create leaderboard ranking system

Week 4:
├─ Test with 100 players in tournament
├─ Verify bracket generation correctness
├─ Test fraud detection (duplicate reports)
├─ Load test (multiple tournaments running simultaneously)
```

---

## Cross-Game Infrastructure

### Shared Systems Needed

```
1. USER BALANCE & TRANSACTION SYSTEM
   ├─ Already built (token ledger)
   ├─ Supports all games automatically
   └─ Commission tracking per game

2. PAYOUT AUTOMATION
   ├─ Settlement process (weekly, daily, or per tournament)
   ├─ Tax calculations (if applicable)
   └─ Bank/wallet integration

3. NOTIFICATIONS
   ├─ Tournament starting soon
   ├─ Match result notification
   ├─ Payment received notification
   ├─ Leaderboard ranking changes
   └─ Achievement unlocked

4. COSMETICS INTEGRATION
   ├─ "Tournament Champion" cosmetics
   ├─ Game-specific cosmetics
   ├─ Cross-game cosmetics (show off across all games)
   └─ Cosmetic marketplace

5. LEADERBOARD AGGREGATION
   ├─ Per-game leaderboard
   ├─ All-games leaderboard (combined across all games)
   ├─ Time-based (daily, weekly, monthly, all-time)
   └─ Campus-specific (for exam predictions only)

6. FRAUD DETECTION
   ├─ Linked account detection
   ├─ Anomaly detection (sudden skill spikes)
   ├─ Bot detection (automated scripts)
   └─ Collusion detection (same IP winners in different games)

7. ANALYTICS DASHBOARD
   ├─ Revenue per game
   ├─ Player retention per game
   ├─ Average spending per player
   └─ Churn analysis
```

---

## Implementation Timeline

### 8-12 Week Development Plan

```
WEEK 1-2: MEME BATTLES
├─ Database schema
├─ Meme editor UI
├─ Voting system
└─ Winner calculation

WEEK 3-4: FREESTYLE RAP
├─ Audio recording system
├─ Beat management
├─ Voting UI
└─ Leaderboard

WEEK 5-6: SPORTS PREDICTIONS
├─ API integration (ESPN)
├─ Fixture sync
├─ Prediction UI
└─ Result settlement automation

WEEK 7-8: EXAM PREDICTIONS
├─ Campus database
├─ Course integration
├─ Prediction UI
└─ Consensus voting

WEEK 9-10: GAMING TOURNAMENTS
├─ Tournament bracket logic
├─ Match reporting system
├─ Leaderboard
└─ Admin dashboard

WEEK 11-12: CROSS-GAME INFRASTRUCTURE
├─ Unified leaderboard
├─ Shared notifications
├─ Cosmetics integration
├─ Analytics dashboard
└─ QA & bug fixes

TOTAL: 12 weeks = 3 months to full launch
```

---

## Revenue & Metrics

### Month 1 Projections (Soft Launch - 5 Games)

```
Game                    Users       Monthly Revenue     Notes
───────────────────────────────────────────────────────
Meme Battles            2,000       ₦242.5K            Free entry, high volume
Freestyle Rap           500         ₦510K              Cultural fit
Sports Predictions      5,000       ₦1.36M             Football obsession
Exam Predictions        10,000      ₦3.12M (prorated)  Campus-specific
Gaming Tournaments      1,000       ₦490K              Niche, high-LTV
───────────────────────────────────────────────────────
TOTAL (All 5 Games):                ₦5.72M             Month 1
```

### Month 6 Projections (Maturity)

```
Game                    Users       Monthly Revenue     Notes
───────────────────────────────────────────────────────
Meme Battles            10,000      ₦1.2M              Daily engagement
Freestyle Rap           2,000       ₦2M                Weekly battles, brand deals
Sports Predictions      30,000      ₦8M                Multiple leagues, betting pools
Exam Predictions        50,000      ₦15.6M             100 campuses active
Gaming Tournaments      5,000       ₦2.5M              Monthly championships
───────────────────────────────────────────────────────
TOTAL (All 5 Games):                ₦29.3M             Month 6
```

### Platform Total Revenue (With Individual Activities + Crews)

```
Month 1:
├─ Individual Activities: ₦13.8M
├─ Crew System: ₦1.18M
├─ Top 5 Games: ₦5.72M
└─ Total: ₦20.7M

Month 6:
├─ Individual Activities: ₦14.5M
├─ Crew System: ₦2M (scaling)
├─ Top 5 Games: ₦29.3M
└─ Total: ₦45.8M

Annualized (Month 12):
├─ All systems mature
└─ Revenue: ₦50M-₦60M/month = ₦600M-₦720M/year
```

---

## Success Metrics to Track

```
Per Game:

1. Participation
   ├─ Daily active players
   ├─ Weekly retention (% who return)
   ├─ Average sessions per user
   └─ Session duration

2. Monetization
   ├─ Revenue per user (ARPU)
   ├─ Conversion rate (free → paid)
   ├─ Average transaction value
   └─ Repeat purchase rate

3. Engagement
   ├─ Participation rate (% entering competitions)
   ├─ Entry rate (avg entries per user per week)
   ├─ Competition frequency (how often users enter)
   └─ Cosmetics purchase rate

4. Quality
   ├─ Fraud rate (% of fraudulent entries)
   ├─ Support tickets per 1,000 users
   ├─ User satisfaction (NPS score)
   └─ App crash rate

Target KPIs:

Meme Battles:
├─ 2,000+ DAU (Month 1) → 10,000+ (Month 6)
├─ 50% daily retention
├─ 200+ entries/day
└─ ₦240K+ monthly revenue

Freestyle Rap:
├─ 500+ weekly participants
├─ 30+ submissions/week
├─ ₦500K+ monthly revenue
└─ 5 brand deals/month (by Month 6)

Sports Predictions:
├─ 5,000+ active predictors
├─ 1,000+ predictions/day
├─ 40% win rate (keeps players engaged)
└─ ₦1.36M+ monthly revenue

Exam Predictions:
├─ 10,000+ active predictors (campus-specific)
├─ 50+ courses with predictions per campus
├─ 70%+ accuracy rate (consensus works)
└─ ₦3.12M+ monthly revenue (annualized)

Gaming Tournaments:
├─ 1,000+ active gamers
├─ 3+ tournaments/day
├─ 200+ monthly tournament entries
├─ 68%+ average win rate (skill-based)
└─ ₦490K+ monthly revenue
```

---

## Next Steps

1. **Database Setup** (Week 1)
   - Deploy all schemas to Supabase
   - Setup indexes for query performance
   - Configure RLS policies

2. **Backend Development** (Weeks 2-6)
   - Build API endpoints for all 5 games
   - Implement payout automation
   - Setup fraud detection

3. **Frontend Development** (Weeks 3-8)
   - Build UI components for each game
   - Implement real-time updates (WebSocket)
   - Mobile optimization

4. **Content Creation** (Weeks 1-12)
   - Create meme templates library (100+ templates)
   - Create beat library (50+ beats)
   - Seed fixture data (sports fixtures)
   - Create cosmetics (200+ designs)

5. **Quality Assurance** (Weeks 9-12)
   - Load testing (1,000+ concurrent users)
   - Security audit
   - Fraud prevention validation
   - Beta testing with select users

6. **Marketing** (Weeks 1-12)
   - Social media campaign
   - Campus ambassadors
   - Creator partnerships
   - Press releases

---

**Total Estimated Build Cost:** ₦500K-₦1M (freelancers) or ₦5M-₦10M (full team)  
**Expected Launch Date:** 12 weeks from start  
**Expected Month 1 Revenue:** ₦20.7M  
**Expected Break-Even:** Month 2-3  

**Ready to build?** 🚀

