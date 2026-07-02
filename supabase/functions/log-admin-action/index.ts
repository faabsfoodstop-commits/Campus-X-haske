import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { adminId, actionType, targetUserId, resourceType, details } = await req.json();

    if (!adminId || !actionType) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Verify admin status
    const { data: admin, error: adminError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", adminId)
      .single();

    if (adminError || !admin?.is_admin) {
      return new Response(JSON.stringify({ error: "Unauthorized - admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get client IP from request headers
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Log the action
    const { data, error } = await supabase
      .from("admin_audit_log")
      .insert({
        admin_id: adminId,
        action_type: actionType,
        target_user_id: targetUserId || null,
        resource_type: resourceType || null,
        details: details || null,
        ip_address: ip,
        user_agent: userAgent,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
