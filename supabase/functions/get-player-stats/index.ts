import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Get Player Stats — Fetch conviction history and battle records
 * 
 * GET /get-player-stats?address=0x123...
 * 
 * Returns: { playerAddress, convictions: [...], battles: [...], totalWins, totalLosses }
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const address = url.searchParams.get('address');

    if (!address) {
      return new Response(
        JSON.stringify({ error: 'Missing required query param: address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch conviction history
    const { data: convictions, error: convErr } = await supabase
      .from('player_convictions')
      .select('*')
      .eq('player_address', address)
      .order('created_at', { ascending: false })
      .limit(20);

    if (convErr) throw convErr;

    // Fetch battle results
    const { data: battles, error: batErr } = await supabase
      .from('battle_results')
      .select('*')
      .or(`player_address.eq.${address},opponent_address.eq.${address}`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (batErr) throw batErr;

    const totalWins = (battles || []).filter(b => b.winner_address === address).length;
    const totalLosses = (battles || []).length - totalWins;

    return new Response(JSON.stringify({
      playerAddress: address,
      convictions: convictions || [],
      battles: battles || [],
      totalWins,
      totalLosses,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
