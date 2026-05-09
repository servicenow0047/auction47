export interface Settings {
  tournamentName: string;
  tournamentLogo?: string;
  numTeams: number;
  initialBudget: number;
  minPlayers: number;
  maxPlayers: number;
  basePrice: number;
  increments: { upTo: number; increment: number }[];
}

export type PlayerStatus = 'pending' | 'rejected' | 'not_called' | 'in_auction' | 'sold' | 'unsold';

export interface Player {
  id: string;
  name: string;
  role?: string;
  age?: number;
  basePrice: number;
  status: PlayerStatus;
  soldPrice?: number;
  teamId?: string;
  photo: string;
  phone?: string;
  email?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  experience?: string;
  previousTeam?: string;
  category?: string;
  idProof?: string;
  [key: string]: any; // allows dynamic fields from form builder
}

export interface Team {
  id: string;
  name: string;
  logo?: string;          // base64 data URL for team logo
  budget: number;         // remaining budget
  players: string[];      // array of sold player IDs
  totalSpent: number;     // cumulative spend
}

export interface AuctionLogEntry {
  id: string;
  playerId: string;
  teamId?: string;
  amount?: number;
  timestamp: string;
  type: 'bid' | 'sold' | 'unsold' | 'started' | 'ended' | 'spinner_selected' | 'bid_undone';
}

export interface AuctionState {
  status: 'setup' | 'ready' | 'running' | 'completed';
  settings: Settings;
  teams: Team[];
  players: Player[];
  currentPlayerId: string | null;
  currentBid: number;
  currentBidTeamId: string | null;
  logs: AuctionLogEntry[];

  // Actions
  loadState: () => Promise<void>;
  updateSettings: (settings: Settings) => void;
  updateTeam: (team: Team) => void;
  addTeam: (team: Omit<Team, 'id'>) => void;
  deleteTeam: (id: string) => void;
  updatePlayer: (player: Player) => void;
  addPlayer: (player: Omit<Player, 'id'>) => void;
  deletePlayer: (id: string) => void;
  updatePlayerStatus: (id: string, status: PlayerStatus) => void;
  startAuction: () => void;
  nextPlayer: (id?: string) => void;
  placeBid: (teamId: string, amount: number) => void;
  sellPlayer: () => void;
  markUnsold: () => void;
  resetAuction: (keepPlayers?: boolean) => void;
  endAuction: () => void;
  readdUnsoldPlayers: () => void;
  readdSingleUnsoldPlayer: (playerId: string) => void;
  undoLastBid: () => void;
}
