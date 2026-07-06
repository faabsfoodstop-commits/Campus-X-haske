export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const totalPoints = Math.floor(Math.random() * 500) + 50;
  const correctAnswers = Math.floor(Math.random() * 10) + 1;
  const accuracy = (correctAnswers / 10) * 100;
  const dailyRank = Math.floor(Math.random() * 20) + 1;
  const tokensEarned = dailyRank <= 10 ? (100 - dailyRank * 5) : 0;

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
}
