export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.json({
    status: 'success',
    data: {
      user_id: 'user_123',
      total_rounds: 25,
      best_score: 450,
      accuracy_percent: 78.5,
      total_tokens_earned: 1250,
      current_streak: 5,
      best_streak: 12
    }
  });
}
