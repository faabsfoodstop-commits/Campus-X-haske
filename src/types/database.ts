/**
 * DATABASE SCHEMA - Single Source of Truth
 * This file defines all database table types that match supabase-schema-safe.sql
 * Any column name changes must be updated HERE FIRST, then everywhere else
 */

export interface User {
  id: string;
  email: string;
  full_name?: string;
  name?: string;
  university?: string;
  department?: string;
  course?: string;
  points: number;
  wallet: number;
  cosmetics_purchased?: string[];
  profile_complete: boolean;
  premium_tier?: string;
  premium_until?: string;
  premium_active: boolean;
  current_streak: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'spin_wheel' | 'trivia' | 'check_in' | 'getting_started' | 'mission' | 'weekly_challenge' | 'video_ad' | 'referral' | 'cosmetic_purchase';
  description?: string;
  amount: number;
  timestamp: string;
}

export interface SpinHistory {
  id: string;
  user_id: string;
  result: string;
  points_earned: number;
  multiplier?: string;
  cost: number;
  created_at: string;
}

export interface TriviaResult {
  id: string;
  user_id: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  points_earned: number;
  created_at: string;
}

export interface StreakCheckIn {
  id: string;
  user_id: string;
  check_in_date: string;
  points_earned: number;
  created_at: string;
}

export interface VideoAdWatched {
  id: string;
  user_id: string;
  ad_id: string;
  ad_title: string;
  points_earned: number;
  watched_date: string;
  duration: number;
  created_at: string;
}

export interface DailyMission {
  id: string;
  user_id: string;
  mission_id: string;
  mission_name?: string;
  base_reward: number;
  completed: boolean;
  completed_at?: string;
  created_at: string;
}

export interface WeeklyChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  claimed: boolean;
  claimed_at?: string;
  created_at: string;
}

export interface FeatureLimit {
  id: string;
  feature_name: string;
  daily_limit?: number;
  weekly_limit?: number;
  hourly_limit?: number;
  cooldown_seconds?: number;
  created_at: string;
}

export interface RateLimit {
  id: string;
  user_id: string;
  feature_name: string;
  count_today: number;
  count_this_week: number;
  last_action_timestamp: string;
  cooldown_until?: string;
  reset_at_date: string;
  updated_at: string;
}

export interface InstagramFollow {
  id: string;
  user_id: string;
  brand_id: string;
  brand_name: string;
  brand_handle: string;
  verified: boolean;
  created_at: string;
}

export interface GettingStartedTask {
  id: string;
  user_id: string;
  task_id: string;
  task_name: string;
  points_awarded: number;
  completed_at: string;
}
