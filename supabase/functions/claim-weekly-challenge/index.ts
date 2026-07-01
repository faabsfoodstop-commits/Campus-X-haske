import { serve } from "https://esm.sh/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userId, challengeId, bonus } = await req.json();

    if (!userId || !challengeId || !bonus) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user data
    const { data: user, error: userError } = await supabaseClient
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already claimed
    const { data: existing } = await supabaseClient
      .from("weekly_challenges")
      .select("*")
      .eq("user_id", userId)
      .eq("challenge_id", challengeId)
      .single();

    if (existing && existing.claimed) {
      return new Response(
        JSON.stringify({ error: "Already claimed this week" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has premium
    const isPremium =
      user.premium_until && new Date(user.premium_until) > new Date();
    const multiplier = isPremium ? 2 : 1;
    const bonusAwarded = bonus * multiplier;

    // Update points
    const newPoints = user.points + bonusAwarded;
    const { error: updateError } = await supabaseClient
      .from("users")
      .update({ points: newPoints })
      .eq("id", userId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to claim reward" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log transaction
    await supabaseClient.from("transactions").insert({
      user_id: userId,
      type: "weekly_challenge",
      description: `Claimed weekly challenge: ${challengeId}`,
      amount: bonusAwarded,
      base_bonus: bonus,
      multiplier: multiplier,
    });

    // Record claim
    if (existing) {
      await supabaseClient
        .from("weekly_challenges")
        .update({ claimed: true, claimed_at: new Date() })
        .eq("id", existing.id);
    } else {
      await supabaseClient.from("weekly_challenges").insert({
        user_id: userId,
        challenge_id: challengeId,
        claimed: true,
        claimed_at: new Date(),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        bonusAwarded,
        multiplier,
        message: `Claimed ${bonusAwarded} bonus points!`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
