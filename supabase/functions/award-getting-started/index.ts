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
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') || '' }
        }
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: corsHeaders
      })
    }

    const { taskId, taskName, rewardPoints } = await req.json()

    if (!taskId || !taskName || rewardPoints === undefined) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: corsHeaders
      })
    }

    // Check if task already completed
    const { data: existingTask } = await supabase
      .from('getting_started_tasks')
      .select('id, points_awarded')
      .eq('user_id', user.id)
      .eq('task_id', taskId)
      .single()

    if (existingTask?.points_awarded) {
      return new Response(JSON.stringify({
        error: 'Task already completed and points awarded',
        success: false
      }), {
        status: 400,
        headers: corsHeaders
      })
    }

    // Get current user points
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('points')
      .eq('id', user.id)
      .single()

    if (userError) throw userError

    const currentPoints = userData?.points || 0
    const newPoints = currentPoints + rewardPoints

    // Start transaction - update user points
    const { error: updateError } = await supabase
      .from('users')
      .update({
        points: newPoints,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) throw updateError

    // Upsert getting_started_tasks record
    const { error: taskError } = await supabase
      .from('getting_started_tasks')
      .upsert({
        user_id: user.id,
        task_id: taskId,
        task_name: taskName,
        reward_points: rewardPoints,
        completed: true,
        completed_at: new Date().toISOString(),
        points_awarded: true,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,task_id'
      })

    if (taskError) throw taskError

    return new Response(JSON.stringify({
      success: true,
      pointsAwarded: rewardPoints,
      newTotalPoints: newPoints
    }), {
      status: 200,
      headers: corsHeaders
    })
  } catch (error) {
    console.error('Award getting started error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})
