import type { Settings, Team, Player } from '../types';

export const defaultSettings: Settings = {
  numTeams: 8,
  initialBudget: 50000,
  minPlayers: 15,
  maxPlayers: 15,
  basePrice: 1000,
  increments: [
    { upTo: 3000, increment: 200 },
    { upTo: 10000, increment: 500 },
    { upTo: Infinity, increment: 1000 }
  ]
};

export const INITIAL_TEAMS: Team[] = [
  { id: 't1', name: 'Mumbai Masters', budget: 50000, players: [], totalSpent: 0 },
  { id: 't2', name: 'Chennai Kings', budget: 50000, players: [], totalSpent: 0 },
  { id: 't3', name: 'Delhi Dashers', budget: 50000, players: [], totalSpent: 0 },
  { id: 't4', name: 'Bengaluru Blasters', budget: 50000, players: [], totalSpent: 0 },
  { id: 't5', name: 'Kolkata Knights', budget: 50000, players: [], totalSpent: 0 },
  { id: 't6', name: 'Punjab Power', budget: 50000, players: [], totalSpent: 0 },
  { id: 't7', name: 'Rajasthan Royals', budget: 50000, players: [], totalSpent: 0 },
  { id: 't8', name: 'Hyderabad Hawks', budget: 50000, players: [], totalSpent: 0 }
];

const roles = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket Keeper'];

export const INITIAL_PLAYERS: Player[] = Array.from({ length: 30 }).map((_, i) => ({
  id: `p${i + 1}`,
  name: `Player ${i + 1}`,
  role: roles[i % 4],
  age: 20 + (i % 15),
  basePrice: 1000 + (Math.floor(i / 5) * 500),
  status: 'not_called',
  photo: `https://ui-avatars.com/api/?name=Player+${i + 1}&background=random`
}));
