export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.json({
    status: 'success',
    data: {
      user_id: 'user_123',
      total_matches: 5,
      best_wpm: 75,
      win_rate_percent: 60,
      total_tokens_earned: 450
    }
  });
}
