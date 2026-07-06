export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question_id, selected_option_id, response_time_ms } = req.body;

  // Mock answer checking
  const isCorrect = Math.random() > 0.3; // 70% chance correct
  let pointsEarned = 0;

  if (isCorrect) {
    let multiplier = 1.0;
    if (response_time_ms < 5000) multiplier = 2.5;
    if (response_time_ms < 2000) multiplier = 10;
    pointsEarned = Math.floor(10 * multiplier);
  }

  res.json({
    status: 'success',
    data: {
      is_correct: isCorrect,
      points_earned: pointsEarned,
      correct_option_id: isCorrect ? selected_option_id : '1a'
    }
  });
}
