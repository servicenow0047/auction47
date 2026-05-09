import { useState } from 'react';
import { X, IndianRupee, Users, Trophy, Download, Loader2 } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import type { Team, Player } from '../types';
import { formatCurrency } from '../lib/utils';
import { SquadPDFDocument } from './TeamPDFView';
import { useToast } from './Toast';
import { useAuctionStore } from '../store/useAuctionStore';

interface TeamDetailDrawerProps {
  team: Team | null;
  players: Player[];
  initialBudget: number;
  onClose: () => void;
}

export default function TeamDetailDrawer({ team, players, initialBudget, onClose }: TeamDetailDrawerProps) {
  const store = useAuctionStore();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { toast } = useToast();

  if (!team) return null;

  // Resolve sold player objects for this team
  const soldPlayers = team.players
    .map(id => players.find(p => p.id === id))
    .filter((p): p is Player => p !== undefined);

  const totalSpent = team.totalSpent ?? soldPlayers.reduce((sum, p) => sum + (p.soldPrice ?? 0), 0);
  const budgetUsedPct = initialBudget > 0 ? Math.min((totalSpent / initialBudget) * 100, 100) : 0;

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);

      // Pre-process all images to safe base64 JPEGs using browser Image/Canvas
      // This bypasses @react-pdf's strict image codec requirements and fixes blob: URLs
      const safePlayers = await Promise.all(
        soldPlayers.map(async (player) => {
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
                ctx.fillStyle = '#0f172a'; // slate-900 background
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

      // Generate the PDF blob directly
      const blob = await pdf(
        <SquadPDFDocument 
          team={team} 
          players={safePlayers} 
          tournamentName={store.settings.tournamentName} 
          tournamentLogo={store.settings.tournamentLogo} 
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${team.name.replace(/\s+/g, '_')}_Squad.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast('error', 'PDF Failed', error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 shrink-0">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              {team.logo ? (
                <img
                  src={team.logo}
                  alt={team.name}
                  className="w-12 h-12 rounded-xl object-cover shrink-0 border-2 border-white/20"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center text-xl font-black">
                  {team.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-xl font-black tracking-tight">{team.name}</h2>
                <p className="text-slate-400 text-sm">{soldPlayers.length} players bought</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf || soldPlayers.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors shadow-lg"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Download PDF
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Budget bar */}
          <div className="grid grid-cols-3 gap-3 mt-2">
            <div className="bg-slate-800/80 rounded-xl p-3">
              <p className="text-slate-400 text-xs uppercase font-semibold mb-1">Remaining</p>
              <p className="text-white font-black text-lg font-mono">{formatCurrency(team.budget)}</p>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-3">
              <p className="text-slate-400 text-xs uppercase font-semibold mb-1">Total Spent</p>
              <p className="text-green-400 font-black text-lg font-mono">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-3">
              <p className="text-slate-400 text-xs uppercase font-semibold mb-1">Players</p>
              <p className="text-purple-400 font-black text-lg">{soldPlayers.length}</p>
            </div>
          </div>

          {/* Budget used bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Budget used</span>
              <span>{budgetUsedPct.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-700"
                style={{ width: `${budgetUsedPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Player List */}
        <div className="flex-1 overflow-y-auto p-5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
            <Trophy size={14} className="text-amber-500" />
            Purchased Players
          </h3>

          {soldPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Users size={40} className="mb-3 opacity-30" />
              <p className="font-medium">No players purchased yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {soldPlayers.map((player, idx) => (
                <div
                  key={player.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-purple-200 hover:shadow-sm transition-all group"
                >
                  {/* Index */}
                  <span className="text-xs font-bold text-slate-400 w-5 shrink-0">{idx + 1}</span>

                  {/* Photo */}
                  <img
                    src={player.photo}
                    alt={player.name}
                    className="w-12 h-12 rounded-full border-2 border-white shadow object-cover bg-slate-200 shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate group-hover:text-purple-700 transition-colors">
                      {player.name}
                    </p>
                    <div className="flex gap-3 mt-0.5 text-xs text-slate-500">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-200 font-medium">
                        {player.role}
                      </span>
                      <span>Age {player.age}</span>
                      <span>Base {formatCurrency(player.basePrice)}</span>
                    </div>
                  </div>

                  {/* Sold price */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-0.5 text-green-700 font-black font-mono text-sm">
                      <IndianRupee size={12} />
                      {(player.soldPrice ?? 0).toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] font-medium bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full uppercase">
                      SOLD
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
