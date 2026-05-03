import { useState, useMemo, useEffect } from 'react';
import { useAuctionStore, getNextBidAmount } from '../store/useAuctionStore';
import { api } from '../lib/api';
import { calculateMaxAllowedBid, canTeamBid } from '../utils/auctionLogic';
import { Gavel, CheckCircle, XCircle, PlayCircle, RotateCcw, Maximize2, X } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import PlayerSpinner from '../components/PlayerSpinner';

export default function LiveAuction() {
  const store = useAuctionStore();
  const [schema, setSchema] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [manualAmt, setManualAmt] = useState('');
  const [manualTeamId, setManualTeamId] = useState('');
  const [isUndoOpen, setIsUndoOpen] = useState(false);
  const [isUnsoldOpen, setIsUnsoldOpen] = useState(false);
  const [popupEvent, setPopupEvent] = useState<{
    type: 'sold' | 'unsold';
    player: any;
    team?: any;
    price?: number;
  } | null>(null);

  useEffect(() => { api.getRegistrationSchema().then(setSchema).catch(console.error); }, []);
  useEffect(() => { setIsExpanded(false); }, [store.currentPlayerId]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsExpanded(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const currentPlayer = useMemo(() =>
    store.currentPlayerId ? store.players.find(p => p.id === store.currentPlayerId) || null : null,
    [store.currentPlayerId, store.players]);

  const nextBid = getNextBidAmount(store.currentBid, store.settings);
  const highestBidder = store.teams.find(t => t.id === store.currentBidTeamId);
  const availablePlayers = store.players.filter(p => p.status === 'not_called');
  const hasUnsold = store.players.some(p => p.status === 'unsold');

  const manualAmount = parseInt(manualAmt) || 0;
  const selTeam = store.teams.find(t => t.id === manualTeamId);
  const selTeamMax = selTeam ? calculateMaxAllowedBid(selTeam, store.settings) : 0;
  const manualErr = !currentPlayer ? 'No active player'
    : !manualTeamId ? 'Select team'
    : manualAmount < store.settings.basePrice ? `Min ₹${store.settings.basePrice.toLocaleString('en-IN')}`
    : manualAmount > selTeamMax ? 'Exceeds max bid'
    : (selTeam?.players.length ?? 0) >= store.settings.maxPlayers ? 'Squad full'
    : null;

  const handleManualBid = () => {
    if (manualErr || !manualAmount) return;
    store.placeBid(manualTeamId, manualAmount);
    setManualAmt('');
  };

  const handleSell = () => {
    if (!currentPlayer || !highestBidder) return;
    setPopupEvent({ type: 'sold', player: currentPlayer, team: highestBidder, price: store.currentBid });
    store.sellPlayer();
    setIsExpanded(false);
    setTimeout(() => setPopupEvent(null), 2500);
  };

  const handleUnsoldClick = () => setIsUnsoldOpen(true);

  const confirmUnsold = () => {
    if (!currentPlayer) return;
    setPopupEvent({ type: 'unsold', player: currentPlayer });
    store.markUnsold();
    setIsExpanded(false);
    setIsUnsoldOpen(false);
    setTimeout(() => setPopupEvent(null), 2500);
  };

  if (store.status === 'setup') return (
    <div className="flex flex-col items-center justify-center h-full text-slate-500">
      <PlayCircle size={64} className="mb-4 text-purple-600" />
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Auction not active</h2>
      <button onClick={store.startAuction} className="mt-4 bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition">Start Auction</button>
    </div>
  );

  if (store.status === 'completed') return (
    <div className="flex flex-col items-center justify-center h-full text-slate-500">
      <CheckCircle size={64} className="mb-4 text-green-600" />
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Auction Completed</h2>
      <button onClick={() => store.resetAuction()} className="mt-6 border border-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition">Reset</button>
    </div>
  );

  return (
    <>
      {/* ── 3-Column Layout ── */}
      <div className="flex gap-4 h-[calc(100vh-8rem)]">

        {/* ── LEFT: Player Card + Team Logos + Manual Bid ── */}
        <div className="w-72 shrink-0 flex flex-col gap-3">

          {/* Player Card */}
          <div
            onClick={() => currentPlayer && setIsExpanded(true)}
            className={cn(
              'bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex-1',
              currentPlayer ? 'cursor-pointer group' : ''
            )}
          >
            {currentPlayer ? (
              <>
                {/* Expand hint */}
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition bg-white/10 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 pointer-events-none">
                  <Maximize2 size={10} /> Expand
                </div>
                {/* Photo */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-600/20 to-transparent" />
                  <img
                    src={currentPlayer.photo}
                    alt={currentPlayer.name}
                    className="w-full h-44 object-contain bg-slate-800"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent h-16" />
                  <span className="absolute bottom-2 left-3 bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full uppercase">
                    {(currentPlayer as any).role || (currentPlayer as any).position || 'Player'}
                  </span>
                </div>
                {/* Details */}
                <div className="p-4">
                  <h2 className="text-white font-black text-xl leading-tight mb-3">{currentPlayer.name}</h2>
                  <div className="space-y-1.5">
                    {schema?.fields?.filter((f: any) => f.type !== 'file' && f.id !== 'name' && f.id !== 'photo' && f.id !== 'basePrice').map((field: any) => {
                      const val = (currentPlayer as any)[field.id];
                      if (!val) return null;
                      return (
                        <div key={field.id} className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-medium">{field.label}</span>
                          <span className="text-slate-100 font-bold">{String(val)}</span>
                        </div>
                      );
                    })}
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-700 mt-2">
                      <span className="text-slate-400 font-medium">Base Price</span>
                      <span className="text-purple-300 font-black">{formatCurrency(currentPlayer.basePrice)}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full">
                <PlayerSpinner
                  availablePlayers={availablePlayers}
                  onSelectPlayer={id => store.nextPlayer(id)}
                  onReaddUnsold={store.readdUnsoldPlayers}
                  hasUnsoldPlayers={hasUnsold}
                />
              </div>
            )}
          </div>



          {/* Manual Bid Bar */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-3 shrink-0">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2 flex items-center gap-1">
              <Gavel size={10} className="text-purple-400" /> Manual Bid
            </p>
            <div className="flex gap-2 mb-1">
              <select
                value={manualTeamId}
                onChange={e => setManualTeamId(e.target.value)}
                disabled={!currentPlayer}
                className="flex-1 appearance-none bg-slate-700 border border-slate-600 text-slate-100 text-xs font-semibold rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
              >
                <option value="">— Team —</option>
                {store.teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                <input
                  type="number"
                  placeholder="Amount"
                  value={manualAmt}
                  onChange={e => setManualAmt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleManualBid()}
                  disabled={!currentPlayer}
                  className="w-full bg-slate-700 border border-slate-600 text-slate-100 text-xs font-mono font-bold rounded-lg pl-5 pr-2 py-2 outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                />
              </div>
              <button
                onClick={handleManualBid}
                disabled={!!manualErr || !manualAmount}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold px-3 py-2 rounded-lg transition text-xs"
              >
                Bid
              </button>
            </div>
            {manualTeamId && manualAmount > 0 && (
              <p className={cn('text-[10px] font-medium', manualErr ? 'text-red-400' : 'text-green-400')}>
                {manualErr ?? `Remaining: ₹${((selTeam?.budget ?? 0) - manualAmount).toLocaleString('en-IN')}`}
              </p>
            )}
          </div>
        </div>

        {/* ── MIDDLE: Bid Amount + Team Bids List ── */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* Big Bid Display */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 p-6 text-center shadow-xl shrink-0">
            <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-1">Bid Amount</p>
            <div className="text-6xl font-black text-white tracking-tight leading-none my-2">
              {store.currentBid > 0 ? formatCurrency(store.currentBid) : '---'}
            </div>
            <p className="text-slate-400 text-sm mt-2">
              {highestBidder
                ? <span className="text-purple-300 font-bold">{highestBidder.name}</span>
                : 'Awaiting first bid...'}
            </p>
            {currentPlayer && (
              <p className="text-slate-500 text-xs mt-1">
                Next: <span className="text-green-400 font-mono font-bold">{formatCurrency(nextBid)}</span>
              </p>
            )}
          </div>

          {/* Team Bid Grid — 2 columns, no scroll, fills height */}
          <div className="flex-1 min-h-0">
            <div className="grid grid-cols-2 gap-2 h-full" style={{ gridTemplateRows: `repeat(${Math.ceil(store.teams.length / 2)}, 1fr)` }}>
              {store.teams.map(team => {
                const maxBid   = calculateMaxAllowedBid(team, store.settings);
                const isFull   = team.players.length >= store.settings.maxPlayers;
                const canBid   = currentPlayer && canTeamBid(team, nextBid, store.settings) && store.currentBidTeamId !== team.id;
                const isLeading = store.currentBidTeamId === team.id;

                return (
                  <div
                    key={team.id}
                    onClick={() => (canBid && !isFull) && store.placeBid(team.id, nextBid)}
                    className={cn(
                      'rounded-xl border overflow-hidden transition-all flex flex-col select-none',
                      isLeading
                        ? 'border-purple-500 shadow-[0_0_16px_rgba(168,85,247,0.35)] bg-purple-950/60'
                        : canBid && !isFull
                        ? 'border-slate-600 bg-slate-800 cursor-pointer hover:border-purple-400 hover:bg-slate-750 active:scale-[0.97] hover:shadow-lg'
                        : 'border-slate-700 bg-slate-800 cursor-not-allowed opacity-60'
                    )}
                  >
                    {/* Top: logo + name + stats */}
                    <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
                      {/* Logo / initials */}
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-600 shrink-0">
                        {team.logo
                          ? <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs font-black">{team.name.substring(0, 2).toUpperCase()}</div>
                        }
                      </div>
                      <div className="min-w-0">
                        <p className={cn('font-black text-sm truncate leading-tight', isLeading ? 'text-purple-200' : 'text-slate-100')}>
                          {team.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono leading-tight">
                          {team.players.length}/{store.settings.maxPlayers} players
                        </p>
                      </div>
                    </div>

                    {/* Budget row */}
                    <div className="flex justify-between items-center px-3 pb-2 text-[10px] font-mono">
                      <span className="text-slate-400">₹{team.budget.toLocaleString('en-IN')}</span>
                      <span className="text-blue-300">max ₹{maxBid.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Status bar — full width at bottom */}
                    <div
                      className={cn(
                        'w-full py-3 font-black text-base tracking-wide text-center mt-auto',
                        isLeading
                          ? 'bg-purple-600 text-white'
                          : isFull
                          ? 'bg-slate-700 text-slate-500 text-sm'
                          : !canBid && currentPlayer
                          ? 'bg-slate-700 text-red-400 text-sm'
                          : 'bg-white text-slate-900'
                      )}
                    >
                      {isLeading
                        ? '★ LEADING'
                        : isFull
                        ? 'Squad Full'
                        : !canBid && currentPlayer
                        ? 'Low Funds'
                        : currentPlayer
                        ? `₹${nextBid.toLocaleString('en-IN')}`
                        : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Sell Panel ── */}
        <div className="w-64 shrink-0 flex flex-col gap-4">

          {/* Leading team box */}
          <div className="bg-slate-900 rounded-2xl border border-slate-700 p-5 text-center shadow-xl">
            <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-3">Transfer To</p>
            {highestBidder ? (
              <>
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-purple-500 mx-auto mb-3 shadow-lg shadow-purple-500/30">
                  {highestBidder.logo
                    ? <img src={highestBidder.logo} alt={highestBidder.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-lg font-black">{highestBidder.name.substring(0, 2).toUpperCase()}</div>
                  }
                </div>
                <p className="text-white font-black text-lg leading-tight">{highestBidder.name}</p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between items-center bg-slate-800 rounded-lg px-3 py-2">
                    <span className="text-slate-400">Balance</span>
                    <span className="text-white font-mono font-bold">{formatCurrency(highestBidder.budget)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-800 rounded-lg px-3 py-2">
                    <span className="text-slate-400">Bid</span>
                    <span className="text-green-400 font-mono font-bold">{formatCurrency(store.currentBid)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-800 rounded-lg px-3 py-2">
                    <span className="text-slate-400">After</span>
                    <span className="text-blue-300 font-mono font-bold">{formatCurrency(highestBidder.budget - store.currentBid)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-6 text-slate-500">
                <div className="w-14 h-14 rounded-xl bg-slate-800 mx-auto mb-3" />
                <p className="text-sm">No bid yet</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {currentPlayer && (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSell}
                disabled={store.currentBid === 0}
                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white py-4 rounded-xl font-black text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Gavel size={22} /> SELL
              </button>
              <button
                onClick={() => setIsUndoOpen(true)}
                disabled={!store.logs.filter(l => l.playerId === store.currentPlayerId && l.type === 'bid').length}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
              >
                <RotateCcw size={16} /> Undo Bid
              </button>
              <button
                onClick={handleUnsoldClick}
                disabled={store.currentBid > 0}
                className="w-full bg-red-700 hover:bg-red-600 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white py-4 rounded-xl font-black text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <XCircle size={22} /> UNSOLD
              </button>
            </div>
          )}


        </div>
      </div>

      {/* ── Expanded Player Card Modal ── */}
      {isExpanded && currentPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={() => setIsExpanded(false)}>
          <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto text-center" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsExpanded(false)} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-700 hover:bg-red-600 text-white transition"><X size={18} /></button>
            <img src={currentPlayer.photo} alt={currentPlayer.name} className="w-full h-80 object-contain bg-slate-800 rounded-t-3xl" />
            <div className="p-8">
              <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">{(currentPlayer as any).role || 'Player'}</span>
              <h2 className="text-white font-black text-4xl mt-4 mb-6">{currentPlayer.name}</h2>
              
              {/* Full Player Attributes */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-8 text-left bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                {schema?.fields?.filter((f: any) => f.type !== 'file' && f.id !== 'name' && f.id !== 'photo' && f.id !== 'basePrice').map((field: any) => {
                  const val = (currentPlayer as any)[field.id];
                  if (!val) return null;
                  return (
                    <div key={field.id} className="flex flex-col">
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">{field.label}</span>
                      <span className="text-slate-100 font-bold text-lg">{String(val)}</span>
                    </div>
                  );
                })}
                <div className="flex flex-col col-span-2 border-t border-slate-700 pt-3 mt-1">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">Base Price</span>
                  <span className="text-purple-400 font-black text-xl">{formatCurrency(currentPlayer.basePrice)}</span>
                </div>
              </div>
              <div className="bg-slate-800/80 rounded-2xl p-6 mb-6">
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Current Bid</p>
                <p className="text-6xl font-black text-white">{store.currentBid > 0 ? formatCurrency(store.currentBid) : '---'}</p>
                {highestBidder && <p className="text-purple-300 font-bold text-xl mt-2">{highestBidder.name}</p>}
              </div>
              <div className="flex gap-3">
                <button onClick={handleSell} disabled={store.currentBid === 0}
                  className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 disabled:cursor-not-allowed">
                  <Gavel size={22} /> Sell
                </button>
                <button onClick={handleUnsoldClick} disabled={store.currentBid > 0}
                  className="flex-1 bg-red-700 hover:bg-red-600 disabled:bg-slate-700 text-white py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 disabled:cursor-not-allowed">
                  <XCircle size={22} /> Unsold
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Undo Modal */}
      {isUndoOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 m-4">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Undo</h3>
            <p className="text-slate-600 text-sm mb-6">Revert the highest bid to the previous amount?</p>
            <div className="flex gap-3">
              <button onClick={() => setIsUndoOpen(false)} className="flex-1 border border-slate-300 py-2 rounded-xl font-bold hover:bg-slate-50 transition">Cancel</button>
              <button onClick={() => { store.undoLastBid(); setIsUndoOpen(false); }} className="flex-[2] bg-amber-500 text-white font-bold py-2 rounded-xl hover:bg-amber-600 transition">Undo Last Bid</button>
            </div>
          </div>
        </div>
      )}

      {/* Unsold Confirmation Modal */}
      {isUnsoldOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 m-4 animate-in zoom-in-95">
            <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
              <XCircle className="text-red-600" /> Mark Unsold?
            </h3>
            <p className="text-slate-600 text-sm mb-6">Are you sure you want to mark <span className="font-bold">{currentPlayer?.name}</span> as unsold? You can re-add unsold players later from the settings.</p>
            <div className="flex gap-3">
              <button onClick={() => setIsUnsoldOpen(false)} className="flex-1 border border-slate-300 py-2 rounded-xl font-bold hover:bg-slate-50 transition">Cancel</button>
              <button onClick={confirmUnsold} className="flex-[2] bg-red-600 text-white font-bold py-2 rounded-xl hover:bg-red-700 transition">Confirm Unsold</button>
            </div>
          </div>
        </div>
      )}

      {/* Popups */}
      <PopupEventRenderer event={popupEvent} />
    </>
  );
}

// Ensure the popup renders right before the closing fragment
const PopupEventRenderer = ({ event }: { event: any }) => {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300 pointer-events-none">
      <div className={cn(
        "relative flex flex-col items-center justify-center p-12 rounded-3xl shadow-2xl animate-in zoom-in-75 duration-500",
        event.type === 'sold' ? 'bg-gradient-to-b from-green-600 to-green-800' : 'bg-gradient-to-b from-red-600 to-red-800'
      )}>
        {/* Decorative background glow */}
        <div className="absolute inset-0 bg-white/10 rounded-3xl animate-pulse mix-blend-overlay" />

        {/* Status Badge */}
        <div className={cn(
          "absolute -top-6 px-8 py-2 rounded-full font-black text-3xl shadow-xl tracking-widest text-white border-4 border-white/20",
          event.type === 'sold' ? 'bg-green-500' : 'bg-red-500'
        )}>
          {event.type === 'sold' ? 'SOLD!' : 'UNSOLD'}
        </div>

        <div className="flex items-center gap-12 mt-6">
          {/* Player Info */}
          <div className="flex flex-col items-center">
            <img src={event.player.photo} alt={event.player.name} className="w-48 h-48 rounded-2xl object-contain bg-white/10 border-4 border-white/20 shadow-2xl" />
            <h2 className="text-white font-black text-3xl mt-4 max-w-[250px] truncate">{event.player.name}</h2>
            <p className="text-white/80 font-bold tracking-widest uppercase mt-1">{(event.player as any).role || 'Player'}</p>
          </div>

          {/* Sold Details */}
          {event.type === 'sold' && event.team && (
            <>
              <div className="text-white/40">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
              <div className="flex flex-col items-center bg-white/10 p-8 rounded-3xl border border-white/20">
                {event.team.logo ? (
                  <img src={event.team.logo} alt={event.team.name} className="w-32 h-32 rounded-xl object-cover shadow-2xl border-2 border-white/20" />
                ) : (
                  <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-2xl border-2 border-white/20">
                    {event.team.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <h3 className="text-white font-black text-2xl mt-4 text-center max-w-[200px] leading-tight">{event.team.name}</h3>
                <div className="mt-4 bg-green-900/50 px-6 py-2 rounded-xl border border-green-400/30">
                  <p className="text-green-300 text-xs uppercase font-bold tracking-widest mb-1 text-center">For</p>
                  <p className="text-4xl font-black text-white font-mono">{formatCurrency(event.price || 0)}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
