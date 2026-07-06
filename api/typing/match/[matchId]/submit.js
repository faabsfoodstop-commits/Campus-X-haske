export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { typed_text, completion_time_ms } = req.body;

  // Mock WPM calculation
  const wpm = Math.round((typed_text?.length || 50) / 5 / (completion_time_ms / 60000)) || 70;
  const accuracy = Math.min(100, Math.max(60, 85 + Math.random() * 10));

  res.json({
    status: 'success',
    data: {
      wpm: Math.max(40, wpm),
      accuracy: accuracy.toFixed(2),
      completion_time_ms
    }
  });
}
