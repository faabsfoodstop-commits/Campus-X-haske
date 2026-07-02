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

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: corsHeaders
      })
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!adminUser?.is_admin) {
      return new Response(JSON.stringify({ error: 'Not authorized - admin only' }), {
        status: 403,
        headers: corsHeaders
      })
    }

    const {
      actionType,
      targetUserId,
      targetResourceId,
      resourceType,
      details
    } = await req.json()

    if (!actionType) {
      return new Response(JSON.stringify({ error: 'Missing actionType' }), {
        status: 400,
        headers: corsHeaders
      })
    }

    // Get IP address from headers
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] ||
                      req.headers.get('x-real-ip') ||
                      'unknown'

    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Insert audit log
    const { error: insertError, data: auditLog } = await supabase
      .from('admin_audit_log')
      .insert({
        admin_id: user.id,
        action_type: actionType,
        target_user_id: targetUserId,
        target_resource_id: targetResourceId,
        resource_type: resourceType,
        details,
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'completed',
        timestamp: new Date().toISOString()
      })
      .select()

    if (insertError) {
      throw insertError
    }

    return new Response(JSON.stringify({ success: true, auditLog }), {
      status: 200,
      headers: corsHeaders
    })
  } catch (error) {
    console.error('Log admin action error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})
