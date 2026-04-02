import { useState } from 'react';
import { useAuctionStore } from '../store/useAuctionStore';
import { Plus, Trash2, Edit2, Users, ChevronRight, IndianRupee } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import type { Team } from '../types';
import { calculateMaxAllowedBid } from '../utils/auctionLogic';
import TeamDetailDrawer from '../components/TeamDetailDrawer';

export default function Teams() {
  const store = useAuctionStore();
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Team>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const handleEdit = (e: React.MouseEvent, team: Team) => {
    e.stopPropagation(); // don't open drawer
    setEditingTeamId(team.id);
    setEditForm(team);
  };

  const handleSave = () => {
    if (editingTeamId) {
      store.updateTeam(editForm as Team);
      setEditingTeamId(null);
    } else {
      store.addTeam({
        name: editForm.name || 'New Team',
        budget: editForm.budget || store.settings.initialBudget,
        players: [],
        totalSpent: 0,
      });
      setIsAdding(false);
    }
  };

  return (
    <>
      <div className="max-w-5xl mx-auto animate-in fade-in">
        {/* Page header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Franchises ({store.teams.length}/{store.settings.numTeams})
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Click any team card to view purchased players. Edit or delete using the action buttons.
            </p>
          </div>
          <button
            onClick={() => { setIsAdding(true); setEditingTeamId(null); setEditForm({ name: '', budget: store.settings.initialBudget }); }}
            disabled={store.teams.length >= store.settings.numTeams}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
          >
            <Plus size={18} /> Add Franchise
          </button>
        </div>

        {/* Grid of team cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Add new team form card */}
          {isAdding && (
            <div className="bg-purple-50 border-2 border-purple-300 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-purple-800 mb-3">New Franchise</h3>
              <div className="space-y-2">
                <input
                  autoFocus
                  placeholder="Team Name"
                  value={editForm.name || ''}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border border-purple-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-400"
                />
                <input
                  type="number"
                  placeholder="Initial Budget"
                  value={editForm.budget || ''}
                  onChange={e => setEditForm({ ...editForm, budget: parseInt(e.target.value) || 0 })}
                  className="w-full border border-purple-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={handleSave} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-bold transition">Save</button>
                <button onClick={() => setIsAdding(false)} className="flex-1 bg-white border border-slate-300 text-slate-600 py-2 rounded-lg text-sm font-bold transition hover:bg-slate-50">Cancel</button>
              </div>
            </div>
          )}

          {store.teams.map(team => {
            const maxBid = calculateMaxAllowedBid(team, store.settings);
            const totalSpent = team.totalSpent ?? 0;
            const spentPct = store.settings.initialBudget > 0
              ? Math.min((totalSpent / store.settings.initialBudget) * 100, 100)
              : 0;
            const isEditing = editingTeamId === team.id;

            return (
              <div
                key={team.id}
                onClick={() => !isEditing && setSelectedTeam(team)}
                className={cn(
                  "bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-purple-300 transition-all group relative",
                  isEditing ? "border-purple-400 ring-2 ring-purple-200" : "border-slate-200 cursor-pointer"
                )}
              >
                {!isEditing && (
                  <ChevronRight
                    size={16}
                    className="absolute top-4 right-4 text-slate-300 group-hover:text-purple-500 transition-colors"
                  />
                )}

                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      autoFocus
                      value={editForm.name || ''}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full border border-purple-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    <input
                      type="number"
                      value={editForm.budget || ''}
                      onChange={e => setEditForm({ ...editForm, budget: parseInt(e.target.value) || 0 })}
                      className="w-full border border-purple-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={handleSave} className="flex-1 bg-purple-600 text-white py-1.5 rounded-lg text-sm font-bold transition hover:bg-purple-700">Save</button>
                      <button onClick={() => setEditingTeamId(null)} className="flex-1 border border-slate-300 text-slate-600 py-1.5 rounded-lg text-sm font-bold transition hover:bg-slate-50">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Team avatar + name */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                        {team.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate group-hover:text-purple-700 transition-colors pr-5">
                          {team.name}
                        </p>
                        <p className="text-xs text-slate-400">{team.players.length} / {store.settings.maxPlayers} players</p>
                      </div>
                    </div>

                    {/* Budget stats */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                        <p className="text-xs text-slate-400 mb-0.5">Remaining</p>
                        <p className="font-black text-slate-800 text-sm font-mono">{formatCurrency(team.budget)}</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-2.5 border border-green-100">
                        <p className="text-xs text-green-600 mb-0.5">Spent</p>
                        <p className="font-black text-green-700 text-sm font-mono">{formatCurrency(totalSpent)}</p>
                      </div>
                    </div>

                    {/* Budget progress bar */}
                    <div className="mb-3">
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${spentPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <IndianRupee size={11} />
                        Max bid {formatCurrency(maxBid)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-purple-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        <Users size={11} /> View Squad
                      </div>
                    </div>

                    {/* Edit/Delete buttons */}
                    <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => handleEdit(e, team)}
                        className="p-1.5 rounded-lg hover:bg-purple-100 text-slate-400 hover:text-purple-600 transition-colors"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); if (confirm('Delete team?')) store.deleteTeam(team.id); }}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {store.teams.length === 0 && !isAdding && (
            <div className="col-span-3 py-16 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p>No teams yet. Click "Add Franchise" to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Team Detail Drawer */}
      {selectedTeam && (
        <TeamDetailDrawer
          team={store.teams.find(t => t.id === selectedTeam.id) ?? selectedTeam}
          players={store.players}
          initialBudget={store.settings.initialBudget}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </>
  );
}
