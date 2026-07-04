# 📱 HASKii - Product Requirements Document
## Campus Points & Rewards Platform

**Version**: 1.0  
**Status**: Ready for Implementation  
**Backend**: Supabase (PostgreSQL + Auth)  
**Frontend**: React + Vite + Tailwind CSS  
**Target**: 50k+ users in 6 months

---

## 📋 TABLE OF CONTENTS
1. Product Overview
2. User Personas & User Flows
3. Feature Set (Complete)
4. Database Schema (Supabase)
5. API Structure
6. Frontend Architecture
7. Implementation Roadmap (7 Phases)
8. Deployment Checklist

---

## 1️⃣ PRODUCT OVERVIEW

### **What is HASKii?**
HASKii is a gamified campus points & rewards platform where students:
- Earn points through daily activities (check-ins, ads, missions)
- Spend points on real rewards (airtime, data, gift cards)
- Trade points with each other on a peer-to-peer market
- Build streaks and climb leaderboards
- Earn money by referring friends

### **Core Value Proposition**
```
For Students:      "Earn free money just by using your phone"
For Platform:      "Monetize student engagement at scale"
For Brands:        "Access university-targeted audience with ROI tracking"
For Telecom:       "User acquisition through points redemption"
```

### **Business Model**
```
Revenue Streams:
├─ Ad impressions (CPM: ₦100-300 per 1k views)
├─ Brand partnerships (CPI: ₦2k-5k per install)
├─ Premium subscriptions (₦499/month)
├─ Point market fees (6% on trades)
├─ Cosmetics/virtual goods (100% margin)
├─ Redemption margins (10% telecom commission)
└─ Data monetization (anonymized cohorts)

Projected Annual Revenue (50k users):
┌─────────────────────────────────┐
│ ₦450,000,000 - ₦600,000,000    │
│ (₦9,000-12,000 per user/year)  │
└─────────────────────────────────┘
```

### **Key Differentiators from HASKE**
✅ Rebuilt from scratch (fresh, clean codebase)
✅ Optimized for performance (Vite bundle size)
✅ Better UX (refined components, animations)
✅ Seamless Supabase integration (no RLS issues)
✅ Phased rollout (reduce bugs)
✅ Psychological pricing built-in
✅ Admin analytics dashboard
✅ Multi-university support

---

## 2️⃣ USER PERSONAS & FLOWS

### **User Personas**

#### **Persona 1: The Casual Earner**
- Demographics: Freshman, just joined campus
- Behavior: Opens app 2-3x per week
- Goals: Earn airtime without effort
- Spending: Redeems airtime weekly (₦1-2k)
- LTV: ₦2,000-3,000/year

#### **Persona 2: The Daily Grinder**
- Demographics: 200-300L, active user
- Behavior: Daily active user (logs in every day)
- Goals: Maximize earnings, unlock cosmetics
- Spending: Mixed (50% cosmetics, 50% airtime)
- LTV: ₦8,000-12,000/year

#### **Persona 3: The Social Butterfly**
- Demographics: Any level, network-focused
- Behavior: Shares referral code aggressively
- Goals: Build network, earn referral bonuses
- Spending: Premium tier + cosmetics
- LTV: ₦15,000-30,000/year

#### **Persona 4: The Whale**
- Demographics: Final year student, high earner
- Behavior: Hourly active, optimization-focused
- Goals: Point accumulation for trading
- Spending: Point packs + premium + market trading
- LTV: ₦50,000+/year

---

### **Core User Flows**

#### **Flow 1: Signup → Profile Complete → Getting Started**
```
1. User clicks "Sign Up"
2. Auth page (email/password)
3. Verify email (Supabase Magic Link)
4. Profile setup (name, university, department, course)
5. Getting started checklist appears
   ├─ Set up profile (1,000 pts) ✅ Already done
   ├─ Your first check-in (250 pts) → Link to /streak
   ├─ Watch your first ad (250 pts) → Link to /video-ads
   ├─ Take your first spin (500 pts) → Link to /spin-wheel
   ├─ Follow a brand (375 pts) → Link to /instagram-follow
   └─ Invite a friend (500 pts) → Link to /referrals
6. Dashboard shows points awarded

Total Onboarding: 2,875 pts (without referral)
Completion Rate Target: 85%+ by day 7
```

#### **Flow 2: Daily Check-In Streak**
```
1. User opens app
2. "Check-In Now" button visible
3. User clicks → Instant confirmation
4. Points awarded (250 + streak multiplier)
5. Streak counter updates
6. Toast notification (dopamine trigger)
7. User sees milestone rewards (7/14/30/100 days)

Repeat Daily: Forms habit loop
Engagement: 40%+ daily active users
Revenue: ₦1,200+ per user per month (direct + indirect)
```

#### **Flow 3: Watch Video Ads**
```
1. User navigates to /video-ads
2. See list of available videos (refreshed daily)
3. Click "Watch Now"
4. Video player (embedded video, auto-play)
5. Video completes → "You earned 50 pts!"
6. Add to hoard
7. See next video suggestion

Daily Max: 3 videos (capped at 150 pts)
Conversion: 60%+ of DAU watches ads
Revenue: ₦3,000+ per user per month
```

#### **Flow 4: Redeem for Airtime**
```
1. User navigates to /rewards
2. See airtime options (₦500-5,000)
3. Select provider (MTN/Airtel/Glo/9mobile)
4. Enter phone number
5. Confirm redemption
6. Points deducted (2,000 pts = ₦1,600 airtime)
7. "Airtime sent! Check your balance in 2 mins"

Minimum: 500 pts (₦400)
Time to fulfill: 2-5 minutes
Success rate: 95%+
Churn prevention: 30% of churners redeemed before leaving
```

#### **Flow 5: Refer a Friend**
```
1. User navigates to /referrals
2. Copy referral link (auto-generated)
3. Share via WhatsApp/Twitter/Email
4. Friend clicks link → Redirected to signup with `ref=USER_ID`
5. Friend completes profile
6. Referrer earns 500 pts instantly
7. Referree sees getting-started with referrer's name

Conversion Rate: 15-20% (referral link → signup)
Completion Rate: 60% (signup → profile complete)
Revenue Per Referral: ₦1,500-5,000 (from brands + data)
```

---

## 3️⃣ FEATURE SET (Complete Mirror of HASKE)

### **PHASE 1: Core Features** ⭐
- [x] Authentication (Email/Password + Magic Link)
- [x] User profiles (name, university, department, course)
- [x] Points ledger (in-app balance)
- [x] Daily check-in streak (with multipliers)
- [x] Activity log (all transactions visible)
- [x] Dashboard (overview of points, streaks, missions)

### **PHASE 2: Earning Mechanisms**
- [ ] Getting started tasks (6 tasks, 2,875 pts total)
- [ ] Daily missions (6 missions, combo bonuses)
- [ ] Video ads (50 pts per video, 3/day max)
- [ ] Sponsored missions (brand partnerships)
- [ ] Spin wheel (random rewards)

### **PHASE 3: Spending & Redemption**
- [ ] Rewards catalog (airtime, data, gift cards)
- [ ] Redemption flow (select → confirm → deliver)
- [ ] Marketplace (cosmetics, badges, titles)
- [ ] Premium subscription (₦499/month or 50k pts)
- [ ] Point decay (60-day expiry with warnings)

### **PHASE 4: Social & Community**
- [ ] Leaderboards (university + national)
- [ ] Referral program (tracking + payouts)
- [ ] Friend list (see friends' progress)
- [ ] Social missions (share, refer, comment)
- [ ] Notifications (real-time + batch)

### **PHASE 5: Advanced Earning**
- [ ] Instagram follow verification
- [ ] Achievement badges
- [ ] Weekly challenges
- [ ] University-specific missions
- [ ] Milestone rewards (day 7/14/30/100)

### **PHASE 6: Marketplace & Trading**
- [ ] Point trading (P2P market)
- [ ] Buy/sell orders (user-set prices)
- [ ] Market analytics (charts, trends)
- [ ] Admin market seeding (bootstrap liquidity)
- [ ] Point packs (buy points with cash)

### **PHASE 7: Admin & Analytics**
- [ ] Admin dashboard (full control)
- [ ] User management (search, edit, ban)
- [ ] Points & rewards management
- [ ] Analytics (DAU, engagement, revenue)
- [ ] Mission management
- [ ] Redemption tracking

---

## 4️⃣ DATABASE SCHEMA (Supabase PostgreSQL)

### **Core Tables**

#### **1. users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY (Supabase Auth ID),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Profile
  university TEXT,
  department TEXT,
  course TEXT,
  profile_complete BOOLEAN DEFAULT FALSE,
  
  -- Points
  points BIGINT DEFAULT 0,
  wallet DECIMAL(12,2) DEFAULT 0, -- ₦ balance
  
  -- Streaks
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_check_in_date DATE,
  
  -- Referrals
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES users(id),
  
  -- Admin
  is_admin BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_university ON users(university);
```

#### **2. transactions**
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Transaction details
  type TEXT NOT NULL, -- check_in, video_ad, redemption, referral, etc
  amount BIGINT NOT NULL, -- Can be negative for redemptions
  description TEXT,
  
  -- Reference
  mission_id UUID,
  reward_id UUID,
  related_user_id UUID REFERENCES users(id),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB -- For storing extra data (provider, phone_number, etc)
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_user_type ON transactions(user_id, type);
```

#### **3. streak_check_ins**
```sql
CREATE TABLE streak_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  check_in_date DATE NOT NULL,
  points_awarded INTEGER DEFAULT 250,
  streak_bonus INTEGER DEFAULT 0, -- Bonus for milestone
  
  -- Prevent duplicates per day per user
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, check_in_date)
);

CREATE INDEX idx_check_ins_user_id ON streak_check_ins(user_id);
CREATE INDEX idx_check_ins_date ON streak_check_ins(check_in_date);
```

#### **4. daily_missions**
```sql
CREATE TABLE daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  mission_id TEXT NOT NULL, -- checkin, video_ad, instagram, etc
  mission_name TEXT,
  reward_points INTEGER,
  difficulty TEXT, -- easy, medium, hard
  
  completed_at TIMESTAMP DEFAULT NOW(),
  
  -- Prevent duplicates per day per user per mission
  UNIQUE(user_id, mission_id, DATE(completed_at))
);

CREATE INDEX idx_daily_missions_user_id ON daily_missions(user_id);
CREATE INDEX idx_daily_missions_completed_at ON daily_missions(completed_at);
```

#### **5. video_ads_watched**
```sql
CREATE TABLE video_ads_watched (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  ad_id TEXT,
  video_url TEXT,
  points_awarded INTEGER DEFAULT 50,
  
  watched_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, ad_id, DATE(watched_at))
);

CREATE INDEX idx_video_ads_user_id ON video_ads_watched(user_id);
CREATE INDEX idx_video_ads_watched_at ON video_ads_watched(watched_at);
```

#### **6. rewards**
```sql
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL, -- ₦500 Airtime, 1GB Data, etc
  description TEXT,
  
  type TEXT NOT NULL, -- airtime, data, giftcard
  points_cost INTEGER NOT NULL,
  amount DECIMAL(10,2), -- ₦ value or GB value
  unit TEXT, -- ₦, GB, etc
  provider TEXT, -- MTN, Airtel, etc
  
  is_active BOOLEAN DEFAULT TRUE,
  
  -- For tracking popularity
  purchase_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rewards_type ON rewards(type);
CREATE INDEX idx_rewards_points_cost ON rewards(points_cost);
```

#### **7. redemptions**
```sql
CREATE TABLE redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  reward_id UUID NOT NULL REFERENCES rewards(id),
  reward_name TEXT,
  points_spent INTEGER NOT NULL,
  
  phone_number TEXT,
  provider TEXT, -- MTN, Airtel, etc
  
  status TEXT DEFAULT 'pending', -- pending, completed, failed
  reference_code TEXT UNIQUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  metadata JSONB
);

CREATE INDEX idx_redemptions_user_id ON redemptions(user_id);
CREATE INDEX idx_redemptions_status ON redemptions(status);
CREATE INDEX idx_redemptions_created_at ON redemptions(created_at);
```

#### **8. referrals**
```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  referee_email TEXT,
  referee_name TEXT,
  
  reward INTEGER DEFAULT 500,
  points_awarded BOOLEAN DEFAULT FALSE,
  
  status TEXT DEFAULT 'pending', -- pending, completed, rejected
  
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX idx_referrals_status ON referrals(status);
```

#### **9. instagram_follows**
```sql
CREATE TABLE instagram_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  brand_username TEXT NOT NULL,
  brand_name TEXT,
  
  verified BOOLEAN DEFAULT FALSE, -- Manual verification or API
  points_awarded INTEGER DEFAULT 375,
  
  created_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  
  UNIQUE(user_id, brand_username)
);

CREATE INDEX idx_instagram_follows_user_id ON instagram_follows(user_id);
CREATE INDEX idx_instagram_follows_verified ON instagram_follows(verified);
```

#### **10. point_market**
```sql
CREATE TABLE point_market (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  points_amount INTEGER NOT NULL,
  price_per_point DECIMAL(10,4) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  
  type TEXT DEFAULT 'sell', -- sell or buy order
  status TEXT DEFAULT 'active', -- active, completed, cancelled
  
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX idx_point_market_seller_id ON point_market(seller_id);
CREATE INDEX idx_point_market_status ON point_market(status);
CREATE INDEX idx_point_market_price ON point_market(price_per_point);
```

#### **11. cosmetics**
```sql
CREATE TABLE cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- badge, frame, title, avatar
  
  icon_url TEXT,
  color TEXT,
  rarity TEXT, -- common, rare, epic, legendary
  
  points_cost INTEGER NOT NULL,
  is_limited BOOLEAN DEFAULT FALSE,
  limited_quantity INTEGER,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cosmetics_type ON cosmetics(type);
CREATE INDEX idx_cosmetics_points_cost ON cosmetics(points_cost);
```

#### **12. user_cosmetics** (Inventory)
```sql
CREATE TABLE user_cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cosmetic_id UUID NOT NULL REFERENCES cosmetics(id) ON DELETE CASCADE,
  
  is_equipped BOOLEAN DEFAULT FALSE,
  purchased_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, cosmetic_id)
);

CREATE INDEX idx_user_cosmetics_user_id ON user_cosmetics(user_id);
CREATE INDEX idx_user_cosmetics_equipped ON user_cosmetics(user_id, is_equipped);
```

#### **13. getting_started_tasks**
```sql
CREATE TABLE getting_started_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  task_id TEXT NOT NULL, -- profile, checkin, video_ad, spin, instagram, refer
  task_name TEXT,
  reward_points INTEGER,
  
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  points_awarded BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, task_id)
);

CREATE INDEX idx_getting_started_user_id ON getting_started_tasks(user_id);
CREATE INDEX idx_getting_started_points_awarded ON getting_started_tasks(points_awarded);
```

#### **14. leaderboards**
```sql
CREATE TABLE leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  rank INTEGER,
  points_total BIGINT,
  university TEXT,
  
  period TEXT DEFAULT 'weekly', -- weekly, monthly, alltime
  
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leaderboards_rank ON leaderboards(rank);
CREATE INDEX idx_leaderboards_university ON leaderboards(university);
CREATE INDEX idx_leaderboards_period ON leaderboards(period);
```

#### **15. admin_settings**
```sql
CREATE TABLE admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB,
  setting_type TEXT, -- integer, decimal, boolean, text, array
  
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Key settings:
-- point_values: {check_in: 250, video_ad: 50, ...}
-- redemption_rates: {airtime: 1.0, data: 1.2, ...}
-- platform_fees: {market_fee: 0.03, redemption_fee: 0.1, ...}
-- feature_flags: {enable_market: true, enable_premium: true, ...}
```

### **RLS (Row Level Security) Policies**

```sql
-- Enable RLS on all user tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
-- ... etc for all user-specific tables

-- Policy: Users can only see their own data
CREATE POLICY users_see_own_data ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_own_data ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY transactions_see_own ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Public leaderboards (read-only)
CREATE POLICY leaderboards_public ON leaderboards
  FOR SELECT USING (true);

-- Admin can bypass RLS
CREATE POLICY admin_all_access ON users
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE is_admin = TRUE)
  );
```

---

## 5️⃣ API STRUCTURE (Supabase Functions)

### **Core Endpoints**

#### **Auth Endpoints**
```
POST /auth/signup
  Body: { email, password, full_name }
  Response: { user, session }

POST /auth/login
  Body: { email, password }
  Response: { user, session }

POST /auth/logout
  Response: { success }

POST /auth/magic-link
  Body: { email }
  Response: { success, message }
```

#### **User Endpoints**
```
GET /user/profile
  Response: { user_data, points, wallet }

PUT /user/profile
  Body: { full_name, university, department, course }
  Response: { updated_user }

GET /user/transactions
  Query: { limit, offset, type }
  Response: { transactions[], total }

GET /user/leaderboard-position
  Response: { rank, points, percentile }
```

#### **Points Endpoints**
```
POST /points/check-in
  Response: { points_awarded, new_total, streak }

GET /points/balance
  Response: { points, wallet, last_check_in }

GET /points/history
  Query: { limit, offset }
  Response: { transactions[] }

POST /points/redeem
  Body: { reward_id, phone_number, provider }
  Response: { redemption_id, status, reference_code }
```

#### **Missions Endpoints**
```
GET /missions/daily
  Response: { missions[], completed[], bonus }

POST /missions/complete
  Body: { mission_id }
  Response: { points_awarded, new_total }

GET /missions/getting-started
  Response: { tasks[], completed[], total_reward }
```

#### **Market Endpoints**
```
GET /market/orders
  Query: { type, price_range, limit }
  Response: { orders[] }

POST /market/create-order
  Body: { points_amount, price_per_point, type }
  Response: { order_id, status }

POST /market/execute-trade
  Body: { order_id }
  Response: { transaction_id, new_balance }

GET /market/price-chart
  Query: { period }
  Response: { chart_data[] }
```

#### **Cosmetics Endpoints**
```
GET /cosmetics/shop
  Query: { type, limit }
  Response: { cosmetics[] }

POST /cosmetics/buy
  Body: { cosmetic_id }
  Response: { transaction_id, new_inventory }

GET /cosmetics/inventory
  Response: { owned_cosmetics[], equipped }

POST /cosmetics/equip
  Body: { cosmetic_id, type }
  Response: { equipped }
```

#### **Social Endpoints**
```
GET /referrals/code
  Response: { referral_code, referral_link }

GET /referrals/stats
  Response: { total_referrals, completed, earned }

GET /referrals/list
  Response: { referrals[] }

GET /leaderboards/global
  Query: { university, limit }
  Response: { rankings[] }

GET /leaderboards/university
  Query: { university }
  Response: { rankings[] }
```

#### **Admin Endpoints**
```
GET /admin/users
  Query: { search, limit, offset }
  Response: { users[], total }

PUT /admin/users/:id/points
  Body: { new_points, reason }
  Response: { updated_user }

POST /admin/missions/create
  Body: { mission_data }
  Response: { mission_id }

GET /admin/analytics
  Query: { metric, period }
  Response: { analytics_data }

POST /admin/market/seed
  Body: { points_amount, price }
  Response: { order_id }
```

---

## 6️⃣ FRONTEND ARCHITECTURE

### **Project Structure**
```
haskii/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── SignUp.jsx
│   │   │   ├── Login.jsx
│   │   │   └── MagicLink.jsx
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── QuickStats.jsx
│   │   │   ├── PointsOverview.jsx
│   │   │   └── StreakCounter.jsx
│   │   ├── Missions/
│   │   │   ├── DailyMissions.jsx
│   │   │   ├── GettingStarted.jsx
│   │   │   └── MissionCard.jsx
│   │   ├── Rewards/
│   │   │   ├── RewardsShop.jsx
│   │   │   ├── RewardCard.jsx
│   │   │   └── RedemptionFlow.jsx
│   │   ├── Market/
│   │   │   ├── PointMarket.jsx
│   │   │   ├── OrderBook.jsx
│   │   │   └── TradeChart.jsx
│   │   ├── Social/
│   │   │   ├── Referrals.jsx
│   │   │   ├── Leaderboards.jsx
│   │   │   └── Profile.jsx
│   │   ├── Common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── BottomNav.jsx
│   │   └── Admin/
│   │       ├── AdminDashboard.jsx
│   │       ├── UserManagement.jsx
│   │       └── Analytics.jsx
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Profile.jsx
│   │   ├── Missions.jsx
│   │   ├── Rewards.jsx
│   │   ├── Market.jsx
│   │   ├── Referrals.jsx
│   │   ├── Leaderboards.jsx
│   │   ├── Admin.jsx
│   │   └── 404.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useUser.js
│   │   ├── usePoints.js
│   │   ├── useMissions.js
│   │   └── useMarket.js
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── UserContext.jsx
│   │   └── ToastContext.jsx
│   ├── utils/
│   │   ├── supabase.js
│   │   ├── api.js
│   │   ├── helpers.js
│   │   └── constants.js
│   ├── styles/
│   │   ├── global.css
│   │   └── tailwind.config.js
│   ├── App.jsx
│   └── main.jsx
├── public/
├── .env.example
├── .gitignore
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

### **Key Dependencies**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.16.0",
    "@supabase/supabase-js": "^2.38.0",
    "tailwindcss": "^3.3.0",
    "axios": "^1.5.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.1.0",
    "eslint": "^8.50.0"
  }
}
```

### **Component Patterns**

#### **Pattern 1: Custom Hooks**
```javascript
// usePoints.js - Centralized points logic
export function usePoints() {
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const fetchBalance = useCallback(async () => {
    const { data } = await supabase
      .from('users')
      .select('points')
      .single();
    setPoints(data?.points || 0);
  }, []);
  
  const awardPoints = useCallback(async (type, amount) => {
    const { data, error } = await supabase
      .rpc('award_points', { 
        p_type: type, 
        p_amount: amount 
      });
    if (!error) setPoints(data.new_total);
    return { data, error };
  }, []);
  
  return { points, loading, fetchBalance, awardPoints };
}
```

#### **Pattern 2: API Layer**
```javascript
// utils/api.js - All API calls centralized
export const api = {
  auth: {
    signup: (email, password, fullName) => 
      supabase.auth.signUp({ email, password }),
    login: (email, password) => 
      supabase.auth.signInWithPassword({ email, password }),
  },
  points: {
    checkIn: () => supabase.rpc('check_in_user'),
    getBalance: () => supabase.from('users').select('points').single(),
  },
  missions: {
    getDaily: () => supabase.from('daily_missions')
      .select('*')
      .eq('date', new Date().toISOString().split('T')[0]),
  },
};
```

#### **Pattern 3: Context for Global State**
```javascript
// context/UserContext.jsx
const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );
    return () => authListener?.subscription.unsubscribe();
  }, []);
  
  return (
    <UserContext.Provider value={{ user, userProfile, setUserProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
```

---

## 7️⃣ IMPLEMENTATION ROADMAP (7 Phases)

### **PHASE 1: Core Setup & Auth (Week 1-2)**
**Goal**: Deployable MVP with signup/login

**What to Build**:
1. Supabase project setup
2. Database schema (all tables)
3. Auth context (signup/login/logout)
4. Landing + signup/login pages
5. Profile setup flow
6. Navigation structure

**Deliverables**:
- Working auth (create user, sign in)
- User profile saving
- Basic dashboard shell
- CI/CD setup

**Testing**:
- Auth signup → profile complete ✅
- Auth login → redirect to dashboard ✅
- Logout → redirect to landing ✅

**Line of Code**: ~2,000 LOC

---

### **PHASE 2: Points System & Check-In (Week 3)**
**Goal**: Users can check-in daily and earn points

**What to Build**:
1. Daily check-in system
2. Streak counter logic
3. Points ledger (transactions table)
4. Activity log display
5. Points balance widget
6. Streak milestone bonuses

**Database Queries**:
```sql
-- Check if user checked in today
SELECT id FROM streak_check_ins 
WHERE user_id = $1 AND check_in_date = CURRENT_DATE;

-- Calculate streak (find continuous days)
-- Award points + create transaction
```

**Deliverables**:
- Check-in button works ✅
- Points awarded ✅
- Streak counter updates ✅
- Activity log shows transactions ✅

**Testing**:
- User can check-in once daily ✅
- Check-in prevents duplicates ✅
- Streak increments correctly ✅
- Bonus at day 7/14/30/100 ✅

**Line of Code**: ~1,500 LOC

---

### **PHASE 3: Getting Started Tasks (Week 4)**
**Goal**: Users complete onboarding tasks for initial points

**What to Build**:
1. Getting started component
2. Task detection logic (profile, checkin, ad, spin, ig, refer)
3. Auto-award when tasks complete
4. Task UI with progress
5. Completion banner

**Task Detection Flow**:
```javascript
const detectCompletions = async () => {
  const checks = await Promise.all([
    checkProfileComplete(),
    checkFirstCheckin(),
    checkFirstAdWatch(),
    checkFirstSpin(),
    checkInstagramFollow(),
    checkReferral()
  ]);
  
  // Auto-award if not awarded yet
  for (const task of checks) {
    if (task.completed && !task.pointsAwarded) {
      await awardTask(task);
    }
  }
};
```

**Deliverables**:
- All 6 tasks detectable ✅
- Auto-award on completion ✅
- Progress UI shows completion ✅
- 2,875 pts total rewarded ✅

**Testing**:
- Profile complete → 1,000 pts ✅
- First check-in → 250 pts ✅
- Watch ad → 250 pts ✅
- Take spin → 500 pts ✅
- Follow Instagram → 375 pts ✅
- Invite friend → 500 pts ✅

**Line of Code**: ~1,200 LOC

---

### **PHASE 4: Daily Missions & Video Ads (Week 5)**
**Goal**: Repeatable daily earning activities

**What to Build**:
1. Daily missions list (6 missions)
2. Mission completion tracking (unique per day)
3. Combo bonus logic
4. Video ads integration (embedded videos)
5. Ad watching verification
6. Mission card UI

**Database Constraint**:
```sql
-- Unique constraint: user can complete mission once per day
ALTER TABLE daily_missions
ADD UNIQUE (user_id, mission_id, DATE(created_at));
```

**Deliverables**:
- All 6 daily missions appear ✅
- Can complete each once per day ✅
- Combo bonuses calculate ✅
- Video ads play and award points ✅
- 3 ad limit per day enforced ✅

**Testing**:
- Complete all easy missions → 250 bonus ✅
- Complete all medium missions → 300 bonus ✅
- Complete all missions → 1,000 bonus ✅
- Video ads capped at 3/day ✅

**Line of Code**: ~1,800 LOC

---

### **PHASE 5: Rewards & Redemption (Week 6)**
**Goal**: Users can spend points on real rewards

**What to Build**:
1. Rewards catalog (airtime, data, gift cards)
2. Redemption flow (select → confirm → deliver)
3. Redemption history
4. Phone number input validation
5. Provider selection (MTN/Airtel/Glo/9mobile)
6. Confirmation & reference codes

**Redemption Flow**:
```javascript
const redeemReward = async (rewardId, phoneNumber) => {
  // 1. Fetch fresh balance
  const user = await fetchUserPoints();
  
  // 2. Check sufficient points
  if (user.points < reward.pointsCost) throw new Error();
  
  // 3. Deduct points
  await supabase.from('users')
    .update({ points: user.points - reward.pointsCost })
    .eq('id', userId);
  
  // 4. Create redemption record
  const redemption = await supabase.from('redemptions')
    .insert({ user_id: userId, reward_id: rewardId, ... });
  
  // 5. Log transaction
  await logTransaction('redemption', -reward.pointsCost, ...);
  
  // 6. Return reference code
  return redemption.reference_code;
};
```

**Deliverables**:
- Rewards catalog displays ✅
- Can select reward + phone number ✅
- Points deducted correctly ✅
- Confirmation shown with reference code ✅
- Redemption history visible ✅

**Testing**:
- Insufficient points → error ✅
- Valid redemption → points deducted ✅
- Reference code generated ✅
- Minimum 1,000 pts enforced ✅

**Line of Code**: ~1,500 LOC

---

### **PHASE 6: Social Features (Week 7-8)**
**Goal**: Referrals, leaderboards, social proof

**What to Build**:
1. Referral link generation
2. Referral tracking (refer → signup → complete profile)
3. Referral payout automation
4. Leaderboards (global + university)
5. Friend list / social connections
6. Achievement system (badges)

**Referral Flow**:
```javascript
// On signup with ref parameter
const handleSignup = async (email, password, refCode) => {
  const referrer = await supabase
    .from('users')
    .select('id')
    .eq('referral_code', refCode)
    .single();
  
  // Create user with referrer_id
  const newUser = await signUp({
    email, password,
    referred_by: referrer.id
  });
  
  // Create referral record
  await supabase.from('referrals').insert({
    referrer_id: referrer.id,
    referee_id: newUser.id,
    status: 'pending'
  });
};

// On profile complete by referee
const checkReferralCompletion = async (userId) => {
  const referral = await supabase
    .from('referrals')
    .select('*')
    .eq('referee_id', userId)
    .single();
  
  if (referral && !referral.points_awarded) {
    // Award referrer 500 pts
    await awardPoints(referral.referrer_id, 500, 'referral');
  }
};
```

**Leaderboard Query**:
```sql
-- Rank users by points
SELECT 
  ROW_NUMBER() OVER (ORDER BY points DESC) as rank,
  id, full_name, points, university
FROM users
WHERE university = $1
ORDER BY points DESC
LIMIT 100;
```

**Deliverables**:
- Referral code unique per user ✅
- Share via WhatsApp/Twitter/Email ✅
- Tracking referral status ✅
- Auto-payout on profile complete ✅
- Leaderboards show top users ✅
- University-specific ranking ✅

**Testing**:
- Referral link works ✅
- Referrer gets 500 pts on completion ✅
- Leaderboard rankings correct ✅
- No duplicate payments ✅

**Line of Code**: ~2,000 LOC

---

### **PHASE 7: Advanced Features & Admin (Week 9-10)**
**Goal**: Marketplace, cosmetics, admin panel

**What to Build**:
1. Point market (P2P trading)
2. Cosmetics shop (badges, frames, titles)
3. User inventory system
4. Premium subscription
5. Admin dashboard (full control)
6. Analytics (DAU, engagement, revenue)

**Market Logic**:
```javascript
const executeTrade = async (orderId, buyerPoints) => {
  const order = await fetchOrder(orderId);
  
  // Check buyer has enough points
  const buyer = await fetchUser(currentUser);
  if (buyer.points < order.totalPrice) throw new Error();
  
  // Atomic transaction
  const totalPrice = order.totalPrice;
  const fee = totalPrice * 0.03;
  
  // Deduct from buyer
  await updatePoints(currentUser, -totalPrice);
  
  // Credit seller (minus fee)
  await updatePoints(order.sellerId, order.pointsAmount - fee);
  
  // Platform keeps fee
  await logTransaction(order.sellerId, 'market_fee', -fee);
  
  // Mark order complete
  await completeOrder(orderId);
};
```

**Deliverables**:
- Point market live with buy/sell orders ✅
- Trading prevents fraud (atomic transactions) ✅
- Cosmetics purchasable with points ✅
- User inventory system ✅
- Premium subscription (₦499/month) ✅
- Admin user management ✅
- Admin analytics dashboard ✅

**Testing**:
- Can create sell order ✅
- Can create buy order ✅
- Trade executes atomically ✅
- Market fees deducted correctly ✅
- Cosmetics show on profile ✅
- Admin can view all users ✅
- Admin can adjust points ✅

**Line of Code**: ~2,500 LOC

---

## 8️⃣ DEPLOYMENT CHECKLIST

### **Pre-Deployment**
- [ ] All tests passing (Jest + Cypress)
- [ ] No console errors (ESLint clean)
- [ ] Database migrations run
- [ ] Environment variables set (.env.production)
- [ ] RLS policies enabled
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Analytics instrumented

### **Supabase Setup**
- [ ] Project created
- [ ] Auth providers configured
- [ ] Database tables created
- [ ] RLS policies enabled
- [ ] Storage buckets created (for avatars)
- [ ] Functions deployed
- [ ] Webhooks configured

### **Frontend Deployment**
- [ ] Vite build optimized
- [ ] Bundle size checked (<300kb gzip)
- [ ] Environment variables configured
- [ ] Vercel/Netlify connected
- [ ] Domain configured
- [ ] SSL/HTTPS enabled
- [ ] CDN configured for static assets

### **Launch Checklist**
- [ ] Beta testing with 100 users
- [ ] Bugs fixed from beta
- [ ] Help documentation written
- [ ] Support email configured
- [ ] Monitoring alerts set up
- [ ] Incident response plan ready
- [ ] Daily auto-backups enabled

### **Post-Launch (Week 1)**
- [ ] Monitor error rates (<1%)
- [ ] Monitor DAU growth
- [ ] Monitor P2P transaction volume
- [ ] Fix critical bugs immediately
- [ ] Respond to user feedback
- [ ] Monitor server performance
- [ ] Optimize slow queries

---

## 🎯 SUCCESS METRICS

### **Week 1**
- ✅ 0 critical bugs
- ✅ 95%+ signup completion
- ✅ 80%+ profile complete
- ✅ 60%+ first check-in

### **Week 4**
- ✅ 1,000+ DAU
- ✅ 40%+ retention (day 7)
- ✅ 20%+ redemption rate
- ✅ 10%+ referral rate

### **Month 1**
- ✅ 5,000+ DAU
- ✅ 30%+ retention (day 30)
- ✅ ₦1M+ transaction volume
- ✅ 4.5+ app rating

### **Month 6**
- ✅ 50,000+ DAU
- ✅ ₦600M+ revenue
- ✅ 35%+ conversion (premium)
- ✅ Profitability achieved

---

## 📝 TECHNICAL NOTES

### **Performance Considerations**
1. **Database Indexing**: All frequently queried columns indexed
2. **Query Optimization**: Use select() to limit returned columns
3. **Caching**: User data cached in context (revalidate every 30s)
4. **Pagination**: All lists paginated (limit 20 per page)
5. **Image Optimization**: Avatar images compressed (<100kb each)

### **Security Considerations**
1. **RLS Policies**: Enforced on all user data
2. **Auth Tokens**: Refresh token rotation every 1 hour
3. **Sensitive Data**: Never logged or exposed
4. **Rate Limiting**: Implemented on sensitive endpoints
5. **Input Validation**: All user inputs validated server-side

### **Scalability Notes**
1. **Concurrent Users**: Database can handle 50k+ concurrent
2. **Transaction Volume**: Point market can process 1000+ TPS
3. **Real-Time**: Use Supabase realtime for live leaderboards
4. **Caching**: Redis for session storage (if needed)

---

## 🚀 READY FOR IMPLEMENTATION

**This PRD is designed to be followed sequentially.**

Each phase:
- Has clear deliverables
- Contains example code
- Includes database queries
- Lists test cases
- Estimates LOC

**Claude can implement each phase in 1-2 days** with this level of detail.

---

**Start with PHASE 1** → Set up Supabase, create tables, build auth.
**Then proceed sequentially** → Each phase builds on previous.
**Deploy after PHASE 3** → Users can sign up and earn points.
**Full feature set by PHASE 7** → Complete platform launch.

Would you like me to start implementing Phase 1?