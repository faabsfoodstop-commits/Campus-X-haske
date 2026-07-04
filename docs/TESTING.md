# 🧪 HASKii Testing Guide

Complete testing guide for all HASKii features (Phases 1-6).

## Prerequisites

- Dev server running: `npm run dev`
- Supabase project set up
- Database schema created
- Can access http://localhost:5173

## User Flow 1: Signup & Authentication

**Testing**:
1. Go to http://localhost:5173
2. Click "Sign Up"
3. Enter:
   - Email: `tester@example.com`
   - Password: `TestPass123`
   - Full Name: `John Doe`
4. Click "Sign Up" button

**Expected**:
- ✅ User account created in `users` table
- ✅ Redirected to Profile setup page
- ✅ Email verified (Supabase)

## User Flow 2: Profile Setup

**Testing**:
1. On Profile page, enter:
   - Full Name: `John Doe`
   - University: `University of Lagos`
   - Department: `Computer Science`
   - Course: `200L`
2. Click "Continue to Dashboard"

**Expected**:
- ✅ Profile data saved
- ✅ `profile_complete: true` set
- ✅ Redirected to Dashboard
- ✅ Sees balance cards

**What triggers**: Getting Started task "Complete Your Profile" will detect this and auto-award 100 points.

---

## Feature 1: Daily Check-In (Phase 2)

### Test Case: First Check-In

**Testing**:
1. On Dashboard, click "Check-In" button
2. See:
   - Base Points: +10
   - Streak Bonus: +0 (no streak yet)
   - Total: +10
3. Click "Check In Now"

**Expected**:
- ✅ +10 points awarded
- ✅ `streak_check_ins` record created
- ✅ Transaction logged
- ✅ Activity logged
- ✅ Toast: "+10 points! Streak: 1"
- ✅ Dashboard updates to show new balance

**Database check**:
```sql
-- Verify in Supabase
SELECT * FROM streak_check_ins WHERE user_id = 'YOUR_USER_ID';
SELECT * FROM transactions WHERE type = 'daily_check_in' LIMIT 1;
```

### Test Case: Duplicate Check-In (Same Day)

**Testing**:
1. Try to check-in again immediately
2. Click "Check In Now" button again

**Expected**:
- ✅ Error: "Already checked in today!"
- ✅ UNIQUE constraint prevents duplicate
- ✅ No points awarded
- ✅ Toast shows warning

---

## Feature 2: Getting Started Tasks (Phase 3)

### Test Case: Auto-Detection

**Testing**:
1. On Dashboard, see "Getting Started" progress widget
2. Should show ~25-50% progress (profile complete)
3. Click "View Tasks"

**Expected**:
- ✅ See 4 tasks
- ✅ "Complete Your Profile" = ✓ Done (100 pts)
- ✅ "Daily Check-In" = ✓ Done (50 pts)
- ✅ Other tasks = Locked
- ✅ Progress bar shows 50%

### Test Case: Manual Task Completion

**Testing**:
1. On Getting Started page
2. On "View Activity Log" task, click "Visit"
3. Gets redirected to Activity Log page

**Expected**:
- ✅ Activity Log page opens
- ✅ Come back to Getting Started
- ✅ Task shows ✓ Done
- ✅ +25 points awarded
- ✅ Progress updated to 75%

---

## Feature 3: Daily Missions (Phase 4)

### Test Case: Complete Mission

**Testing**:
1. On Dashboard, click "Missions"
2. See 5 mission cards:
   - Trivia Challenge (20 pts, 1/day)
   - Instagram Follow (50 pts, 1/day)
   - Invite Friend (100 pts, 3/day)
   - Quick Survey (15 pts, 1/day)
   - Sponsored App (75 pts, 1/day)
3. Click "Complete" on "Trivia Challenge"

**Expected**:
- ✅ +20 points awarded
- ✅ Toast: "+20 points"
- ✅ Combo count increases to 1
- ✅ Mission marked as completed today

### Test Case: Combo Bonus

**Testing**:
1. Complete 2 more missions (Instagram Follow, Quick Survey)
2. On 3rd completion, check points awarded

**Expected**:
- ✅ 1st mission: +20 points (no bonus)
- ✅ 2nd mission: +50 points (no bonus)
- ✅ 3rd mission: +22 points (15 × 1.5 = 22.5 rounded)
- ✅ Toast: "+22 points 🔥 COMBO BONUS!"
- ✅ Combo count shows "🔥 1"

### Test Case: Daily Limit

**Testing**:
1. Complete "Invite Friend" mission 3 times
2. Try to complete 4th time

**Expected**:
- ✅ All 3 show completed
- ✅ Button shows "Limit Reached" on 4th attempt
- ✅ Toast: "Daily limit reached for Invite Friend"

---

## Feature 4: Video Ads (Phase 4)

### Test Case: Watch Ad

**Testing**:
1. On Dashboard, click "Ads"
2. See 5 video ads with thumbnails
3. Click "Watch Now" on first ad (VPN App Pro, 30s)

**Expected**:
- ✅ Modal opens with video player
- ✅ Countdown timer shows "30s"
- ✅ Instruction: "Watch entire video to earn +5 points"
- ✅ Progress bar fills as timer counts down
- ✅ Modal closes automatically at 0s
- ✅ +5 points awarded
- ✅ Toast: "+5 points for watching!"

### Test Case: Cannot Watch Same Ad Twice

**Testing**:
1. Try to click "Watch Now" on same ad again

**Expected**:
- ✅ Button shows "✓ Watched"
- ✅ Cannot click
- ✅ Toast: "Already watched this ad today"

### Test Case: Watch Multiple Ads

**Testing**:
1. Watch 2 more ads (e.g., Game and Fitness)
2. Check points

**Expected**:
- ✅ Each ad awards its points (3, 5, 7)
- ✅ Total: 5 + 3 + 5 = 13 points
- ✅ Can watch all 5 ads in a day
- ✅ Page shows "All ads watched!" when done

---

## Feature 5: Referrals (Phase 6)

### Test Case: Generate & Share Code

**Testing**:
1. On Dashboard, click "Referrals"
2. See your referral code (e.g., "AB12XYZ")
3. Click "Copy" button

**Expected**:
- ✅ Code copied to clipboard
- ✅ Toast: "Referral code copied!"
- ✅ Button changes to "✓ Copied" briefly
- ✅ Can paste code elsewhere

### Test Case: Share Links

**Testing**:
1. Click "Copy Share Link"
2. Paste in text editor

**Expected**:
- ✅ Full URL copied: `http://localhost:5173?ref=AB12XYZ`
- ✅ Can share on social media

### Test Case: Referral Tracking

**Testing**:
1. Check referrals section
2. See summary cards:
   - Total Earned: 0 (no successful referrals yet)
   - Successful: 0
   - Pending: 0

**Expected**:
- ✅ Summary displays correctly
- ✅ Referral list shows when available

---

## Feature 6: Leaderboards (Phase 6)

### Test Case: View Rankings

**Testing**:
1. On Dashboard, click "Rankings"
2. See leaderboard

**Expected**:
- ✅ Top 50 users displayed
- ✅ Medal icons (🥇🥈🥉) for top 3
- ✅ Your rank card at top
- ✅ Shows: Rank, Name, University, Points, Streak
- ✅ You're ranked high (you have lots of points from testing!)

### Test Case: User Card Display

**Testing**:
1. Look at your user card on leaderboard
2. Check if it's highlighted

**Expected**:
- ✅ Your card has purple border
- ✅ Shows "(You)" after name
- ✅ Different styling to stand out

---

## Feature 7: Achievements (Phase 6)

### Test Case: Unlock Achievements

**Testing**:
1. On Dashboard, click "Badges"
2. See 8 achievement cards

**Expected**:
- ✅ Some achievements unlocked (green cards):
  - "First Steps" ✅ (did first check-in)
  - "Mission Possible" ✅ (did first mission)
  - "First Prize" ✅ (if you redeemed)
- ✅ Some locked (gray cards):
  - "7-Day Warrior" (need 7-day streak)
  - "30-Day Grinder" (need 30-day streak)

### Test Case: Progress Tracking

**Testing**:
1. Check progress bar at top
2. Check bonus points earned

**Expected**:
- ✅ Shows: X / 8 achievements
- ✅ Progress percentage (25%, 50%, etc)
- ✅ Bonus points earned (e.g., +400 points)

### Test Case: Filtering

**Testing**:
1. Click filter buttons (Engagement, Missions, Social, etc)
2. View filtered achievements

**Expected**:
- ✅ Only selected category achievements show
- ✅ Count updates
- ✅ "All" shows everything again

---

## Feature 8: Rewards & Redemption (Phase 5)

### Test Case: View Rewards

**Testing**:
1. On Dashboard, click "Rewards"
2. See 7 rewards:
   - MTN ₦500 (500 pts)
   - MTN ₦1000 (1000 pts)
   - MTN ₦2000 (2000 pts, "Best Value")
   - Airtel 1GB (800 pts)
   - Airtel 2GB (1500 pts, "Popular")
   - Amazon ₦1k (1200 pts)
   - Amazon ₦5k (6000 pts)

**Expected**:
- ✅ All 7 rewards displayed
- ✅ Badges show ("Popular", "Best Value")
- ✅ Cost in points shown

### Test Case: Filter Rewards

**Testing**:
1. Click category buttons (Airtime, Data, Gift Cards)
2. View filtered rewards

**Expected**:
- ✅ Only selected category shows
- ✅ Counts update
- ✅ "All Rewards" shows everything

### Test Case: Redeem Reward

**Testing**:
1. Click "Redeem" on MTN ₦500 (if you have 500+ points)

**Expected**:
- ✅ Points deducted from balance
- ✅ Redemption record created (status: pending)
- ✅ Toast: "✅ Redemption request submitted!"
- ✅ Redirected to dashboard
- ✅ Balance updated

### Test Case: View Redemption History

**Testing**:
1. Click "History" on Dashboard
2. See redemptions

**Expected**:
- ✅ Your redemption shows
- ✅ Status: "⏳ Pending"
- ✅ Points spent shown
- ✅ Timestamp displayed
- ✅ Summary shows: Total Redeemed, Completed, Pending

### Test Case: Insufficient Points

**Testing**:
1. Click "Redeem" on reward with cost > your points

**Expected**:
- ✅ Button disabled (gray)
- ✅ Toast: "You need X more points"

---

## Feature 9: Wallet (Phase 2)

### Test Case: Convert Points to Wallet

**Testing**:
1. On Dashboard, click "Wallet"
2. Enter amount: 100
3. Click "Convert to Wallet"

**Expected**:
- ✅ Points deducted: -100
- ✅ Wallet increased: +100
- ✅ Rate shown: 1 Point = ₦1
- ✅ Transaction logged
- ✅ Balance cards updated

---

## Feature 10: Activity Log (Phase 2)

### Test Case: View Activities

**Testing**:
1. On Dashboard, click "Activity"
2. See all your actions

**Expected**:
- ✅ Most recent first
- ✅ Shows:
  - 📅 Daily check-in
  - ✅ Missions completed
  - ▶️ Ads watched
  - 💸 Points converted/spent
- ✅ Relative timestamps (5m ago, 2h ago, etc)
- ✅ Icons for quick scanning

---

## Feature 11: Transaction Ledger (Phase 2)

### Test Case: View All Transactions

**Testing**:
1. On Dashboard, click "Ledger"
2. See all point movements

**Expected**:
- ✅ Shows: Date, Type, Amount, Description
- ✅ Green for earnings (+)
- ✅ Red for spending (-)
- ✅ Sortable/filterable

### Test Case: Filter Transactions

**Testing**:
1. Click filter buttons
2. View by type

**Expected**:
- ✅ Shows only selected type
- ✅ Count updates
- ✅ "All" shows everything

---

## 🔄 Complete User Journey (End-to-End)

**Full flow to test everything at once**:

1. **Signup** (Flow 1)
   - Create account
   - Complete profile

2. **Get Started** (Feature 2)
   - View getting started tasks
   - See tasks auto-detect completion
   - Get bonus points

3. **Daily Loop** (Features 3 & 4)
   - Do daily check-in (+10 pts)
   - Complete 3 missions with combo (+20, +50, +22.5 pts)
   - Watch 2 ads (+5, +3 pts)
   - Total earned: ~110 points

4. **Social** (Feature 6)
   - View referral code
   - Check leaderboard ranking
   - View achievements

5. **Spend** (Features 8 & 9)
   - Redeem a small reward (costs 500-1000 pts)
   - Convert remaining points to wallet

6. **Track** (Features 10 & 11)
   - View activity log
   - Check transaction ledger
   - Verify all actions logged

**Expected**: All features work, data persists in Supabase, no errors.

---

## 📊 Data Verification

**Check Supabase SQL to verify data**:

```sql
-- Check user profile
SELECT id, email, full_name, university, points, current_streak, profile_complete 
FROM users LIMIT 1;

-- Check check-in record
SELECT * FROM streak_check_ins 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC LIMIT 1;

-- Check missions completed
SELECT * FROM daily_missions 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC LIMIT 5;

-- Check all transactions
SELECT type, amount, description, created_at 
FROM transactions 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC LIMIT 20;

-- Check activity log
SELECT action, description, created_at 
FROM activity_log 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC LIMIT 20;
```

---

## ✅ Testing Checklist

- [ ] Signup & Login work
- [ ] Profile setup works
- [ ] Daily check-in awards points
- [ ] Can't check-in twice same day
- [ ] Getting started tasks auto-award
- [ ] Missions complete and award points
- [ ] Combo bonus works (3rd = 50% extra)
- [ ] Video ads play and award points
- [ ] Can't watch same ad twice
- [ ] Referral code generates
- [ ] Leaderboard shows rankings
- [ ] Achievements detect and unlock
- [ ] Rewards display and filter
- [ ] Redemption creates order
- [ ] Wallet conversion works
- [ ] Activity log shows all actions
- [ ] Transaction ledger tracks all points
- [ ] All data persists in Supabase

---

**All tests passing? 🎉 HASKii is working perfectly!**
