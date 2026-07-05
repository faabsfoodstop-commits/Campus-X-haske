const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { awardTypingPayout, calculateTypingPayouts } = require('../utils/payouts');
const { detectTypingAnomalies } = require('../utils/fraud');

// POST /api/typing/match/create - Create new match
router.post('/match/create', async (req, res) => {
  try {
    const { difficulty } = req.body;
    const userId = req.headers['x-user-id'];

    console.log('📝 Create match request:', { userId, difficulty });

    if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    // MOCK DATA FOR TESTING - Will connect to real database later
    const matchId = uuidv4();
    const tournamentId = uuidv4();

    res.json({
      status: 'success',
      data: {
        match_id: matchId,
        player1_id: userId,
        tournament_id: tournamentId,
        timer: 600000 // 10 minutes
      }
    });
  } catch (error) {
    console.error('❌ Create match error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/typing/match/:matchId/live - Get live match data (for Supabase Realtime)
router.get('/match/:matchId/live', async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.headers['x-user-id'];

    // Mock live match data
    res.json({
      status: 'success',
      data: {
        match_id: matchId,
        player1_wpm: 72 + Math.floor(Math.random() * 30),
        player2_wpm: 68 + Math.floor(Math.random() * 30),
        player1_accuracy: 88 + Math.random() * 8,
        player2_accuracy: 85 + Math.random() * 10,
        completed_at: null
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /api/typing/match/:matchId/submit - Submit typing results
router.post('/match/:matchId/submit', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { typed_text, completion_time_ms } = req.body;
    const userId = req.headers['x-user-id'];

    // Mock WPM and accuracy calculation
    const wpm = Math.round((typed_text.length / 5) / (completion_time_ms / 60000));
    const accuracy = Math.min(100, Math.max(60, 85 + Math.random() * 10)); // 85-95% accuracy

    res.json({
      status: 'success',
      data: {
        wpm: Math.max(40, wpm || 70),
        accuracy: accuracy.toFixed(2),
        completion_time_ms
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /api/typing/match/:matchId/complete - Complete match and award tokens
router.post('/match/:matchId/complete', async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.headers['x-user-id'];

    // Mock match completion
    const player1Wins = Math.random() > 0.5;
    const winnerId = player1Wins ? userId : `opponent_${Math.random().toString(36).substr(2, 9)}`;
    const loserId = player1Wins ? `opponent_${Math.random().toString(36).substr(2, 9)}` : userId;
    const tokensAwarded = player1Wins ? 150 : 50;

    res.json({
      status: 'success',
      data: {
        winner_id: winnerId,
        tokens_awarded: tokensAwarded,
        platform_revenue: 10
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/typing/leaderboard/global - Global rankings
router.get('/leaderboard/global', async (req, res) => {
  try {
    // MOCK DATA FOR TESTING
    const mockLeaderboard = [
      { user_id: 'user1', best_wpm: 95, total_matches: 15, win_rate_percent: 75 },
      { user_id: 'user2', best_wpm: 88, total_matches: 12, win_rate_percent: 70 },
      { user_id: 'user3', best_wpm: 82, total_matches: 10, win_rate_percent: 65 },
      { user_id: 'user4', best_wpm: 78, total_matches: 8, win_rate_percent: 60 },
      { user_id: 'user5', best_wpm: 75, total_matches: 6, win_rate_percent: 55 },
    ];

    res.json({
      status: 'success',
      data: mockLeaderboard
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/typing/leaderboard/campus/:campusId - Campus rankings
router.get('/leaderboard/campus/:campusId', async (req, res) => {
  try {
    const { campusId } = req.params;
    const { limit = 50 } = req.query;

    const { data: leaderboard, error } = await req.supabase
      .from('typing_leaderboard')
      .select('user_id, total_matches, total_wins, win_rate_percent, best_wpm, current_rank')
      .eq('campus_id', campusId)
      .eq('period_type', 'all_time')
      .order('current_rank', { ascending: true })
      .limit(limit);

    if (error) throw error;

    res.json({
      status: 'success',
      data: leaderboard
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/typing/user/stats - Personal statistics
router.get('/user/stats', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    // MOCK DATA FOR TESTING
    res.json({
      status: 'success',
      data: {
        user_id: userId,
        total_matches: 5,
        best_wpm: 75,
        win_rate_percent: 60,
        total_tokens_earned: 450
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /api/typing/cosmetics/purchase - Buy cosmetics
router.post('/cosmetics/purchase', async (req, res) => {
  try {
    const { cosmetic_id } = req.body;
    const userId = req.headers['x-user-id'];

    const { data: cosmetic } = await req.supabase
      .from('cosmetics_catalog')
      .select('price_tokens')
      .eq('id', cosmetic_id)
      .single();

    if (!cosmetic) return res.status(404).json({ status: 'error', message: 'Cosmetic not found' });

    // Insert purchase
    const { error } = await req.supabase
      .from('user_cosmetics')
      .insert({
        user_id: userId,
        cosmetic_id: cosmetic_id,
        is_equipped: false
      });

    if (error) throw error;

    res.json({
      status: 'success',
      data: { cosmetic_id, tokens_spent: cosmetic.price_tokens }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/typing/cosmetics/shop - Cosmetics shop
router.get('/cosmetics/shop', async (req, res) => {
  try {
    const { data: cosmetics, error } = await req.supabase
      .from('cosmetics_catalog')
      .select('*')
      .eq('game_id', 'typing')
      .eq('is_active', true);

    if (error) throw error;

    res.json({
      status: 'success',
      data: cosmetics
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/typing/match/history - Match history
router.get('/match/history', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { limit = 20, offset = 0 } = req.query;

    const { data: matches, error } = await req.supabase
      .from('typing_matches')
      .select('*')
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      status: 'success',
      data: matches
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Helper functions
function calculateAccuracy(typed, expected) {
  let matches = 0;
  const minLen = Math.min(typed.length, expected.length);

  for (let i = 0; i < minLen; i++) {
    if (typed[i] === expected[i]) matches++;
  }

  return (matches / expected.length) * 100;
}

function calculateMatches(typed, expected) {
  let matches = 0;
  const minLen = Math.min(typed.length, expected.length);

  for (let i = 0; i < minLen; i++) {
    if (typed[i] === expected[i]) matches++;
  }

  return matches;
}

module.exports = router;
