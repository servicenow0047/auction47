import { useAuctionStore } from '../store/useAuctionStore';
import { formatCurrency } from '../lib/utils';
import { Clock, Gavel, XCircle, PlayCircle, TrendingUp, RotateCcw, UserCircle } from 'lucide-react';

const typeStyles = {
  bid: { icon: TrendingUp, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100', label: 'Bid Placed' },
  sold: { icon: Gavel, color: 'text-green-700', bg: 'bg-green-50 border-green-100', label: 'Player Sold' },
  unsold: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-100', label: 'Unsold' },
  started: { icon: PlayCircle, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-100', label: 'Auction Started' },
  spinner_selected: { icon: UserCircle, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100', label: 'Player Selected' },
  bid_undone: { icon: RotateCcw, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-100', label: 'Bid Undone' },
};

export default function AuctionLog() {
  const store = useAuctionStore();

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Clock size={22} className="text-purple-500" /> Auction Activity Log
          </h2>
          <p className="text-slate-500 text-sm mt-1">{store.logs.length} event(s) recorded</p>
        </div>
      </div>

      {store.logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-xl text-slate-400">
          <Clock size={40} className="mb-4 opacity-30" />
          <p className="font-semibold">No activity yet</p>
          <p className="text-sm mt-1">Events will appear here once the auction starts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {store.logs.map((log) => {
            const team = store.teams.find(t => t.id === log.teamId);
            const player = store.players.find(p => p.id === log.playerId);
            const style = typeStyles[log.type] || { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-50 border-slate-100', label: 'Event' };
            const Icon = style.icon;

            return (
              <div
                key={log.id}
                className={`flex items-center gap-4 p-4 rounded-xl border ${style.bg} transition-all`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-white border ${style.color}`}>
                  <Icon size={17} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm ${style.color}`}>
                    {log.type === 'bid' && `${team?.name ?? 'Unknown'} bid ${formatCurrency(log.amount ?? 0)}`}
                    {log.type === 'sold' && `${player?.name ?? 'Player'} sold to ${team?.name ?? 'Unknown'}`}
                    {log.type === 'unsold' && `${player?.name ?? 'Player'} went unsold`}
                    {log.type === 'started' && 'Auction Started'}
                    {log.type === 'spinner_selected' && `${player?.name ?? 'Player'} is up for auction`}
                    {log.type === 'bid_undone' && `Last bid was undone for ${player?.name ?? 'Player'}`}
                  </p>
                  {player && log.type !== 'started' && log.type !== 'bid' && (
                    <p className="text-xs text-slate-500 mt-0.5">{player.role} · Age {player.age}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</p>
                </div>

                {log.amount && log.type === 'sold' && (
                  <span className="font-mono font-black text-green-700 text-sm shrink-0">
                    {formatCurrency(log.amount)}
                  </span>
                )}
                {log.amount && log.type === 'bid' && (
                  <span className="font-mono font-semibold text-blue-600 text-sm shrink-0">
                    {formatCurrency(log.amount)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
