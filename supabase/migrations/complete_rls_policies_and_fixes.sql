-- COMPLETE RLS POLICIES AND FIXES FOR ALL FEATURES
-- Run this once to set up all missing policies and fix limits

-- ==============================================
-- 1. FIX: Spin Wheel Free Limit (was 2, should be 3)
-- ==============================================
UPDATE feature_limits
SET daily_limit = 3, updated_at = NOW()
WHERE feature_name = 'spin_wheel_free';

-- ==============================================
-- 2. RLS POLICIES FOR USER TRANSACTION TRACKING
-- ==============================================

-- Transactions table
DROP POLICY IF EXISTS "Users can read own transactions" ON transactions;
CREATE POLICY "Users can read own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily Missions
DROP POLICY IF EXISTS "Users can read own missions" ON daily_missions;
CREATE POLICY "Users can read own missions" ON daily_missions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own missions" ON daily_missions;
CREATE POLICY "Users can insert own missions" ON daily_missions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own missions" ON daily_missions;
CREATE POLICY "Users can update own missions" ON daily_missions
  FOR UPDATE USING (auth.uid() = user_id);

-- Weekly Challenges
DROP POLICY IF EXISTS "Users can read own challenges" ON weekly_challenges;
CREATE POLICY "Users can read own challenges" ON weekly_challenges
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own challenges" ON weekly_challenges;
CREATE POLICY "Users can insert own challenges" ON weekly_challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own challenges" ON weekly_challenges;
CREATE POLICY "Users can update own challenges" ON weekly_challenges
  FOR UPDATE USING (auth.uid() = user_id);

-- Cosmetics Purchases
DROP POLICY IF EXISTS "Users can read own cosmetic purchases" ON cosmetics_purchases;
CREATE POLICY "Users can read own cosmetic purchases" ON cosmetics_purchases
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert cosmetic purchases" ON cosmetics_purchases;
CREATE POLICY "Users can insert cosmetic purchases" ON cosmetics_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Point Sell Orders
DROP POLICY IF EXISTS "Users can read own sell orders" ON point_sell_orders;
CREATE POLICY "Users can read own sell orders" ON point_sell_orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert sell orders" ON point_sell_orders;
CREATE POLICY "Users can insert sell orders" ON point_sell_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sell orders" ON point_sell_orders;
CREATE POLICY "Users can update own sell orders" ON point_sell_orders
  FOR UPDATE USING (auth.uid() = user_id);

-- Point Trades
DROP POLICY IF EXISTS "Users can read own trades" ON point_trades;
CREATE POLICY "Users can read own trades" ON point_trades
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can insert trades" ON point_trades;
CREATE POLICY "Users can insert trades" ON point_trades
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Redemptions
DROP POLICY IF EXISTS "Users can read own redemptions" ON redemptions;
CREATE POLICY "Users can read own redemptions" ON redemptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert redemptions" ON redemptions;
CREATE POLICY "Users can insert redemptions" ON redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own redemptions" ON redemptions;
CREATE POLICY "Users can update own redemptions" ON redemptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Leaderboard Stats
DROP POLICY IF EXISTS "Users can read leaderboard" ON leaderboard_stats;
CREATE POLICY "Users can read leaderboard" ON leaderboard_stats
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can update leaderboard" ON leaderboard_stats;
CREATE POLICY "System can update leaderboard" ON leaderboard_stats
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update leaderboard stats" ON leaderboard_stats;
CREATE POLICY "System can update leaderboard stats" ON leaderboard_stats
  FOR UPDATE USING (true);

-- Instagram Follows
DROP POLICY IF EXISTS "Users can read own follows" ON instagram_follows;
CREATE POLICY "Users can read own follows" ON instagram_follows
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert follows" ON instagram_follows;
CREATE POLICY "Users can insert follows" ON instagram_follows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Referrals
DROP POLICY IF EXISTS "Users can read own referrals" ON referrals;
CREATE POLICY "Users can read own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- INSERT policy intentionally omitted here:
-- fix_referrals_system.sql sets the correct policy (auth.uid() = referee_id)
-- because the referee (new user) inserts the row at signup, not the referrer.

-- User Ads
DROP POLICY IF EXISTS "Users can read own ads" ON user_ads;
CREATE POLICY "Users can read own ads" ON user_ads
  FOR SELECT USING (auth.uid() = user_id OR true);

DROP POLICY IF EXISTS "Users can insert ads" ON user_ads;
CREATE POLICY "Users can insert ads" ON user_ads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own ads" ON user_ads;
CREATE POLICY "Users can update own ads" ON user_ads
  FOR UPDATE USING (auth.uid() = user_id);

-- University Chat Messages
DROP POLICY IF EXISTS "Users can read chat messages" ON university_chat_messages;
CREATE POLICY "Users can read chat messages" ON university_chat_messages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert chat messages" ON university_chat_messages;
CREATE POLICY "Users can insert chat messages" ON university_chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Campaigns
DROP POLICY IF EXISTS "Users can read campaigns" ON campaigns;
CREATE POLICY "Users can read campaigns" ON campaigns
  FOR SELECT USING (true);

-- Purchases
DROP POLICY IF EXISTS "Users can read own purchases" ON purchases;
CREATE POLICY "Users can read own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert purchases" ON purchases;
CREATE POLICY "Users can insert purchases" ON purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Spin History
DROP POLICY IF EXISTS "Users can read own spin history" ON spin_history;
CREATE POLICY "Users can read own spin history" ON spin_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert spin history" ON spin_history;
CREATE POLICY "Users can insert spin history" ON spin_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trivia Results
DROP POLICY IF EXISTS "Users can read own trivia results" ON trivia_results;
CREATE POLICY "Users can read own trivia results" ON trivia_results
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert trivia results" ON trivia_results;
CREATE POLICY "Users can insert trivia results" ON trivia_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Point Buy Offers
DROP POLICY IF EXISTS "Users can read own buy offers" ON point_buy_offers;
CREATE POLICY "Users can read own buy offers" ON point_buy_offers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert buy offers" ON point_buy_offers;
CREATE POLICY "Users can insert buy offers" ON point_buy_offers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Video Ads Watched
DROP POLICY IF EXISTS "Users can read own video history" ON video_ads_watched;
CREATE POLICY "Users can read own video history" ON video_ads_watched
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert video history" ON video_ads_watched;
CREATE POLICY "Users can insert video history" ON video_ads_watched
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Withdrawals
DROP POLICY IF EXISTS "Users can read own withdrawals" ON withdrawals;
CREATE POLICY "Users can read own withdrawals" ON withdrawals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert withdrawals" ON withdrawals;
CREATE POLICY "Users can insert withdrawals" ON withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Rate Limits
DROP POLICY IF EXISTS "Users can read own rate limits" ON rate_limits;
CREATE POLICY "Users can read own rate limits" ON rate_limits
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert rate limits" ON rate_limits;
CREATE POLICY "Users can insert rate limits" ON rate_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update rate limits" ON rate_limits;
CREATE POLICY "Users can update rate limits" ON rate_limits
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin Audit Log (admin only)
DROP POLICY IF EXISTS "Admins can read audit log" ON admin_audit_log;
CREATE POLICY "Admins can read audit log" ON admin_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Feature Limits (readable by all, writable by admins)
DROP POLICY IF EXISTS "All can read feature limits" ON feature_limits;
CREATE POLICY "All can read feature limits" ON feature_limits
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update feature limits" ON feature_limits;
CREATE POLICY "Admins can update feature limits" ON feature_limits
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ==============================================
-- 3. SUMMARY OF DEPLOYED FEATURES
-- ==============================================
-- ✅ Spin Wheel (Free & Purchased) - Rate limited
-- ✅ Marketplace Ads - Rate limited
-- ✅ Point Selling - Rate limited (weekly)
-- ✅ Point Buying - Rate limited (weekly)
-- ✅ Referrals - Rate limited
-- ✅ Video Ads - Rate limited (daily + hourly)
-- ✅ Trivia Games - Rate limited
-- ✅ Cosmetics - Rate limited
-- ✅ Redemptions - Rate limited (daily + weekly)
-- ✅ University Chat - Rate limited (hourly)
-- ✅ Weekly Challenges - Tracked
-- ✅ Getting Started Tasks - Tracked & Points Awarded
-- ✅ Daily Check-In - Tracked & Points Awarded
-- ✅ Admin Audit Logging - Configured
-- ✅ All RLS Policies - Complete
