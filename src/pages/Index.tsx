import { useCallback, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useGameState } from '@/hooks/useGameState';
import { ThesisPanel } from '@/components/ThesisPanel';
import { ConvictionDashboard } from '@/components/ConvictionDashboard';
import { GameCanvas } from '@/components/GameCanvas';

const Index = () => {
  const wallet = useWallet();
  const game = useGameState();
  const [isPanelsDimmed, setIsPanelsDimmed] = useState(false);

  const handleStake = useCallback(async () => {
    if (!game.selectedThesis) return;
    setIsPanelsDimmed(true);
    
    // Call backend Conviction Engine via wallet hook
    const result = await wallet.stakeThesis(game.selectedThesis, game.stakeAmount);
    
    if (result) {
      // Apply backend-calculated boosts to game state
      game.applyThesisFromBackend(
        result.convictionScore,
        result.attackBoost,
        result.shieldBoost,
        result.speedBoost
      );
    } else {
      // Fallback to local calculation if backend unavailable
      game.applyThesis(game.selectedThesis);
    }
    
    setIsPanelsDimmed(false);
    setTimeout(() => game.startBattle(), 800);
  }, [wallet, game]);

  const handleBattleEnd = useCallback((winnerId: string) => {
    game.endBattle(winnerId);
    // Submit result on-chain
    wallet.submitBattleResult(
      winnerId === 'player' ? 'player' : 'opponent',
      winnerId === 'player' ? 'opponent' : 'player'
    );
  }, [game, wallet]);

  const panelClass = isPanelsDimmed ? 'panels-dimmed' : 'panels-active';

  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex flex-col">
      {/* Main grid */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel: Title + Thesis */}
        <div className={`w-1/4 border-r border-border flex flex-col ${panelClass}`}>
          <div className="p-4 border-b border-border">
            <h1 className="text-sm font-mono font-bold uppercase tracking-widest text-active">
              Conviction Clash
            </h1>
            <p className="text-xs font-mono text-muted-foreground mt-1">
              Avalanche Fuji Testnet
            </p>
          </div>
          <div className="flex-1 p-4 overflow-auto">
            <ThesisPanel
              theses={game.theses}
              selectedThesis={game.selectedThesis}
              onSelectThesis={game.setSelectedThesis}
              stakeAmount={game.stakeAmount}
              onStakeAmountChange={game.setStakeAmount}
              onStake={handleStake}
              txStatus={wallet.txStatus}
              walletConnected={!!wallet.address}
              phase={game.phase}
            />
          </div>
          {game.phase === 'result' && (
            <div className="p-4 border-t border-border">
              <button
                onClick={game.resetGame}
                className="w-full py-2 text-xs font-mono uppercase tracking-widest border border-border text-muted-foreground hover:text-active hover:border-active transition-colors"
              >
                New Match
              </button>
            </div>
          )}
        </div>

        {/* Center Panel: Game */}
        <div className="w-1/2 flex flex-col">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Battle Arena
            </span>
            <span className={`text-xs font-mono uppercase tracking-widest ${
              game.phase === 'battle' ? 'text-primary' : 'text-muted-foreground'
            }`}>
              {game.phase === 'idle' ? 'Awaiting Stake' :
               game.phase === 'staking' ? 'Processing' :
               game.phase === 'battle' ? 'Live' :
               'Complete'}
            </span>
          </div>
          <div className="flex-1 p-4 flex items-center justify-center">
            <GameCanvas
              player={game.player}
              opponent={game.opponent}
              phase={game.phase}
              winner={game.winner}
              onPlayerUpdate={(p) => game.setPlayer(prev => ({ ...prev, ...p }))}
              onOpponentUpdate={(o) => game.setOpponent(prev => ({ ...prev, ...o }))}
              onBattleEnd={handleBattleEnd}
              txStatus={wallet.txStatus}
            />
          </div>
        </div>

        {/* Right Panel: Dashboard + Wallet */}
        <div className={`w-1/4 border-l border-border flex flex-col ${panelClass}`}>
          <div className="flex-1 p-4 overflow-auto">
            <ConvictionDashboard
              player={game.player}
              convictionScore={game.convictionScore}
              phase={game.phase}
              winner={game.winner}
              address={wallet.address}
              isConnecting={wallet.isConnecting}
              onConnect={wallet.connect}
              onDisconnect={wallet.disconnect}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
