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

    const { missionId, missionName, baseReward, userId } = await req.json();

    if (!userId || !missionId || !baseReward) {
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

    // Check if user has premium
    const isPremium =
      user.premium_until && new Date(user.premium_until) > new Date();
    const multiplier = isPremium ? 2 : 1;
    const pointsAwarded = baseReward * multiplier;

    // Update user points
    const { error: updateError } = await supabase
      .from("users")
      .update({ points: user.points + pointsAwarded })
      .eq("id", userId);

    if (updateError) {
      return new Response(JSON.stringify({ error: "Failed to update points" }), {
        status: 500,
      });
    }

    // Log transaction
    await supabase.from("transactions").insert({
      user_id: userId,
      type: "mission_reward",
      description: `Completed mission: ${missionName}`,
      amount: pointsAwarded,
      base_bonus: baseReward,
      multiplier: multiplier,
    });

    // Record mission completion
    await supabase.from("daily_missions").insert({
      user_id: userId,
      mission_id: missionId,
      mission_name: missionName,
      base_reward: baseReward,
      completed: true,
    });

    return new Response(
      JSON.stringify({
        success: true,
        pointsAwarded,
        multiplier,
        message: `Awarded ${pointsAwarded} points!`,
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
