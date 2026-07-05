// Fraud Detection Engine

async function detectTypingAnomalies(supabase, userId, match, metadata) {
  const anomalies = [];

  // Check 1: Timing anomalies
  if (match.player1_completion_time_ms < 15000 && match.player1_accuracy_percent > 95) {
    anomalies.push({
      type: 'impossible_speed',
      confidence: 0.85,
      description: 'Completion too fast for accuracy level'
    });
  }

  // Check 2: WPM impossibility (human limit ~150 WPM)
  if (match.player1_wpm > 250) {
    anomalies.push({
      type: 'superhuman_wpm',
      confidence: 0.9,
      description: 'WPM exceeds human capability'
    });
  }

  // Check 3: Perfect accuracy at high speed
  if (match.player1_wpm > 120 && match.player1_accuracy_percent === 100) {
    anomalies.push({
      type: 'perfect_accuracy_high_speed',
      confidence: 0.75,
      description: 'Perfect accuracy at high speed is statistically unlikely'
    });
  }

  // Check 4: Rate limiting
  const { data: recentMatches } = await supabase
    .from('typing_matches')
    .select('created_at')
    .eq('player1_id', userId)
    .gt('created_at', new Date(Date.now() - 3600000).toISOString())
    .order('created_at', { ascending: false });

  if (recentMatches && recentMatches.length > 20) {
    anomalies.push({
      type: 'rate_limit_exceeded',
      confidence: 0.8,
      description: '20+ matches in 1 hour indicates bot behavior'
    });
  }

  if (anomalies.length > 0) {
    await reportFraud(supabase, userId, 'typing', anomalies[0].type, anomalies);
    return { suspicious: true, anomalies, severity: calculateSeverity(anomalies) };
  }

  return { suspicious: false, anomalies: [] };
}

async function detectTriviaAnomalies(supabase, userId, round, responses) {
  const anomalies = [];

  // Check 1: Response time anomalies (under 1 second per question)
  const avgResponseTime = responses.reduce((sum, r) => sum + r.response_time_ms, 0) / responses.length;
  if (avgResponseTime < 1000) {
    anomalies.push({
      type: 'too_fast_responses',
      confidence: 0.8,
      description: 'Average response time < 1 second per question'
    });
  }

  // Check 2: Accuracy spike
  const { data: userHistory } = await supabase
    .from('trivia_rounds')
    .select('accuracy_percent')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(10);

  if (userHistory && userHistory.length > 3) {
    const prevAccuracy = userHistory.slice(1).reduce((sum, r) => sum + r.accuracy_percent, 0) / (userHistory.length - 1);
    const currentAccuracy = round.accuracy_percent;

    if (currentAccuracy - prevAccuracy > 40) {
      anomalies.push({
        type: 'accuracy_spike',
        confidence: 0.7,
        description: `Accuracy jumped ${currentAccuracy - prevAccuracy}% from previous average`
      });
    }
  }

  // Check 3: New account with high accuracy
  const { data: accountAge } = await supabase
    .from('auth.users')
    .select('created_at')
    .eq('id', userId)
    .single();

  if (accountAge) {
    const ageMs = Date.now() - new Date(accountAge.created_at).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    if (ageDays < 7 && round.accuracy_percent > 80) {
      anomalies.push({
        type: 'new_account_high_accuracy',
        confidence: 0.75,
        description: 'New account (<7 days) with high accuracy'
      });
    }
  }

  if (anomalies.length > 0) {
    await reportFraud(supabase, userId, 'trivia', anomalies[0].type, anomalies);
    return { suspicious: true, anomalies, severity: calculateSeverity(anomalies) };
  }

  return { suspicious: false, anomalies: [] };
}

async function reportFraud(supabase, userId, gameId, reportType, evidence) {
  try {
    const severity = calculateSeverity(Array.isArray(evidence) ? evidence : [evidence]);

    const { error } = await supabase
      .from('fraud_reports')
      .insert({
        reported_user_id: userId,
        game_id: gameId,
        report_type: reportType,
        evidence: { anomalies: evidence },
        severity_score: severity,
        is_confirmed: false,
        created_at: new Date().toISOString()
      });

    if (error) console.error('Fraud report error:', error);
    return { success: !error };
  } catch (err) {
    console.error('Fraud reporting exception:', err);
    return { success: false };
  }
}

function calculateSeverity(anomalies) {
  if (!Array.isArray(anomalies)) return 0;
  const total = anomalies.reduce((sum, a) => sum + (a.confidence || 0.5), 0);
  return Math.min(total / anomalies.length, 1.0);
}

module.exports = {
  detectTypingAnomalies,
  detectTriviaAnomalies,
  reportFraud
};
