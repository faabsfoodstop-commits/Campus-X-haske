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

    const { taskId, taskName, rewardPoints, userId } = await req.json();
    if (!taskId || !taskName || !rewardPoints || !userId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Check if task already completed
    const { data: existing } = await supabase
      .from("getting_started_tasks")
      .select("points_awarded")
      .eq("user_id", userId)
      .eq("task_id", taskId);

    if (existing && existing.length > 0 && existing[0].points_awarded) {
      return new Response(
        JSON.stringify({ error: "Task already completed", success: false }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user's current points
    const { data: users } = await supabase
      .from("users")
      .select("points")
      .eq("id", userId);

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const newPoints = (users[0].points || 0) + rewardPoints;

    // Update user points
    const { error: updateError } = await supabase
      .from("users")
      .update({ points: newPoints, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (updateError) throw updateError;

    // Record task completion
    const { error: taskError } = await supabase
      .from("getting_started_tasks")
      .upsert({
        user_id: userId,
        task_id: taskId,
        task_name: taskName,
        reward_points: rewardPoints,
        completed: true,
        completed_at: new Date().toISOString(),
        points_awarded: true,
      });

    if (taskError) throw taskError;

    return new Response(
      JSON.stringify({ success: true, newPoints }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
