import { useRef, useEffect, useCallback } from 'react';
import { type PlayerState, type GamePhase } from '@/hooks/useGameState';

interface GameCanvasProps {
  player: PlayerState;
  opponent: PlayerState;
  phase: GamePhase;
  winner: string | null;
  onPlayerUpdate: (p: Partial<PlayerState>) => void;
  onOpponentUpdate: (o: Partial<PlayerState>) => void;
  onBattleEnd: (winnerId: string) => void;
  txStatus: string;
}

const CANVAS_W = 720;
const CANVAS_H = 420;
const SHIP_SIZE = 28;

// Colors matching design system
const BG = '#0A0A0C';
const PANEL_LINE = '#1A1A1E';
const INACTIVE = '#65656D';
const ACTIVE = '#EAEAEB';
const RED = '#E84142';

function drawShip(ctx: CanvasRenderingContext2D, x: number, y: number, facingRight: boolean, isPlayer: boolean, boosted: boolean) {
  ctx.save();
  ctx.translate(x, y);

  // Ship body - angular, geometric
  ctx.beginPath();
  if (facingRight) {
    ctx.moveTo(SHIP_SIZE, 0);
    ctx.lineTo(-SHIP_SIZE * 0.7, -SHIP_SIZE * 0.6);
    ctx.lineTo(-SHIP_SIZE * 0.5, 0);
    ctx.lineTo(-SHIP_SIZE * 0.7, SHIP_SIZE * 0.6);
  } else {
    ctx.moveTo(-SHIP_SIZE, 0);
    ctx.lineTo(SHIP_SIZE * 0.7, -SHIP_SIZE * 0.6);
    ctx.lineTo(SHIP_SIZE * 0.5, 0);
    ctx.lineTo(SHIP_SIZE * 0.7, SHIP_SIZE * 0.6);
  }
  ctx.closePath();

  ctx.strokeStyle = boosted && isPlayer ? RED : INACTIVE;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = boosted && isPlayer ? RED + '15' : INACTIVE + '08';
  ctx.fill();

  ctx.restore();
}

function drawStats(ctx: CanvasRenderingContext2D, ship: PlayerState, x: number, y: number, boosted: boolean) {
  ctx.font = '9px "IBM Plex Mono", monospace';
  const stats = [
    `ATK ${ship.stats.attack}${ship.boosts.attack > 0 ? ` +${ship.boosts.attack}` : ''}`,
    `SHD ${ship.stats.shield}${ship.boosts.shield > 0 ? ` +${ship.boosts.shield}` : ''}`,
    `SPD ${ship.stats.speed}${ship.boosts.speed > 0 ? ` +${ship.boosts.speed}` : ''}`,
  ];
  stats.forEach((s, i) => {
    const hasBoostedStat = s.includes('+');
    ctx.fillStyle = hasBoostedStat ? RED : INACTIVE;
    ctx.fillText(s, x, y - 50 + i * 12);
  });

  // HP bar
  ctx.fillStyle = PANEL_LINE;
  ctx.fillRect(x, y - 12, 60, 3);
  ctx.fillStyle = ship.hp > 30 ? INACTIVE : RED;
  ctx.fillRect(x, y - 12, 60 * (ship.hp / 100), 3);

  // Label
  ctx.fillStyle = INACTIVE;
  ctx.font = '10px "IBM Plex Mono", monospace';
  ctx.fillText(ship.label, x, y + 35);
}

interface Projectile {
  x: number;
  y: number;
  dx: number;
  fromPlayer: boolean;
  life: number;
}

export function GameCanvas({ player, opponent, phase, winner, onPlayerUpdate, onOpponentUpdate, onBattleEnd, txStatus }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const projectilesRef = useRef<Projectile[]>([]);
  const battleTickRef = useRef(0);
  const scanLineRef = useRef<number | null>(null);
  const playerHpRef = useRef(100);
  const opponentHpRef = useRef(100);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid lines (subtle)
    ctx.strokeStyle = PANEL_LINE;
    ctx.lineWidth = 0.5;
    for (let x = 0; x < CANVAS_W; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_H; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }

    // Center divider
    ctx.strokeStyle = PANEL_LINE;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_W / 2, 0);
    ctx.lineTo(CANVAS_W / 2, CANVAS_H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Ships
    const hasBoostedPlayer = player.boosts.attack > 0 || player.boosts.shield > 0 || player.boosts.speed > 0;
    drawShip(ctx, player.x, player.y, true, true, hasBoostedPlayer);
    drawStats(ctx, player, player.x - 30, player.y, hasBoostedPlayer);

    drawShip(ctx, opponent.x, opponent.y, false, false, false);
    drawStats(ctx, opponent, opponent.x - 30, opponent.y, false);

    // Projectiles
    const projs = projectilesRef.current;
    projs.forEach((p, i) => {
      p.x += p.dx;
      p.life--;

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.dx * 3, p.y);
      ctx.strokeStyle = p.fromPlayer ? RED : INACTIVE;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Hit detection
      const targetX = p.fromPlayer ? opponent.x : player.x;
      const targetY = p.fromPlayer ? opponent.y : player.y;
      if (Math.abs(p.x - targetX) < SHIP_SIZE && Math.abs(p.y - targetY) < SHIP_SIZE * 0.6) {
        if (p.fromPlayer) {
          const dmg = Math.max(1, player.stats.attack - opponent.stats.shield * 0.3);
          opponentHpRef.current = Math.max(0, opponentHpRef.current - dmg);
          onOpponentUpdate({ hp: opponentHpRef.current });
        } else {
          const dmg = Math.max(1, opponent.stats.attack - player.stats.shield * 0.3);
          playerHpRef.current = Math.max(0, playerHpRef.current - dmg);
          onPlayerUpdate({ hp: playerHpRef.current });
        }
        p.life = 0;
      }
    });
    projectilesRef.current = projs.filter(p => p.life > 0 && p.x > 0 && p.x < CANVAS_W);

    // Battle logic
    if (phase === 'battle') {
      battleTickRef.current++;

      // Ship oscillation
      const pOsc = Math.sin(battleTickRef.current * 0.03 * (player.stats.speed * 0.2)) * 15;
      const oOsc = Math.sin(battleTickRef.current * 0.025 * 1.2) * 12;
      onPlayerUpdate({ y: 210 + pOsc });
      onOpponentUpdate({ y: 210 + oOsc });

      // Fire projectiles
      if (battleTickRef.current % Math.max(8, 25 - player.stats.speed * 2) === 0) {
        projectilesRef.current.push({
          x: player.x + SHIP_SIZE,
          y: player.y + (Math.random() - 0.5) * 10,
          dx: 5 + player.stats.speed * 0.3,
          fromPlayer: true,
          life: 120,
        });
      }
      if (battleTickRef.current % 20 === 0) {
        projectilesRef.current.push({
          x: opponent.x - SHIP_SIZE,
          y: opponent.y + (Math.random() - 0.5) * 10,
          dx: -(4 + opponent.stats.speed * 0.2),
          fromPlayer: false,
          life: 120,
        });
      }

      // Check end
      if (opponentHpRef.current <= 0) {
        onBattleEnd('player');
      } else if (playerHpRef.current <= 0) {
        onBattleEnd('opponent');
      }
    }

    // Scan line effect (after staking)
    if (scanLineRef.current !== null) {
      const scanY = scanLineRef.current;
      ctx.strokeStyle = RED;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(CANVAS_W, scanY);
      ctx.stroke();
      scanLineRef.current += 6;
      if (scanLineRef.current > CANVAS_H) {
        scanLineRef.current = null;
      }
    }

    // Phase overlays
    if (phase === 'idle') {
      ctx.fillStyle = INACTIVE;
      ctx.font = '11px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('STAKE A THESIS TO BEGIN', CANVAS_W / 2, CANVAS_H - 20);
      ctx.textAlign = 'left';
    }

    if (phase === 'result' && winner) {
      ctx.fillStyle = BG + 'CC';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = winner === 'player' ? RED : INACTIVE;
      ctx.font = '18px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(winner === 'player' ? 'VICTORY' : 'DEFEAT', CANVAS_W / 2, CANVAS_H / 2 - 10);
      ctx.fillStyle = INACTIVE;
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.fillText('Battle result recorded on-chain', CANVAS_W / 2, CANVAS_H / 2 + 15);
      ctx.textAlign = 'left';
    }

    animRef.current = requestAnimationFrame(render);
  }, [player, opponent, phase, winner, onPlayerUpdate, onOpponentUpdate, onBattleEnd]);

  useEffect(() => {
    playerHpRef.current = player.hp;
    opponentHpRef.current = opponent.hp;
  }, [player.hp, opponent.hp]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [render]);

  // Trigger scan line when tx succeeds
  useEffect(() => {
    if (txStatus === 'success') {
      scanLineRef.current = 0;
    }
  }, [txStatus]);

  // Reset battle tick when phase changes
  useEffect(() => {
    if (phase === 'battle') {
      battleTickRef.current = 0;
      playerHpRef.current = 100;
      opponentHpRef.current = 100;
    }
  }, [phase]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      className="w-full h-full border border-border"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
