import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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

    // Get feature limits for cooldown
    const { data: featureLimit } = await supabase
      .from('feature_limits')
      .select('cooldown_seconds')
      .eq('feature_name', featureName)
      .single()

    const now = new Date()
    const cooldownUntil = featureLimit?.cooldown_seconds
      ? new Date(now.getTime() + featureLimit.cooldown_seconds * 1000)
      : null

    // Get or create rate limit record
    const { data: existingLimit } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('feature_name', featureName)
      .single()

    const today = new Date().toDateString()
    let countToday = 1
    let countThisWeek = 1

    if (existingLimit) {
      countToday = (existingLimit.reset_at_date === today ? existingLimit.count_today : 0) + 1

      // Week calculation (Monday to Sunday)
      const lastMonday = new Date()
      lastMonday.setDate(lastMonday.getDate() - lastMonday.getDay() + 1)
      const lastMondayStr = lastMonday.toDateString()

      const lastWeekMonday = existingLimit.reset_at_date
        ? new Date(existingLimit.reset_at_date)
        : null

      countThisWeek =
        lastWeekMonday && lastWeekMonday >= lastMonday
          ? existingLimit.count_this_week + 1
          : 1
    }

    // Update rate limit record
    const { error: updateError } = await supabase
      .from('rate_limits')
      .upsert({
        user_id: userId,
        feature_name: featureName,
        count_today: countToday,
        count_this_week: countThisWeek,
        last_action_timestamp: now.toISOString(),
        cooldown_until: cooldownUntil?.toISOString(),
        reset_at_date: today,
        updated_at: now.toISOString()
      })

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({
        success: true,
        countToday,
        countThisWeek,
        cooldownUntil: cooldownUntil?.toISOString()
      }),
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Record rate limit error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})
