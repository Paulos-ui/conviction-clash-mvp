import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Conviction Engine — Calculate Conviction Score & Stat Boosts
 * 
 * POST /calculate-conviction
 * Body: { playerAddress, thesis, stakeAmount, txHash? }
 * 
 * Returns: { playerAddress, thesis, convictionScore, attackBoost, shieldBoost, speedBoost, timestamp }
 * 
 * BLOCKCHAIN INTEGRATION POINTS:
 * - Avalanche Fuji RPC: https://api.avax-test.network/ext/bc/C/rpc
 * - Chainlink Price Feed (AVAX/USD on Fuji): 0x5498BB86BC934c8D34FDA08E81D444153d0D06aD
 * - Replace mock data fetching with actual RPC calls for production
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Avalanche Fuji RPC endpoint
const AVAX_RPC = 'https://api.avax-test.network/ext/bc/C/rpc';

// Thesis configuration — easily tunable multipliers
const THESIS_CONFIG: Record<string, { attackWeight: number; shieldWeight: number; speedWeight: number; baseFactor: number }> = {
  'AVAX Growth': { attackWeight: 0.5, shieldWeight: 0.2, speedWeight: 0.1, baseFactor: 15 },
  'DeFi Expansion': { attackWeight: 0.2, shieldWeight: 0.5, speedWeight: 0.2, baseFactor: 12 },
  'Gaming Subnet': { attackWeight: 0.3, shieldWeight: 0.1, speedWeight: 0.6, baseFactor: 10 },
  'NFT Infrastructure': { attackWeight: 0.4, shieldWeight: 0.4, speedWeight: 0.1, baseFactor: 13 },
};

/**
 * Fetch live on-chain data from Avalanche Fuji testnet.
 * In production, this would call Chainlink oracles and Avalanche APIs.
 * For MVP, returns placeholder data with optional real RPC call.
 */
async function fetchOnChainData(playerAddress: string): Promise<{ balanceFactor: number; networkFactor: number }> {
  try {
    // Attempt to fetch real balance from Fuji testnet
    const response = await fetch(AVAX_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [playerAddress, 'latest'],
      }),
    });
    const data = await response.json();
    const balanceWei = parseInt(data.result || '0', 16);
    const balanceAvax = balanceWei / 1e18;

    // Balance factor: logarithmic scaling so whales don't dominate completely
    const balanceFactor = Math.min(20, Math.log2(balanceAvax + 1) * 3);

    // Network activity factor — placeholder for Chainlink oracle feed
    // TODO: Replace with actual Chainlink AVAX/USD price feed call
    // Contract: 0x5498BB86BC934c8D34FDA08E81D444153d0D06aD (Fuji)
    const networkFactor = 5 + Math.random() * 5; // Simulated network health score

    return { balanceFactor, networkFactor };
  } catch (error) {
    console.warn('On-chain data fetch failed, using placeholder:', error);
    return { balanceFactor: 5, networkFactor: 7 };
  }
}

/**
 * Core Conviction Score calculation.
 * Formula: base + stakeFactor + thesisFactor + dataFactor
 * Score range: 0-100
 */
function calculateConvictionScore(
  stakeAmount: number,
  thesisConfig: typeof THESIS_CONFIG[string],
  onChainData: { balanceFactor: number; networkFactor: number }
): number {
  const base = 20; // Base conviction for participating
  const stakeFactor = Math.min(30, stakeAmount * 10); // Stake impact, capped at 30
  const thesisFactor = thesisConfig.baseFactor; // Thesis-specific base
  const dataFactor = onChainData.balanceFactor + onChainData.networkFactor; // On-chain data

  const rawScore = base + stakeFactor + thesisFactor + dataFactor;
  return Math.min(99, Math.max(1, Math.round(rawScore)));
}

/**
 * Map conviction score to dynamic stat boosts.
 * Returns percentage boosts for Attack, Shield, Speed.
 */
function scoreToBoosts(
  score: number,
  thesisConfig: typeof THESIS_CONFIG[string]
): { attackBoost: number; shieldBoost: number; speedBoost: number } {
  // Scale factor based on conviction score (0-1 range)
  const scale = score / 100;

  // Max possible boost per stat = 25%
  const maxBoost = 25;

  return {
    attackBoost: Math.round(scale * maxBoost * thesisConfig.attackWeight * 2),
    shieldBoost: Math.round(scale * maxBoost * thesisConfig.shieldWeight * 2),
    speedBoost: Math.round(scale * maxBoost * thesisConfig.speedWeight * 2),
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { playerAddress, thesis, stakeAmount, txHash } = await req.json();

    // Validate inputs
    if (!playerAddress || !thesis || stakeAmount === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: playerAddress, thesis, stakeAmount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const thesisConfig = THESIS_CONFIG[thesis];
    if (!thesisConfig) {
      return new Response(
        JSON.stringify({ error: `Unknown thesis: ${thesis}. Valid: ${Object.keys(THESIS_CONFIG).join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch on-chain data
    const onChainData = await fetchOnChainData(playerAddress);

    // Calculate conviction score
    const convictionScore = calculateConvictionScore(stakeAmount, thesisConfig, onChainData);

    // Map to stat boosts
    const boosts = scoreToBoosts(convictionScore, thesisConfig);

    const result = {
      playerAddress,
      thesis,
      stakeAmount,
      convictionScore,
      ...boosts,
      timestamp: new Date().toISOString(),
      txHash: txHash || null,
    };

    // Store in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: dbError } = await supabase.from('player_convictions').insert({
      player_address: playerAddress,
      thesis,
      stake_amount: stakeAmount,
      conviction_score: convictionScore,
      attack_boost: boosts.attackBoost,
      shield_boost: boosts.shieldBoost,
      speed_boost: boosts.speedBoost,
      tx_hash: txHash || null,
    });

    if (dbError) {
      console.error('DB insert error:', dbError);
    }

    console.log(`Conviction calculated: ${playerAddress} → score ${convictionScore}`);

    return new Response(JSON.stringify(result), {
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
