# Firebase to Supabase Migration Guide

## Overview

This guide shows how to update your frontend components to use Supabase instead of Firebase.

## Key Changes

### 1. Import Changes

**Before (Firebase):**
```typescript
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
```

**After (Supabase):**
```typescript
import { supabase, callEdgeFunction } from '../config/supabase';
```

---

### 2. Authentication

**Before (Firebase):**
```typescript
if (!auth.currentUser) return;
const userId = auth.currentUser.uid;
```

**After (Supabase):**
```typescript
const { data: { session } } = await supabase.auth.getSession();
if (!session) return;
const userId = session.user.id;
```

---

### 3. Fetching User Data

**Before (Firebase):**
```typescript
const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
if (userDoc.exists()) {
  setUserData(userDoc.data());
}
```

**After (Supabase):**
```typescript
const { data: userData, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', session.user.id)
  .single();

if (!error) {
  setUserData(userData);
}
```

---

### 4. Calling Cloud Functions

**Before (Firebase):**
```typescript
const functions = getFunctions();
const awardMissionReward = httpsCallable(functions, 'awardMissionReward');
const result = await awardMissionReward({
  missionId: 'mission_001',
  missionName: 'Daily Login',
  baseReward: 100
});
```

**After (Supabase):**
```typescript
const result = await callEdgeFunction('award-mission-reward', {
  userId: session.user.id,
  missionId: 'mission_001',
  missionName: 'Daily Login',
  baseReward: 100
});
```

---

### 5. Updating Data

**Before (Firebase):**
```typescript
await updateDoc(doc(db, 'users', userId), {
  points: newPoints
});
```

**After (Supabase):**
```typescript
const { error } = await supabase
  .from('users')
  .update({ points: newPoints })
  .eq('id', userId);
```

---

### 6. Inserting Data

**Before (Firebase):**
```typescript
await addDoc(collection(db, 'transactions'), {
  userId: userId,
  type: 'mission_reward',
  amount: 100
});
```

**After (Supabase):**
```typescript
const { error } = await supabase
  .from('transactions')
  .insert({
    user_id: userId,
    type: 'mission_reward',
    amount: 100
  });
```

---

## Component-by-Component Updates

### DailyMissions.jsx

1. Replace all `firebase` imports with `supabase`
2. Update `useEffect` to use Supabase queries
3. Replace Cloud Function calls with `callEdgeFunction`
4. Update state management for user data

### WeeklyChallenges.jsx

1. Replace `firebase` imports
2. Update user data fetching
3. Replace `claimWeeklyChallenge` Cloud Function call with Edge Function

### CosmeticsShop.jsx

1. Update imports
2. Replace `buyCosmeticItem` Cloud Function call
3. Update cosmetics list fetching

### Profile.jsx

1. Update authentication checks
2. Replace `updateUserProfile` Cloud Function call
3. Update profile data fetching and updating

---

## Testing

After updating each component:

1. **Test Authentication:**
   ```
   Sign up → Sign in → Check user ID
   ```

2. **Test Data Fetching:**
   ```
   Navigate to profile → Verify user data loads
   ```

3. **Test Edge Functions:**
   ```
   Complete mission → Check if points awarded
   ```

4. **Check Console:**
   ```
   Open browser DevTools → Look for errors
   ```

---

## Common Issues

### Issue: "VITE_SUPABASE_URL is undefined"
**Solution:** Add to `.env.local`:
```
VITE_SUPABASE_URL=https://fhagosdrnoqfqnzrqrvw.supabase.co
VITE_SUPABASE_ANON_KEY=your-key-here
```

### Issue: "Edge Function not found"
**Solution:** Verify function is deployed in Supabase Console

### Issue: "RLS policy violation"
**Solution:** Check RLS policies allow the operation

---

## Migration Checklist

- [ ] Install @supabase/supabase-js
- [ ] Create src/config/supabase.ts
- [ ] Update DailyMissions.jsx
- [ ] Update WeeklyChallenges.jsx
- [ ] Update CosmeticsShop.jsx
- [ ] Update Profile.jsx
- [ ] Update SponsoredMissions.jsx
- [ ] Update Authentication pages (Login/SignUp)
- [ ] Test all features
- [ ] Test on mobile

---

## Next Steps

1. Start with `src/config/supabase.ts` (already created)
2. Update one component at a time
3. Test each component after updating
4. Move to next component
5. Run full integration test
