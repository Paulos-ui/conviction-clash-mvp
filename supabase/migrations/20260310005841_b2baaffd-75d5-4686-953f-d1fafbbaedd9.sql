
-- Create table for player conviction records
CREATE TABLE public.player_convictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_address TEXT NOT NULL,
  thesis TEXT NOT NULL,
  stake_amount NUMERIC NOT NULL DEFAULT 0,
  conviction_score INTEGER NOT NULL DEFAULT 0,
  attack_boost INTEGER NOT NULL DEFAULT 0,
  shield_boost INTEGER NOT NULL DEFAULT 0,
  speed_boost INTEGER NOT NULL DEFAULT 0,
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for battle results
CREATE TABLE public.battle_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_address TEXT NOT NULL,
  opponent_address TEXT NOT NULL,
  winner_address TEXT NOT NULL,
  player_conviction_id UUID REFERENCES public.player_convictions(id),
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.player_convictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_results ENABLE ROW LEVEL SECURITY;

-- Public read access (game data is public on-chain anyway)
CREATE POLICY "Anyone can read convictions" ON public.player_convictions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert convictions" ON public.player_convictions FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read battle results" ON public.battle_results FOR SELECT USING (true);
CREATE POLICY "Anyone can insert battle results" ON public.battle_results FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX idx_convictions_player ON public.player_convictions(player_address);
CREATE INDEX idx_battles_player ON public.battle_results(player_address);
CREATE INDEX idx_battles_winner ON public.battle_results(winner_address);
