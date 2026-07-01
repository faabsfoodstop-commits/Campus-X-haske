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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userId, cosmeticId, cosmeticName, price } = await req.json();

    if (!userId || !cosmeticId || !price) {
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

    // Check if user already owns it
    if (user.cosmetics_purchased && user.cosmetics_purchased.includes(cosmeticId)) {
      return new Response(
        JSON.stringify({ error: "Already owned" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has enough points
    if (user.points < price) {
      return new Response(
        JSON.stringify({ error: "Insufficient points" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduct points
    const newPoints = user.points - price;
    const updatedCosmetics = [...(user.cosmetics_purchased || []), cosmeticId];

    const { error: updateError } = await supabaseClient
      .from("users")
      .update({
        points: newPoints,
        cosmetics_purchased: updatedCosmetics,
      })
      .eq("id", userId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to purchase" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log transaction
    await supabaseClient.from("transactions").insert({
      user_id: userId,
      type: "cosmetic_purchase",
      description: `Purchased: ${cosmeticName}`,
      amount: -price,
    });

    // Record purchase
    await supabaseClient.from("cosmetics_purchases").insert({
      user_id: userId,
      cosmetic_id: cosmeticId,
      cosmetic_name: cosmeticName,
      price: price,
    });

    return new Response(
      JSON.stringify({
        success: true,
        newPoints,
        message: `${cosmeticName} purchased!`,
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
