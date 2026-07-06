export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const player1Wins = Math.random() > 0.5;
  const winnerId = player1Wins ? 'player1' : 'player2';
  const tokensAwarded = player1Wins ? 150 : 50;

  res.json({
    status: 'success',
    data: {
      winner_id: winnerId,
      tokens_awarded: tokensAwarded,
      platform_revenue: 10
    }
  });
}
