import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { taskId, taskName, rewardPoints, userId } = await req.json();

    if (!taskId || !taskName || !rewardPoints || !userId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Check if task already completed
    const { data: existingArray } = await supabase
      .from("getting_started_tasks")
      .select("points_awarded")
      .eq("user_id", userId)
      .eq("task_id", taskId);

    const existing = existingArray?.[0];
    if (existing?.points_awarded) {
      return new Response(
        JSON.stringify({ error: "Task already completed and points awarded", success: false }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Award points to user
    const { data: userArray, error: userError } = await supabase
      .from("users")
      .select("points")
      .eq("id", userId);

    const user = userArray?.[0];

    if (userError || !user) {
      throw userError || new Error("User not found");
    }

    const newPoints = (user.points || 0) + rewardPoints;

    // Update user points
    const { error: updateError } = await supabase
      .from("users")
      .update({ points: newPoints, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (updateError) throw updateError;

    // Record task completion
    const { error: taskError } = await supabase
      .from("getting_started_tasks")
      .upsert(
        {
          user_id: userId,
          task_id: taskId,
          task_name: taskName,
          reward_points: rewardPoints,
          completed: true,
          completed_at: new Date().toISOString(),
          points_awarded: true,
        },
        { onConflict: "user_id,task_id" }
      );

    if (taskError) throw taskError;

    return new Response(
      JSON.stringify({ success: true, newPoints }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
