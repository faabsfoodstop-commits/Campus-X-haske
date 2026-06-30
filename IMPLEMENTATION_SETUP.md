# Campus X Haske - Feature Implementation Setup Guide

## Overview
This document provides step-by-step setup instructions for all incomplete features now connected to Cloud Functions and payment gateways.

---

## 🔐 PAYMENT GATEWAYS SETUP

### 1. Paystack Configuration
**For: Buy Points, Premium Subscription, Payment Processing**

```bash
# Get keys from https://dashboard.paystack.com/settings/developer

# Add to .env:
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
VITE_PAYSTACK_SECRET_KEY=sk_test_xxxxx
```

**What it does:**
- Handles point purchases
- Processes premium subscriptions
- Verifies payments before crediting accounts

**Integration Points:**
- `BuyPoints.jsx`: Uses Paystack popup for payment collection
- `PremiumTier.jsx`: Uses Paystack for ₦999/month subscription
- `functions/src/index.js`: `verifyPaystackPayment()` Cloud Function

---

### 2. Flutterwave Configuration
**For: Airtime/Data Redemption, Withdrawals**

```bash
# Get keys from https://dashboard.flutterwave.com/settings/

# Add to .env (frontend):
VITE_FLUTTERWAVE_PUBLIC_KEY=your_public_key

# Add to functions/.env (backend):
FLUTTERWAVE_SECRET_KEY=your_secret_key
```

**What it does:**
- Sends airtime to phone numbers (MTN, Airtel, Glo)
- Processes mobile data purchases
- Handles bank transfers for withdrawals

**Integration Points:**
- `Rewards.jsx`: Redemption requests
- `Wallet.jsx`: Withdrawal processing
- `functions/src/index.js`: `adminProcessRedemption()`, `adminProcessWithdrawal()`

---

## ☁️ CLOUD FUNCTIONS SETUP

### Installation

```bash
# Install Firebase CLI if not already done
npm install -g firebase-tools

# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Deploy functions
firebase deploy --only functions
```

### Available Functions

| Function | Purpose | Called From |
|----------|---------|-------------|
| `verifyPaystackPayment()` | Verify payment with Paystack | BuyPoints.jsx |
| `creditPointsAfterPayment()` | Award points after payment | BuyPoints.jsx |
| `activatePremium()` | Activate premium subscription | PremiumTier.jsx |
| `processRedemption()` | Create redemption request | Rewards.jsx |
| `adminProcessRedemption()` | Process and send airtime (Admin only) | AdminRedemptions.jsx |
| `requestWithdrawal()` | Create withdrawal request | Wallet.jsx |
| `adminProcessWithdrawal()` | Process bank transfer (Admin only) | Admin Dashboard |
| `completeTask()` | Award points for task completion | All earning pages |
| `transferPoints()` | Transfer points between users | PointMarket.jsx |
| `handleReferralSignup()` | Award referral bonus | (Firestore trigger) |
| `dailyReset()` | Clear daily mission flags | (Scheduled - midnight) |
| `weeklyReset()` | Award weekly challenge bonuses | (Scheduled - Monday 00:00) |

---

## 💰 FEATURE-BY-FEATURE SETUP

### BUY POINTS
**Status**: ✅ Ready to implement
**New Flow**:
1. User selects package
2. Paystack payment popup appears
3. User completes payment
4. `verifyPaystackPayment()` function called
5. `creditPointsAfterPayment()` awards points
6. Transaction logged

**What Users See**:
- Package options (5K, 10K, 25K, 50K points)
- Paystack popup for payment
- Success message with points credited

**What Admins See**: (via Dashboard)
- Payment history
- User spending
- Revenue analytics

---

### REDEMPTION (Airtime/Data)
**Status**: ✅ Ready to implement
**New Flow**:
1. User selects reward (airtime/data amount)
2. User enters phone number
3. `processRedemption()` function creates request
4. Points deducted from user
5. Admin reviews in AdminRedemptions page
6. Admin clicks "Approve"
7. `adminProcessRedemption()` calls Flutterwave API
8. Airtime sent to phone
9. Redemption marked "completed"
10. User notified via toast

**What Users See**:
- Reward options with point costs
- Phone number input (validated)
- List of past redemption requests
- Status: Pending / Completed / Rejected

**What Admins See**:
- Queue of pending redemptions
- Phone number for verification
- Approve/Reject buttons
- Flutterwave status
- Success/Failure logs

---

### PREMIUM SUBSCRIPTION
**Status**: ✅ Ready to implement
**New Flow**:
1. User clicks "Subscribe" on PremiumTier
2. Paystack payment for ₦999
3. Payment verified
4. `activatePremium()` sets premiumActive = true
5. premiumUntil = 30 days from now
6. User gets 2x points multiplier
7. Auto-renewal ready (admin schedules monthly)

**What Users See**:
- Benefits showcase
- Subscribe button
- Countdown to expiry
- 2x points indicator on earning pages

**What Admins See**:
- Active subscriptions
- Expiring soon notifications
- Revenue from subscriptions
- Renewal tracking

---

### WALLET WITHDRAWALS
**Status**: ✅ Ready to implement
**New Flow**:
1. User goes to Wallet
2. Clicks "Withdraw"
3. If no bank details: prompts to enter
4. Enters withdrawal amount
5. `requestWithdrawal()` creates request
6. Withdrawal shown as "pending"
7. Admin reviews in Admin panel
8. Admin clicks "Approve"
9. `adminProcessWithdrawal()` calls Flutterwave
10. Money transferred to bank account
11. User notified "Withdrawal processing"

**What Users See**:
- Current wallet balance
- Bank details management
- Withdrawal history
- Status tracking (Pending / Approved / Rejected)

**What Admins See**:
- Queue of withdrawal requests
- Bank details for verification
- Approve/Reject buttons
- Flutterwave transfer confirmation
- Audit trail

---

### VIDEO ADS REWARDS
**Status**: ✅ Ready to implement
**New Logic**:
1. User watches video (30-60 seconds)
2. Clicks "Claim Reward" when complete
3. `completeTask()` function called with taskType="video_ad"
4. Function checks if completed today
5. If premium: 2x points awarded
6. Transaction logged
7. User sees success message

**Enhanced Features**:
- Daily limit: max 5 videos/day
- Cooldown: 2-minute wait between videos
- Points: 250-500 per video
- Premium bonus: 2x multiplier

---

### SPIN WHEEL REWARDS
**Status**: ✅ Ready to implement
**New Logic**:
1. User clicks spin (if free spins available)
2. Wheel animates
3. When stopped, calls `completeTask()` with result
4. Points checked and deducted for premium multiplier
5. Transaction created with reference to spin
6. Reward added to wallet

**Enhanced Features**:
- Free spins: 2 per day
- Buy more spins: 50 points = 1 spin
- Cooldown: 30 seconds between spins
- Fraud prevention: transaction-based tracking

---

### TRIVIA REWARDS
**Status**: ✅ Ready to implement
**New Logic**:
1. User answers question
2. Answer validated (already coded)
3. If correct, calls `completeTask()`
4. Points awarded based on difficulty
5. Streak tracking (consecutive correct answers)
6. Daily limit: max 20 questions/day

**Enhanced Features**:
- Point multiplier: +50% for streak of 5+
- Difficulty levels: Easy (100pts), Medium (200pts), Hard (300pts)
- Timed questions (optional)
- Leaderboard tracking

---

### COSMETICS SHOP
**Status**: ✅ Ready to implement
**New Logic**:
1. User selects cosmetic (frame/badge/title)
2. Clicks "Purchase"
3. System deducts points
4. Cosmetic added to user.cosmeticsPurchased array
5. User can "equip" one cosmetic per category
6. Cosmetic displays on:
   - User profile
   - Leaderboard (next to name)
   - Public profiles
   - Chat messages (badge)

**Database Structure**:
```firestore
users/{userId}
├── cosmeticsPurchased: [
│   ├── "frame_gold",
│   ├── "badge_og",
│   └── "title_grinder"
│   ]
├── activeCosmetics: {
│   ├── frame: "frame_gold",
│   ├── badge: "badge_og",
│   └── title: "title_grinder"
│   }
```

---

### POINT MARKET (Trading)
**Status**: ✅ Ready to implement
**New Logic**:
1. User A wants to sell points to User B
2. User A creates offer: "Sell 1000 points for ₦500"
3. User B can accept offer
4. `transferPoints()` function executes
5. User A loses 1000 points
6. User B gains 1000 points
7. Transaction logged for both

**Features**:
- Peer-to-peer trading
- Seller/Buyer matching
- Historical trades
- Price discovery (market rates)

---

### SELL POINTS
**Status**: ✅ Ready to implement
**New Logic**:
1. User selects amount to sell
2. Exchange rate: 100 points = ₦1 (configurable)
3. User review window
4. Admin approval required (anti-fraud)
5. Points converted to wallet cash
6. Transaction logged

**Features**:
- Minimum: 1,000 points
- Daily limit: 10,000 points max
- Conversion rate: 100 points = ₦1
- Instant approval (or admin queue)

---

### INSTAGRAM FOLLOW VERIFICATION
**Status**: ⚠️ Requires Instagram API setup
**New Logic**:
1. User clicks "Follow Campus X"
2. Opens Instagram link
3. User follows @campusx.haske
4. Returns to app
5. Calls Instagram Basic Display API to verify follow
6. If verified: awards 250 points
7. If not: shows error "Follow first then retry"

**Setup Required**:
```bash
# Get Instagram Basic Display access token from:
# https://developers.facebook.com/docs/instagram-basic-display

# Add to Cloud Function for Instagram verification
```

---

### DAILY MISSIONS
**Status**: ✅ Ready to implement
**New Logic**:
1. System creates daily missions (6 tasks)
2. User completes missions
3. Each completion calls `completeTask()`
4. Points awarded per mission
5. Daily bonus: complete all 6 = +500 bonus points
6. Missions reset at midnight
7. Daily stats tracked

**Missions Examples**:
- Watch 2 videos (500 pts)
- Complete 1 trivia (300 pts)
- Spin wheel once (250 pts)
- Invite 1 friend (400 pts)
- Complete 1 profile field (250 pts)
- Earn 1000 points (daily total) (300 pts)

---

### WEEKLY CHALLENGES
**Status**: ✅ Ready to implement
**New Logic**:
1. System creates weekly challenges (Monday-Sunday)
2. Users accumulate points during week
3. Leaderboard updates in real-time
4. Top 3 users get bonuses:
   - 1st place: 1000 points
   - 2nd place: 750 points
   - 3rd place: 500 points
5. `weeklyReset()` function awards bonuses
6. New week starts fresh

**Features**:
- Weekly point tracking
- University-based leaderboards
- Real-time rankings
- Bonus notifications
- Archive of past weeks

---

### REFERRAL SYSTEM
**Status**: ✅ Ready to implement
**New Logic**:
1. User gets unique referral code (auto-generated)
2. User shares code with friends
3. Friend signs up using code
4. `handleReferralSignup()` Firestore trigger fires
5. Referrer gets 500 points bonus
6. Referee gets 250 points welcome bonus
7. Referral tracked in database

**Features**:
- Unique code per user
- Referral history
- Total referrals count
- Bonus tracking
- Shareable link

---

### SPONSORED MISSIONS
**Status**: ✅ Ready to implement
**Integration**:
- Same as regular missions
- Brand pays platform fee
- Users complete for points
- Revenue: 60% to users, 40% to platform

---

## 🎯 IMPLEMENTATION CHECKLIST

### Step 1: Setup APIs
- [ ] Paystack account created
- [ ] Paystack keys in .env
- [ ] Flutterwave account created
- [ ] Flutterwave keys in functions/.env
- [ ] Firebase project selected
- [ ] Cloud Functions deployed

### Step 2: Update Pages
- [ ] BuyPoints.jsx - integrated with Cloud Functions
- [ ] PremiumTier.jsx - payment integration
- [ ] Rewards.jsx - redemption requests
- [ ] Wallet.jsx - withdrawal requests
- [ ] VideoAds.jsx - task completion integration
- [ ] SpinWheel.jsx - task completion integration
- [ ] Trivia.jsx - task completion integration
- [ ] CosmeticsShop.jsx - cosmetics equipping
- [ ] PointMarket.jsx - point transfers
- [ ] SellPoints.jsx - point-to-cash conversion
- [ ] DailyMissions.jsx - mission tracking
- [ ] WeeklyChallenges.jsx - leaderboard updates
- [ ] Referrals.jsx - referral code sharing

### Step 3: Admin Panels
- [ ] AdminRedemptions.jsx - approve/reject airtime requests
- [ ] AdminWithdrawals.jsx (NEW) - manage withdrawal requests
- [ ] AdminRevenueAnalytics.jsx (NEW) - revenue dashboard

### Step 4: Testing
- [ ] Test point purchase flow
- [ ] Test premium subscription
- [ ] Test redemption request → approval → airtime sent
- [ ] Test withdrawal request → approval → bank transfer
- [ ] Test task completion & rewards
- [ ] Test point transfers
- [ ] Test referral signup bonus

### Step 5: Monitoring
- [ ] Setup Firebase Firestore backup
- [ ] Enable Firebase Cloud Functions logging
- [ ] Setup error alerts
- [ ] Monitor Paystack/Flutterwave integration
- [ ] Daily revenue reporting

---

## 🛠️ USEFUL COMMANDS

```bash
# Deploy Cloud Functions
firebase deploy --only functions

# View logs
firebase functions:log

# Local testing
firebase emulators:start --only functions

# View Firestore
firebase firestore:delete --recursive /users

# Backup Firestore
firebase firestore:export gs://your-bucket-name/backup

```

---

## 💡 IMPORTANT NOTES

1. **Security**:
   - Never expose secret keys in frontend code
   - All sensitive operations in Cloud Functions
   - Use Firestore security rules to prevent unauthorized access
   - Validate all user inputs

2. **Testing**:
   - Use Paystack test keys first (pk_test_*, sk_test_*)
   - Use Flutterwave test credentials
   - Test with test phone numbers

3. **Monitoring**:
   - Track all payment transactions
   - Monitor Firestore read/write quota
   - Setup alerts for failed operations
   - Audit trail for withdrawals/redemptions

4. **User Experience**:
   - Show clear loading states during payment
   - Provide transaction IDs to users
   - Send confirmation emails
   - Handle errors gracefully

---

## 📞 SUPPORT

If you encounter issues:
1. Check Cloud Functions logs: `firebase functions:log`
2. Verify API keys are correct
3. Ensure Firestore collections exist
4. Check browser console for errors
5. Review function payload structure

---

## 🚀 NEXT STEPS

1. Setup Paystack and Flutterwave accounts
2. Deploy Cloud Functions
3. Update frontend pages systematically
4. Test each feature end-to-end
5. Setup admin dashboards
6. Monitor and optimize
