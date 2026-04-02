import { useState } from 'react';
import { useAuctionStore } from '../store/useAuctionStore';
import { UsersRound, Users, UserCheck, UserX, Wallet, PlayCircle, Settings as SettingsIcon, MonitorPlay, PlusCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import logoUrl from '../assets/logo.png.png';

export default function Home() {
  const store = useAuctionStore();
  const navigate = useNavigate();
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmScratch, setConfirmScratch] = useState(false);

  const openResetModal = () => {
    setConfirmScratch(false);
    setShowResetModal(true);
  };

  const soldPlayers = store.players.filter(p => p.status === 'sold').length;
  const unsoldPlayers = store.players.filter(p => p.status === 'unsold').length;
  const totalSpend = store.players.reduce((acc, p) => acc + (p.soldPrice || 0), 0);

  const stats = [
    { label: 'Total Teams', value: store.teams.length, icon: UsersRound, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Players', value: store.players.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Sold Players', value: soldPlayers, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Unsold', value: unsoldPlayers, icon: UserX, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'Total Spent', value: formatCurrency(totalSpend), icon: Wallet, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  const handleCreateNew = (keepPlayers: boolean) => {
    store.resetAuction(keepPlayers);
    setShowResetModal(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 relative pb-12">
      {/* Background Logo Watermark */}
      <div className="absolute inset-0 z-[-1] flex items-center justify-center pointer-events-none opacity-[0.04]">
        <img src={logoUrl} alt="" className="w-[80%] max-w-3xl object-contain mix-blend-multiply" />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tournament Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your active workspace, view stats, or create a new auction.</p>
        </div>
      </div>

      {/* NEW CREATE TOURNAMENT CARD */}
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black mb-2">
              {store.status === 'completed' ? 'Auction Completed! Ready for a new one?' : 
               store.status === 'setup' && store.teams.length === 0 ? 'Welcome to AUCTION 47' :
               'Active Workspace'}
            </h2>
            <p className="text-indigo-200 text-sm max-w-xl">
              {store.status === 'completed' 
                ? 'Your previous auction has concluded. You can review the stats below, or start a fresh tournament workspace.'
                : 'You are currently working in an active auction workspace. You can end the auction from the settings page, or destroy the current workspace to start anew.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0 mt-4 md:mt-0">
             {store.status === 'setup' && store.teams.length > 0 && (
                <button onClick={() => { store.startAuction(); navigate('/auction'); }} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2">
                  <PlayCircle size={20} /> Start Live Auction
                </button>
             )}
             {(store.status === 'ready' || store.status === 'running') && (
                <button onClick={() => navigate('/auction')} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2">
                  <PlayCircle size={20} /> Resume Auction
                </button>
             )}
            <button onClick={openResetModal} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 backdrop-blur-sm">
              <PlusCircle size={20} /> Create New Tournament
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm col-span-2">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/teams" className="flex items-center p-4 border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-white flex items-center justify-center mr-4">
                <UsersRound size={20} className="text-slate-600 group-hover:text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Manage Teams</p>
                <p className="text-sm text-slate-500">Edit budgets and configs</p>
              </div>
            </Link>
            <Link to="/players" className="flex items-center p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-white flex items-center justify-center mr-4">
                <Users size={20} className="text-slate-600 group-hover:text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Manage Players</p>
                <p className="text-sm text-slate-500">Add or edit pool</p>
              </div>
            </Link>
            <Link to="/display" className="flex items-center p-4 border border-slate-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-white flex items-center justify-center mr-4">
                <MonitorPlay size={20} className="text-slate-600 group-hover:text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Live Display Mode</p>
                <p className="text-sm text-slate-500">Projector screen view</p>
              </div>
            </Link>
            <Link to="/settings" className="flex items-center p-4 border border-slate-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-white flex items-center justify-center mr-4">
                <SettingsIcon size={20} className="text-slate-600 group-hover:text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Auction Rules</p>
                <p className="text-sm text-slate-500">Configure increments</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Auction Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-slate-500">Budget Limit</span>
              <span className="font-semibold text-slate-900">{formatCurrency(store.settings.initialBudget)} / team</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-slate-500">Base Price</span>
              <span className="font-semibold text-slate-900">{formatCurrency(store.settings.basePrice)}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-slate-500">Squad Size</span>
              <span className="font-semibold text-slate-900">{store.settings.minPlayers} - {store.settings.maxPlayers}</span>
            </div>
            <div className="flex justify-between items-center pb-3">
              <span className="text-slate-500">Status</span>
              <span className={`font-semibold capitalize px-2.5 py-1 rounded-md text-xs
                ${store.status === 'setup' ? 'bg-slate-100 text-slate-700' : 
                  store.status === 'running' ? 'bg-green-100 text-green-700' : 
                  store.status === 'ready' ? 'bg-blue-100 text-blue-700' : 
                  'bg-purple-100 text-purple-700'}
              `}>
                {store.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {confirmScratch ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                  <AlertTriangle size={32} className="text-red-600" />
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-2">Delete Everything?</h2>
                <p className="text-slate-600 text-sm mb-6 font-medium">
                  This action is irreversible. All teams, players, and bidding history will be permanently erased. Are you absolutely certain you want to wipe the database?
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => handleCreateNew(false)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <AlertTriangle size={20} />
                    Yes, Wipe Everything
                  </button>
                  <button 
                    onClick={() => setConfirmScratch(false)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-6">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                    <PlusCircle size={24} className="text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mb-2">Create New Tournament</h2>
                  <p className="text-slate-600 text-sm mb-6">
                    Creating a new tournament will permanently delete the bidding history and reset the current workspace. How would you like to handle the registered players?
                  </p>
                  
                  <div className="space-y-3">
                    <button 
                      onClick={() => handleCreateNew(true)}
                      className="w-full text-left p-4 rounded-xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                    >
                      <h3 className="font-bold text-slate-900 group-hover:text-indigo-700">Retain Player Pool & Teams</h3>
                      <p className="text-xs text-slate-500 mt-1">Keeps all registered players and teams, but resets their sold status. Good for rematches.</p>
                    </button>
                    <button 
                      onClick={() => setConfirmScratch(true)}
                      className="w-full text-left p-4 rounded-xl border-2 border-slate-200 hover:border-red-500 hover:bg-red-50 transition-all group"
                    >
                      <h3 className="font-bold text-red-600 group-hover:text-red-700">Start from Scratch</h3>
                      <p className="text-xs text-slate-500 mt-1">Wipes all teams and players. A completely blank slate.</p>
                    </button>
                  </div>
                </div>
                <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end">
                  <button 
                    onClick={() => setShowResetModal(false)}
                    className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
