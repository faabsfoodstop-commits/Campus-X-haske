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

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      token || Deno.env.get("SUPABASE_ANON_KEY") || ""
    );

    // Get feature limits
    const { data: limits } = await supabase
      .from("feature_limits")
      .select("*")
      .eq("feature_name", featureName);

    if (!limits || limits.length === 0) {
      return new Response(
        JSON.stringify({ allowed: false, message: "Feature not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const limit = limits[0];
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // Get user's rate limit record
    const { data: userLimits } = await supabase
      .from("rate_limits")
      .select("*")
      .eq("user_id", userId)
      .eq("feature_name", featureName);

    const userLimit = userLimits?.[0];

    // Check if cooldown active
    if (userLimit?.cooldown_until) {
      const cooldownUntil = new Date(userLimit.cooldown_until);
      if (now < cooldownUntil) {
        const secondsRemaining = Math.ceil((cooldownUntil.getTime() - now.getTime()) / 1000);
        return new Response(
          JSON.stringify({
            allowed: false,
            message: `Please wait ${secondsRemaining}s before trying again`,
            reason: `cooldown - ${secondsRemaining}s remaining`,
            secondsRemaining,
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Check daily limit
    if (limit.daily_limit && userLimit?.reset_at_date === today && userLimit.count_today >= limit.daily_limit) {
      return new Response(
        JSON.stringify({
          allowed: false,
          message: `Daily limit reached (${limit.daily_limit}/${limit.daily_limit})`,
          reason: `Daily limit reached`,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check weekly limit
    if (limit.weekly_limit && userLimit?.count_this_week >= limit.weekly_limit) {
      return new Response(
        JSON.stringify({
          allowed: false,
          message: `Weekly limit reached (${limit.weekly_limit}/${limit.weekly_limit})`,
          reason: `Weekly limit reached`,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const remaining = limit.daily_limit ? limit.daily_limit - (userLimit?.count_today || 0) : null;

    return new Response(
      JSON.stringify({
        allowed: true,
        message: "Action allowed",
        remaining,
        dailyLimit: limit.daily_limit,
        weeklyLimit: limit.weekly_limit,
        hourlyLimit: limit.hourly_limit,
        currentDailyCount: userLimit?.count_today || 0,
        currentWeeklyCount: userLimit?.count_this_week || 0,
      }),
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
