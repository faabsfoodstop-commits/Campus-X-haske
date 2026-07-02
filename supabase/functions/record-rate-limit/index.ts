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
    const { data: limitsArray } = await supabase
      .from("feature_limits")
      .select("*")
      .eq("feature_name", featureName);

    const limits = limitsArray?.[0];
    if (!limits) {
      return new Response(JSON.stringify({ error: "Feature not configured" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const cooldownUntil = limits.cooldown_seconds
      ? new Date(now.getTime() + limits.cooldown_seconds * 1000).toISOString()
      : null;

    // Get current counts
    const { data: currentArray } = await supabase
      .from("rate_limits")
      .select("count_today, count_this_week")
      .eq("user_id", userId)
      .eq("feature_name", featureName);

    const current = currentArray?.[0];
    const countToday = (current?.count_today || 0) + 1;
    const countThisWeek = (current?.count_this_week || 0) + 1;

    // Upsert rate limit record
    const { data: dataArray, error } = await supabase
      .from("rate_limits")
      .upsert(
        {
          user_id: userId,
          feature_name: featureName,
          count_today: countToday,
          count_this_week: countThisWeek,
          last_action_timestamp: now.toISOString(),
          cooldown_until: cooldownUntil,
          reset_at_date: today,
          updated_at: now.toISOString(),
        },
        { onConflict: "user_id,feature_name" }
      )
      .select();

    const data = dataArray?.[0];

    if (error) {
      throw error;
    }

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
