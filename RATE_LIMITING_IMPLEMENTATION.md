# Rate Limiting Implementation Guide

This document outlines how to integrate rate limiting into each feature of Campus-X-Haske.

## Overview

All rate limiting is controlled by the `feature_limits` table in Supabase. Admins can adjust limits without code changes.

**Key Helper Functions** (in `src/utils/rateLimiter.ts`):
- `checkRateLimit(userId, featureName)` - Verify user can perform action
- `recordRateLimitAction(userId, featureName)` - Record action after completion
- `checkAndNotify(userId, featureName, displayName)` - Check + user-friendly message

---

## 🔴 CRITICAL - NEEDS IMMEDIATE IMPLEMENTATION

### 1. SPIN WHEEL (`SpinWheel.jsx`)
**Feature Names**: `spin_wheel_free`, `spin_wheel_purchase`

```javascript
// In handleSpin() function:
import { checkRateLimit, recordRateLimitAction, checkAndNotify } from '../utils/rateLimiter'

const handleSpin = async (useFreeSpins = true) => {
  if (isSpinning) return

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return

  // CHANGE THIS:
  // OLD: if (useFreeSpins && freeSpin <= 0)
  // NEW:
  const featureName = useFreeSpins ? 'spin_wheel_free' : 'spin_wheel_purchase'
  const { allowed, message } = await checkAndNotify(
    session.user.id,
    featureName,
    'Spin Wheel'
  )
  
  if (!allowed) {
    showAlert({ title: 'Limit Reached', message, type: 'warning' })
    return
  }

  setIsSpinning(true)
  setSpinResult(null)
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // ... spin logic ...
  
  // AFTER SUCCESSFUL SPIN:
  await recordRateLimitAction(session.user.id, featureName)
  setIsSpinning(false)
}
```

**Current Database Limits**:
- Free spins: 3 per day (reset daily)
- Purchased spins: 10 per day max, 30s cooldown

---

### 2. MARKETPLACE ADS (`UserAdsPosting.jsx`)
**Feature Name**: `marketplace_ad_post`

```javascript
const handlePostAd = async () => {
  // Add at start of function:
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return

  const { allowed, message } = await checkAndNotify(
    session.user.id,
    'marketplace_ad_post',
    'Marketplace Posting'
  )
  
  if (!allowed) {
    showAlert({ title: 'Limit Reached', message, type: 'warning' })
    return
  }

  // ... existing validation ...
  
  try {
    // ... insert ad into database ...
    
    // AFTER SUCCESSFUL POST:
    await recordRateLimitAction(session.user.id, 'marketplace_ad_post')
    
    // Clear form and show success
  }
}
```

**Current Database Limits**:
- 5 ads per day max
- 2 hour cooldown between posts
- Max 5 active ads per user

---

### 3. POINT SELLING (`PointMarket.jsx` or equivalent)
**Feature Name**: `point_sell_order`

```javascript
const handleSellPoints = async (amount) => {
  const { data: { session } } = await supabase.auth.getSession()

  const { allowed, message } = await checkAndNotify(
    session.user.id,
    'point_sell_order',
    'Point Selling'
  )
  
  if (!allowed) {
    showAlert({ title: 'Limit Reached', message, type: 'warning' })
    return
  }

  try {
    // Create sell order
    const { error } = await supabase
      .from('point_sell_orders')
      .insert({ user_id: session.user.id, points_amount: amount, ... })

    if (!error) {
      await recordRateLimitAction(session.user.id, 'point_sell_order')
    }
  }
}
```

**Current Database Limits**:
- 50K points per week max
- 1 hour cooldown between orders

---

### 4. REFERRALS (`Referrals.jsx`)
**Feature Name**: `referral_create`

```javascript
const handleShareCode = async () => {
  const { data: { session } } = await supabase.auth.getSession()

  const { allowed, message } = await checkAndNotify(
    session.user.id,
    'referral_create',
    'Referral Sharing'
  )
  
  if (!allowed) {
    showAlert({ title: 'Limit Reached', message, type: 'warning' })
    return
  }

  // Share code... (WhatsApp, Twitter, Email)
  // NOTE: Only record if referral actually completes in backend
}
```

**Current Database Limits**:
- 10 referrals per day max
- Includes IP address for fraud detection

---

### 5. VIDEO ADS (`VideoRewards.jsx` or equivalent)
**Feature Name**: `video_ad_watch`

```javascript
const handleWatchVideoAd = async (videoId) => {
  const { data: { session } } = await supabase.auth.getSession()

  const { allowed, message } = await checkAndNotify(
    session.user.id,
    'video_ad_watch',
    'Video Ads'
  )
  
  if (!allowed) {
    showAlert({ title: 'Limit Reached', message, type: 'warning' })
    return
  }

  // Show video...
  // On completion:
  await recordRateLimitAction(session.user.id, 'video_ad_watch')
  
  // Award points
}
```

**Current Database Limits**:
- 10 per day max
- 2 per hour max
- Prevents duplicate videos (24h cooldown)

---

### 6. TRIVIA GAMES (`Trivia.jsx`)
**Feature Name**: `trivia_game_play`

```javascript
const handleStartGame = async () => {
  const { data: { session } } = await supabase.auth.getSession()

  const { allowed, message } = await checkAndNotify(
    session.user.id,
    'trivia_game_play',
    'Trivia Games'
  )
  
  if (!allowed) {
    showAlert({ title: 'Limit Reached', message, type: 'warning' })
    return
  }

  // Start game...
  // On completion:
  await recordRateLimitAction(session.user.id, 'trivia_game_play')
}
```

**Current Database Limits**:
- 10 per day max
- 5 minute cooldown between games

---

### 7. COSMETICS PURCHASE (`Marketplace.jsx` cosmetics section)
**Feature Name**: `cosmetic_purchase`

```javascript
const handleBuyCosmeticItem = async (cosmeticId) => {
  const { data: { session } } = await supabase.auth.getSession()

  const { allowed, message } = await checkAndNotify(
    session.user.id,
    'cosmetic_purchase',
    'Cosmetic Shopping'
  )
  
  if (!allowed) {
    showAlert({ title: 'Limit Reached', message, type: 'warning' })
    return
  }

  try {
    // Purchase cosmetic...
    await recordRateLimitAction(session.user.id, 'cosmetic_purchase')
  }
}
```

**Current Database Limits**:
- 1 per day max (24 hour cooldown)
- Max 20 items in inventory

---

### 8. REDEMPTIONS (`Rewards.jsx`)
**Feature Name**: `redemption_claim`

```javascript
const handleRedeemReward = async (rewardId) => {
  const { data: { session } } = await supabase.auth.getSession()

  const { allowed, message } = await checkAndNotify(
    session.user.id,
    'redemption_claim',
    'Reward Redemption'
  )
  
  if (!allowed) {
    showAlert({ title: 'Limit Reached', message, type: 'warning' })
    return
  }

  try {
    // Submit redemption...
    await recordRateLimitAction(session.user.id, 'redemption_claim')
  }
}
```

**Current Database Limits**:
- 1 per day max
- 5 per week max
- 24 hour cooldown between claims

---

### 9. UNIVERSITY CHAT (`UniversityChat.jsx`)
**Feature Name**: `university_chat_message`

```javascript
const handleSendMessage = async (message) => {
  const { data: { session } } = await supabase.auth.getSession()

  const { allowed, message: limitMessage } = await checkAndNotify(
    session.user.id,
    'university_chat_message',
    'Chat Messages'
  )
  
  if (!allowed) {
    showAlert({ title: 'Limit Reached', message: limitMessage, type: 'warning' })
    return
  }

  try {
    // Send message...
    await recordRateLimitAction(session.user.id, 'university_chat_message')
  }
}
```

**Current Database Limits**:
- 20 per hour max
- 30 second cooldown between messages

---

### 10. POINT BUYING (from naira)
**Feature Name**: `point_buy_offer`

```javascript
const handleBuyPoints = async (nairaAmount) => {
  const { data: { session } } = await supabase.auth.getSession()

  const { allowed, message } = await checkAndNotify(
    session.user.id,
    'point_buy_offer',
    'Point Purchases'
  )
  
  if (!allowed) {
    showAlert({ title: 'Limit Reached', message, type: 'warning' })
    return
  }

  // Process payment...
  await recordRateLimitAction(session.user.id, 'point_buy_offer')
}
```

**Current Database Limits**:
- 10K points per day max
- 50K points per week max

---

## 🟡 MEDIUM PRIORITY

### Admin Features
**Feature Name**: `admin_action`

All admin actions should log to audit trail:

```javascript
import { logAdminAction } from '../utils/rateLimiter'

// After approving an ad:
await logAdminAction(
  'approve_ad',
  adData.user_id,
  adData.id,
  'user_ad',
  { title: adData.title, reason: 'Approved' }
)

// After rejecting a redemption:
await logAdminAction(
  'reject_redemption',
  redemption.user_id,
  redemption.id,
  'redemption',
  { reason: 'Invalid phone number' }
)
```

---

## Configuration in Database

All limits are configured in the `feature_limits` table:

```sql
-- View current limits:
SELECT feature_name, daily_limit, weekly_limit, hourly_limit, cooldown_seconds 
FROM feature_limits;

-- Update a limit (admin only):
UPDATE feature_limits 
SET daily_limit = 15 
WHERE feature_name = 'spin_wheel_purchase';

-- Add new feature:
INSERT INTO feature_limits (feature_name, daily_limit, cooldown_seconds, enabled)
VALUES ('new_feature', 5, 60, true);
```

---

## Testing

```javascript
// Test rate limiting:
import { checkRateLimit, recordRateLimitAction } from '../utils/rateLimiter'

// Check without action:
const result = await checkRateLimit(userId, 'spin_wheel_purchase')
console.log(result) // { allowed: true, dailyLimit: 10, ... }

// Record action:
await recordRateLimitAction(userId, 'spin_wheel_purchase')

// Check again (should show usage):
const result2 = await checkRateLimit(userId, 'spin_wheel_purchase')
console.log(result2) // { allowed: true, currentDailyCount: 1, dailyLimit: 10, ... }

// Hit the limit:
for (let i = 0; i < 10; i++) {
  await recordRateLimitAction(userId, 'spin_wheel_purchase')
}

// Check again (should be blocked):
const result3 = await checkRateLimit(userId, 'spin_wheel_purchase')
console.log(result3) // { allowed: false, reason: 'Daily limit exceeded...' }
```

---

## Monitoring

**Admin Dashboard Features to Add:**

1. **Rate Limits Page**
   - View/edit all feature limits
   - Enable/disable features
   - Set cooldowns

2. **Audit Log Viewer**
   - View all admin actions
   - Filter by admin, action type, date
   - Search by user or resource

3. **User Activity Dashboard**
   - See user's feature usage
   - View rate limit status
   - Identify abuse patterns

---

## Migration Path

1. **Phase 1 (IMMEDIATE)**: Implement on Spin Wheel - highest abuse risk
2. **Phase 2 (WEEK 1)**: Marketplace Ads, Point Selling, Referrals
3. **Phase 3 (WEEK 2)**: Video Ads, Trivia, Cosmetics
4. **Phase 4 (WEEK 3)**: Redemptions, Chat, Admin Logging

---

## API Reference

### checkRateLimit(userId, featureName)
Returns: `{ allowed: boolean, reason?: string, currentDailyCount?: number, dailyLimit?: number, ... }`

### recordRateLimitAction(userId, featureName)
Returns: `{ success: boolean, countToday: number, countThisWeek: number, cooldownUntil?: string }`

### checkAndNotify(userId, featureName, displayName)
Returns: `{ allowed: boolean, message?: string }`

### logAdminAction(actionType, targetUserId, targetResourceId, resourceType, details)
Returns: Audit log entry with timestamp and IP

---

## Common Issues

**Q: Feature limit not working?**
A: Ensure feature exists in `feature_limits` table and `enabled = true`

**Q: Need to adjust limits?**
A: Update the `feature_limits` table directly - no code changes needed

**Q: How to reset user limits?**
A: Update the user record with `count_today = 0` in `rate_limits` table

**Q: Audit logs not showing?**
A: Ensure user calling `logAdminAction` has `is_admin = true`
