import type { Player, Team } from './index';

export type ElementType = 'text' | 'image' | 'player-grid' | 'badge';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number; // in pixels relative to 1000px canvas
  y: number; // in pixels relative to 1480px canvas
  width: number;
  height: number;
  rotation?: number; // degrees
  zIndex: number;
  isLocked?: boolean;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number; // in px
  fontFamily: string; // 'Impact', 'Arial Black', 'Inter', 'Cinzel', 'Oswald', etc.
  fontWeight?: string;
  color: string;
  styleEffect: 'gold-3d' | 'metallic-silver' | 'red-ribbon' | 'flat' | 'glow-cyan';
  textAlign: 'left' | 'center' | 'right';
  letterSpacing?: number; // px
  textTransform?: 'uppercase' | 'none';
  opacity?: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  objectFit: 'contain' | 'cover';
  borderRadius: number; // px
  borderWidth?: number;
  borderColor?: string;
  opacity?: number;
  isCircular?: boolean;
}

export interface BadgeElement extends BaseElement {
  type: 'badge';
  text: string;
  badgeType: 'venue' | 'dates' | 'season';
  bgColor: string;
  textColor: string;
  borderColor?: string;
  fontSize: number;
}

export interface PlayerGridElement extends BaseElement {
  type: 'player-grid';
  columns: 3 | 4 | 5 | 6;
  cardRadius: number;
  photoAspectRatio: 'square' | 'portrait';
  nameSize: 'xs' | 'sm' | 'md' | 'lg';
  showRole: boolean;
  showPrice: boolean;
  borderColor?: string;
}

export type CanvasElement = TextElement | ImageElement | BadgeElement | PlayerGridElement;

export interface EditorBackground {
  preset: 'stadium-night' | 'stadium-gold' | 'electric-blue' | 'dark-arena' | 'carbon-luxury' | 'custom';
  customUrl?: string;
  darkness: number; // 0 to 90%
}

export interface PosterEditorDocument {
  id: string;
  canvasWidth: number; // default 1080 (9:16)
  canvasHeight: number; // default 1920 (9:16)
  background: EditorBackground;
  elements: CanvasElement[];
}

/**
 * Creates a complete initial editable poster layout from the active tournament and team data.
 * Optimized for standard 9:16 Full HD portrait poster (1080 x 1920).
 */
export function createDefaultPosterDocument(
  team?: Team | null,
  allPlayers: Player[] = [],
  tournamentName = 'AUCTION 47',
  tournamentLogo = ''
): PosterEditorDocument {
  const soldPlayers = team
    ? team.players
        .map(id => allPlayers.find(p => p.id === id))
        .filter((p): p is Player => p !== undefined)
    : [];

  const teamName = team?.name || 'CHAMPION SQUAD';
  const teamLogo = team?.logo || '';

  const elements: CanvasElement[] = [];
  let zCounter = 1;

  // 1. Left Tournament Logo
  if (tournamentLogo) {
    elements.push({
      id: 'logo-left',
      type: 'image',
      x: 55,
      y: 40,
      width: 95,
      height: 95,
      zIndex: zCounter++,
      src: tournamentLogo,
      objectFit: 'cover',
      borderRadius: 48,
      borderWidth: 2,
      borderColor: '#F59E0B',
      isCircular: true,
    });
  }

  // 2. Right Team Logo
  if (teamLogo) {
    elements.push({
      id: 'logo-right',
      type: 'image',
      x: 930,
      y: 40,
      width: 95,
      height: 95,
      zIndex: zCounter++,
      src: teamLogo,
      objectFit: 'cover',
      borderRadius: 48,
      borderWidth: 2,
      borderColor: '#F59E0B',
      isCircular: true,
    });
  }

  // 3. Organizer Subtitle
  elements.push({
    id: 'organizer-subtitle',
    type: 'text',
    x: 160,
    y: 35,
    width: 760,
    height: 30,
    zIndex: zCounter++,
    text: 'OFFICIAL AUCTION PRESENTS',
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    fontWeight: '800',
    color: '#FDE68A',
    styleEffect: 'flat',
    textAlign: 'center',
    letterSpacing: 4,
    textTransform: 'uppercase',
  });

  // 4. Tournament Title (3D Gold)
  elements.push({
    id: 'tournament-title',
    type: 'text',
    x: 50,
    y: 75,
    width: 980,
    height: 90,
    zIndex: zCounter++,
    text: tournamentName.toUpperCase(),
    fontSize: 76,
    fontFamily: 'Impact, sans-serif',
    fontWeight: '900',
    color: '#F59E0B',
    styleEffect: 'gold-3d',
    textAlign: 'center',
    letterSpacing: 3,
    textTransform: 'uppercase',
  });

  // 5. Season / Edition Subtitle
  elements.push({
    id: 'season-subtitle',
    type: 'text',
    x: 140,
    y: 175,
    width: 800,
    height: 40,
    zIndex: zCounter++,
    text: 'SEASON 2026',
    fontSize: 30,
    fontFamily: 'Arial Black, sans-serif',
    fontWeight: '900',
    color: '#FDE68A',
    styleEffect: 'flat',
    textAlign: 'center',
    letterSpacing: 3,
    textTransform: 'uppercase',
  });

  // 6. Dates Ribbon Badge
  elements.push({
    id: 'dates-ribbon',
    type: 'badge',
    badgeType: 'dates',
    x: 350,
    y: 228,
    width: 380,
    height: 42,
    zIndex: zCounter++,
    text: 'OCTOBER 18, 19, 20, 21',
    fontSize: 14,
    bgColor: '#991B1B',
    textColor: '#FFFFFF',
    borderColor: '#F59E0B',
  });

  // 7. Venue Badge
  elements.push({
    id: 'venue-badge',
    type: 'badge',
    badgeType: 'venue',
    x: 390,
    y: 282,
    width: 300,
    height: 38,
    zIndex: zCounter++,
    text: '📍 PUZHAKKAL GROUND',
    fontSize: 14,
    bgColor: '#0F172A',
    textColor: '#FCD34D',
    borderColor: '#F59E0B',
  });

  // 8. Team Name Banner
  elements.push({
    id: 'team-name-banner',
    type: 'text',
    x: 50,
    y: 335,
    width: 980,
    height: 55,
    zIndex: zCounter++,
    text: teamName.toUpperCase(),
    fontSize: 50,
    fontFamily: 'Arial Black, sans-serif',
    fontWeight: '900',
    color: '#FACC15',
    styleEffect: 'flat',
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
  });

  // 9. Player Squad Grid (Movable, resizable block)
  elements.push({
    id: 'player-squad-grid',
    type: 'player-grid',
    x: 40,
    y: 410,
    width: 1000,
    height: 1400,
    zIndex: zCounter++,
    columns: soldPlayers.length > 12 ? 5 : 4,
    cardRadius: 12,
    photoAspectRatio: 'square',
    nameSize: 'sm',
    showRole: false,
    showPrice: false,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  });

  // 10. Footer Left Text (Watermark)
  elements.push({
    id: 'footer-left-watermark',
    type: 'text',
    x: 50,
    y: 1845,
    width: 450,
    height: 50,
    zIndex: zCounter++,
    text: `Auction & Event hosted by\nOfficial ${tournamentName}`,
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    fontWeight: '600',
    color: '#E2E8F0',
    styleEffect: 'flat',
    textAlign: 'left',
    letterSpacing: 0.5,
  });

  // 11. Footer Right Text (Sponsor/Watermark)
  elements.push({
    id: 'footer-right-watermark',
    type: 'text',
    x: 580,
    y: 1845,
    width: 450,
    height: 50,
    zIndex: zCounter++,
    text: 'AUCTION 47\nSTREAM & AUCTION PARTNER',
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    fontWeight: '800',
    color: '#CBD5E1',
    styleEffect: 'flat',
    textAlign: 'right',
    letterSpacing: 1,
    textTransform: 'uppercase',
  });

  return {
    id: `poster-${Date.now()}`,
    canvasWidth: 1080,
    canvasHeight: 1920,
    background: {
      preset: 'stadium-night',
      darkness: 20,
    },
    elements,
  };
}
