import { create } from 'zustand';
import type { AuctionState, PlayerStatus } from '../types';
import { api } from '../lib/api';
import { defaultSettings } from '../utils/dummyData';

// ── Utility: compute next bid increment from settings ───────────────────────
export const getNextBidAmount = (currentBid: number, settings: AuctionState['settings']) => {
  if (currentBid === 0) return settings.basePrice;
  const rule = settings.increments.find(r => currentBid < r.upTo);
  return currentBid + (rule ? rule.increment : 1000);
};

// ── Zustand store (synced with MongoDB backend) ─────────────────────────────
export const useAuctionStore = create<AuctionState>((set, get) => ({
  // ── Initial state (gets replaced on loadState) ──────────────────────────
  status: 'setup',
  settings: defaultSettings,
  teams: [],
  players: [],
  currentPlayerId: null,
  currentBid: 0,
  currentBidTeamId: null,
  logs: [],

  // ── Load everything from backend ────────────────────────────────────────
  loadState: async () => {
    try {
      const data = await api.getState();
      set({
        status: data.status,
        settings: {
          numTeams:      data.settings?.numTeams      ?? 8,
          initialBudget: data.settings?.initialBudget ?? 100000,
          minPlayers:    data.settings?.minPlayers    ?? 7,
          maxPlayers:    data.settings?.maxPlayers    ?? 15,
          basePrice:     data.settings?.basePrice     ?? 1000,
          increments:    data.settings?.increments    ?? defaultSettings.increments,
        },
        players:         data.players  ?? [],
        teams:           data.teams    ?? [],
        currentPlayerId: data.currentPlayerId  ?? null,
        currentBid:      data.currentBid       ?? 0,
        currentBidTeamId:data.currentBidTeamId ?? null,
        logs:            data.logs     ?? [],
      });
    } catch (err) {
      console.error('[loadState] Error fetching from backend:', err);
    }
  },

  // ── Settings ────────────────────────────────────────────────────────────
  updateSettings: async (settings) => {
    set({ settings });
    await api.updateSettings(settings);
  },

  // ── Teams ────────────────────────────────────────────────────────────────
  addTeam: async (team) => {
    const created = await api.addTeam(team);
    set(state => ({ teams: [...state.teams, { ...created, id: created._id }] }));
  },

  updateTeam: async (team) => {
    await api.updateTeam(team.id, team);
    set(state => ({ teams: state.teams.map(t => t.id === team.id ? team : t) }));
  },

  deleteTeam: async (id) => {
    await api.deleteTeam(id);
    set(state => ({ teams: state.teams.filter(t => t.id !== id) }));
  },

  // ── Players ──────────────────────────────────────────────────────────────
  addPlayer: async (player) => {
    const created = await api.registerPlayer(player);
    set(state => ({ players: [...state.players, { ...created, id: created._id }] }));
  },

  updatePlayer: (player) => set(state => ({
    players: state.players.map(p => p.id === player.id ? player : p)
  })),

  deletePlayer: async (id) => {
    await api.deletePlayer(id);
    set(state => ({ players: state.players.filter(p => p.id !== id) }));
  },

  updatePlayerStatus: async (id, status) => {
    await api.updatePlayerStatus(id, status);
    set(state => ({
      players: state.players.map(p => p.id === id ? { ...p, status } : p)
    }));
  },

  // ── Auction flow ─────────────────────────────────────────────────────────
  startAuction: async () => {
    await api.startAuction();
    set({ status: 'ready' });
  },

  nextPlayer: async (id?: string) => {
    try {
      const res = await api.nextPlayer(id);
      if (res.completed) {
        set({ status: 'completed' });
        return;
      }
      set(state => ({
        status: 'running',
        currentPlayerId: res.playerId,
        currentBid: 0,
        currentBidTeamId: null,
        players: state.players.map(p =>
          p.id === res.playerId ? { ...p, status: 'in_auction' } : p
        ),
      }));
    } catch (err) {
      console.error('[nextPlayer] Failed to fetch next player:', err);
      throw err;
    }
  },

  placeBid: async (teamId, amount) => {
    await api.placeBid(teamId, amount);
    set(state => ({
      currentBid: amount,
      currentBidTeamId: teamId,
      logs: [{
        id: Date.now().toString(),
        playerId: state.currentPlayerId!,
        teamId, amount,
        timestamp: new Date().toISOString(),
        type: 'bid',
      }, ...state.logs],
    }));
  },

  sellPlayer: async () => {
    const state = get();
    if (!state.currentPlayerId || !state.currentBidTeamId) return;
    await api.sellPlayer();
    const teamId    = state.currentBidTeamId;
    const playerId  = state.currentPlayerId;
    const soldPrice = state.currentBid;
    set(s => ({
      teams: s.teams.map(t => t.id === teamId ? {
        ...t,
        budget: t.budget - soldPrice,
        totalSpent: (t.totalSpent ?? 0) + soldPrice,
        players: [...t.players, playerId],
      } : t),
      players: s.players.map(p => p.id === playerId ? {
        ...p, status: 'sold', soldPrice, teamId,
      } : p),
      currentPlayerId: null,
      currentBid: 0,
      currentBidTeamId: null,
      logs: [{ id: Date.now().toString(), playerId, teamId, amount: soldPrice, timestamp: new Date().toISOString(), type: 'sold' }, ...s.logs],
    }));
  },

  markUnsold: async () => {
    const state = get();
    if (!state.currentPlayerId) return;
    await api.markUnsold();
    const playerId = state.currentPlayerId;
    set(s => ({
      players: s.players.map(p => p.id === playerId ? { ...p, status: 'unsold', teamId: undefined, soldPrice: undefined } : p),
      currentPlayerId: null,
      currentBid: 0,
      currentBidTeamId: null,
      logs: [{ id: Date.now().toString(), playerId, timestamp: new Date().toISOString(), type: 'unsold' }, ...s.logs],
    }));
  },

  undoLastBid: async () => {
    const res = await api.undoBid();
    set({
      currentBid:       res.currentBid       ?? 0,
      currentBidTeamId: res.currentBidTeamId ?? null,
    });
  },

  readdUnsoldPlayers: async () => {
    await api.readdUnsold();
    set(state => ({
      players: state.players.map(p => p.status === 'unsold' ? { ...p, status: 'not_called' } : p),
    }));
  },

  readdSingleUnsoldPlayer: async (playerId) => {
    await api.updatePlayerStatus(playerId, 'not_called');
    set(state => ({
      players: state.players.map(p =>
        p.id === playerId && p.status === 'unsold' ? { ...p, status: 'not_called' } : p
      ),
    }));
  },

  endAuction: async () => {
    await api.endAuction();
    set({
      status: 'completed',
      currentPlayerId: null,
      currentBid: 0,
      currentBidTeamId: null,
    });
  },

  resetAuction: async (keepPlayers?: boolean) => {
    const res = await api.resetAuction(keepPlayers);
    set(state => ({
      status:            'setup',
      currentPlayerId:   null,
      currentBid:        0,
      currentBidTeamId:  null,
      logs:              [],
      players: res.hardReset ? [] : state.players.map(p => ({ ...p, status: 'not_called' as PlayerStatus, soldPrice: undefined, teamId: undefined })),
      teams:   res.hardReset ? [] : state.teams.map(t => ({ ...t, budget: state.settings.initialBudget, totalSpent: 0, players: [] })),
    }));
  },
}));
