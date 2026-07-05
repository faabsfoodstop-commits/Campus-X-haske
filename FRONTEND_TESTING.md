# Frontend Testing Guide - HASKii Games

## Overview

This guide covers testing the React frontend components for Typing Master and QuickFire Trivia games, including integration with the backend API.

## Setup

### 1. Install Dependencies

```bash
cd /home/user/Campus-X-haske
npm install
```

### 2. Configure Environment

Create `.env.local` from the template:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3000
```

### 3. Start Backend Server

First, start the Node.js backend (required for game endpoints):

```bash
cd backend
npm run dev
```

Server runs on `http://localhost:3000`

### 4. Start Frontend Development Server

In a new terminal:

```bash
npm run dev
```

Frontend typically runs on `http://localhost:5173`

## Component Structure

### Core Game Components

#### TypingMaster.jsx
- **Path**: `src/components/games/TypingMaster.jsx`
- **Screens**: Home → Lobby → Racing → Results
- **Features**:
  - User stats display (total matches, best WPM, win rate)
  - Global leaderboard (top 10)
  - Real-time WPM calculation
  - Accuracy calculation
  - Token rewards display

#### QuickFireTrivia.jsx
- **Path**: `src/components/games/QuickFireTrivia.jsx`
- **Screens**: Home → Question → Review → Results
- **Features**:
  - Daily winners display
  - Round type selector (free/premium)
  - 10-second countdown timer per question
  - Streak tracking
  - Question review after answer
  - Leaderboard (daily/weekly)

### Shared Components

#### GamesHub.jsx
- **Path**: `src/components/GamesHub.jsx`
- **Purpose**: Main game selector dashboard
- **Features**:
  - Game display with categories
  - Category filtering
  - Coming soon games preview
  - Platform statistics

#### Leaderboard.jsx
- **Path**: `src/components/Leaderboard.jsx`
- **Props**: `gameType` ('typing' | 'trivia'), `boardType` ('global' | 'daily' | etc)
- **Features**:
  - Multi-game support
  - Board type switching
  - Medal rankings (🥇🥈🥉)
  - Player stats display

#### CosmeticsShop.jsx
- **Path**: `src/components/CosmeticsShop.jsx`
- **Props**: `gameId` (game identifier)
- **Features**:
  - Category filtering
  - Purchase functionality
  - Ownership tracking
  - Rarity display

### API Client

#### gamesClient.js
- **Path**: `src/api/gamesClient.js`
- **Methods**:
  - **Typing**: createTypingMatch, submitTypingMatch, completeTypingMatch, getTypingLeaderboard, getTypingStats, getTypingHistory
  - **Trivia**: startTriviaRound, submitTriviaAnswer, completeTriviaRound, getTriviaLeaderboard, getTriviaStats, getTriviaWinners
  - **Cosmetics**: getCosmetics, purchaseCosmetic

### Custom Hooks

#### useTypingGame.js
- **Path**: `src/hooks/useTypingGame.js`
- **State**: gameState, match, wpm, accuracy, loading, error
- **Methods**: createMatch, startRace, updateTyping, submitMatch, completeMatch

#### useTriviaGame.js
- **Path**: `src/hooks/useTriviaGame.js`
- **State**: gameState, round, questions, currentQuestion, score, streak, timePerQuestion
- **Methods**: startRound, submitAnswer, completeRound

## Testing Workflows

### Test 1: Typing Master Full Flow

**Goal**: Complete a full typing match from start to finish

**Steps**:

1. Navigate to `/games`
2. Click "Typing Master" card
3. On home screen, verify:
   - User stats load (total matches, best WPM, win rate)
   - Global leaderboard shows top 10 players
4. Click "Start Quick Match"
5. On lobby screen, click "🚀 Start Racing"
6. On racing screen, verify:
   - Live WPM updates as you type
   - Accuracy updates in real-time
7. Type some text in the input field
8. Click "Submit & Finish"
9. On results screen, verify:
   - Final WPM displays
   - Final accuracy displays
   - Tokens earned shows (if applicable)
10. Click "Play Again" to reset

**Expected API Calls**:
- `POST /api/typing/match/create` - Create match
- `POST /api/typing/match/:matchId/submit` - Submit results
- `POST /api/typing/match/:matchId/complete` - Complete match
- `GET /api/typing/leaderboard/global` - Load leaderboard
- `GET /api/typing/user/stats` - Load user stats

### Test 2: QuickFire Trivia Full Flow

**Goal**: Complete a trivia round with question review

**Steps**:

1. Navigate to `/games`
2. Click "QuickFire Trivia" card
3. On home screen, verify:
   - Daily winners display
   - User stats load
   - Round type buttons visible (Free Play / Premium)
4. Click "Free Play"
5. On question screen, verify:
   - Question displays
   - 4 options show
   - 10-second timer starts
   - Score, time, and streak display
6. Click one of the answer options
7. On review screen, verify:
   - Shows if answer is correct/incorrect
   - Displays correct answer (if wrong)
   - Shows points earned
   - Shows current streak
8. Click "Next Question →"
9. Repeat for multiple questions
10. After all questions, verify results screen displays final score and streak

**Expected API Calls**:
- `POST /api/trivia/round/start` - Start trivia round
- `POST /api/trivia/round/:roundId/answer` - Submit answer (called for each question)
- `POST /api/trivia/round/:roundId/complete` - Complete round
- `GET /api/trivia/leaderboard/daily` - Load daily leaderboard
- `GET /api/trivia/winners/today` - Load daily winners
- `GET /api/trivia/user/stats` - Load user stats

### Test 3: Leaderboard Component

**Goal**: Test leaderboard display with different board types

**Steps**:

1. In any game component, look for leaderboard section
2. Click "Global" tab (for typing) or "Daily" tab (for trivia)
3. Verify leaderboard data loads
4. Click "Campus" or "Weekly" tab
5. Verify different data loads
6. Check medal rankings (🥇🥈🥉 for top 3)
7. Scroll through rankings

**Expected Behavior**:
- Data updates when board type changes
- Proper sorting by score/WPM
- User info displays correctly

### Test 4: Cosmetics Shop

**Goal**: Browse and verify cosmetics (purchase requires tokens)

**Steps**:

1. Navigate to cosmetics shop (from hub or game nav)
2. Verify cosmetics load
3. Click category filters (Avatar, Theme, Effect, Animation)
4. Verify list filters correctly
5. Check rarity colors match (Common: green, Rare: blue, Epic: purple, Legendary: gold)
6. For owned cosmetics: verify "✓ Owned" button shows
7. For unowned: verify "Purchase" button shows
8. Click purchase (will fail if no tokens, which is expected)

**Expected Behavior**:
- Cosmetics load on mount
- Filtering works
- Ownership status displays correctly
- Button states match ownership

### Test 5: Real-Time Stats Updates

**Goal**: Verify live calculations update correctly

**Steps**:

1. Start typing match
2. In racing screen, type different amounts and watch WPM:
   - After 1 word: WPM should calculate
   - After 5 words: WPM should update
   - After 10+ words: WPM should stabilize
3. Verify accuracy updates as you type
4. Check stats update in real-time (not after submit)

**Expected Behavior**:
- WPM = (words typed / elapsed minutes)
- Accuracy = (matching characters / total expected) × 100
- Both update live without API calls

### Test 6: Timer Functionality

**Goal**: Verify question timer works correctly

**Steps**:

1. Start trivia round
2. On question screen, watch timer count from 10 to 0
3. Let timer expire without selecting answer
4. Verify question auto-submits when timer hits 0
5. Verify correct/incorrect status displays

**Expected Behavior**:
- Timer updates every second
- Question submits automatically at 0 seconds
- Flow continues to next question

### Test 7: Error Handling

**Goal**: Verify error states display correctly

**Steps**:

1. Stop backend server
2. Try to start a game
3. Verify error message displays in red box
4. Restart backend
5. Try again - should work

**Expected Behavior**:
- Error messages display in red
- User can retry without losing state
- Graceful degradation

### Test 8: Loading States

**Goal**: Verify loading indicators work

**Steps**:

1. Start game (might be fast, watch carefully)
2. Look for loading text or spinner
3. Once game loads, verify loading state clears
4. During API calls (submit, complete), watch for loading states

**Expected Behavior**:
- Loading indicators show during async operations
- Content updates when loading completes
- Buttons disabled during loading

## Common Testing Issues

### Issue: API 404 Errors

**Solution**: 
- Verify backend is running: `npm run dev` in backend folder
- Check `VITE_API_URL` in `.env.local` matches backend port
- Backend should run on http://localhost:3000

### Issue: No Data Displays

**Solution**:
- Check browser console for errors (F12 → Console)
- Verify user is authenticated (should have user ID)
- Check if backend has seed data (run migration if needed)

### Issue: Timer Not Counting Down

**Solution**:
- Check browser console for JavaScript errors
- Verify useEffect hook is working
- Check if component is still mounted

### Issue: WPM Shows as Infinity

**Solution**:
- Expected if elapsed time is 0 (less than 1 second)
- WPM should show as 0 or specific number after typing more text
- Check WPM calculation in useTypingGame hook

## Performance Testing

### Recommended Tools
- Chrome DevTools (F12 → Performance tab)
- React Developer Tools extension
- Network tab to monitor API calls

### What to Monitor
- API response times (target: < 500ms)
- Component render times (target: < 100ms)
- Bundle size (keep under 500KB for games bundle)

## Debugging Tips

### Enable Debug Mode
Edit `.env.local`:
```
VITE_DEBUG=true
```

### Console Logging
Add to components:
```javascript
console.log('Component mounted/updated', { gameState, score });
```

### React DevTools
- Install React Developer Tools browser extension
- Inspect component tree
- View hook state in real-time
- Track component re-renders

### Network Tab
- Open DevTools → Network tab
- Perform game action
- Watch API calls in real-time
- Check response status (should be 200)

## Integration with Backend

### API Response Format
All endpoints should return:
```json
{
  "status": "success|error",
  "data": { /* game data */ },
  "message": "Optional error message"
}
```

### Required Headers
```
X-User-ID: user-uuid-here
Content-Type: application/json
```

### Example API Call Flow

**Typing Match**:
1. `POST /api/typing/match/create` → Returns match_id
2. `POST /api/typing/match/:matchId/submit` → Returns accuracy, WPM
3. `POST /api/typing/match/:matchId/complete` → Returns tokens_awarded

**Trivia Round**:
1. `POST /api/trivia/round/start` → Returns round_id, questions array
2. `POST /api/trivia/round/:roundId/answer` → Returns points, is_correct, streak
3. `POST /api/trivia/round/:roundId/complete` → Returns final_score, tokens_awarded

## Deployment Checklist

- [ ] All game components render without errors
- [ ] Backend API running and accessible
- [ ] API endpoints returning correct data
- [ ] Real-time calculations working (WPM, accuracy)
- [ ] Timers functioning correctly
- [ ] Leaderboards updating
- [ ] Cosmetics shop loading
- [ ] Error handling working
- [ ] Loading states display
- [ ] No console errors
- [ ] Performance acceptable (<3s page load)
- [ ] Mobile responsive (if required)

## Next Steps

1. **Load Testing**: Test with multiple concurrent users
2. **Real-time Sync**: Enable Supabase Realtime subscriptions for live leaderboard
3. **Additional Games**: Build components for Code Challenges, Music Quiz, etc.
4. **Analytics**: Add event tracking for game actions
5. **Notifications**: Implement push notifications for achievements
6. **Mobile Optimization**: Ensure mobile-friendly UI
