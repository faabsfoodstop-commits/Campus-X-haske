import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
      });
    }

    const { challengeId, bonus, userId } = await req.json();

    if (!userId || !challengeId || !bonus) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
      });
    }

    // Get user data
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    // Check if already claimed
    const { data: existing } = await supabase
      .from("weekly_challenges")
      .select("*")
      .eq("user_id", userId)
      .eq("challenge_id", challengeId)
      .single();

    if (existing && existing.claimed) {
      return new Response(
        JSON.stringify({ error: "Already claimed this week" }),
        { status: 400 }
      );
    }

    // Check if user has premium
    const isPremium =
      user.premium_until && new Date(user.premium_until) > new Date();
    const multiplier = isPremium ? 2 : 1;
    const bonusAwarded = bonus * multiplier;

    // Update points
    const newPoints = user.points + bonusAwarded;
    const { error: updateError } = await supabase
      .from("users")
      .update({ points: newPoints })
      .eq("id", userId);

    if (updateError) {
      return new Response(JSON.stringify({ error: "Failed to claim reward" }), {
        status: 500,
      });
    }

    // Log transaction
    await supabase.from("transactions").insert({
      user_id: userId,
      type: "weekly_challenge",
      description: `Claimed weekly challenge: ${challengeId}`,
      amount: bonusAwarded,
      base_bonus: bonus,
      multiplier: multiplier,
    });

    // Record claim
    if (existing) {
      await supabase
        .from("weekly_challenges")
        .update({ claimed: true, claimed_at: new Date() })
        .eq("id", existing.id);
    } else {
      await supabase.from("weekly_challenges").insert({
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
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
