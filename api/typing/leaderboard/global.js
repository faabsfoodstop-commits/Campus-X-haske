export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const limit = parseInt(req.query.limit) || 100;
  const mockLeaderboard = Array.from({ length: Math.min(limit, 50) }, (_, i) => ({
    rank: i + 1,
    user_id: `user_${i + 1}`,
    best_wpm: 120 - (i * 2),
    total_matches: 50 - i,
    win_rate_percent: 65 - (i * 1),
    total_tokens_earned: 5000 - (i * 100)
  }));

  res.json({
    status: 'success',
    data: mockLeaderboard
  });
}
