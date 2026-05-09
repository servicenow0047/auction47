import { useState, useEffect, useRef } from 'react';
import type { Player } from '../types';
import { cn } from '../lib/utils';
import { RefreshCw, Play } from 'lucide-react';

interface PlayerSpinnerProps {
  availablePlayers: Player[];
  allPlayers: Player[];
  onSelectPlayer: (id: string) => void;
  onReaddUnsold?: () => void;
  hasUnsoldPlayers?: boolean;
  tournamentName?: string;
  tournamentLogo?: string;
}

// ---------------------------------------------------------------------------
// SLOT MACHINE SPINNER LOGIC
// ---------------------------------------------------------------------------

export default function PlayerSpinner({
  availablePlayers,
  allPlayers,
  onSelectPlayer,
  onReaddUnsold,
  hasUnsoldPlayers = false,
  tournamentName,
  tournamentLogo,
}: PlayerSpinnerProps) {
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'revealing'>('idle');
  const [winner, setWinner] = useState<Player | null>(null);
  
  // Slot Machine Digits (0-9)
  const [digits, setDigits] = useState<[number, number, number]>([0, 0, 0]);

  // useRef so we can safely clear it from inside the closure
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset when the player pool changes
  useEffect(() => {
    setPhase('idle');
    setWinner(null);
    setDigits([0, 0, 0]);
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

    // STEP 1: Pick the true winner
    const randomIndex = Math.floor(Math.random() * availablePlayers.length);
    const selectedWinner = availablePlayers[randomIndex];
    setWinner(selectedWinner);
    setPhase('spinning');

    // Calculate final padded registration number (e.g., "067")
    const regNum = allPlayers.findIndex((p) => p.id === selectedWinner.id) + 101;
    const regStr = String(regNum).padStart(3, '0');
    const targetDigits: [number, number, number] = [
      parseInt(regStr[0]),
      parseInt(regStr[1]),
      parseInt(regStr[2])
    ];

    // STEP 2: Animate — rapidly cycle digits
    const totalFrames = 40;
    let frame = 0;

    const animate = () => {
      frame++;

      if (frame < totalFrames) {
        // Randomize all digits while spinning
        setDigits([
          Math.floor(Math.random() * 10),
          Math.floor(Math.random() * 10),
          Math.floor(Math.random() * 10)
        ]);

        // Accelerate first half, decelerate second half
        const progress = frame / totalFrames;
        let delay = progress < 0.5 
          ? 30 + progress * 20 
          : 50 + (progress - 0.5) * 150;
          
        timerRef.current = setTimeout(animate, delay);
      } else {
        // STEP 3: Snap display to the actual winner's number
        setDigits(targetDigits);
        setPhase('revealing');

        // STEP 4: After reveal pause, push selection into the store
        timerRef.current = setTimeout(async () => {
          try {
            await onSelectPlayer(selectedWinner.id);
          } catch (err) {
            console.error('Failed to select player:', err);
            setPhase('idle'); 
          }
        }, 1500); // 1.5 second dramatic pause before closing popup
      }
    };

    timerRef.current = setTimeout(animate, 40);
  };

  // ─── Empty pool screen ───────────────────────────────────────────────────
  if (availablePlayers.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-md">
        <h3 className="text-4xl font-black text-white mb-4">Auction Completed</h3>
        <p className="text-slate-400 mb-8 text-xl">All available players have been processed.</p>

        {hasUnsoldPlayers && onReaddUnsold && (
          <button
            onClick={onReaddUnsold}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all flex items-center gap-3 hover:scale-105 active:scale-95"
          >
            <RefreshCw size={24} />
            Re-auction Unsold
          </button>
        )}
      </div>
    );
  }

  // ─── Slot Machine UI ───────────────────────────────────────────────────────
  const isSpinning = phase === 'spinning';
  const isRevealing = phase === 'revealing';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050B14]/95 backdrop-blur-lg animate-in fade-in duration-500">
      
      {/* Sci-Fi Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Neon light beams */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.5)] transform -rotate-12" />
        <div className="absolute top-0 right-1/4 w-px h-full bg-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.5)] transform rotate-12" />
        <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-blue-900/20 to-transparent" />
        <div className="absolute top-0 w-full h-1/4 bg-gradient-to-b from-purple-900/20 to-transparent" />
      </div>

      <div className="relative flex flex-col items-center w-full max-w-4xl px-4">
        
        {/* Tournament Branding */}
        <div className="flex flex-col items-center mb-4 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
          {tournamentLogo && (
            <img src={tournamentLogo} alt="Logo" className="h-16 object-contain mb-3" />
          )}
          {tournamentName && (
            <h1
              className="font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFF500] to-[#FFB800] uppercase tracking-widest text-center filter drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] leading-tight"
              style={{ fontSize: 'clamp(1.4rem, 4vw, 3.5rem)' }}
            >
              {tournamentName}
            </h1>
          )}
        </div>

        {/* Slot Machine Container */}
        <div className="relative">
          {/* Metallic Gold Frame */}
          <div className="bg-gradient-to-b from-[#FFE066] via-[#B8860B] to-[#DAA520] p-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-4 border-[#FFF500]/50 relative overflow-hidden">
            
            {/* Glossy overlay on frame */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 pointer-events-none" />

            {/* Inner Dark Screen */}
            <div className="bg-gradient-to-b from-slate-900 to-black p-6 rounded-2xl border-4 border-slate-800 shadow-inner flex gap-4">
              
              {/* Digit 1 */}
              <div className="w-20 h-28 md:w-28 md:h-40 bg-gradient-to-b from-slate-200 via-white to-slate-300 rounded-xl shadow-[inset_0_10px_20px_rgba(0,0,0,0.5)] border-2 border-slate-400 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20 pointer-events-none" />
                <span className={cn(
                  "text-6xl md:text-8xl font-black font-mono text-slate-900 drop-shadow-md",
                  isSpinning ? "blur-[2px] opacity-80 animate-pulse" : "opacity-100"
                )}>
                  {digits[0]}
                </span>
              </div>

              {/* Digit 2 */}
              <div className="w-20 h-28 md:w-28 md:h-40 bg-gradient-to-b from-slate-200 via-white to-slate-300 rounded-xl shadow-[inset_0_10px_20px_rgba(0,0,0,0.5)] border-2 border-slate-400 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20 pointer-events-none" />
                <span className={cn(
                  "text-6xl md:text-8xl font-black font-mono text-slate-900 drop-shadow-md",
                  isSpinning ? "blur-[2px] opacity-80 animate-pulse delay-75" : "opacity-100"
                )}>
                  {digits[1]}
                </span>
              </div>

              {/* Digit 3 */}
              <div className="w-20 h-28 md:w-28 md:h-40 bg-gradient-to-b from-slate-200 via-white to-slate-300 rounded-xl shadow-[inset_0_10px_20px_rgba(0,0,0,0.5)] border-2 border-slate-400 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20 pointer-events-none" />
                <span className={cn(
                  "text-6xl md:text-8xl font-black font-mono text-slate-900 drop-shadow-md",
                  isSpinning ? "blur-[2px] opacity-80 animate-pulse delay-150" : "opacity-100"
                )}>
                  {digits[2]}
                </span>
              </div>

            </div>
          </div>
          
          {/* Decorative screws/bolts on frame */}
          <div className="absolute top-6 left-6 w-3 h-3 rounded-full bg-slate-800 border border-slate-600 shadow-inner" />
          <div className="absolute top-6 right-6 w-3 h-3 rounded-full bg-slate-800 border border-slate-600 shadow-inner" />
          <div className="absolute bottom-6 left-6 w-3 h-3 rounded-full bg-slate-800 border border-slate-600 shadow-inner" />
          <div className="absolute bottom-6 right-6 w-3 h-3 rounded-full bg-slate-800 border border-slate-600 shadow-inner" />
        </div>

        {/* Start Button & Meta */}
        <div className="mt-8 flex flex-col items-center">
          <button
            onClick={startSpin}
            disabled={phase !== 'idle'}
            className={cn(
              'px-12 py-4 rounded-full font-black text-3xl uppercase tracking-widest shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all border-4 flex items-center gap-4',
              phase !== 'idle'
                ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed shadow-none'
                : isRevealing
                ? 'bg-emerald-500 text-white border-emerald-300 shadow-[0_0_50px_rgba(16,185,129,0.8)] scale-110'
                : 'bg-gradient-to-b from-[#22C55E] to-[#15803D] text-white border-[#86EFAC] hover:from-[#4ADE80] hover:to-[#16A34A] hover:scale-105 active:scale-95 hover:shadow-[0_0_40px_rgba(34,197,94,0.6)]'
            )}
          >
            {isSpinning ? (
              <span className="animate-pulse">Spinning...</span>
            ) : isRevealing ? (
              'PLAYER SELECTED!'
            ) : (
              <>
                START <Play size={28} fill="currentColor" />
              </>
            )}
          </button>
          
          {phase === 'idle' && (
            <p className="text-slate-400 mt-6 text-sm font-bold tracking-widest uppercase">
              {availablePlayers.length} Players Remaining in Pool
            </p>
          )}
        </div>

        {/* Bottom Left Branding Badge */}
        <div className="absolute bottom-8 left-0 -translate-x-1/2 flex flex-col items-start bg-black/50 backdrop-blur-md px-6 py-4 rounded-r-2xl border-r border-t border-b border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.6)]">
          <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Powered By</p>
          <p className="bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text font-black text-4xl tracking-wider drop-shadow-[0_0_20px_rgba(168,85,247,0.6)] leading-none">AUCTION 47</p>
          <p className="text-purple-300/80 font-mono text-xs mt-2 tracking-wide">auction047@gmail.com</p>
        </div>

      </div>
    </div>
  );
}
