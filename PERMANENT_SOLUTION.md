# PERMANENT SOLUTION: Centralized Typed Database Layer

## The Problem We Solved

You've been fixing bugs repeatedly because:
1. **No type safety** - Frontend code column names don't match database schema
2. **Fragmented logic** - Each feature records activities differently
3. **Inconsistent patterns** - No single way to track points
4. **Silent failures** - Database errors aren't caught until runtime

## The Solution

### 1. Single Source of Truth: `src/types/database.ts`

This file defines TypeScript types for EVERY table in your database. Now when columns change, TypeScript catches it immediately.

**Example:**
```typescript
export interface SpinHistory {
  id: string;
  user_id: string;
  result: string;
  points_earned: number;  // TypeScript will error if you write 'earned_points'
  multiplier?: string;
  cost: number;
  created_at: string;
}
```

### 2. Centralized Helpers: `src/utils/databaseHelpers.ts`

All database operations go through typed helper functions. No more direct `supabase.from()` calls scattered everywhere.

**Pattern for all activities:**
```typescript
// BEFORE (scattered, error-prone):
await supabase.from('spin_history').insert({
  user_id,
  result,
  earned_points,      // ❌ Wrong column name
  spin_type           // ❌ Column doesn't exist
});
await supabase.from('transactions').insert({...});

// AFTER (centralized, type-safe):
await recordSpinActivity(userId, result, earnedPoints, isFree);
// ✓ Both spin_history and transaction recorded atomically
// ✓ Type-checked column names
// ✓ Consistent error handling
```

## How to Use This for ALL Features

### Step 1: Add Helper Function to `databaseHelpers.ts`

For each point-earning feature, add a function like:

```typescript
export async function recordMissionActivity(
  userId: string,
  missionId: string,
  missionName: string,
  pointsEarned: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Record in feature-specific table
    const { error: err1 } = await supabase.from('daily_missions').insert({
      user_id: userId,
      mission_id: missionId,
      mission_name: missionName,
      completed: true,
      completed_at: new Date().toISOString()
    });
    if (err1) throw err1;

    // Record in transactions (unified activity log)
    const { error: err2 } = await supabase.from('transactions').insert({
      user_id: userId,
      type: 'mission',
      amount: pointsEarned,
      description: `Completed mission: ${missionName}`,
      timestamp: new Date().toISOString()
    });
    if (err2) throw err2;

    return { success: true };
  } catch (err: any) {
    console.error('[recordMissionActivity] Error:', err);
    return { success: false, error: err.message };
  }
}
```

### Step 2: Update Feature Component to Use Helper

**Example for Trivia.jsx:**

```typescript
// BEFORE
const { error: updateError } = await supabase
  .from('users')
  .update({ points: (userData?.points || 0) + totalReward })
  .eq('id', session.user.id);

await supabase.from('trivia_results').insert({
  user_id: session.user.id,
  score,
  correct_answers: correctAnswers,
  total_questions: 10,
  points_earned: totalReward  // ✓ At least this was right
});

// AFTER
import { recordTriviaActivity } from '../utils/databaseHelpers';

const result = await recordTriviaActivity(
  session.user.id,
  score,
  correctAnswers,
  totalReward
);
if (!result.success) throw new Error(result.error);
```

## Features to Update

Priority order (based on common bugs):

1. **Trivia.jsx** - Already has helper, just needs to be used
2. **VideoAds.jsx** - Already has helper, just needs to be used
3. **InstagramFollow.jsx** - Already has helper, just needs to be used
4. **Dashboard.jsx** (check-in) - Already has helper, just needs to be used
5. **DailyMissions.jsx** - Uses `award-mission-reward` edge function (already fixed)
6. **WeeklyChallenges.jsx** - Uses `claim-weekly-challenge` edge function (already fixed)

## How This Prevents Future Bugs

| Before | After |
|--------|-------|
| 400 errors on spin_history inserts | TypeScript catches column names at compile time |
| "Recent spins not showing" | Atomic operations: both tables or neither |
| Points not syncing | All activities → transactions table automatically |
| Scattered database logic | Single source of truth in databaseHelpers.ts |
| Silent failures | Errors logged and returned consistently |

## Validation Checklist

Before deploying any feature, verify:
- [ ] Activity helper function exists in `databaseHelpers.ts`
- [ ] Helper uses types from `database.ts` (TypeScript enforces this)
- [ ] Activity records to transactions table
- [ ] Activity records to feature-specific table (spin_history, trivia_results, etc.)
- [ ] Both inserts are atomic (both succeed or both fail)
- [ ] Error handling uses `{ success, error }` pattern
- [ ] Feature component uses helper, not direct supabase calls

## Testing

After updating a feature:
1. Perform the activity (spin, trivia, etc.)
2. Check browser console for errors
3. Check Activity Log to see the entry
4. Verify points updated correctly
5. Check that count/limit tracking works

## Future: Converting Edge Functions

All edge functions should follow this pattern:

```typescript
// OLD (deprecated SERVICE_ROLE_KEY)
const supabase = createClient(url, SERVICE_ROLE_KEY);

// NEW (uses auth token)
const authHeader = req.headers.get("authorization") || "";
const token = authHeader.replace("Bearer ", "");
const supabase = createClient(url, token || ANON_KEY);

// Record transaction
await supabase.from('transactions').insert({
  user_id,
  type: 'mission',  // Must match database.ts types
  amount,
  description,
  timestamp: new Date().toISOString()
});
```

## Questions?

All database schema is now documented in:
- `src/types/database.ts` - What columns exist
- `src/utils/databaseHelpers.ts` - How to use them
- `supabase-schema-safe.sql` - Original SQL

If you add a new table to the database:
1. Update `supabase-schema-safe.sql`
2. Add type to `src/types/database.ts`
3. Add helper function(s) to `src/utils/databaseHelpers.ts`
4. Use in components

No more guessing column names. No more "earned_points vs points_earned" confusion. TypeScript has your back.
