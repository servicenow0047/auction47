import { useState } from 'react';
import { useAuctionStore } from '../store/useAuctionStore';
import { RefreshCw, Users, RotateCcw } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export default function UnsoldPlayers() {
  const store = useAuctionStore();
  const [confirming, setConfirming] = useState<string | null>(null);

  const unsoldPlayers = store.players.filter(p => p.status === 'unsold');

  const handleReadd = (playerId: string) => {
    store.readdSingleUnsoldPlayer(playerId);
    setConfirming(null);
  };

  const handleReaddAll = () => {
    if (confirm(`Re-add all ${unsoldPlayers.length} unsold player(s) to the auction pool?`)) {
      store.readdUnsoldPlayers();
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Unsold Players
            {unsoldPlayers.length > 0 && (
              <span className="ml-3 text-sm font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
                {unsoldPlayers.length}
              </span>
            )}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Players who went unsold. Re-add to spinner for another chance.
          </p>
        </div>

        {unsoldPlayers.length > 1 && (
          <button
            onClick={handleReaddAll}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition"
          >
            <RefreshCw size={16} />
            Re-add All
          </button>
        )}
      </div>

      {/* Empty state */}
      {unsoldPlayers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-xl text-slate-400">
          <Users size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-semibold">No unsold players</p>
          <p className="text-sm mt-1">Players marked unsold during auction will appear here.</p>
        </div>
      )}

      {/* Player Cards */}
      {unsoldPlayers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {unsoldPlayers.map(player => (
            <div
              key={player.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Photo + badge */}
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={player.photo}
                  alt={player.name}
                  className="w-14 h-14 rounded-full border-2 border-slate-200 object-cover bg-slate-100 shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{player.name}</p>
                  <span className="inline-block mt-0.5 text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {player.role}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-3 text-sm text-slate-600 mb-4">
                <div className="flex-1 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                  <p className="text-xs text-slate-400 mb-0.5">Age</p>
                  <p className="font-bold">{player.age}</p>
                </div>
                <div className="flex-1 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                  <p className="text-xs text-slate-400 mb-0.5">Base Price</p>
                  <p className="font-bold font-mono">{formatCurrency(player.basePrice)}</p>
                </div>
              </div>

              {/* Status badge */}
              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Unsold
                </span>
              </div>

              {/* Re-add button */}
              {confirming === player.id ? (
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleReadd(player.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 rounded-lg font-bold transition"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirming(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm py-2 rounded-lg font-bold transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming(player.id)}
                  className="mt-auto w-full flex items-center justify-center gap-2 border border-slate-300 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700 text-slate-600 text-sm py-2 rounded-lg font-medium transition"
                >
                  <RotateCcw size={14} />
                  Re-add to Auction Pool
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
