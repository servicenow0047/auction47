import { useState, useMemo, useEffect } from 'react';
import { useAuctionStore, getNextBidAmount } from '../store/useAuctionStore';
import { api } from '../lib/api';
import { calculateMaxAllowedBid, canTeamBid } from '../utils/auctionLogic';
import { Gavel, CheckCircle, XCircle, PlayCircle, RotateCcw, Maximize2, X, Shuffle } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import PlayerSpinner from '../components/PlayerSpinner';
import PlayerCard from '../components/PlayerCard';

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
    setTimeout(() => setPopupEvent(null), 8000); // 8 seconds, can be dismissed early
  };

  const handleUnsoldClick = () => setIsUnsoldOpen(true);

  const confirmUnsold = () => {
    if (!currentPlayer) return;
    setPopupEvent({ type: 'unsold', player: currentPlayer });
    store.markUnsold();
    setIsExpanded(false);
    setIsUnsoldOpen(false);
    setTimeout(() => setPopupEvent(null), 8000); // 8 seconds, can be dismissed early
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
    <div className="relative h-full w-full overflow-hidden flex flex-col">
      {/* Background Watermark */}
      {store.settings.tournamentLogo && (
        <div className="absolute inset-0 z-[-1] flex items-center justify-center pointer-events-none opacity-[0.03]">
          <img src={store.settings.tournamentLogo} alt="" className="w-[80%] max-w-4xl object-contain mix-blend-luminosity grayscale" />
        </div>
      )}

      {/* ── 3-Column Layout ── */}
      <div className="flex gap-4 h-full">

        {/* ── LEFT: Player Card + Team Logos + Manual Bid ── */}
        <div className="w-72 shrink-0 flex flex-col gap-3">

          {/* Player Card */}
          {currentPlayer ? (
            <div 
              onClick={() => setIsExpanded(true)}
              className="cursor-pointer group relative flex-1 min-h-0"
            >
              <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 pointer-events-none shadow-lg">
                <Maximize2 size={10} /> Expand
              </div>
              <PlayerCard 
                player={currentPlayer} 
                schema={schema} 
                layout="vertical"
                className="h-full w-full !border-blue-500/30 hover:!border-blue-400 transition-colors overflow-y-auto"
                registrationNumber={store.players.findIndex(p => p.id === currentPlayer.id) + 101}
              />
            </div>
          ) : (
            <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl border border-slate-700 shadow-xl flex-1 min-h-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mb-4">
                <Shuffle className="text-slate-500" size={24} />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs leading-relaxed">
                Waiting for<br />Player Selection
              </p>
            </div>
          )}



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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 sm:p-8" onClick={() => setIsExpanded(false)}>
          <div className="relative w-full max-w-5xl flex flex-col gap-6" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsExpanded(false)} className="absolute -top-5 -right-5 z-50 p-3 rounded-full bg-slate-800 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-slate-700 transition"><X size={20} /></button>
            
            <PlayerCard 
              player={currentPlayer} 
              schema={schema} 
              layout="horizontal"
              className="w-full max-w-none shadow-[0_0_50px_rgba(37,99,235,0.4)]"
              registrationNumber={store.players.findIndex(p => p.id === currentPlayer.id) + 101}
            />

            {/* Auction Actions Panel */}
            <div className="w-full flex flex-col sm:flex-row gap-4 mt-2">
              <div className="flex-[2] bg-slate-900/90 backdrop-blur-md rounded-2xl p-6 border border-slate-700 flex flex-col justify-center items-center shadow-2xl">
                <p className="text-slate-400 text-sm uppercase tracking-widest mb-1 font-bold">Current Bid</p>
                <p className="text-5xl md:text-6xl font-black text-white">{store.currentBid > 0 ? formatCurrency(store.currentBid) : '---'}</p>
                {highestBidder && <p className="text-purple-400 font-bold text-xl mt-2">{highestBidder.name}</p>}
              </div>
              
              <div className="flex-[3] flex flex-col sm:flex-row gap-3">
                <button onClick={handleSell} disabled={store.currentBid === 0}
                  className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-600 text-white py-6 rounded-2xl font-black text-2xl flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(22,163,74,0.3)] disabled:shadow-none uppercase tracking-wider">
                  <Gavel size={28} /> Sell
                </button>
                <button onClick={handleUnsoldClick} disabled={store.currentBid > 0}
                  className="flex-1 bg-red-700 hover:bg-red-600 disabled:bg-slate-800 disabled:text-slate-600 text-white py-6 rounded-2xl font-black text-2xl flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(185,28,28,0.3)] disabled:shadow-none uppercase tracking-wider">
                  <XCircle size={28} /> Unsold
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
      <PopupEventRenderer 
        event={popupEvent} 
        tournamentName={store.settings.tournamentName} 
        tournamentLogo={store.settings.tournamentLogo}
        schema={schema}
        players={store.players}
        onDismiss={() => setPopupEvent(null)}
      />

      {/* Full Screen Slot Machine Spinner */}
      {!currentPlayer && (
        <PlayerSpinner
          availablePlayers={availablePlayers}
          allPlayers={store.players}
          onSelectPlayer={id => store.nextPlayer(id)}
          onReaddUnsold={store.readdUnsoldPlayers}
          hasUnsoldPlayers={hasUnsold}
          tournamentName={store.settings.tournamentName}
          tournamentLogo={store.settings.tournamentLogo}
        />
      )}
    </div>
  );
}

// Ensure the popup renders right before the closing fragment
const PopupEventRenderer = ({ 
  event, 
  tournamentName, 
  tournamentLogo,
  schema,
  players,
  onDismiss
}: { 
  event: any; 
  tournamentName?: string; 
  tournamentLogo?: string;
  schema?: any;
  players?: any[];
  onDismiss?: () => void;
}) => {
  if (!event || !schema || !players) return null;

  const registrationNumber = players.findIndex(p => p.id === event.player.id) + 101;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in zoom-in-95 duration-300 cursor-pointer"
      onClick={onDismiss}
    >
      <div className="absolute top-4 right-8 text-white/50 text-sm font-bold tracking-widest uppercase">
        Click anywhere to close
      </div>
      <div className="relative pointer-events-none">
        <PlayerCard 
          player={event.player} 
          schema={schema} 
          layout="horizontal"
          registrationNumber={registrationNumber}
          className="max-w-5xl w-[90vw] md:w-[1000px] shadow-[0_0_80px_rgba(37,99,235,0.4)] scale-100 md:scale-105 origin-center transition-transform"
        />

        {/* OVERLAYS */}

        {/* Tournament Logo (Top Center/Right) */}
        {tournamentLogo && (
          <div className="absolute -top-10 right-[35%] translate-x-1/2 z-50 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            <img src={tournamentLogo} alt="Tournament" className="h-28 object-contain" />
          </div>
        )}

        {/* SOLD / UNSOLD STAMP over the player image */}
        <div className="absolute top-1/2 left-24 -translate-y-1/2 z-50 -rotate-12 pointer-events-none origin-center">
          {event.type === 'sold' ? (
            <div className="bg-[#ff0000] text-white font-black text-6xl px-12 py-3 rounded shadow-[0_15px_30px_rgba(220,38,38,0.6)] border-4 border-red-500 tracking-[0.2em] transform scale-125">
              SOLD
            </div>
          ) : (
            <div className="bg-red-800 text-white font-black text-6xl px-12 py-3 rounded shadow-[0_15px_30px_rgba(153,27,27,0.6)] border-4 border-red-900 tracking-[0.2em] transform scale-125">
              UNSOLD
            </div>
          )}
        </div>

        {/* Sold Team & Price Overlay */}
        {event.type === 'sold' && event.team && (
          <div className="absolute -bottom-6 right-8 z-50 flex items-end gap-6 pointer-events-none">
            {/* Team Logo Box */}
            <div className="w-36 h-36 bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.8)] border-4 border-slate-200 rotate-3">
              {event.team.logo ? (
                <img src={event.team.logo} alt={event.team.name} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-800 font-black text-3xl text-center">
                  {event.team.name.substring(0, 3).toUpperCase()}
                </div>
              )}
            </div>
            {/* Price Text */}
            <div className="text-white font-black text-[2.5rem] tracking-wider drop-shadow-[0_5px_10px_rgba(0,0,0,0.9)] pb-6 whitespace-nowrap bg-black/40 px-4 py-1 rounded backdrop-blur-sm">
              POINT: {event.price}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
