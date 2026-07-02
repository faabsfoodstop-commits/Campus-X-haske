import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const { userId, featureName } = await req.json();
    if (!userId || !featureName) {
      return new Response(JSON.stringify({ error: "Missing userId or featureName" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Get feature limits
    const { data: limits } = await supabase
      .from("feature_limits")
      .select("*")
      .eq("feature_name", featureName);

    if (!limits || limits.length === 0) {
      return new Response(JSON.stringify({ error: "Feature not configured" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const limit = limits[0];
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const cooldownUntil = limit.cooldown_seconds
      ? new Date(now.getTime() + limit.cooldown_seconds * 1000).toISOString()
      : null;

    // Get current counts
    const { data: current } = await supabase
      .from("rate_limits")
      .select("count_today, count_this_week")
      .eq("user_id", userId)
      .eq("feature_name", featureName);

    const currentRecord = current?.[0];
    const countToday = (currentRecord?.count_today || 0) + 1;
    const countThisWeek = (currentRecord?.count_this_week || 0) + 1;

    // Upsert rate limit record
    const { error } = await supabase
      .from("rate_limits")
      .upsert({
        user_id: userId,
        feature_name: featureName,
        count_today: countToday,
        count_this_week: countThisWeek,
        last_action_timestamp: now.toISOString(),
        cooldown_until: cooldownUntil,
        reset_at_date: today,
        updated_at: now.toISOString(),
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, countToday, countThisWeek }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
