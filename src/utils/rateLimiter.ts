import { supabase } from '../config/supabase'

export interface RateLimitCheckResult {
  allowed: boolean
  reason?: string
  secondsRemaining?: number
  currentDailyCount?: number
  currentWeeklyCount?: number
  dailyLimit?: number
  weeklyLimit?: number
  hourlyLimit?: number
  cooldownSeconds?: number
}

export interface RateLimitRecordResult {
  success: boolean
  countToday: number
  countThisWeek: number
  cooldownUntil?: string
}

/**
 * Check if user can perform an action based on rate limits
 */
export async function checkRateLimit(
  userId: string,
  featureName: string
): Promise<RateLimitCheckResult> {
  try {
    const { data, error } = await supabase.functions.invoke('check-rate-limit', {
      body: { userId, featureName }
    })

    if (error) throw error
    return data
  } catch (err) {
    console.error('Rate limit check failed:', err)
    // Default to allowing if check fails
    return { allowed: true }
  }
}

/**
 * Record that user performed an action (increments counters)
 */
export async function recordRateLimitAction(
  userId: string,
  featureName: string
): Promise<RateLimitRecordResult> {
  try {
    const { data, error } = await supabase.functions.invoke('record-rate-limit', {
      body: { userId, featureName }
    })

    if (error) throw error
    return data
  } catch (err) {
    console.error('Rate limit recording failed:', err)
    throw err
  }
}

/**
 * Log an admin action for audit trail
 */
export async function logAdminAction(
  actionType: string,
  targetUserId?: string,
  targetResourceId?: string,
  resourceType?: string,
  details?: Record<string, any>
): Promise<any> {
  try {
    const { data, error } = await supabase.functions.invoke('log-admin-action', {
      body: {
        actionType,
        targetUserId,
        targetResourceId,
        resourceType,
        details
      }
    })

    if (error) throw error
    return data
  } catch (err) {
    console.error('Admin action logging failed:', err)
    throw err
  }
}

/**
 * Get current feature limits configuration
 */
export async function getFeatureLimits(featureName: string) {
  try {
    const { data, error } = await supabase
      .from('feature_limits')
      .select('*')
      .eq('feature_name', featureName)
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Failed to fetch feature limits:', err)
    return null
  }
}

/**
 * Helper to check rate limit and provide user-friendly message
 */
export async function checkAndNotify(
  userId: string,
  featureName: string,
  featureDisplayName: string
): Promise<{ allowed: boolean; message?: string }> {
  const result = await checkRateLimit(userId, featureName)

  if (!result.allowed) {
    if (result.reason?.includes('cooldown')) {
      return {
        allowed: false,
        message: `You can use this again in ${result.secondsRemaining} seconds.`
      }
    }
    if (result.reason?.includes('Daily limit')) {
      return {
        allowed: false,
        message: `You've reached your daily limit for ${featureDisplayName} (${result.currentDailyCount}/${result.dailyLimit}). Try again tomorrow!`
      }
    }
    if (result.reason?.includes('Weekly limit')) {
      return {
        allowed: false,
        message: `You've reached your weekly limit for ${featureDisplayName} (${result.currentWeeklyCount}/${result.weeklyLimit}). Try again next week!`
      }
    }
    if (result.reason?.includes('Hourly limit')) {
      return {
        allowed: false,
        message: `You're using ${featureDisplayName} too frequently. Please wait a bit before trying again.`
      }
    }
    return {
      allowed: false,
      message: result.reason || 'Action not allowed at this time.'
    }
  }

  return { allowed: true }
}

/**
 * Format remaining usage for display
 */
export function formatRemainingUsage(
  current: number,
  limit: number,
  period: 'day' | 'week' | 'hour' = 'day'
): string {
  const remaining = Math.max(0, limit - current)
  const periodText = period === 'hour' ? 'hour' : period === 'week' ? 'week' : 'day'
  return `${remaining} ${periodText === 'hour' ? 'uses' : `uses per ${periodText}`} remaining`
}
