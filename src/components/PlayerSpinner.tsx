import { useState, useEffect, useRef } from 'react';
import type { Player } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { RefreshCw, Shuffle, Trophy, Users } from 'lucide-react';

interface PlayerSpinnerProps {
  availablePlayers: Player[];
  onSelectPlayer: (id: string) => void;
  onReaddUnsold?: () => void;
  hasUnsoldPlayers?: boolean;
}

// ---------------------------------------------------------------------------
// SPINNER LOGIC
//
// 1. On SPIN click → pick true winner first with Math.random()
// 2. Run a purely cosmetic animation (rapidly cycle displayed names/photos)
// 3. When animation ends → snap to the predetermined winner
// 4. Call onSelectPlayer(winner.id) which updates the store
//
// The animation NEVER controls which player is selected.
// ---------------------------------------------------------------------------

export default function PlayerSpinner({
  availablePlayers,
  onSelectPlayer,
  onReaddUnsold,
  hasUnsoldPlayers = false,
}: PlayerSpinnerProps) {
  // The player shown in the spinning "slot" (purely cosmetic during animation)
  const [displayIndex, setDisplayIndex] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'revealing'>('idle');
  const [winner, setWinner] = useState<Player | null>(null);

  // useRef so we can safely clear it from inside the closure
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset when the player pool changes (e.g. after readdUnsold)
  useEffect(() => {
    setPhase('idle');
    setWinner(null);
    setDisplayIndex(0);
  }, [availablePlayers.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const startSpin = () => {
    // Guard: must have players and must not already be spinning
    if (availablePlayers.length === 0 || phase !== 'idle') return;

    // STEP 1: Pick the true winner using Math.random() BEFORE any animation
    const randomIndex = Math.floor(Math.random() * availablePlayers.length);
    const selectedWinner = availablePlayers[randomIndex];

    setWinner(selectedWinner);
    setPhase('spinning');

    // STEP 2: Animate — cycle through indexes rapidly then decelerate
    // All of this is purely visual; it does NOT affect who wins.
    const totalFrames = 30;
    let frame = 0;

    const animate = () => {
      frame++;

      // Cycle display index cosmetically (wrap around pool)
      setDisplayIndex((prev) => (prev + 1) % availablePlayers.length);

      if (frame < totalFrames) {
        // Accelerate first half, decelerate second half
        const progress = frame / totalFrames;
        let delay: number;
        if (progress < 0.4) {
          delay = 40 + progress * 30; // speeds up: 40ms → ~52ms
        } else {
          delay = 52 + (progress - 0.4) * 300; // slows down: 52ms → ~232ms
        }
        timerRef.current = setTimeout(animate, delay);
      } else {
        // STEP 3: Snap display to the actual winner
        const winnerIdx = availablePlayers.findIndex((p) => p.id === selectedWinner.id);
        setDisplayIndex(winnerIdx >= 0 ? winnerIdx : 0);
        setPhase('revealing');

        // STEP 4: After reveal pause, push selection into the store
        timerRef.current = setTimeout(() => {
          onSelectPlayer(selectedWinner.id);
          // parent's nextPlayer() will set currentPlayerId → this component
          // unmounts / re-renders, so no need to reset phase here.
        }, 1200);
      }
    };

    timerRef.current = setTimeout(animate, 40);
  };

  // ─── Empty pool screen ───────────────────────────────────────────────────
  if (availablePlayers.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
          <Trophy size={36} className="text-amber-500" />
        </div>
        <h3 className="text-2xl font-black text-slate-800 mb-2">Auction Completed</h3>
        <p className="text-slate-500 mb-8">All available players have been processed.</p>

        {hasUnsoldPlayers && onReaddUnsold && (
          <button
            onClick={onReaddUnsold}
            className="bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <RefreshCw size={18} />
            Re-auction Unsold Players
          </button>
        )}
      </div>
    );
  }

  // ─── Main spinner ─────────────────────────────────────────────────────────
  const displayPlayer = availablePlayers[displayIndex] ?? availablePlayers[0];
  const isSpinning = phase === 'spinning';
  const isRevealing = phase === 'revealing';

  return (
    <div className="py-6 flex flex-col items-center w-full px-4">
      {/* Stats bar */}
      <div className="flex items-center gap-2 mb-6 bg-purple-50 border border-purple-200 text-purple-800 px-4 py-2 rounded-full text-sm font-bold shadow-sm">
        <Users size={14} />
        <span>{availablePlayers.length} players remaining in pool</span>
      </div>

      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
        Random Player Draw
      </p>

      {/* Spinning card */}
      <div
        className={cn(
          'relative w-full max-w-xs rounded-3xl p-6 flex flex-col items-center justify-center border-4 shadow-xl transition-all duration-300 overflow-hidden',
          isSpinning
            ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-purple-200'
            : isRevealing
            ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-green-200 scale-[1.03]'
            : 'border-slate-200 bg-white'
        )}
      >
        {/* Animated shimmer during spin */}
        {isSpinning && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -inset-full animate-[spin_1s_linear_infinite] bg-gradient-conic from-purple-400/0 via-purple-400/20 to-purple-400/0" />
          </div>
        )}

        {/* Player photo */}
        <div className="relative mb-4 z-10">
          <img
            key={displayPlayer.id} // key change triggers re-render flash
            src={displayPlayer.photo}
            alt={displayPlayer.name}
            className={cn(
              'w-28 h-28 rounded-full border-4 object-cover bg-white shadow-md transition-all',
              isSpinning ? 'border-purple-300 opacity-80 blur-[0.5px]' :
              isRevealing ? 'border-green-400 ring-4 ring-green-200 ring-offset-2' :
              'border-slate-200'
            )}
          />
          {!isSpinning && (
            <span
              className={cn(
                'absolute -bottom-2 left-1/2 -translate-x-1/2 text-white text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow',
                isRevealing ? 'bg-green-600' : 'bg-slate-700'
              )}
            >
              {displayPlayer.role}
            </span>
          )}
        </div>

        {/* Player name */}
        <h2
          className={cn(
            'text-2xl font-black text-center tracking-tight z-10 transition-all',
            isSpinning ? 'text-purple-600 blur-[0.5px] opacity-70' :
            isRevealing ? 'text-green-700' : 'text-slate-900'
          )}
        >
          {isSpinning ? '???' : displayPlayer.name}
        </h2>

        {/* Player meta */}
        <div
          className={cn(
            'flex gap-3 mt-2 text-sm font-medium z-10 transition-opacity',
            isSpinning ? 'opacity-0' : 'opacity-100 text-slate-500'
          )}
        >
          <span>Age {displayPlayer.age}</span>
          <span>·</span>
          <span>Base {formatCurrency(displayPlayer.basePrice)}</span>
        </div>

        {/* Revealing banner */}
        {isRevealing && winner && (
          <div className="mt-4 z-10 w-full bg-green-500 text-white text-center font-black text-sm py-2 rounded-xl uppercase tracking-widest animate-bounce">
            🎯 Player Selected!
          </div>
        )}
      </div>

      {/* Spin button */}
      <button
        id="spin-player-btn"
        onClick={startSpin}
        disabled={phase !== 'idle'}
        className={cn(
          'mt-6 w-full max-w-xs py-4 rounded-2xl font-black text-lg uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-3',
          phase !== 'idle'
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-purple-300 hover:scale-105 active:scale-95'
        )}
      >
        {isSpinning ? (
          <span className="flex items-center gap-2 animate-pulse">
            <Shuffle size={20} className="animate-spin" /> Spinning...
          </span>
        ) : isRevealing ? (
          <span>Starting Auction...</span>
        ) : (
          <span className="flex items-center gap-2">
            <Shuffle size={20} /> Spin Player
          </span>
        )}
      </button>
    </div>
  );
}
