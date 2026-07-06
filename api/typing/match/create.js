export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const matchId = 'match_' + Date.now();
  const tournamentId = 'tournament_' + Date.now();

  res.json({
    status: 'success',
    data: {
      match_id: matchId,
      player1_id: 'user_1',
      tournament_id: tournamentId,
      timer: 600000 // 10 minutes
    }
  });
}
