import { type TxStatus } from '@/hooks/useWallet';

interface ThesisPanelProps {
  theses: string[];
  selectedThesis: string | null;
  onSelectThesis: (thesis: string) => void;
  stakeAmount: string;
  onStakeAmountChange: (amount: string) => void;
  onStake: () => void;
  txStatus: TxStatus;
  walletConnected: boolean;
  phase: string;
}

export function ThesisPanel({
  theses,
  selectedThesis,
  onSelectThesis,
  stakeAmount,
  onStakeAmountChange,
  onStake,
  txStatus,
  walletConnected,
  phase,
}: ThesisPanelProps) {
  const isStaking = txStatus === 'pending';
  const canStake = walletConnected && selectedThesis && parseFloat(stakeAmount) > 0 && phase === 'idle';

  return (
    <div className="flex flex-col gap-6">
      {/* Section: Thesis */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Select Thesis
        </h3>
        <div className="flex flex-col gap-1">
          {theses.map((thesis) => (
            <button
              key={thesis}
              onClick={() => onSelectThesis(thesis)}
              className={`w-full text-left px-3 py-2 text-sm font-mono transition-colors border border-transparent ${
                selectedThesis === thesis
                  ? 'text-active bg-accent border-border'
                  : 'text-muted-foreground hover:text-active'
              }`}
            >
              {thesis}
            </button>
          ))}
        </div>
      </div>

      {/* Section: Stake Amount */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Stake Amount (AVAX)
        </h3>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={stakeAmount}
          onChange={(e) => onStakeAmountChange(e.target.value)}
          className="w-full bg-surface border border-border px-3 py-2 text-sm font-mono text-active focus:outline-none focus:border-primary"
          placeholder="0.1"
        />
      </div>

      {/* Section: Action */}
      <button
        onClick={onStake}
        disabled={!canStake || isStaking}
        className={`w-full py-3 text-sm font-mono uppercase tracking-widest transition-colors border ${
          isStaking
            ? 'bg-primary text-primary-foreground border-primary animate-pulse-red'
            : canStake
            ? 'bg-transparent text-primary border-primary hover:bg-primary hover:text-primary-foreground'
            : 'bg-transparent text-muted-foreground border-border cursor-not-allowed'
        }`}
      >
        {isStaking ? 'Staking...' : 'Stake & Apply Thesis'}
      </button>

      {/* Tx Status */}
      {txStatus !== 'idle' && (
        <div className={`text-xs font-mono uppercase tracking-widest ${
          txStatus === 'pending' ? 'text-primary' :
          txStatus === 'success' ? 'text-active' :
          'text-primary'
        }`}>
          TX: {txStatus}
        </div>
      )}
    </div>
  );
}
