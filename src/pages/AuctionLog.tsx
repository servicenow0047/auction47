import { useAuctionStore } from '../store/useAuctionStore';
import { formatCurrency, cn } from '../lib/utils';
import { Clock, Gavel, XCircle, PlayCircle, TrendingUp, RotateCcw, UserCircle, Trophy, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';

const typeStyles: Record<string, { color: string; bg: string; border: string; label: string }> = {
  bid:              { color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',   label: 'Bid Placed' },
  sold:             { color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200',  label: 'Player Sold' },
  unsold:           { color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    label: 'Unsold' },
  started:          { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', label: 'Auction Started' },
  spinner_selected: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Player Selected' },
  bid_undone:       { color: 'text-slate-500',  bg: 'bg-slate-50',  border: 'border-slate-200',  label: 'Bid Undone' },
  ended:            { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', label: 'Auction Ended' },
};

const TypeIcon = ({ type }: { type: string }) => {
  const icons: Record<string, React.ReactNode> = {
    bid: <TrendingUp size={15} />, sold: <Gavel size={15} />, unsold: <XCircle size={15} />,
    started: <PlayCircle size={15} />, spinner_selected: <UserCircle size={15} />,
    bid_undone: <RotateCcw size={15} />, ended: <Trophy size={15} />,
  };
  return <>{icons[type] || <Clock size={15} />}</>;
};

export default function AuctionLog() {
  const store = useAuctionStore();
  const [filter, setFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'bid', label: 'Bids' },
    { id: 'sold', label: 'Sold' },
    { id: 'unsold', label: 'Unsold' },
  ];

  const filteredLogs = useMemo(() => {
    return store.logs.filter(log => {
      const typeMatch = filter === 'all' || log.type === filter;
      const teamMatch = teamFilter === 'all' || log.teamId === teamFilter;
      return typeMatch && teamMatch;
    });
  }, [store.logs, filter, teamFilter]);

  // Stats
  const totalBids  = store.logs.filter(l => l.type === 'bid').length;
  const totalSold  = store.logs.filter(l => l.type === 'sold').length;
  const totalUnsold = store.logs.filter(l => l.type === 'unsold').length;
  const totalSpent = store.logs.filter(l => l.type === 'sold').reduce((s, l) => s + (l.amount ?? 0), 0);

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in">

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Clock size={22} className="text-purple-500" /> Bidding Log
        </h2>
        <p className="text-slate-500 text-sm mt-1">{store.logs.length} event(s) recorded this session</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Bids',    value: totalBids,                  color: 'text-blue-600',  bg: 'bg-blue-50'  },
          { label: 'Players Sold',  value: totalSold,                  color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Unsold',        value: totalUnsold,                color: 'text-red-600',   bg: 'bg-red-50'   },
          { label: 'Total Spent',   value: formatCurrency(totalSpent), color: 'text-purple-700',bg: 'bg-purple-50'},
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-slate-100`}>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <Filter size={15} className="text-slate-400" />
        <div className="flex gap-1.5">
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-bold transition',
                filter === f.id ? 'bg-purple-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-purple-300')}>
              {f.label}
            </button>
          ))}
        </div>
        {store.teams.length > 0 && (
          <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}
            className="ml-2 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-purple-400 bg-white">
            <option value="all">All Teams</option>
            {store.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
        <span className="ml-auto text-xs text-slate-400 font-medium">{filteredLogs.length} events</span>
      </div>

      {/* Log Entries */}
      {filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-xl text-slate-400">
          <Clock size={40} className="mb-4 opacity-30" />
          <p className="font-semibold">No events yet</p>
          <p className="text-sm mt-1">Events appear here once the auction starts.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log) => {
            const team   = store.teams.find(t => t.id === log.teamId);
            const player = store.players.find(p => p.id === log.playerId);
            const style  = typeStyles[log.type] || typeStyles['bid_undone'];

            return (
              <div key={log.id}
                className={cn('flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-sm', style.bg, style.border)}>

                {/* Icon */}
                <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-white border shadow-sm', style.color, style.border)}>
                  <TypeIcon type={log.type} />
                </div>

                {/* Team logo */}
                {team && (
                  <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                    {team.logo
                      ? <img src={team.logo} alt={team.name || 'Team'} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black">{(team.name || 'TM').substring(0, 2).toUpperCase()}</div>
                    }
                  </div>
                )}

                {/* Player photo */}
                {player?.photo && (
                  <img src={player.photo} alt={player.name}
                    className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0" />
                )}

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={cn('font-bold text-sm', style.color)}>
                    {log.type === 'bid'              && `${team?.name ?? '?'} bid ${formatCurrency(log.amount ?? 0)}`}
                    {log.type === 'sold'             && `${player?.name ?? 'Player'} sold to ${team?.name ?? '?'}`}
                    {log.type === 'unsold'           && `${player?.name ?? 'Player'} went unsold`}
                    {log.type === 'started'          && 'Auction Started'}
                    {log.type === 'ended'            && 'Auction Ended'}
                    {log.type === 'spinner_selected' && `${player?.name ?? 'Player'} called for auction`}
                    {log.type === 'bid_undone'       && `Bid undone — ${player?.name ?? 'Player'}`}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {player && log.type !== 'started' && log.type !== 'bid' && (
                      <span>{player.role} · </span>
                    )}
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </p>
                </div>

                {/* Amount badge */}
                {log.amount && (
                  <span className={cn(
                    'font-mono font-black text-sm shrink-0 px-2.5 py-1 rounded-lg',
                    log.type === 'sold' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  )}>
                    {formatCurrency(log.amount)}
                  </span>
                )}

                {/* Type badge */}
                <span className={cn('text-[10px] font-bold uppercase tracking-wide shrink-0 px-2 py-0.5 rounded-full border', style.color, style.border, style.bg)}>
                  {style.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
