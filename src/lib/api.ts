// Thin axios-free fetch wrapper that talks to the Express backend (auto-routes to /api on Vercel)
const BASE = import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ''
  ? import.meta.env.VITE_API_URL
  : (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '/api' : 'http://localhost:5000/api');

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  const password = localStorage.getItem('admin_password');
  if (password) {
    headers['x-admin-password'] = password;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API error');
  }
  return res.json();
}

export const api = {
  checkPassword: () => req<any>('POST', '/auth/verify'),
  // Auction state
  getState: ()                        => req<any>('GET',  '/auction/state'),
  startAuction: ()                    => req<any>('POST', '/auction/start'),
  nextPlayer: (playerId?: string)     => req<any>('POST', '/auction/next-player', { playerId }),
  placeBid: (teamId: string, amount: number) => req<any>('POST', '/auction/bid', { teamId, amount }),
  undoBid: ()                         => req<any>('POST', '/auction/undo-bid'),
  sellPlayer: ()                      => req<any>('POST', '/auction/sell'),
  markUnsold: ()                      => req<any>('POST', '/auction/unsold'),
  readdUnsold: ()                     => req<any>('POST', '/auction/readd-unsold'),
  resetAuction: (keepPlayers?: boolean, tournamentName?: string, tournamentLogo?: string) => req<any>('POST', '/auction/reset', { keepPlayers, tournamentName, tournamentLogo }),
  endAuction: ()                      => req<any>('POST', '/auction/end'),

  // Players
  getPlayers: (params?: { status?: string; role?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string,string>).toString() : '';
    return req<any[]>('GET', `/players${qs}`);
  },
  registerPlayer: (data: unknown)               => req<any>('POST',   '/players',             data),
  updatePlayerStatus: (id: string, status: string) => req<any>('PATCH', `/players/${id}/status`, { status }),
  updatePlayer: (id: string, data: unknown)       => req<any>('PUT',   `/players/${id}`,      data),
  deletePlayer: (id: string)                      => req<any>('DELETE', `/players/${id}`),

  // Teams
  getTeams: ()                          => req<any[]>('GET',    '/teams'),
  addTeam: (data: unknown)              => req<any>('POST',   '/teams',        data),
  updateTeam: (id: string, data: unknown) => req<any>('PUT', `/teams/${id}`, data),
  deleteTeam: (id: string)              => req<any>('DELETE', `/teams/${id}`),

  // Settings & Schema
  getSettings: ()              => req<any>('GET', '/settings'),
  updateSettings: (data: unknown) => req<any>('PUT', '/settings', data),
  getRegistrationSchema: ()       => req<any>('GET', '/settings/schema'),
  updateRegistrationSchema: (data: unknown) => req<any>('PUT', '/settings/schema', data),
};
