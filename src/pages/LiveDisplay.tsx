import { useMemo } from 'react';
import { useAuctionStore } from '../store/useAuctionStore';
import { calculateMaxAllowedBid } from '../utils/auctionLogic';
import { formatCurrency, cn } from '../lib/utils';
import { MonitorPlay } from 'lucide-react';

export default function LiveDisplay() {
  const store = useAuctionStore();

  const currentPlayer = useMemo(() => {
    if (!store.currentPlayerId) return null;
    return store.players.find(p => p.id === store.currentPlayerId) || null;
  }, [store.currentPlayerId, store.players]);

  const highestBidder = store.teams.find(t => t.id === store.currentBidTeamId);

  // Auto-scroll the page slightly if there are many teams
  // This is a read-only display, hide scrollbars via css class 'overflow-hidden' on wrapper

  if (store.status === 'setup' || store.status === 'completed') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-slate-400">
        <MonitorPlay size={96} className="mb-8 text-purple-600 opacity-50" />
        <h1 className="text-5xl font-black text-white mb-4 tracking-tight">AUCTION TERMINAL</h1>
        <p className="text-2xl">Waiting for auction to begin...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-900 text-white font-sans overflow-hidden">
      {/* Left panel: Player Focus */}
      <div className="flex flex-col w-[45%] border-r border-slate-700 bg-slate-800/50">
        <div className="flex-none p-10 flex flex-col items-center justify-center min-h-[50%] border-b border-slate-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-indigo-900/10" />
          
          {currentPlayer ? (
            <div className="z-10 flex flex-col items-center text-center w-full">
              <div className="relative mb-8">
                <img 
                  src={currentPlayer.photo} 
                  alt={currentPlayer.name} 
                  className="w-56 h-56 rounded-full border-8 border-slate-700 shadow-2xl object-cover bg-white"
                />
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-lg font-black px-6 py-2 rounded-full uppercase tracking-widest shadow-lg">
                  {currentPlayer.role}
                </span>
              </div>
              <h1 className="text-6xl font-black text-white tracking-tight leading-tight">{currentPlayer.name}</h1>
              <div className="flex gap-6 mt-6 text-2xl text-purple-200 font-medium">
                <span>Age: {currentPlayer.age}</span>
                <span>•</span>
                <span>Base: {formatCurrency(currentPlayer.basePrice)}</span>
              </div>
            </div>
          ) : (
            <div className="z-10 text-center text-slate-400">
              <h1 className="text-5xl font-bold mb-4">Awaiting Player</h1>
              <p className="text-2xl">The auctioneer is selecting the next player.</p>
            </div>
          )}
        </div>

        {/* Current Bid Display */}
        <div className="flex-1 flex flex-col justify-center items-center p-12 bg-slate-900">
          <p className="text-2xl text-slate-400 font-bold uppercase tracking-widest mb-6">Current Highest Bid</p>
          <div className="text-[7rem] leading-none font-black text-green-400 drop-shadow-2xl font-mono tracking-tighter">
            {store.currentBid > 0 ? formatCurrency(store.currentBid) : '---'}
          </div>
          <div className="mt-8 h-20">
            {highestBidder ? (
              <p className="text-4xl font-bold text-white bg-slate-800 px-8 py-4 rounded-2xl border border-slate-700 shadow-xl inline-block">
                {highestBidder.name}
              </p>
            ) : currentPlayer ? (
              <p className="text-3xl font-medium text-slate-500 animate-pulse">Awaiting bids...</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Right panel: Teams Dashboard */}
      <div className="flex-1 p-8 grid grid-cols-2 gap-6 bg-slate-950 overflow-y-auto">
        {store.teams.map(team => {
          const maxBid = calculateMaxAllowedBid(team, store.settings);
          const isLeading = store.currentBidTeamId === team.id;
          const isFull = team.players.length >= store.settings.maxPlayers;
          
          return (
            <div 
              key={team.id} 
              className={cn(
                "p-6 rounded-3xl border-2 flex flex-col justify-between shadow-2xl transition-all",
                isLeading ? "bg-purple-900/60 border-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.4)] transform scale-[1.02]" : "bg-slate-800 border-slate-700/50"
              )}
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-black text-white tracking-wide truncate pr-4">{team.name}</h3>
                <div className={cn(
                  "px-4 py-1.5 rounded-lg text-lg font-bold border",
                  isFull ? "bg-red-500/20 text-red-300 border-red-500/30" : "bg-slate-900 text-slate-300 border-slate-700"
                )}>
                  {team.players.length}/{store.settings.maxPlayers}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-900/50 rounded-xl p-4 flex justify-between items-center border border-slate-700/50">
                  <span className="text-slate-400 font-medium uppercase tracking-wider text-sm">Remaining Purse</span>
                  <span className="text-3xl font-bold font-mono text-white tracking-tight">{formatCurrency(team.budget)}</span>
                </div>
                
                <div className="bg-slate-900/50 rounded-xl p-4 flex justify-between items-center border border-slate-700/50">
                  <span className="text-slate-400 font-medium uppercase tracking-wider text-sm">Max Allowed Bid</span>
                  <span className={cn(
                    "text-2xl font-bold font-mono tracking-tight",
                    maxBid === 0 ? "text-red-400" : "text-blue-300"
                  )}>
                    {formatCurrency(maxBid)}
                  </span>
                </div>
              </div>

              {isLeading && (
                <div className="mt-6 text-center bg-purple-500 text-white font-black py-2 rounded-xl uppercase tracking-widest text-sm animate-pulse shadow-lg ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-900">
                  Current Leader
                </div>
              )}
              {isFull && !isLeading && (
                <div className="mt-6 text-center bg-red-900/50 text-red-300 font-black py-2 rounded-xl uppercase tracking-widest text-sm border border-red-500/30">
                  Squad Full
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
