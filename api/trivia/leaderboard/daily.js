export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const mockLeaderboard = Array.from({ length: 10 }, (_, i) => ({
    rank: i + 1,
    user_id: `user_${i + 1}`,
    total_points: 500 - (i * 40),
    accuracy_percent: 85 - (i * 3),
    round_date: new Date().toISOString().split('T')[0]
  }));

  res.json({
    status: 'success',
    data: mockLeaderboard
  });
}
