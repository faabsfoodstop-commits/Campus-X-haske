const express = require('express');
const router = express.Router();
const { awardTriviaPayout, calculateTriviaPayouts } = require('../utils/payouts');
const { detectTriviaAnomalies } = require('../utils/fraud');

// POST /api/trivia/round/start - Start new trivia round
router.post('/round/start', async (req, res) => {
  try {
    const { round_type = 'free' } = req.body;
    const userId = req.headers['x-user-id'];

    if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    // MOCK DATA FOR TESTING
    const mockQuestions = [
      {
        id: '1',
        question_text: 'What is the capital of France?',
        options: [
          { id: '1a', option_text: 'Paris', is_correct: true },
          { id: '1b', option_text: 'Lyon', is_correct: false },
          { id: '1c', option_text: 'Marseille', is_correct: false },
          { id: '1d', option_text: 'Nice', is_correct: false }
        ]
      },
      {
        id: '2',
        question_text: 'What is 2 + 2?',
        options: [
          { id: '2a', option_text: '3', is_correct: false },
          { id: '2b', option_text: '4', is_correct: true },
          { id: '2c', option_text: '5', is_correct: false },
          { id: '2d', option_text: '6', is_correct: false }
        ]
      }
    ];

    res.json({
      status: 'success',
      data: {
        round_id: 'round-' + Date.now(),
        questions: mockQuestions,
        timer: 20000 // 10 seconds per question × 2 = 20 seconds
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

    // Mock answer checking - simulate correct/incorrect
    const isCorrect = Math.random() > 0.3; // 70% chance of being correct
    const correctOptionId = ['1a', '2b'][Math.floor(Math.random() * 2)];

    let pointsEarned = 0;
    if (isCorrect) {
      let multiplier = 1.0;
      if (response_time_ms < 5000) multiplier = 2.5;
      if (response_time_ms < 2000) multiplier = 10;
      pointsEarned = Math.floor(10 * multiplier);
    }

    const currentStreak = isCorrect ? 1 : 0;
    const streakMax = isCorrect ? 1 : 0;

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

    // Mock round completion
    const totalPoints = Math.floor(Math.random() * 500) + 50; // 50-550 points
    const correctAnswers = Math.floor(Math.random() * 10) + 1; // 1-10 correct
    const accuracy = (correctAnswers / 10) * 100;
    const dailyRank = Math.floor(Math.random() * 20) + 1; // Random rank 1-20
    const tokensEarned = dailyRank <= 10 ? (100 - dailyRank * 5) : 0; // Top 10 get tokens

    res.json({
      status: 'success',
      data: {
        final_score: totalPoints,
        accuracy: accuracy.toFixed(2),
        correct_answers: correctAnswers,
        daily_rank: dailyRank,
        tokens_earned: tokensEarned
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/trivia/categories - Get categories
router.get('/categories', async (req, res) => {
  try {
    const mockCategories = [
      'General Knowledge',
      'Science',
      'History',
      'Geography',
      'Sports',
      'Entertainment',
      'Technology',
      'Literature'
    ];

    res.json({
      status: 'success',
      data: mockCategories
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/trivia/leaderboard/daily - Daily leaderboard
router.get('/leaderboard/daily', async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const mockLeaderboard = Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      user_id: `user_${i + 1}`,
      total_points: 500 - (i * 40),
      accuracy_percent: 85 - (i * 3),
      round_date: new Date().toISOString().split('T')[0]
    })).slice(0, parseInt(limit));

    res.json({
      status: 'success',
      data: mockLeaderboard
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/trivia/leaderboard/weekly - Weekly leaderboard
router.get('/leaderboard/weekly', async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const mockLeaderboard = Array.from({ length: 10 }, (_, i) => ({
      current_rank: i + 1,
      user_id: `user_${i + 1}`,
      total_points: 2000 - (i * 150),
      period_type: 'weekly'
    })).slice(0, parseInt(limit));

    res.json({
      status: 'success',
      data: mockLeaderboard
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/trivia/user/stats - User statistics
router.get('/user/stats', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    const mockStats = {
      user_id: userId,
      total_rounds: 25,
      best_score: 450,
      accuracy_percent: 78.5,
      total_tokens_earned: 1250,
      current_streak: 5,
      best_streak: 12
    };

    res.json({
      status: 'success',
      data: mockStats
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

    const mockHistory = Array.from({ length: 5 }, (_, i) => ({
      id: `round_${i + 1}`,
      user_id: userId,
      final_score: 400 - (i * 50),
      correct_answers: 9 - i,
      accuracy_percent: 90 - (i * 5),
      completed_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
    })).slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      status: 'success',
      data: mockHistory
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

    // Mock cosmetic purchase
    const mockPrice = 100 + (Math.random() * 200); // 100-300 tokens

    res.json({
      status: 'success',
      data: { cosmetic_id, tokens_spent: Math.floor(mockPrice) }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/trivia/cosmetics/shop - Cosmetics shop
router.get('/cosmetics/shop', async (req, res) => {
  try {
    const mockCosmetics = [
      { id: 'cos_1', name: 'Golden Border', price_tokens: 150, game_id: 'trivia' },
      { id: 'cos_2', name: 'Neon Theme', price_tokens: 200, game_id: 'trivia' },
      { id: 'cos_3', name: 'Dark Mode', price_tokens: 100, game_id: 'trivia' },
      { id: 'cos_4', name: 'Rainbow Effect', price_tokens: 250, game_id: 'trivia' }
    ];

    res.json({
      status: 'success',
      data: mockCosmetics
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/trivia/winners/today - Today's winners
router.get('/winners/today', async (req, res) => {
  try {
    const mockWinners = Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      user_id: `user_${i + 1}`,
      total_points: 500 - (i * 40),
      accuracy_percent: 85 - (i * 3),
      round_date: new Date().toISOString().split('T')[0]
    }));

    res.json({
      status: 'success',
      data: mockWinners
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /api/trivia/daily-challenge/claim - Claim daily bonus
router.post('/daily-challenge/claim', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    // Mock daily bonus award
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

    const mockStandings = Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      user_id: `user_${i + 1}`,
      total_points: 5000 - (i * 400),
      period_type: 'weekly'
    })).slice(0, parseInt(limit));

    res.json({
      status: 'success',
      data: mockStandings
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
