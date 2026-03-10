import { supabase } from '@/integrations/supabase/client';

export interface ConvictionResult {
  playerAddress: string;
  thesis: string;
  stakeAmount: number;
  convictionScore: number;
  attackBoost: number;
  shieldBoost: number;
  speedBoost: number;
  timestamp: string;
  txHash: string | null;
}

export interface PlayerStats {
  playerAddress: string;
  convictions: any[];
  battles: any[];
  totalWins: number;
  totalLosses: number;
}

/**
 * Call the Conviction Engine to calculate score and stat boosts.
 * This replaces the frontend mock calculation with the real backend engine.
 */
export async function calculateConviction(
  playerAddress: string,
  thesis: string,
  stakeAmount: number,
  txHash?: string
): Promise<ConvictionResult> {
  const { data, error } = await supabase.functions.invoke('calculate-conviction', {
    body: { playerAddress, thesis, stakeAmount, txHash },
  });

  if (error) throw new Error(`Conviction calculation failed: ${error.message}`);
  return data as ConvictionResult;
}

/**
 * Fetch player's conviction history and battle records.
 */
export async function getPlayerStats(address: string): Promise<PlayerStats> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-player-stats?address=${encodeURIComponent(address)}`;
  
  const response = await fetch(url, {
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  });

  if (!response.ok) throw new Error('Failed to fetch player stats');
  return await response.json();
}

/**
 * Submit battle result to backend (records in DB + on-chain placeholder).
 */
export async function submitBattleResult(
  playerAddress: string,
  opponentAddress: string,
  winnerAddress: string,
  playerConvictionId?: string,
  txHash?: string
): Promise<{ success: boolean; battleId: string }> {
  const { data, error } = await supabase.functions.invoke('submit-battle-result', {
    body: { playerAddress, opponentAddress, winnerAddress, playerConvictionId, txHash },
  });

  if (error) throw new Error(`Battle submission failed: ${error.message}`);
  return data;
}
