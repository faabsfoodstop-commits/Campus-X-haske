import { serve } from "https://raw.githubusercontent.com/denoland/std/0.208.0/http/server.ts";
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
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { userId, missionId, missionName, baseReward } = await req.json();

    if (!userId || !missionId || !baseReward) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record mission completion FIRST — atomic duplicate guard
    const { error: missionError } = await supabaseClient.from("daily_missions").insert({
      user_id: userId,
      mission_id: missionId,
      mission_name: missionName,
      base_reward: baseReward,
      completed: true,
    });
    if (missionError) {
      return new Response(
        JSON.stringify({ error: "Failed to record mission or already completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch fresh user data AFTER recording
    const { data: user, error: userError } = await supabaseClient
      .from("users")
      .select("points, premium_until")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has premium
    const isPremium =
      user.premium_until && new Date(user.premium_until) > new Date();
    const multiplier = isPremium ? 2 : 1;
    const pointsAwarded = baseReward * multiplier;

    // Update user points
    const { error: updateError } = await supabaseClient
      .from("users")
      .update({ points: (user.points || 0) + pointsAwarded })
      .eq("id", userId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update points" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log transaction
    await supabaseClient.from("transactions").insert({
      user_id: userId,
      type: "mission",
      description: `Completed mission: ${missionName}`,
      amount: pointsAwarded,
      created_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        pointsAwarded,
        multiplier,
        message: `Awarded ${pointsAwarded} points!`,
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
