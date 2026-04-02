import { useState, useMemo, useEffect } from 'react';
import { useAuctionStore } from '../store/useAuctionStore';
import {
  Search, CheckCircle, XCircle, UserX, UserCheck,
  Clock, UserPlus, Eye, Filter, Trash2, ShieldAlert, Users, Download, Loader2
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import type { Player } from '../types';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { pdf } from '@react-pdf/renderer';
import { ApprovedPlayersPDFDocument } from '../components/PlayerListPDFView';

type TabType = 'pending' | 'not_called' | 'rejected';

interface ActionModal {
  isOpen: boolean;
  type: 'approve' | 'reject' | 'reapprove' | 'make_pending' | 'delete' | null;
  player: Player | null;
}

interface ModalConfig {
  title: string;
  body: string;
  confirmText: string;
  confirmClass: string;
}

function getModalConfig(type: ActionModal['type'], playerName: string): ModalConfig {
  switch (type) {
    case 'approve':
      return {
        title: 'Approve Player',
        body: `Approve "${playerName}" for the auction pool? They will be immediately available in the Live Auction spinner.`,
        confirmText: 'Yes, Approve',
        confirmClass: 'bg-emerald-600 hover:bg-emerald-700',
      };
    case 'reject':
      return {
        title: 'Reject Player',
        body: `Reject "${playerName}"? They will be moved to the Rejected section and removed from the auction pool.`,
        confirmText: 'Yes, Reject',
        confirmClass: 'bg-rose-600 hover:bg-rose-700',
      };
    case 'reapprove':
      return {
        title: 'Re-Approve Player',
        body: `Re-approve "${playerName}"? They will be moved back to the Approved auction pool.`,
        confirmText: 'Yes, Re-Approve',
        confirmClass: 'bg-emerald-600 hover:bg-emerald-700',
      };
    case 'make_pending':
      return {
        title: 'Move to Pending',
        body: `Move "${playerName}" back to the Pending review queue? They will no longer be in the auction pool.`,
        confirmText: 'Yes, Move to Pending',
        confirmClass: 'bg-amber-600 hover:bg-amber-700',
      };
    case 'delete':
      return {
        title: 'Delete Player',
        body: `Permanently delete "${playerName}"? This action cannot be undone.`,
        confirmText: 'Delete Permanently',
        confirmClass: 'bg-red-600 hover:bg-red-700',
      };
    default:
      return { title: '', body: '', confirmText: '', confirmClass: '' };
  }
}

const ROLE_OPTIONS = ['All', 'Batsman', 'Bowler', 'All-Rounder', 'Wicket Keeper'];

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  not_called: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  rejected: 'bg-rose-100 text-rose-700 border border-rose-200',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  not_called: 'Approved',
  rejected: 'Rejected',
};
const STATUS_DOT: Record<string, string> = {
  pending: 'bg-amber-400',
  not_called: 'bg-emerald-500',
  rejected: 'bg-rose-500',
};

export default function Players() {
  const store = useAuctionStore();

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [schema, setSchema] = useState<any>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [actionModal, setActionModal] = useState<ActionModal>({
    isOpen: false, type: null, player: null,
  });
  const [detailsModal, setDetailsModal] = useState<{ isOpen: boolean; player: Player | null }>({
    isOpen: false, player: null,
  });

  useEffect(() => {
    api.getRegistrationSchema().then(setSchema).catch(console.error);
  }, []);

  const handleDownloadApprovedPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const approvedPlayers = store.players.filter(p => p.status === 'not_called');

      // Pre-process all images to safe base64 JPEGs using browser Image/Canvas
      const safePlayers = await Promise.all(
        approvedPlayers.map(async (player) => {
          if (!player.photo) return player;
          const safePhoto = await new Promise<string>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width || 200;
              canvas.height = img.height || 200;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', 0.9));
              } else {
                resolve('');
              }
            };
            img.onerror = () => resolve('');
            img.src = player.photo;
          });
          return { ...player, photo: safePhoto };
        })
      );

      const blob = await pdf(
        <ApprovedPlayersPDFDocument players={safePlayers} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Approved_Players_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // --- Counts ---
  const pendingCount  = store.players.filter(p => p.status === 'pending').length;
  const approvedCount = store.players.filter(p => p.status === 'not_called').length;
  const rejectedCount = store.players.filter(p => p.status === 'rejected').length;
  const totalCount    = store.players.length;

  // --- Filtered list ---
  const visiblePlayers = useMemo(() => {
    return store.players.filter(p => {
      if (p.status !== activeTab) return false;
      if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (roleFilter !== 'All' && p.role !== roleFilter) return false;
      return true;
    });
  }, [store.players, activeTab, searchTerm, roleFilter]);

  // --- Action handlers ---
  const openAction = (player: Player, type: ActionModal['type']) =>
    setActionModal({ isOpen: true, type, player });

  const closeAction = () => setActionModal({ isOpen: false, type: null, player: null });

  const confirmAction = () => {
    if (!actionModal.player || !actionModal.type) return;
    const { id } = actionModal.player;
    if (actionModal.type === 'approve')      store.updatePlayerStatus(id, 'not_called');
    if (actionModal.type === 'reapprove')    store.updatePlayerStatus(id, 'not_called');
    if (actionModal.type === 'reject')       store.updatePlayerStatus(id, 'rejected');
    if (actionModal.type === 'make_pending') store.updatePlayerStatus(id, 'pending');
    if (actionModal.type === 'delete')       store.deletePlayer(id);
    closeAction();
  };

  const modalCfg = actionModal.player
    ? getModalConfig(actionModal.type, actionModal.player.name)
    : { title: '', body: '', confirmText: '', confirmClass: '' };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-6 animate-in fade-in">

      {/* ── SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {[
          { label: 'Total Players', count: totalCount,    icon: <Users size={22} />,     bg: 'bg-blue-50',    icon_color: 'text-blue-600'    },
          { label: 'Pending',       count: pendingCount,  icon: <Clock size={22} />,     bg: 'bg-amber-50',   icon_color: 'text-amber-600'   },
          { label: 'Approved',      count: approvedCount, icon: <UserCheck size={22} />, bg: 'bg-emerald-50', icon_color: 'text-emerald-600' },
          { label: 'Rejected',      count: rejectedCount, icon: <UserX size={22} />,     bg: 'bg-rose-50',    icon_color: 'text-rose-600'    },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className={cn('p-3 rounded-xl', card.bg)}>
              <span className={card.icon_color}>{card.icon}</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
              <h3 className="text-2xl font-black text-slate-900 leading-tight">{card.count}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN PANEL ── */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">

        {/* Header */}
        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center shrink-0">

          {/* Tabs */}
          <div className="flex bg-slate-200/60 p-1 rounded-xl gap-1">
            {([
              { id: 'pending',   label: 'Pending Review', icon: <Clock size={15} />,     badge: pendingCount  },
              { id: 'not_called',label: 'Approved',        icon: <CheckCircle size={15}/>, badge: approvedCount },
              { id: 'rejected',  label: 'Rejected',        icon: <XCircle size={15} />,    badge: rejectedCount },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <span className={activeTab === tab.id ? 'text-purple-600' : ''}>{tab.icon}</span>
                {tab.label}
                {tab.badge > 0 && (
                  <span className={cn(
                    'px-1.5 py-0.5 rounded-full text-xs font-black',
                    activeTab === tab.id ? 'bg-purple-100 text-purple-700' : 'bg-slate-300 text-slate-600'
                  )}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Filters + Add */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-300 w-44 bg-white font-medium"
              />
            </div>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-300 bg-white font-medium appearance-none"
              >
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r === 'All' ? 'All Roles' : r}</option>)}
              </select>
            </div>
            {activeTab === 'not_called' && (
              <button
                onClick={handleDownloadApprovedPdf}
                disabled={isGeneratingPdf || approvedCount === 0}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all"
              >
                {isGeneratingPdf ? (
                  <><Loader2 size={15} className="animate-spin" /> Generating...</>
                ) : (
                  <><Download size={15} /> Download PDF</>
                )}
              </button>
            )}
            <Link
              to="/register"
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all"
            >
              <UserPlus size={15} /> Register Player
            </Link>
          </div>
        </div>

        {/* ── PLAYER CARDS ── */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
          {visiblePlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 gap-3">
              <ShieldAlert size={56} className="text-slate-200" />
              <p className="text-xl font-bold text-slate-500">No players found</p>
              <p className="text-sm">Adjust search / filters, or switch tabs.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {visiblePlayers.map(player => (
                <div
                  key={player.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
                >
                  {/* Card top */}
                  <div className="p-4 flex gap-4 items-start">
                    {/* Photo + status dot */}
                    <div className="relative shrink-0">
                      <img
                        src={player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=f1f5f9&color=334155&bold=true&size=128`}
                        alt={player.name}
                        className="w-16 h-16 rounded-xl object-cover border-2 border-slate-100 bg-slate-100"
                      />
                      <span className={cn('absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white', STATUS_DOT[player.status] ?? 'bg-slate-400')} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-slate-900 truncate">{player.name}</h3>
                        <span className={cn('text-[10px] font-black uppercase px-2 py-0.5 rounded-full whitespace-nowrap shrink-0', STATUS_BADGE[player.status])}>
                          {STATUS_LABEL[player.status] ?? player.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{player.role}</p>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-slate-50 rounded-lg p-2 text-center">
                          <p className="text-slate-400 font-medium">Age</p>
                          <p className="font-black text-slate-800">{player.age}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 text-center">
                          <p className="text-slate-400 font-medium">Base</p>
                          <p className="font-black text-purple-700 text-[11px]">{formatCurrency(player.basePrice)}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 text-center overflow-hidden">
                          <p className="text-slate-400 font-medium">Exp</p>
                          <p className="font-black text-slate-800 truncate text-[10px]">{player.experience ?? '—'}</p>
                        </div>
                      </div>

                      {player.phone && (
                        <p className="mt-2 text-xs text-slate-500 font-medium">📞 {player.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Action bar */}
                  <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 flex gap-2">
                    <button
                      onClick={() => setDetailsModal({ isOpen: true, player })}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                    >
                      <Eye size={13} /> Details
                    </button>

                    {activeTab === 'pending' && (
                      <>
                        <button
                          onClick={() => openAction(player, 'reject')}
                          className="flex-1 px-3 py-2 rounded-lg text-xs font-bold bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100 transition-all"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => openAction(player, 'approve')}
                          className="flex-[1.3] px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm"
                        >
                          ✓ Approve
                        </button>
                      </>
                    )}

                    {activeTab === 'not_called' && (
                      <button
                        onClick={() => openAction(player, 'make_pending')}
                        className="flex-1 px-3 py-2 rounded-lg text-xs font-bold bg-amber-50 border border-amber-100 text-amber-700 hover:bg-amber-100 transition-all"
                      >
                        Move to Pending
                      </button>
                    )}

                    {activeTab === 'rejected' && (
                      <>
                        <button
                          onClick={() => openAction(player, 'reapprove')}
                          className="flex-[1.3] px-3 py-2 rounded-lg text-xs font-bold bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100 transition-all"
                        >
                          Re-Approve
                        </button>
                        <button
                          onClick={() => openAction(player, 'delete')}
                          className="flex items-center justify-center px-3 py-2 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── CONFIRMATION MODAL ── */}
      {actionModal.isOpen && actionModal.player && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">{modalCfg.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">{modalCfg.body}</p>
            <div className="flex gap-3">
              <button
                onClick={closeAction}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={cn('flex-[2] py-2.5 px-4 rounded-xl text-white font-bold shadow-md transition-all', modalCfg.confirmClass)}
              >
                {modalCfg.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PLAYER DETAILS MODAL ── */}
      {detailsModal.isOpen && detailsModal.player && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

            {/* ---- Modal header banner ---- */}
            <div className="relative bg-slate-900 h-32 shrink-0">
              <button
                onClick={() => setDetailsModal({ isOpen: false, player: null })}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-1.5 transition-all"
              >
                <XCircle size={22} />
              </button>
              {/* Avatar overlapping banner */}
              <div className="absolute -bottom-10 left-6 flex items-end gap-4">
                <img
                  src={detailsModal.player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(detailsModal.player.name)}&background=334155&color=fff&bold=true&size=200`}
                  alt={detailsModal.player.name}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-xl bg-slate-200"
                />
              </div>
            </div>

            {/* ---- Modal body ---- */}
            <div className="flex-1 overflow-y-auto px-8 pt-14 pb-8">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{detailsModal.player.name}</h2>
                  <p className="text-slate-500 font-medium mt-0.5">{detailsModal.player.role || detailsModal.player.position || 'Player'}</p>
                </div>
                <span className={cn('text-xs font-black uppercase px-3 py-1 rounded-full', STATUS_BADGE[detailsModal.player.status])}>
                  {STATUS_LABEL[detailsModal.player.status] ?? detailsModal.player.status}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-8">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">{schema?.sportName || 'Player'} Profile Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3">
                    {schema?.fields.filter((f: any) => f.type !== 'file' && f.id !== 'name').map((field: any) => (
                      <div key={field.id} className="flex justify-between border-b border-slate-50 pb-2 text-sm">
                        <dt className="text-slate-400 font-medium">{field.label}</dt>
                        <dd className="font-bold text-slate-800 text-right break-all">
                          {detailsModal.player?.[field.id]?.toString() || '—'}
                        </dd>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Files/Docs if any */}
                {schema?.fields.filter((f: any) => f.type === 'file' && f.id !== 'photo').map((field: any) => (
                  <div key={field.id} className="mt-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">{field.label}</h4>
                    {detailsModal.player?.[field.id] ? (
                      <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2">
                        {detailsModal.player[field.id].startsWith('data:image') ? (
                          <img src={detailsModal.player[field.id]} alt={field.label} className="max-h-48 rounded-lg object-contain mx-auto" />
                        ) : (
                          <div className="py-4 text-center">
                            <Link to={detailsModal.player[field.id]} target="_blank" className="text-blue-600 font-bold hover:underline">View Document</Link>
                          </div>
                        )}
                      </div>
                    ) : <p className="text-sm text-slate-400 italic">Not provided</p>}
                  </div>
                ))}
              </div>

              {/* Base price highlight */}
              <div className="mt-6 bg-purple-50 border border-purple-100 rounded-2xl p-5 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">Base Price</p>
                  <p className="text-3xl font-black text-purple-900 tracking-tight mt-0.5">{formatCurrency(detailsModal.player.basePrice)}</p>
                </div>
                {detailsModal.player.category && (
                  <div className="text-right">
                    <p className="text-xs font-bold text-purple-300 uppercase tracking-widest">Category</p>
                    <p className="font-black text-purple-700 mt-0.5">{detailsModal.player.category}</p>
                  </div>
                )}
              </div>

              {/* Quick actions inside modal */}
              <div className="mt-6 flex gap-3">
                {detailsModal.player.status === 'pending' && (
                  <>
                    <button
                      onClick={() => { setDetailsModal({ isOpen: false, player: null }); openAction(detailsModal.player!, 'approve'); }}
                      className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-md"
                    >
                      Approve Player
                    </button>
                    <button
                      onClick={() => { setDetailsModal({ isOpen: false, player: null }); openAction(detailsModal.player!, 'reject'); }}
                      className="flex-1 bg-rose-50 border border-rose-100 text-rose-700 font-bold py-3 rounded-xl hover:bg-rose-100 transition-all"
                    >
                      Reject Player
                    </button>
                  </>
                )}
                {detailsModal.player.status === 'rejected' && (
                  <>
                    <button
                      onClick={() => { setDetailsModal({ isOpen: false, player: null }); openAction(detailsModal.player!, 'reapprove'); }}
                      className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-md"
                    >
                      Re-Approve
                    </button>
                    <button
                      onClick={() => { setDetailsModal({ isOpen: false, player: null }); openAction(detailsModal.player!, 'delete'); }}
                      className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-all"
                    >
                      Delete
                    </button>
                  </>
                )}
                {detailsModal.player.status === 'not_called' && (
                  <button
                    onClick={() => { setDetailsModal({ isOpen: false, player: null }); openAction(detailsModal.player!, 'make_pending'); }}
                    className="flex-1 bg-amber-50 border border-amber-200 text-amber-700 font-bold py-3 rounded-xl hover:bg-amber-100 transition-all"
                  >
                    Move to Pending
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
