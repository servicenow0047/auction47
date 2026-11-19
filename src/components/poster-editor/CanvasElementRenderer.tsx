import React from 'react';
import type { CanvasElement, TextElement, ImageElement, BadgeElement, PlayerGridElement } from '../../types/editor';
import type { Player } from '../../types';

interface CanvasElementRendererProps {
  element: CanvasElement;
  players: Player[];
  isSelected?: boolean;
}

export const CanvasElementRenderer: React.FC<CanvasElementRendererProps> = ({
  element,
  players,
}) => {
  switch (element.type) {
    case 'text':
      return <RenderText textEl={element} />;
    case 'image':
      return <RenderImage imgEl={element} />;
    case 'badge':
      return <RenderBadge badgeEl={element} />;
    case 'player-grid':
      return <RenderPlayerGrid gridEl={element} players={players} />;
    default:
      return null;
  }
};

/** Render Text Layer */
function RenderText({ textEl }: { textEl: TextElement }) {
  const getStyleEffect = (): React.CSSProperties => {
    switch (textEl.styleEffect) {
      case 'gold-3d':
        return {
          color: '#FACC15',
          textShadow:
            '0 2px 0 #D97706, 0 4px 0 #B45309, 0 6px 0 #78350F, 0 8px 14px rgba(0, 0, 0, 0.95), 0 0 25px rgba(245, 158, 11, 0.5)',
        };
      case 'metallic-silver':
        return {
          color: '#F8FAFC',
          textShadow:
            '0 2px 0 #94A3B8, 0 4px 0 #64748B, 0 6px 0 #334155, 0 8px 12px rgba(0, 0, 0, 0.9)',
        };
      case 'red-ribbon':
        return {
          color: '#FCA5A5',
          textShadow:
            '0 2px 0 #DC2626, 0 4px 0 #991B1B, 0 6px 12px rgba(0, 0, 0, 0.9)',
        };
      case 'glow-cyan':
        return {
          color: '#38BDF8',
          textShadow: '0 0 15px rgba(56, 189, 248, 0.8), 0 0 30px rgba(14, 165, 233, 0.5)',
        };
      case 'flat':
      default:
        return {
          color: textEl.color || '#FFFFFF',
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)',
        };
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col justify-center select-none whitespace-pre-wrap pointer-events-none"
      style={{
        fontSize: `${textEl.fontSize}px`,
        fontFamily: textEl.fontFamily || 'Inter, sans-serif',
        fontWeight: textEl.fontWeight || 'normal',
        textAlign: textEl.textAlign || 'center',
        letterSpacing: textEl.letterSpacing ? `${textEl.letterSpacing}px` : undefined,
        textTransform: textEl.textTransform || 'none',
        opacity: textEl.opacity ?? 1,
        lineHeight: 1.15,
        ...getStyleEffect(),
      }}
    >
      {textEl.text}
    </div>
  );
}

/** Render Image Layer */
function RenderImage({ imgEl }: { imgEl: ImageElement }) {
  return (
    <div
      className="w-full h-full overflow-hidden select-none pointer-events-none flex items-center justify-center"
      style={{
        borderRadius: imgEl.isCircular ? '9999px' : `${imgEl.borderRadius || 0}px`,
        border: imgEl.borderWidth ? `${imgEl.borderWidth}px solid ${imgEl.borderColor || '#F59E0B'}` : undefined,
        opacity: imgEl.opacity ?? 1,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
      }}
    >
      <img
        src={imgEl.src}
        alt="Element"
        className="w-full h-full"
        style={{
          objectFit: imgEl.objectFit || 'contain',
        }}
        crossOrigin="anonymous"
      />
    </div>
  );
}

/** Render Badge Layer (Ribbon / Venue) */
function RenderBadge({ badgeEl }: { badgeEl: BadgeElement }) {
  if (badgeEl.badgeType === 'dates') {
    return (
      <div
        className="w-full h-full flex items-center justify-center px-6 rounded-md font-black tracking-widest uppercase shadow-xl pointer-events-none select-none"
        style={{
          backgroundColor: '#7F1D1D',
          border: `1.5px solid ${badgeEl.borderColor || '#F59E0B'}`,
          color: badgeEl.textColor || '#FFFFFF',
          fontSize: `${badgeEl.fontSize || 14}px`,
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.6)',
        }}
      >
        <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">{badgeEl.text}</span>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full flex items-center justify-center gap-2 px-4 rounded-full font-black tracking-wider uppercase shadow-xl pointer-events-none select-none"
      style={{
        backgroundColor: badgeEl.bgColor || '#0F172A',
        border: `1.5px solid ${badgeEl.borderColor || '#F59E0B'}`,
        color: badgeEl.textColor || '#FCD34D',
        fontSize: `${badgeEl.fontSize || 13}px`,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
      }}
    >
      <span>{badgeEl.text}</span>
    </div>
  );
}

/** Render Player Squad Grid Layer */
function RenderPlayerGrid({
  gridEl,
  players,
}: {
  gridEl: PlayerGridElement;
  players: Player[];
}) {
  const getGridColsClass = () => {
    switch (gridEl.columns) {
      case 3: return 'grid-cols-3';
      case 4: return 'grid-cols-4';
      case 6: return 'grid-cols-6';
      case 5:
      default: return 'grid-cols-5';
    }
  };

  const getNameSizeClass = () => {
    switch (gridEl.nameSize) {
      case 'xs': return 'text-[11px]';
      case 'md': return 'text-[15px]';
      case 'lg': return 'text-[17px]';
      case 'sm':
      default: return 'text-[13px]';
    }
  };

  // Explicit card dimensions based on column count and aspect ratio
  // This guarantees 100% distortion-free cards in both DOM and raster canvas export engines
  const getCardDimensions = () => {
    const isPortrait = gridEl.photoAspectRatio === 'portrait';
    switch (gridEl.columns) {
      case 3:
        return { width: 280, height: isPortrait ? 370 : 280 };
      case 4:
        return { width: 210, height: isPortrait ? 280 : 210 };
      case 6:
        return { width: 135, height: isPortrait ? 180 : 135 };
      case 5:
      default:
        return { width: 165, height: isPortrait ? 220 : 165 };
    }
  };

  const cardDim = getCardDimensions();

  if (!players || players.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-2xl bg-black/20 text-slate-400 p-8 text-center pointer-events-none">
        <p className="text-xl font-bold">No Squad Players</p>
        <p className="text-sm mt-1 opacity-70">
          Select a team with bought players or add players to preview the squad grid.
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full grid ${getGridColsClass()} gap-x-5 gap-y-6 justify-items-center items-start content-start pointer-events-none select-none`}>
      {players.map((player, idx) => (
        <div
          key={player.id || idx}
          className="flex flex-col items-center self-start"
          style={{ width: `${cardDim.width}px` }}
        >
          {/* Photo Container with explicit pixel dimensions and cover background */}
          <div
            className="relative overflow-hidden shadow-2xl shrink-0"
            style={{
              width: `${cardDim.width}px`,
              height: `${cardDim.height}px`,
              borderRadius: `${gridEl.cardRadius || 12}px`,
              border: `2px solid ${gridEl.borderColor || 'rgba(255, 255, 255, 0.35)'}`,
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.7)',
              backgroundColor: '#0f172a',
              ...(player.photo
                ? {
                    backgroundImage: `url("${player.photo}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }
                : {}),
            }}
          >
            {!player.photo && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-amber-400">
                <span className="text-3xl font-black">
                  {player.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}

            {/* Optional Role Badge */}
            {gridEl.showRole && player.role && (
              <div className="absolute top-1.5 right-1.5 bg-black/85 backdrop-blur-xs text-[10px] font-bold px-2 py-0.5 rounded text-amber-300 border border-amber-400/40 uppercase shadow-md">
                {player.role}
              </div>
            )}

            {/* Optional Price Badge */}
            {gridEl.showPrice && (player.soldPrice ?? player.basePrice) && (
              <div className="absolute bottom-1.5 right-1.5 bg-emerald-950/95 text-[10px] font-mono font-bold px-2 py-0.5 rounded text-emerald-300 border border-emerald-500/50 shadow-md">
                ₹{(player.soldPrice ?? player.basePrice).toLocaleString('en-IN')}
              </div>
            )}
          </div>

          {/* Name */}
          <div className="w-full text-center mt-2 px-1">
            <p
              className={`font-black uppercase tracking-wide truncate ${getNameSizeClass()}`}
              style={{
                color: '#FFFFFF',
                textShadow: '0 2px 6px rgba(0, 0, 0, 0.95), 0 0 8px rgba(0, 0, 0, 0.8)',
              }}
              title={player.name}
            >
              {player.name}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
