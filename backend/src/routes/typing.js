const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { awardTypingPayout, calculateTypingPayouts } = require('../utils/payouts');
const { detectTypingAnomalies } = require('../utils/fraud');

// POST /api/typing/match/create - Create new match
router.post('/match/create', async (req, res) => {
  try {
    const { difficulty, tournament_id } = req.body;
    const userId = req.headers['x-user-id'];

    console.log('📝 Create match request:', { userId, difficulty, headers: req.headers });

    if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    // Create tournament if not provided
    let tournamentId = tournament_id;
    if (!tournamentId) {
      const { data: tournament } = await req.supabase
        .from('typing_tournaments')
        .insert({
          tournament_type: 'quick_match',
          difficulty_level: difficulty || 'medium',
          status: 'open'
        })
        .select()
        .single();
      tournamentId = tournament.id;
    }

    // Find or create match for two players (simplified - in production use matchmaking queue)
    const { data: match } = await req.supabase
      .from('typing_matches')
      .insert({
        tournament_id: tournamentId,
        player1_id: userId,
        player2_id: uuidv4(), // Placeholder - would be actual opponent
        text_prompt_id: Math.floor(Math.random() * 50) + 1 // Random prompt
      })
      .select()
      .single();

    res.json({
      status: 'success',
      data: {
        match_id: match.id,
        player1_id: match.player1_id,
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

    const { data: match, error } = await req.supabase
      .from('typing_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (error || !match) return res.status(404).json({ status: 'error', message: 'Match not found' });

    // Verify user is participant
    if (match.player1_id !== userId && match.player2_id !== userId) {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }

    res.json({
      status: 'success',
      data: {
        match_id: match.id,
        player1_wpm: match.player1_wpm || 0,
        player2_wpm: match.player2_wpm || 0,
        player1_accuracy: match.player1_accuracy_percent || 0,
        player2_accuracy: match.player2_accuracy_percent || 0,
        completed_at: match.completed_at
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

    // Calculate WPM and accuracy
    const prompt = await req.supabase
      .from('typing_prompts')
      .select('text_content')
      .eq('id', 1)
      .single();

    const expectedText = prompt.data?.text_content || '';
    const wpm = Math.round((typed_text.length / 5) / (completion_time_ms / 60000));
    const accuracy = calculateAccuracy(typed_text, expectedText);

    // Check for fraud
    const fraudCheck = await detectTypingAnomalies(req.supabase, userId,
      { player1_wpm: wpm, player1_accuracy_percent: accuracy, player1_completion_time_ms: completion_time_ms },
      { device: req.headers['user-agent'] }
    );

    if (fraudCheck.suspicious) {
      return res.status(400).json({
        status: 'error',
        message: 'Suspicious activity detected',
        fraud_reason: fraudCheck.anomalies[0]?.description
      });
    }

    // Update match
    const { error } = await req.supabase
      .from('typing_matches')
      .update({
        player1_wpm: wpm,
        player1_accuracy_percent: accuracy,
        player1_completion_time_ms: completion_time_ms,
        player1_typos: expectedText.length - calculateMatches(typed_text, expectedText)
      })
      .eq('id', matchId);

    if (error) throw error;

    res.json({
      status: 'success',
      data: {
        wpm,
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

    // Get match
    const { data: match } = await req.supabase
      .from('typing_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (!match) return res.status(404).json({ status: 'error', message: 'Match not found' });

    // Determine winner
    const player1Wins = match.player1_wpm > match.player2_wpm;
    const winnerId = player1Wins ? match.player1_id : match.player2_id;
    const loserId = player1Wins ? match.player2_id : match.player1_id;

    // Calculate payouts
    const payouts = calculateTypingPayouts(match);

    // Award winner
    const winnerPayout = await awardTypingPayout(
      req.supabase,
      winnerId,
      matchId,
      payouts.winner_payout,
      'Match victory'
    );

    // Update match as completed
    await req.supabase
      .from('typing_matches')
      .update({
        winner_id: winnerId,
        loser_id: loserId,
        completed_at: new Date().toISOString()
      })
      .eq('id', matchId);

    res.json({
      status: 'success',
      data: {
        winner_id: winnerId,
        tokens_awarded: payouts.winner_payout,
        platform_revenue: payouts.platform_revenue
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/typing/leaderboard/global - Global rankings
router.get('/leaderboard/global', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const { data: leaderboard, error } = await req.supabase
      .from('typing_leaderboard')
      .select('user_id, total_matches, total_wins, win_rate_percent, best_wpm, current_rank')
      .eq('period_type', 'all_time')
      .order('current_rank', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      status: 'success',
      data: leaderboard,
      total: leaderboard.length,
      limit,
      offset
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

    const { data: stats, error } = await req.supabase
      .from('typing_user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    res.json({
      status: 'success',
      data: stats
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
