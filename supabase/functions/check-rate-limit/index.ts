import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || ''
    )

    const { userId, featureName } = await req.json()

    if (!userId || !featureName) {
      return new Response(
        JSON.stringify({ error: 'Missing userId or featureName' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Get feature limits
    const { data: featureLimit, error: limitError } = await supabase
      .from('feature_limits')
      .select('*')
      .eq('feature_name', featureName)
      .single()

    if (limitError || !featureLimit) {
      return new Response(
        JSON.stringify({ error: 'Feature limit not found' }),
        { status: 404, headers: corsHeaders }
      )
    }

    if (!featureLimit.enabled) {
      return new Response(
        JSON.stringify({ allowed: false, reason: 'Feature is disabled' }),
        { status: 200, headers: corsHeaders }
      )
    }

    // Get current user limits
    const { data: rateLimit, error: rateLimitError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('feature_name', featureName)
      .single()

    // Check cooldown
    if (rateLimit?.cooldown_until && new Date(rateLimit.cooldown_until) > new Date()) {
      const secondsRemaining = Math.ceil(
        (new Date(rateLimit.cooldown_until).getTime() - new Date().getTime()) / 1000
      )
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: 'Feature is on cooldown',
          secondsRemaining
        }),
        { status: 200, headers: corsHeaders }
      )
    }

    // Check daily limit
    if (featureLimit.daily_limit) {
      const today = new Date().toDateString()
      if (rateLimit?.reset_at_date !== today) {
        // Reset daily count
        await supabase
          .from('rate_limits')
          .update({ count_today: 0, reset_at_date: today })
          .eq('user_id', userId)
          .eq('feature_name', featureName)
      }

      if ((rateLimit?.count_today || 0) >= featureLimit.daily_limit) {
        return new Response(
          JSON.stringify({
            allowed: false,
            reason: `Daily limit exceeded (${featureLimit.daily_limit} per day)`,
            currentCount: rateLimit?.count_today || 0,
            limit: featureLimit.daily_limit
          }),
          { status: 200, headers: corsHeaders }
        )
      }
    }

    // Check weekly limit
    if (featureLimit.weekly_limit) {
      if ((rateLimit?.count_this_week || 0) >= featureLimit.weekly_limit) {
        return new Response(
          JSON.stringify({
            allowed: false,
            reason: `Weekly limit exceeded (${featureLimit.weekly_limit} per week)`,
            currentCount: rateLimit?.count_this_week || 0,
            limit: featureLimit.weekly_limit
          }),
          { status: 200, headers: corsHeaders }
        )
      }
    }

    // Check hourly limit
    if (featureLimit.hourly_limit) {
      const oneHourAgo = new Date(new Date().getTime() - 3600000)
      if (rateLimit?.last_action_timestamp && new Date(rateLimit.last_action_timestamp) > oneHourAgo) {
        if ((rateLimit?.count_today || 0) >= featureLimit.hourly_limit) {
          return new Response(
            JSON.stringify({
              allowed: false,
              reason: `Hourly limit exceeded (${featureLimit.hourly_limit} per hour)`,
              currentCount: rateLimit?.count_today || 0,
              limit: featureLimit.hourly_limit
            }),
            { status: 200, headers: corsHeaders }
          )
        }
      }
    }

    // All checks passed
    return new Response(
      JSON.stringify({
        allowed: true,
        currentDailyCount: rateLimit?.count_today || 0,
        currentWeeklyCount: rateLimit?.count_this_week || 0,
        dailyLimit: featureLimit.daily_limit,
        weeklyLimit: featureLimit.weekly_limit,
        hourlyLimit: featureLimit.hourly_limit,
        cooldownSeconds: featureLimit.cooldown_seconds
      }),
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Rate limit check error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})
