import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Submit Battle Result — Record battle outcome in database
 * 
 * POST /submit-battle-result
 * Body: { playerAddress, opponentAddress, winnerAddress, playerConvictionId?, txHash? }
 * 
 * BLOCKCHAIN INTEGRATION:
 * After recording in DB, this would also submit the result to the smart contract
 * via contract.submitBattleResult(winnerId, loserId) on Avalanche Fuji
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
    const { playerAddress, opponentAddress, winnerAddress, playerConvictionId, txHash } = await req.json();

    if (!playerAddress || !opponentAddress || !winnerAddress) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: playerAddress, opponentAddress, winnerAddress' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.from('battle_results').insert({
      player_address: playerAddress,
      opponent_address: opponentAddress,
      winner_address: winnerAddress,
      player_conviction_id: playerConvictionId || null,
      tx_hash: txHash || null,
    }).select().single();

    if (error) throw error;

    // TODO: Submit result on-chain
    // const provider = new ethers.JsonRpcProvider(AVAX_RPC);
    // const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    // const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    // const tx = await contract.submitBattleResult(winnerAddress, loserAddress);

    console.log(`Battle recorded: ${winnerAddress} wins`);

    return new Response(JSON.stringify({
      success: true,
      battleId: data.id,
      timestamp: data.created_at,
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
