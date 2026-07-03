/**
 * CENTRALIZED DATABASE HELPERS - Permanent Solution
 * All database operations go through these typed functions
 * This ensures schema consistency and prevents mismatches
 */

import { supabase } from '../config/supabase';
import type {
  Transaction,
  SpinHistory,
  TriviaResult,
  StreakCheckIn,
  VideoAdWatched,
  InstagramFollow,
  GettingStartedTask
} from '../types/database';

// ============================================================================
// TRANSACTION LOGGING (Activity Log Source)
// ============================================================================

export async function recordSpinActivity(
  userId: string,
  result: string,
  pointsEarned: number,
  isFree: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: spinError } = await supabase.from('spin_history').insert({
      user_id: userId,
      result,
      points_earned: pointsEarned,
      multiplier: '1',
      cost: isFree ? 0 : 50
    });

    if (spinError) throw spinError;

    const { error: txError } = await supabase.from('transactions').insert({
      user_id: userId,
      type: 'spin_wheel',
      amount: pointsEarned,
      description: `${result}${isFree ? ' (free)' : ' (purchased)'}`,
      timestamp: new Date().toISOString()
    });

    if (txError) throw txError;

    return { success: true };
  } catch (err: any) {
    console.error('[recordSpinActivity] Error:', err);
    return { success: false, error: err.message };
  }
}

export async function recordTriviaActivity(
  userId: string,
  score: number,
  correctAnswers: number,
  totalReward: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: triviaError } = await supabase.from('trivia_results').insert({
      user_id: userId,
      score,
      correct_answers: correctAnswers,
      total_questions: 10,
      points_earned: totalReward
    });

    if (triviaError) throw triviaError;

    const { error: txError } = await supabase.from('transactions').insert({
      user_id: userId,
      type: 'trivia',
      amount: totalReward,
      description: `Trivia Game: ${correctAnswers}/10 correct`,
      timestamp: new Date().toISOString()
    });

    if (txError) throw txError;

    return { success: true };
  } catch (err: any) {
    console.error('[recordTriviaActivity] Error:', err);
    return { success: false, error: err.message };
  }
}

export async function recordVideoAdActivity(
  userId: string,
  adId: string,
  adTitle: string,
  pointsEarned: number,
  duration: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const today = new Date().toDateString();

    const { error: videoError } = await supabase.from('video_ads_watched').insert({
      user_id: userId,
      ad_id: adId,
      ad_title: adTitle,
      points_earned: pointsEarned,
      watched_date: today,
      duration
    });

    if (videoError) throw videoError;

    const { error: txError } = await supabase.from('transactions').insert({
      user_id: userId,
      type: 'video_ad',
      amount: pointsEarned,
      description: `Watched ad: ${adTitle}`,
      timestamp: new Date().toISOString()
    });

    if (txError) throw txError;

    return { success: true };
  } catch (err: any) {
    console.error('[recordVideoAdActivity] Error:', err);
    return { success: false, error: err.message };
  }
}

export async function recordInstagramFollowActivity(
  userId: string,
  brandId: string,
  brandName: string,
  brandHandle: string,
  pointsEarned: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: igError } = await supabase.from('instagram_follows').insert({
      user_id: userId,
      brand_id: brandId,
      brand_name: brandName,
      brand_handle: brandHandle,
      verified: true
    });

    if (igError) throw igError;

    const { error: txError } = await supabase.from('transactions').insert({
      user_id: userId,
      type: 'referral',
      amount: pointsEarned,
      description: `Followed ${brandName} on Instagram`,
      timestamp: new Date().toISOString()
    });

    if (txError) throw txError;

    return { success: true };
  } catch (err: any) {
    console.error('[recordInstagramFollowActivity] Error:', err);
    return { success: false, error: err.message };
  }
}

export async function recordCheckInActivity(
  userId: string,
  pointsEarned: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { error: checkInError } = await supabase.from('streak_check_ins').insert({
      user_id: userId,
      check_in_date: today,
      points_earned: pointsEarned
    });

    if (checkInError) throw checkInError;

    const { error: txError } = await supabase.from('transactions').insert({
      user_id: userId,
      type: 'check_in',
      amount: pointsEarned,
      description: 'Daily Check-In',
      timestamp: new Date().toISOString()
    });

    if (txError) throw txError;

    return { success: true };
  } catch (err: any) {
    console.error('[recordCheckInActivity] Error:', err);
    return { success: false, error: err.message };
  }
}

// ============================================================================
// DATA FETCHING (with type safety)
// ============================================================================

export async function fetchSpinHistory(userId: string, limit: number = 10): Promise<SpinHistory[]> {
  try {
    const { data, error } = await supabase
      .from('spin_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as SpinHistory[];
  } catch (err: any) {
    console.error('[fetchSpinHistory] Error:', err);
    return [];
  }
}

export async function fetchTransactions(userId: string, limit: number = 50): Promise<Transaction[]> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as Transaction[];
  } catch (err: any) {
    console.error('[fetchTransactions] Error:', err);
    return [];
  }
}

export async function fetchStreakCheckIns(userId: string): Promise<StreakCheckIn[]> {
  try {
    const { data, error } = await supabase
      .from('streak_check_ins')
      .select('*')
      .eq('user_id', userId)
      .order('check_in_date', { ascending: false });

    if (error) throw error;
    return (data || []) as StreakCheckIn[];
  } catch (err: any) {
    console.error('[fetchStreakCheckIns] Error:', err);
    return [];
  }
}

// ============================================================================
// POINTS MANAGEMENT (single source of truth)
// ============================================================================

export async function updateUserPoints(userId: string, newPoints: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ points: newPoints })
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (err: any) {
    console.error('[updateUserPoints] Error:', err);
    return false;
  }
}

export async function updateUserWallet(userId: string, newWallet: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ wallet: newWallet })
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (err: any) {
    console.error('[updateUserWallet] Error:', err);
    return false;
  }
}
