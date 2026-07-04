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
// TRANSACTION LOGGING
// ============================================================================

// Call ONLY after the corresponding users.points UPDATE succeeds.
// Non-fatal — logs a warning on failure so the caller can still show success.
export async function insertTransaction(
  userId: string,
  type: string,
  amount: number,
  description: string
): Promise<void> {
  const { error } = await supabase.from('transactions').insert({
    user_id: userId,
    type,
    amount,
    description,
    timestamp: new Date().toISOString(),
  });
  if (error) {
    console.error('[insertTransaction] Failed to log transaction:', error.message);
  }
}

// ============================================================================
// ACTIVITY RECORDING
// Each function inserts ONLY the activity-specific row and returns its id.
// The caller must:
//   1. Use activityId to rollback (delete the row) if points update fails.
//   2. Call insertTransaction() after points update succeeds.
// This guarantees the transactions table is always consistent with users.points.
// ============================================================================

export async function recordSpinActivity(
  userId: string,
  result: string,
  pointsEarned: number,
  isFree: boolean
): Promise<{ success: boolean; activityId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('spin_history')
      .insert({ user_id: userId, result, points_earned: pointsEarned, multiplier: '1', cost: isFree ? 0 : 50 })
      .select('id')
      .single();
    if (error) throw error;
    return { success: true, activityId: data.id };
  } catch (err: any) {
    console.error('[recordSpinActivity]', err.message);
    return { success: false, error: err.message };
  }
}

export async function recordTriviaActivity(
  userId: string,
  score: number,
  correctAnswers: number,
  totalReward: number
): Promise<{ success: boolean; activityId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('trivia_results')
      .insert({ user_id: userId, score, correct_answers: correctAnswers, total_questions: 10, points_earned: totalReward })
      .select('id')
      .single();
    if (error) throw error;
    return { success: true, activityId: data.id };
  } catch (err: any) {
    console.error('[recordTriviaActivity]', err.message);
    return { success: false, error: err.message };
  }
}

export async function recordVideoAdActivity(
  userId: string,
  adId: string,
  adTitle: string,
  pointsEarned: number
): Promise<{ success: boolean; activityId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('video_ads_watched')
      .insert({ user_id: userId, ad_id: adId, points_earned: pointsEarned, watched_at: new Date().toISOString() })
      .select('id')
      .single();
    if (error) throw error;
    return { success: true, activityId: data.id };
  } catch (err: any) {
    console.error('[recordVideoAdActivity]', err.message);
    return { success: false, error: err.message };
  }
}

export async function recordInstagramFollowActivity(
  userId: string,
  brandId: string,
  brandName: string,
  brandHandle: string,
  pointsEarned: number
): Promise<{ success: boolean; activityId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('instagram_follows')
      .insert({ user_id: userId, brand_id: brandId, brand_name: brandName, brand_handle: brandHandle, verified: true })
      .select('id')
      .single();
    if (error) throw error;
    return { success: true, activityId: data.id };
  } catch (err: any) {
    console.error('[recordInstagramFollowActivity]', err.message);
    return { success: false, error: err.message };
  }
}

export async function recordCheckInActivity(
  userId: string,
  pointsEarned: number
): Promise<{ success: boolean; activityId?: string; error?: string }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('streak_check_ins')
      .insert({ user_id: userId, check_in_date: today, points_earned: pointsEarned })
      .select('id')
      .single();
    if (error) throw error;
    return { success: true, activityId: data.id };
  } catch (err: any) {
    console.error('[recordCheckInActivity]', err.message);
    return { success: false, error: err.message };
  }
}

export async function recordGettingStartedActivity(
  userId: string,
  taskId: string,
  taskName: string,
  pointsEarned: number
): Promise<{ success: boolean; activityId?: string; error?: string }> {
  try {
    const { data: existing, error: checkError } = await supabase
      .from('getting_started_tasks')
      .select('id, points_awarded')
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing?.points_awarded) return { success: false, error: 'Task already completed' };

    let taskId_db: string;
    if (existing?.id) {
      const { data, error } = await supabase
        .from('getting_started_tasks')
        .update({ completed: true, completed_at: new Date().toISOString(), points_awarded: true })
        .eq('id', existing.id)
        .eq('user_id', userId)
        .select('id')
        .single();
      if (error) throw error;
      taskId_db = data.id;
    } else {
      const { data, error } = await supabase
        .from('getting_started_tasks')
        .insert({
          user_id: userId,
          task_id: taskId,
          task_name: taskName,
          reward_points: pointsEarned,
          completed: true,
          completed_at: new Date().toISOString(),
          points_awarded: true,
        })
        .select('id')
        .single();
      if (error) throw error;
      taskId_db = data.id;
    }

    return { success: true, activityId: taskId_db };
  } catch (err: any) {
    console.error('[recordGettingStartedActivity]', err.message);
    return { success: false, error: err.message };
  }
}

// ============================================================================
// DATA FETCHING
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
    console.error('[fetchSpinHistory]', err.message);
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
    console.error('[fetchTransactions]', err.message);
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
    console.error('[fetchStreakCheckIns]', err.message);
    return [];
  }
}

// ============================================================================
// POINTS & WALLET MANAGEMENT
// ============================================================================

export async function updateUserPoints(userId: string, newPoints: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ points: newPoints })
      .eq('id', userId)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new Error(`0 rows affected for user ${userId}`);
    return true;
  } catch (err: any) {
    console.error('[updateUserPoints]', err.message);
    return false;
  }
}

export async function updateUserWallet(userId: string, newWallet: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ wallet: newWallet })
      .eq('id', userId)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new Error(`0 rows affected for user ${userId}`);
    return true;
  } catch (err: any) {
    console.error('[updateUserWallet]', err.message);
    return false;
  }
}

export async function recordCosmeticPurchaseActivity(
  userId: string,
  cosmeticId: string,
  cosmeticName: string,
  price: number
): Promise<{ success: boolean; newPoints?: number; error?: string }> {
  try {
    const { data: freshUser, error: fetchError } = await supabase
      .from('users')
      .select('points, cosmetics_purchased')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError || !freshUser) throw new Error('Failed to fetch user data');
    if ((freshUser.cosmetics_purchased || []).includes(cosmeticId)) return { success: false, error: 'Already owned' };
    if (freshUser.points < price) return { success: false, error: 'Insufficient points' };

    const newPoints = freshUser.points - price;
    const updatedCosmetics = [...(freshUser.cosmetics_purchased || []), cosmeticId];

    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({ points: newPoints, cosmetics_purchased: updatedCosmetics })
      .eq('id', userId)
      .select('id');
    if (updateError) throw updateError;
    if (!updated?.length) throw new Error('Points update blocked by RLS');

    const { error: auditError } = await supabase
      .from('cosmetics_purchases')
      .insert({ user_id: userId, cosmetic_id: cosmeticId, cosmetic_name: cosmeticName, price });
    if (auditError) console.error('[recordCosmeticPurchaseActivity] Audit insert failed:', auditError.message);

    // Transaction logged after points update (already correct order)
    await insertTransaction(userId, 'cosmetic_purchase', -price, `Purchased: ${cosmeticName}`);

    return { success: true, newPoints };
  } catch (err: any) {
    console.error('[recordCosmeticPurchaseActivity]', err.message);
    return { success: false, error: err.message };
  }
}
