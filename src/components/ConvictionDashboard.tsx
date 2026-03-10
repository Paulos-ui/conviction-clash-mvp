import { type PlayerState } from '@/hooks/useGameState';

interface ConvictionDashboardProps {
  player: PlayerState;
  convictionScore: number;
  phase: string;
  winner: string | null;
  address: string | null;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

const LEADERBOARD = [
  { address: '0x7a3...f42', score: 94, wins: 12 },
  { address: '0x1b8...a91', score: 87, wins: 9 },
  { address: '0xc4d...e17', score: 81, wins: 7 },
  { address: '0x9f2...b38', score: 73, wins: 5 },
];

export function ConvictionDashboard({
  player,
  convictionScore,
  phase,
  winner,
  address,
  isConnecting,
  onConnect,
  onDisconnect,
}: ConvictionDashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Wallet Section */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Wallet
        </h3>
        {address ? (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono text-active break-all">
              {address}
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              Fuji Testnet
            </span>
            <button
              onClick={onDisconnect}
              className="text-xs font-mono text-muted-foreground hover:text-active uppercase tracking-widest mt-1"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={onConnect}
            disabled={isConnecting}
            className="w-full py-2 text-sm font-mono uppercase tracking-widest border border-border text-muted-foreground hover:text-active hover:border-active transition-colors"
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </div>

      {/* Conviction Score */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          AI Conviction Score
        </h3>
        <div className={`text-4xl font-mono font-bold ${convictionScore > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
          {convictionScore > 0 ? convictionScore : '--'}
        </div>
      </div>

      {/* Applied Boosts */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Stat Boosts
        </h3>
        <div className="flex flex-col gap-1">
          {(['attack', 'shield', 'speed'] as const).map((stat) => (
            <div key={stat} className="flex justify-between text-xs font-mono">
              <span className="text-muted-foreground uppercase">{stat}</span>
              <span className={player.boosts[stat] > 0 ? 'text-primary' : 'text-muted-foreground'}>
                {player.boosts[stat] > 0 ? `+${player.boosts[stat]}` : '--'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Battle Result */}
      {phase === 'result' && winner && (
        <div>
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Result
          </h3>
          <div className={`text-sm font-mono uppercase tracking-widest ${
            winner === 'player' ? 'text-primary' : 'text-muted-foreground'
          }`}>
            {winner === 'player' ? 'Victory' : 'Defeat'}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Leaderboard
        </h3>
        <div className="flex flex-col gap-1">
          {LEADERBOARD.map((entry, i) => (
            <div key={i} className="flex justify-between text-xs font-mono">
              <span className="text-muted-foreground">{entry.address}</span>
              <span className="text-muted-foreground">{entry.wins}W</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
