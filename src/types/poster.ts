import type { Player, Team } from './index';

export type BackgroundPreset = 
  | 'stadium-night' 
  | 'stadium-gold' 
  | 'electric-blue' 
  | 'dark-arena' 
  | 'carbon-luxury' 
  | 'custom';

export interface PosterConfig {
  // Background
  backgroundPreset: BackgroundPreset;
  customBackgroundUrl?: string;
  overlayDarkness: number; // 0 to 80%

  // Top Header / Tournament info
  showOrganizer: boolean;
  organizerText: string;
  tournamentName: string;
  showSubtitle: boolean;
  subtitle: string;
  showDates: boolean;
  datesText: string;
  showVenue: boolean;
  venueText: string;

  // Logos
  showLeftLogo: boolean;
  leftLogoUrl?: string;
  showRightLogo: boolean;
  rightLogoUrl?: string;

  // Team
  teamName: string;
  teamLogoUrl?: string;
  showTeamLogo: boolean;
  teamColor: string; // Hex color for team name

  // Players
  columns: 3 | 4 | 5 | 6;
  cardBorderRadius: number; // 6, 12, 16, 24 px
  photoAspectRatio: 'square' | 'portrait' | 'auto';
  playerNameSize: 'xs' | 'sm' | 'md' | 'lg';
  showPlayerRole: boolean;
  showPlayerPrice: boolean;
  playersList: Player[]; // Allow custom ordering or override

  // Watermarks / Footer
  showFooter: boolean;
  footerLeftText: string;
  footerRightText: string;
  footerRightLogoUrl?: string;
}

export function getDefaultPosterConfig(
  team?: Team | null, 
  allPlayers: Player[] = [],
  tournamentName = 'AUCTION TOURNAMENT',
  tournamentLogo = ''
): PosterConfig {
  const soldPlayers = team
    ? team.players
        .map(id => allPlayers.find(p => p.id === id))
        .filter((p): p is Player => p !== undefined)
    : [];

  return {
    backgroundPreset: 'stadium-night',
    customBackgroundUrl: '',
    overlayDarkness: 20,

    showOrganizer: false,
    organizerText: 'JWALA CLUB PRESENTS',
    tournamentName: tournamentName || 'AUCTION TOURNAMENT',
    showSubtitle: true,
    subtitle: 'OFFICIAL SQUAD',
    showDates: false,
    datesText: 'SEASON 2026',
    showVenue: false,
    venueText: 'PUZHAKKAL GROUND',

    showLeftLogo: Boolean(tournamentLogo),
    leftLogoUrl: tournamentLogo || '',
    showRightLogo: Boolean(team?.logo),
    rightLogoUrl: team?.logo || '',

    teamName: team?.name || 'FRANCHISE SQUAD',
    teamLogoUrl: team?.logo || '',
    showTeamLogo: false,
    teamColor: '#F59E0B', // Amber gold

    columns: soldPlayers.length > 12 ? 5 : 4,
    cardBorderRadius: 10,
    photoAspectRatio: 'square',
    playerNameSize: 'sm',
    showPlayerRole: false,
    showPlayerPrice: false,
    playersList: soldPlayers,

    showFooter: true,
    footerLeftText: `Official Squad • ${tournamentName || 'Auction'}`,
    footerRightText: 'AUCTION 47',
    footerRightLogoUrl: '',
  };
}
