import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { userId, featureName } = await req.json();

    if (!userId || !featureName) {
      return new Response(JSON.stringify({ error: "Missing userId or featureName" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get feature limits
    const { data: limits } = await supabase
      .from("feature_limits")
      .select("*")
      .eq("feature_name", featureName)
      .single();

    if (!limits) {
      return new Response(JSON.stringify({ allowed: false, message: "Feature not configured" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user's rate limit record
    const { data: userLimitArray } = await supabase
      .from("rate_limits")
      .select("*")
      .eq("user_id", userId)
      .eq("feature_name", featureName);

    const userLimit = userLimitArray?.[0] || null;

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // Check if cooldown active
    if (userLimit?.cooldown_until) {
      const cooldownUntil = new Date(userLimit.cooldown_until);
      if (now < cooldownUntil) {
        const secondsRemaining = Math.ceil((cooldownUntil.getTime() - now.getTime()) / 1000);
        return new Response(
          JSON.stringify({
            allowed: false,
            message: `Please wait ${secondsRemaining}s before trying again`,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Check daily limit
    if (limits.daily_limit && userLimit?.reset_at_date === today && userLimit.count_today >= limits.daily_limit) {
      return new Response(
        JSON.stringify({ allowed: false, message: `Daily limit reached (${limits.daily_limit}/${limits.daily_limit})` }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check weekly limit
    if (limits.weekly_limit && userLimit?.count_this_week >= limits.weekly_limit) {
      return new Response(
        JSON.stringify({ allowed: false, message: `Weekly limit reached (${limits.weekly_limit}/${limits.weekly_limit})` }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const remaining = limits.daily_limit ? limits.daily_limit - (userLimit?.count_today || 0) : null;

    return new Response(
      JSON.stringify({ allowed: true, message: "Action allowed", remaining }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
