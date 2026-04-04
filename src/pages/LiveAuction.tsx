import { useState, useMemo, useEffect } from 'react';
import { useAuctionStore, getNextBidAmount } from '../store/useAuctionStore';
import { api } from '../lib/api';
import { calculateMaxAllowedBid, canTeamBid } from '../utils/auctionLogic';
import { Gavel, CheckCircle, XCircle, PlayCircle, RotateCcw } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import PlayerSpinner from '../components/PlayerSpinner';

export default function LiveAuction() {
  const store = useAuctionStore();
  const [schema, setSchema] = useState<any>(null);

  useEffect(() => {
    api.getRegistrationSchema().then(setSchema).catch(console.error);
  }, []);

  const currentPlayer = useMemo(() => {
    if (!store.currentPlayerId) return null;
    return store.players.find(p => p.id === store.currentPlayerId) || null;
  }, [store.currentPlayerId, store.players]);

  const nextBid = getNextBidAmount(store.currentBid, store.settings);
  const highestBidder = store.teams.find(t => t.id === store.currentBidTeamId);
  const availablePlayers = store.players.filter(p => p.status === 'not_called');
  const hasUnsoldPlayers = store.players.some(p => p.status === 'unsold');

  const [isUndoModalOpen, setIsUndoModalOpen] = useState(false);

  const playerBids = useMemo(() => {
    if (!store.currentPlayerId) return [];
    return store.logs.filter(l => l.playerId === store.currentPlayerId && l.type === 'bid');
  }, [store.logs, store.currentPlayerId]);

  const handleNextPlayer = (id: string) => {
    store.nextPlayer(id);
  };

  const handleUndoConfirm = () => {
    store.undoLastBid();
    setIsUndoModalOpen(false);
  };

  if (store.status === 'setup') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-in fade-in">
        <PlayCircle size={64} className="mb-4 text-purple-600" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Auction is not active</h2>
        <p className="mb-6">Initialize teams and players, then start the auction from the dashboard.</p>
        <button 
          onClick={store.startAuction}
          className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition"
        >
          Start Auction Now
        </button>
      </div>
    );
  }

  if (store.status === 'completed') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-in fade-in">
        <CheckCircle size={64} className="mb-4 text-green-600" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Auction Completed</h2>
        <p>All players have been processed.</p>
        <button 
          onClick={() => store.resetAuction()}
          className="mt-6 border border-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition"
        >
          Reset to Setup
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)] animate-in fade-in">
      {/* Left Panel: Active Player & Log */}
      <div className="flex-1 flex flex-col gap-6 w-1/2">
        {/* Current Player Card */}
        <div className="flex-1 bg-white border-2 border-purple-200 rounded-2xl shadow-lg flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-10"></div>
          
          {currentPlayer ? (
            <div className="relative z-10 flex flex-col items-center w-full p-6 overflow-y-auto">
              <div className="relative">
                <img 
                  src={currentPlayer.photo} 
                  alt={currentPlayer.name} 
                  className="w-32 h-32 rounded-full border-4 border-white shadow-md object-cover bg-white"
                />
                <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                    {(currentPlayer as any).role || (currentPlayer as any).position || 'Player'}
                </span>
              </div>
              
              <h2 className="text-3xl font-black text-slate-900 mt-6">{currentPlayer.name}</h2>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 text-slate-600 max-w-lg mx-auto">
                {schema?.fields?.filter((f: any) => f.type !== 'file' && f.id !== 'name' && f.id !== 'photo' && f.id !== 'basePrice').map((field: any) => {
                  const val = (currentPlayer as any)[field.id];
                  if (val === undefined || val === null || val === '') return null;
                  return (
                    <span key={field.id} className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-md text-sm border border-slate-200">
                      <span className="font-semibold text-slate-500">{field.label}:</span>
                      <span className="font-bold text-slate-800">{String(val)}</span>
                    </span>
                  );
                })}
                <span className="flex items-center gap-1.5 bg-purple-50 px-3 py-1 rounded-md text-sm border border-purple-200">
                  <span className="font-semibold text-purple-600">Base:</span>
                  <span className="font-bold text-purple-900">{formatCurrency(currentPlayer.basePrice)}</span>
                </span>
              </div>

              {/* Bidding Stats */}
              <div className="mt-8 w-full bg-slate-50 rounded-xl p-6 border border-slate-200 shadow-inner">
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">Current Highest Bid</p>
                <div className="text-5xl font-black text-purple-700 tracking-tight">
                  {store.currentBid > 0 ? formatCurrency(store.currentBid) : '---'}
                </div>
                {highestBidder ? (
                  <p className="mt-2 text-lg font-bold text-indigo-600">Bid by {highestBidder.name}</p>
                ) : (
                  <p className="mt-2 text-slate-500">Awaiting first bid...</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex w-full gap-4 mt-8 pb-2">
                <button 
                  onClick={store.sellPlayer}
                  disabled={store.currentBid === 0}
                  className="flex-[2] bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Gavel size={24} />
                  Sell
                </button>
                <button 
                  onClick={() => setIsUndoModalOpen(true)}
                  disabled={playerBids.length === 0}
                  className="flex-[1] bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2"
                  title="Undo last bid"
                >
                  <RotateCcw size={24} />
                  Undo
                </button>
                <button 
                  onClick={store.markUnsold}
                  disabled={store.currentBid > 0}
                  className="flex-[2] bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <XCircle size={24} />
                  Pass / Unsold
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full overflow-y-auto">
              <PlayerSpinner 
                availablePlayers={availablePlayers}
                onSelectPlayer={handleNextPlayer}
                onReaddUnsold={store.readdUnsoldPlayers}
                hasUnsoldPlayers={hasUnsoldPlayers}
              />
            </div>
          )}
        </div>

        {/* Live Bidding History Display */}
        {currentPlayer && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col" style={{minHeight: '180px', maxHeight: '30%'}}>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3 flex justify-between items-center">
              <span>Live Bidding Log</span>
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-xs">{playerBids.length} bids</span>
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
              {playerBids.length === 0 ? (
                <div className="text-center text-slate-400 py-6 text-sm">Waiting for bids...</div>
              ) : (
                playerBids.map((bid, i) => {
                  const team = store.teams.find(t => t.id === bid.teamId);
                  const isLatest = i === 0;
                  return (
                    <div 
                      key={bid.id} 
                      className={cn(
                        "flex justify-between items-center p-3 rounded-lg border text-sm transition-all",
                        isLatest ? "bg-purple-50 border-purple-200 shadow-sm" : "bg-slate-50 border-slate-100 opacity-70"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {isLatest && <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />}
                        <span className={cn("font-medium", isLatest ? "text-purple-900" : "text-slate-600")}>
                          {team?.name}
                        </span>
                      </div>
                      <span className={cn("font-mono font-bold tracking-tight", isLatest ? "text-purple-700" : "text-slate-500")}>
                        {formatCurrency(bid.amount ?? 0)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel: Teams Control */}
      <div className="flex-1 bg-slate-900 rounded-2xl shadow-xl border border-slate-700 flex flex-col overflow-hidden w-1/2">
        <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-white text-lg">Franchise Boards</h3>
          <div className="text-slate-300 bg-slate-900 px-4 py-1.5 rounded-full text-sm font-semibold border border-slate-700 flex items-center gap-2">
            Next Bid: <span className="text-green-400 font-mono text-base">{formatCurrency(currentPlayer ? nextBid : 0)}</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {store.teams.map(team => {
            const maxBid = calculateMaxAllowedBid(team, store.settings);
            const isFull = team.players.length >= store.settings.maxPlayers;
            const canBid = currentPlayer && canTeamBid(team, nextBid, store.settings) && store.currentBidTeamId !== team.id;
            const isLeading = store.currentBidTeamId === team.id;

            return (
              <div 
                key={team.id} 
                className={cn(
                  "p-4 rounded-xl border flex flex-col justify-between transition-all",
                  isLeading ? "bg-purple-900/40 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]" : "bg-slate-800 border-slate-700"
                )}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-100 uppercase tracking-wide truncate pr-2">{team.name}</h4>
                    <span className="text-xs font-semibold bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                      {team.players.length}/{store.settings.maxPlayers}
                    </span>
                  </div>
                  <div className="flex items-end justify-between mt-3">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Purse</p>
                      <p className="font-mono font-bold text-white tracking-tight">{formatCurrency(team.budget)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Max Bid</p>
                      <p className="font-mono font-bold text-blue-300 text-sm tracking-tight">{formatCurrency(maxBid)}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => store.placeBid(team.id, nextBid)}
                  disabled={!canBid || isFull}
                  className={cn(
                    "mt-4 w-full py-2.5 rounded-lg font-bold text-sm tracking-wide transition-all",
                    isLeading ? "bg-purple-600 text-white shadow-lg pointer-events-none" :
                    !canBid || isFull ? "bg-slate-700 text-slate-500 cursor-not-allowed" :
                    "bg-slate-200 text-slate-900 hover:bg-white active:scale-[0.98] shadow text-center flex items-center justify-center gap-2"
                  )}
                >
                  {isLeading ? (
                    <>Leading Bidder</>
                  ) : isFull ? (
                    <>Squad Full</>
                  ) : !canBid && currentPlayer ? (
                    <>Insufficient Funds</>
                  ) : currentPlayer ? (
                    <>Bid {formatCurrency(nextBid)}</>
                  ) : (
                    <>Waiting...</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Undo Confirmation Modal */}
      {isUndoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 m-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Undo</h3>
            <p className="text-slate-600 text-sm mb-6">
              Do you want to undo the last bid? This will revert the highest bid to the previous amount.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsUndoModalOpen(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleUndoConfirm}
                className="flex-[2] bg-amber-500 text-white font-bold px-4 py-2 rounded-xl shadow-md hover:bg-amber-600 transition"
              >
                Undo Last Bid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
