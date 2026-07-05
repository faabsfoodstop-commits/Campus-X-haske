const express = require('express');
const router = express.Router();
const { awardTriviaPayout, calculateTriviaPayouts } = require('../utils/payouts');
const { detectTriviaAnomalies } = require('../utils/fraud');

// POST /api/trivia/round/start - Start new trivia round
router.post('/round/start', async (req, res) => {
  try {
    const { round_type = 'free', difficulty_level = 'mixed' } = req.body;
    const userId = req.headers['x-user-id'];

    if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    // Create round
    const { data: round, error } = await req.supabase
      .from('trivia_rounds')
      .insert({
        user_id: userId,
        round_type,
        difficulty_level,
        started_at: new Date().toISOString(),
        tokens_spent: round_type === 'premium' ? 50 : 0
      })
      .select()
      .single();

    if (error) throw error;

    // Get 10 questions
    const { data: questions, error: qError } = await req.supabase
      .from('trivia_questions')
      .select('id, question_text, options, category')
      .eq('is_active', true)
      .order('RANDOM()')
      .limit(10);

    if (qError) throw qError;

    res.json({
      status: 'success',
      data: {
        round_id: round.id,
        questions: questions,
        timer: 120000 // 10 seconds per question × 10 = 120 seconds
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /api/trivia/round/:roundId/answer - Submit answer
router.post('/round/:roundId/answer', async (req, res) => {
  try {
    const { roundId } = req.params;
    const { question_id, selected_option_id, response_time_ms } = req.body;
    const userId = req.headers['x-user-id'];

    // Get correct answer
    const { data: question } = await req.supabase
      .from('trivia_questions')
      .select('correct_option_id')
      .eq('id', question_id)
      .single();

    const isCorrect = question.correct_option_id === selected_option_id;

    // Get current streak
    const { data: roundData } = await req.supabase
      .from('trivia_rounds')
      .select('streak_max, correct_answers')
      .eq('id', roundId)
      .single();

    const currentStreak = isCorrect ? (roundData.correct_answers || 0) + 1 : 0;
    const streakMax = Math.max(roundData.streak_max || 0, currentStreak);

    // Calculate points
    let pointsEarned = 0;
    if (isCorrect) {
      let multiplier = 1.0;
      if (currentStreak >= 5) multiplier = 2.5;
      if (currentStreak === 10) multiplier = 10;
      pointsEarned = Math.floor(10 * multiplier);
    }

    // Record response
    const { error } = await req.supabase
      .from('trivia_responses')
      .insert({
        round_id: roundId,
        question_id,
        selected_option_id,
        is_correct: isCorrect,
        response_time_ms,
        points_earned: pointsEarned,
        streak_at_time: currentStreak
      });

    if (error) throw error;

    res.json({
      status: 'success',
      data: {
        is_correct: isCorrect,
        points_earned: pointsEarned,
        streak: currentStreak,
        streak_max: streakMax
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /api/trivia/round/:roundId/complete - Complete round
router.post('/round/:roundId/complete', async (req, res) => {
  try {
    const { roundId } = req.params;
    const userId = req.headers['x-user-id'];

    // Get round data
    const { data: round } = await req.supabase
      .from('trivia_rounds')
      .select('*')
      .eq('id', roundId)
      .single();

    // Get all responses for this round
    const { data: responses } = await req.supabase
      .from('trivia_responses')
      .select('*')
      .eq('round_id', roundId);

    const correctAnswers = responses.filter(r => r.is_correct).length;
    const totalPoints = responses.reduce((sum, r) => sum + r.points_earned, 0);
    const accuracy = (correctAnswers / responses.length) * 100;

    // Fraud check
    const fraudCheck = await detectTriviaAnomalies(req.supabase, userId,
      { accuracy_percent: accuracy, correct_answers: correctAnswers },
      responses
    );

    if (fraudCheck.suspicious) {
      return res.status(400).json({
        status: 'error',
        message: 'Suspicious activity detected',
        fraud_reason: fraudCheck.anomalies[0]?.description
      });
    }

    // Update round
    const { error } = await req.supabase
      .from('trivia_rounds')
      .update({
        completed_at: new Date().toISOString(),
        final_score: totalPoints,
        correct_answers: correctAnswers,
        accuracy_percent: accuracy,
        question_count: responses.length
      })
      .eq('id', roundId);

    if (error) throw error;

    // Get daily rank
    const today = new Date().toISOString().split('T')[0];
    const { data: dailyRounds } = await req.supabase
      .from('trivia_rounds')
      .select('final_score')
      .eq('round_date', today)
      .order('final_score', { ascending: false });

    let dailyRank = dailyRounds?.length + 1 || 1;

    // Award tokens if top 10
    if (dailyRank <= 10) {
      const payouts = await calculateTriviaPayouts(req.supabase, userId, totalPoints, null);
      await awardTriviaPayout(req.supabase, userId, roundId, payouts.tokens_earned, 'Daily winner');
    }

    res.json({
      status: 'success',
      data: {
        final_score: totalPoints,
        accuracy: accuracy.toFixed(2),
        correct_answers: correctAnswers,
        daily_rank: dailyRank,
        tokens_earned: dailyRank <= 10 ? (calculateTriviaPayouts.tokens_earned || 0) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/trivia/categories - Get categories
router.get('/categories', async (req, res) => {
  try {
    const { data: questions, error } = await req.supabase
      .from('trivia_questions')
      .select('category')
      .eq('is_active', true);

    if (error) throw error;

    const categories = [...new Set(questions.map(q => q.category))];

    res.json({
      status: 'success',
      data: categories
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/trivia/leaderboard/daily - Daily leaderboard
router.get('/leaderboard/daily', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const today = new Date().toISOString().split('T')[0];

    const { data: winners, error } = await req.supabase
      .from('trivia_daily_winners')
      .select('*')
      .eq('round_date', today)
      .order('rank', { ascending: true })
      .limit(limit);

    if (error) throw error;

    res.json({
      status: 'success',
      data: winners
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/trivia/leaderboard/weekly - Weekly leaderboard
router.get('/leaderboard/weekly', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: leaderboard, error } = await req.supabase
      .from('trivia_leaderboard')
      .select('*')
      .eq('period_type', 'weekly')
      .gt('period_start', weekAgo)
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

// GET /api/trivia/user/stats - User statistics
router.get('/user/stats', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    const { data: stats, error } = await req.supabase
      .from('trivia_user_stats')
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

// GET /api/trivia/user/history - User round history
router.get('/user/history', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { limit = 20, offset = 0 } = req.query;

    const { data: history, error } = await req.supabase
      .from('trivia_rounds')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      status: 'success',
      data: history
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /api/trivia/cosmetics/purchase - Buy cosmetics
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

    const { error } = await req.supabase
      .from('user_cosmetics')
      .insert({
        user_id: userId,
        cosmetic_id: cosmetic_id
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

// GET /api/trivia/cosmetics/shop - Cosmetics shop
router.get('/cosmetics/shop', async (req, res) => {
  try {
    const { data: cosmetics, error } = await req.supabase
      .from('cosmetics_catalog')
      .select('*')
      .eq('game_id', 'trivia');

    if (error) throw error;

    res.json({
      status: 'success',
      data: cosmetics
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/trivia/winners/today - Today's winners
router.get('/winners/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: winners, error } = await req.supabase
      .from('trivia_daily_winners')
      .select('*')
      .eq('round_date', today)
      .order('rank', { ascending: true });

    if (error) throw error;

    res.json({
      status: 'success',
      data: winners
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /api/trivia/daily-challenge/claim - Claim daily bonus
router.post('/daily-challenge/claim', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    // Award 50 tokens for daily participation
    const { data } = await req.supabase.rpc('award_trivia_payout', {
      p_user_id: userId,
      p_round_id: null,
      p_tokens_amount: 50,
      p_reason: 'Daily challenge bonus'
    });

    res.json({
      status: 'success',
      data: { bonus_tokens: 50 }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /api/trivia/premium-round/multiplier-booster - Buy booster
router.post('/premium-round/multiplier-booster', async (req, res) => {
  try {
    const { booster_type } = req.body;
    const userId = req.headers['x-user-id'];

    const BOOSTER_COSTS = {
      '2x_points': 150,
      'streak_saver': 100,
      'extra_question': 75
    };

    const cost = BOOSTER_COSTS[booster_type] || 0;

    res.json({
      status: 'success',
      data: { booster_type, tokens_spent: cost }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/trivia/season/standings - Season leaderboard
router.get('/season/standings', async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const { data: standings, error } = await req.supabase
      .from('trivia_leaderboard')
      .select('*')
      .eq('period_type', 'weekly')
      .order('total_points', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({
      status: 'success',
      data: standings
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
