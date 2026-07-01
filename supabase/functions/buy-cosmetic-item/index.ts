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

    const { cosmeticId, cosmeticName, price, userId } = await req.json();

    if (!userId || !cosmeticId || !price) {
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

    // Check if user already owns it
    if (user.cosmetics_purchased && user.cosmetics_purchased.includes(cosmeticId)) {
      return new Response(JSON.stringify({ error: "Already owned" }), {
        status: 400,
      });
    }

    // Check if user has enough points
    if (user.points < price) {
      return new Response(
        JSON.stringify({ error: "Insufficient points" }),
        { status: 400 }
      );
    }

    // Deduct points
    const newPoints = user.points - price;
    const updatedCosmetics = [...(user.cosmetics_purchased || []), cosmeticId];

    const { error: updateError } = await supabase
      .from("users")
      .update({
        points: newPoints,
        cosmetics_purchased: updatedCosmetics,
      })
      .eq("id", userId);

    if (updateError) {
      return new Response(JSON.stringify({ error: "Failed to purchase" }), {
        status: 500,
      });
    }

    // Log transaction
    await supabase.from("transactions").insert({
      user_id: userId,
      type: "cosmetic_purchase",
      description: `Purchased: ${cosmeticName}`,
      amount: -price,
    });

    // Record purchase
    await supabase.from("cosmetics_purchases").insert({
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
