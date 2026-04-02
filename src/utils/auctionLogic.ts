import type { Team, Settings } from '../types';

export const calculateMaxAllowedBid = (team: Team, settings: Settings): number => {
  const remainingSlots = settings.minPlayers - team.players.length;
  
  if (team.players.length >= settings.maxPlayers) {
    return 0; // Squad is full
  }

  if (remainingSlots <= 1) {
    // If only 1 or 0 required slots left, they can use their entire budget
    return team.budget;
  }
  
  // They must save basePrice for each remaining required slot
  const reservedBudget = (remainingSlots - 1) * settings.basePrice;
  return team.budget - reservedBudget;
};

export const canTeamBid = (team: Team, amount: number, settings: Settings): boolean => {
  if (team.players.length >= settings.maxPlayers) return false;
  return amount <= calculateMaxAllowedBid(team, settings);
};
