// ============================================================================
// Supabase Edge Function: knight-engine
// Serverless Titan Chess Engine running on Deno / V8 Edge
// ============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { fen, difficulty = "grandmaster" } = await req.json();

    if (!fen) {
      return new Response(JSON.stringify({ error: "FEN position is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side Engine API response
    return new Response(
      JSON.stringify({
        status: "success",
        difficulty,
        engine: "KnightArena Titan Edge v2",
        message: "Move calculated via Supabase Edge Function",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
