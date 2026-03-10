import { useState, useCallback } from 'react';

export interface ShipStats {
  attack: number;
  shield: number;
  speed: number;
}

export interface PlayerState {
  id: string;
  label: string;
  stats: ShipStats;
  boosts: ShipStats;
  hp: number;
  x: number;
  y: number;
}

export type GamePhase = 'idle' | 'staking' | 'battle' | 'result';

const BASE_STATS: ShipStats = { attack: 10, shield: 8, speed: 6 };

const THESIS_BOOSTS: Record<string, ShipStats> = {
  'AVAX Growth': { attack: 5, shield: 2, speed: 1 },
  'DeFi Expansion': { attack: 2, shield: 5, speed: 2 },
  'Gaming Subnet': { attack: 3, shield: 1, speed: 6 },
  'NFT Infrastructure': { attack: 4, shield: 4, speed: 1 },
};

export function useGameState() {
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [selectedThesis, setSelectedThesis] = useState<string | null>(null);
  const [stakeAmount, setStakeAmount] = useState('0.1');
  const [winner, setWinner] = useState<string | null>(null);
  const [convictionScore, setConvictionScore] = useState(0);

  const [player, setPlayer] = useState<PlayerState>({
    id: 'player',
    label: 'YOU',
    stats: { ...BASE_STATS },
    boosts: { attack: 0, shield: 0, speed: 0 },
    hp: 100,
    x: 120,
    y: 200,
  });

  const [opponent, setOpponent] = useState<PlayerState>({
    id: 'opponent',
    label: 'OPP',
    stats: { attack: 12, shield: 7, speed: 5 },
    boosts: { attack: 0, shield: 0, speed: 0 },
    hp: 100,
    x: 580,
    y: 200,
  });

  const applyThesis = useCallback((thesis: string) => {
    const boosts = THESIS_BOOSTS[thesis] || { attack: 0, shield: 0, speed: 0 };
    setPlayer(prev => ({
      ...prev,
      boosts,
      stats: {
        attack: BASE_STATS.attack + boosts.attack,
        shield: BASE_STATS.shield + boosts.shield,
        speed: BASE_STATS.speed + boosts.speed,
      },
    }));
    const score = Math.min(99, Math.floor(Math.random() * 30 + 50 + parseFloat(stakeAmount) * 10));
    setConvictionScore(score);
  }, [stakeAmount]);

  // Apply boosts from backend Conviction Engine
  const applyThesisFromBackend = useCallback((score: number, attack: number, shield: number, speed: number) => {
    setPlayer(prev => ({
      ...prev,
      boosts: { attack, shield, speed },
      stats: {
        attack: BASE_STATS.attack + attack,
        shield: BASE_STATS.shield + shield,
        speed: BASE_STATS.speed + speed,
      },
    }));
    setConvictionScore(score);
  }, []);

  const startBattle = useCallback(() => {
    setPhase('battle');
    setPlayer(p => ({ ...p, hp: 100 }));
    setOpponent(o => ({ ...o, hp: 100 }));
    setWinner(null);
  }, []);

  const endBattle = useCallback((winnerId: string) => {
    setWinner(winnerId);
    setPhase('result');
  }, []);

  const resetGame = useCallback(() => {
    setPhase('idle');
    setWinner(null);
    setPlayer(p => ({
      ...p,
      boosts: { attack: 0, shield: 0, speed: 0 },
      stats: { ...BASE_STATS },
      hp: 100,
    }));
    setOpponent(o => ({ ...o, hp: 100 }));
    setSelectedThesis(null);
    setConvictionScore(0);
  }, []);

  return {
    phase, setPhase,
    selectedThesis, setSelectedThesis,
    stakeAmount, setStakeAmount,
    player, setPlayer,
    opponent, setOpponent,
    winner, convictionScore,
    applyThesis, applyThesisFromBackend, startBattle, endBattle, resetGame,
    theses: Object.keys(THESIS_BOOSTS),
  };
}
