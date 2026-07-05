// Payout Engine - Handles atomic token distribution

async function awardTypingPayout(supabase, userId, matchId, tokensAmount, reason) {
  try {
    // Call stored procedure for atomic transaction
    const { data, error } = await supabase.rpc('award_typing_payout', {
      p_user_id: userId,
      p_match_id: matchId,
      p_tokens_amount: tokensAmount,
      p_reason: reason
    });

    if (error) {
      console.error('Payout error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, tokensAwarded: tokensAmount };
  } catch (err) {
    console.error('Payout exception:', err);
    return { success: false, error: err.message };
  }
}

async function awardTriviaPayout(supabase, userId, roundId, tokensAmount, reason) {
  try {
    const { data, error } = await supabase.rpc('award_trivia_payout', {
      p_user_id: userId,
      p_round_id: roundId,
      p_tokens_amount: tokensAmount,
      p_reason: reason
    });

    if (error) {
      console.error('Trivia payout error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, tokensAwarded: tokensAmount };
  } catch (err) {
    console.error('Trivia payout exception:', err);
    return { success: false, error: err.message };
  }
}

// Calculate Typing Master payouts
function calculateTypingPayouts(match) {
  const ENTRY_FEE = 100; // tokens
  const WINNER_PAYOUT = 180;
  const LOSER_REFUND = 40;
  const PLATFORM_RAKE = 100;

  let winnerBonus = 1.0;
  if (match.player_streak > 5) winnerBonus = 1.2;
  if (match.player_streak > 10) winnerBonus = 1.5;
  if (match.accuracy_percent > 99) winnerBonus += 0.1;

  const finalWinnerPayout = Math.floor(WINNER_PAYOUT * winnerBonus);

  return {
    winner_payout: finalWinnerPayout,
    loser_refund: LOSER_REFUND,
    platform_revenue: PLATFORM_RAKE * 0.10 // Convert to naira
  };
}

// Calculate Trivia payouts
async function calculateTriviaPayouts(supabase, userId, roundScore, campusId) {
  // Determine daily rank
  const { data: rankData, error: rankError } = await supabase
    .from('trivia_daily_winners')
    .select('rank')
    .eq('user_id', userId)
    .eq('round_date', new Date().toISOString().split('T')[0])
    .order('rank', { ascending: true })
    .limit(1);

  let tokensEarned = 0;
  const dailyRank = rankData?.[0]?.rank || 11;

  const PAYOUTS = [500, 400, 300, 250, 200, 180, 160, 150, 140, 130];
  if (dailyRank <= 10) {
    tokensEarned = PAYOUTS[dailyRank - 1];
  } else {
    // Participation rewards
    if (roundScore >= 250) tokensEarned = 50;
    if (roundScore >= 400) tokensEarned = 100;
    if (roundScore >= 600) tokensEarned = 200;
  }

  return {
    tokens_earned: tokensEarned,
    daily_rank: dailyRank,
    platform_revenue: 50 * 0.10 // Premium entry fee
  };
}

module.exports = {
  awardTypingPayout,
  awardTriviaPayout,
  calculateTypingPayouts,
  calculateTriviaPayouts
};
