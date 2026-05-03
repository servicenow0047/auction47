import { useState, useRef } from 'react';
import { useAuctionStore } from '../store/useAuctionStore';
import { Plus, Trash2, Edit2, Users, ChevronRight, IndianRupee, Upload, X } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import type { Team } from '../types';
import { calculateMaxAllowedBid } from '../utils/auctionLogic';
import TeamDetailDrawer from '../components/TeamDetailDrawer';

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Resize & convert file to base64 data URL (max 300px, JPEG 80%) */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 300;
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = img.width  * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Team avatar: logo image if set, else gradient initials */
function TeamAvatar({ logo, name, size = 'md' }: { logo?: string; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'w-16 h-16 text-lg' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-11 h-11 text-sm';
  if (logo) {
    return (
      <img
        src={logo}
        alt={name}
        className={`${dims} rounded-xl object-cover shrink-0 border border-slate-200`}
      />
    );
  }
  return (
    <div className={`${dims} rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black shrink-0`}>
      {name.substring(0, 2).toUpperCase()}
    </div>
  );
}

/** Logo upload widget used in both Add and Edit forms */
function LogoUploader({ logo, onChange }: { logo?: string; onChange: (val: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    onChange(b64);
    // reset input so same file can be re-picked
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-3">
      {logo ? (
        <div className="relative shrink-0">
          <img src={logo} alt="Logo" className="w-14 h-14 rounded-xl object-cover border border-slate-200" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-600 transition"
          >
            <X size={10} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className="w-14 h-14 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-100 transition"
        >
          <Upload size={16} className="text-purple-400" />
          <span className="text-[9px] text-purple-400 mt-0.5 font-medium">LOGO</span>
        </div>
      )}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="text-xs text-purple-600 hover:text-purple-800 font-medium underline underline-offset-2 transition"
      >
        {logo ? 'Change logo' : 'Upload logo'}
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function Teams() {
  const store = useAuctionStore();
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Team>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const handleEdit = (e: React.MouseEvent, team: Team) => {
    e.stopPropagation();
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
        logo: editForm.logo || '',
        budget: editForm.budget || store.settings.initialBudget,
        players: [],
        totalSpent: 0,
      });
      setIsAdding(false);
    }
    setEditForm({});
  };

  const startAdding = () => {
    setIsAdding(true);
    setEditingTeamId(null);
    setEditForm({ name: '', logo: '', budget: store.settings.initialBudget });
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
            onClick={startAdding}
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
              <div className="space-y-3">
                <LogoUploader
                  logo={editForm.logo}
                  onChange={(val) => setEditForm(f => ({ ...f, logo: val }))}
                />
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
            const maxBid    = calculateMaxAllowedBid(team, store.settings);
            const totalSpent = team.totalSpent ?? 0;
            const spentPct  = store.settings.initialBudget > 0
              ? Math.min((totalSpent / store.settings.initialBudget) * 100, 100)
              : 0;
            const isEditing = editingTeamId === team.id;

            return (
              <div
                key={team.id}
                onClick={() => !isEditing && setSelectedTeam(team)}
                className={cn(
                  'bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-purple-300 transition-all group relative',
                  isEditing ? 'border-purple-400 ring-2 ring-purple-200' : 'border-slate-200 cursor-pointer'
                )}
              >
                {!isEditing && (
                  <ChevronRight
                    size={16}
                    className="absolute top-4 right-4 text-slate-300 group-hover:text-purple-500 transition-colors"
                  />
                )}

                {isEditing ? (
                  <div className="space-y-3">
                    <LogoUploader
                      logo={editForm.logo}
                      onChange={(val) => setEditForm(f => ({ ...f, logo: val }))}
                    />
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
                    <div className="flex gap-2">
                      <button onClick={handleSave} className="flex-1 bg-purple-600 text-white py-1.5 rounded-lg text-sm font-bold transition hover:bg-purple-700">Save</button>
                      <button onClick={() => setEditingTeamId(null)} className="flex-1 border border-slate-300 text-slate-600 py-1.5 rounded-lg text-sm font-bold transition hover:bg-slate-50">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Team avatar + name */}
                    <div className="flex items-center gap-3 mb-4">
                      <TeamAvatar logo={team.logo} name={team.name} />
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
