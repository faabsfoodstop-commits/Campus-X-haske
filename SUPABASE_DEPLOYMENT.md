# Supabase Deployment Guide

## Edge Functions Setup

These Edge Functions replace Firebase Cloud Functions.

### Functions Created

1. **award-mission-reward** - Award points for completing missions
2. **buy-cosmetic-item** - Purchase cosmetics with points
3. **claim-weekly-challenge** - Claim weekly challenge bonuses

### Deployment Steps

#### Option 1: Deploy via Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref fhagosdrnoqfqnzrqrvw

# Deploy functions
supabase functions deploy award-mission-reward
supabase functions deploy buy-cosmetic-item
supabase functions deploy claim-weekly-challenge
```

#### Option 2: Deploy via Supabase Console (Manual)

1. Go to Supabase Console → Edge Functions
2. Click "Create a new function"
3. Name: `award-mission-reward`
4. Copy content from `supabase/functions/award-mission-reward/index.ts`
5. Click Deploy
6. Repeat for other functions

### Environment Variables

Functions automatically have access to:
- `SUPABASE_URL` - Your project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (from .env.local)

### Testing Functions

After deployment, test via cURL:

```bash
curl -X POST https://fhagosdrnoqfqnzrqrvw.supabase.co/functions/v1/award-mission-reward \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-here",
    "missionId": "mission_001",
    "missionName": "Daily Login",
    "baseReward": 100
  }'
```

### Expected Response

```json
{
  "success": true,
  "pointsAwarded": 100,
  "multiplier": 1,
  "message": "Awarded 100 points!"
}
```

## Frontend Integration

Update your frontend to call Edge Functions instead of Firebase:

```typescript
// Replace Firebase Cloud Functions with Edge Functions
const response = await fetch(
  `${supabaseUrl}/functions/v1/award-mission-reward`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: user.id,
      missionId: 'mission_001',
      missionName: 'Daily Login',
      baseReward: 100
    })
  }
);
```

## Additional Functions to Create

These should follow the same pattern:

- executePointTrade
- claimSponsoredMission
- createPointSellOrder
- updateUserProfile
- postUserAd
- verifyInstagramFollow

## Database Queries

Functions use the Supabase client to query:

```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();
```

## Security

- Edge Functions run with `SUPABASE_SERVICE_ROLE_KEY`
- Use this key to bypass RLS when needed for server operations
- Always validate input in functions
- Log all transactions for audit trail
