import React, { forwardRef } from 'react';
import type { PosterConfig } from '../types/poster';
import { MapPin, Trophy, Shield } from 'lucide-react';

interface TeamPosterCanvasProps {
  config: PosterConfig;
  id?: string;
}

export const TeamPosterCanvas = forwardRef<HTMLDivElement, TeamPosterCanvasProps>(
  ({ config, id = 'team-poster-capture-node' }, ref) => {
    const {
      backgroundPreset,
      customBackgroundUrl,
      overlayDarkness,
      showOrganizer,
      organizerText,
      tournamentName,
      showSubtitle,
      subtitle,
      showDates,
      datesText,
      showVenue,
      venueText,
      showLeftLogo,
      leftLogoUrl,
      showRightLogo,
      rightLogoUrl,
      teamName,
      teamLogoUrl,
      showTeamLogo,
      teamColor,
      columns,
      cardBorderRadius,
      photoAspectRatio,
      playerNameSize,
      showPlayerRole,
      showPlayerPrice,
      playersList,
      showFooter,
      footerLeftText,
      footerRightText,
      footerRightLogoUrl,
    } = config;

    // Background style generator
    const getBackgroundStyle = (): React.CSSProperties => {
      if (backgroundPreset === 'custom' && customBackgroundUrl) {
        return {
          backgroundImage: `url(${customBackgroundUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      }

      switch (backgroundPreset) {
        case 'stadium-gold':
          return {
            background: `
              radial-gradient(ellipse 80% 40% at 50% 0%, rgba(245, 158, 11, 0.35) 0%, transparent 70%),
              radial-gradient(circle at 20% 15%, rgba(251, 191, 36, 0.2) 0%, transparent 45%),
              radial-gradient(circle at 80% 15%, rgba(251, 191, 36, 0.2) 0%, transparent 45%),
              radial-gradient(circle at 50% 90%, rgba(245, 158, 11, 0.25) 0%, transparent 60%),
              linear-gradient(180deg, #070e1e 0%, #0c1836 40%, #050b18 100%)
            `,
          };
        case 'electric-blue':
          return {
            background: `
              radial-gradient(ellipse 90% 45% at 50% 0%, rgba(56, 189, 248, 0.35) 0%, transparent 75%),
              radial-gradient(circle at 15% 20%, rgba(14, 165, 233, 0.3) 0%, transparent 45%),
              radial-gradient(circle at 85% 20%, rgba(14, 165, 233, 0.3) 0%, transparent 45%),
              linear-gradient(180deg, #020b1c 0%, #0a1f44 50%, #020712 100%)
            `,
          };
        case 'dark-arena':
          return {
            background: `
              radial-gradient(ellipse 70% 35% at 50% 0%, rgba(255, 255, 255, 0.15) 0%, transparent 70%),
              radial-gradient(circle at 50% 85%, rgba(217, 119, 6, 0.15) 0%, transparent 60%),
              linear-gradient(180deg, #11141a 0%, #090a0d 100%)
            `,
          };
        case 'carbon-luxury':
          return {
            background: `
              radial-gradient(circle at 50% 10%, rgba(245, 158, 11, 0.25) 0%, transparent 60%),
              linear-gradient(135deg, #171717 0%, #0a0a0a 50%, #000000 100%)
            `,
          };
        case 'stadium-night':
        default:
          return {
            background: `
              radial-gradient(ellipse 80% 35% at 50% 0%, rgba(125, 211, 252, 0.3) 0%, transparent 65%),
              radial-gradient(circle at 10% 15%, rgba(255, 255, 255, 0.4) 0%, transparent 25%),
              radial-gradient(circle at 90% 15%, rgba(255, 255, 255, 0.4) 0%, transparent 25%),
              radial-gradient(circle at 50% 85%, rgba(245, 158, 11, 0.25) 0%, transparent 55%),
              linear-gradient(180deg, #061126 0%, #0b1e42 35%, #081630 70%, #030814 100%)
            `,
          };
      }
    };

    // Columns CSS class generator
    const getGridColsClass = () => {
      switch (columns) {
        case 3: return 'grid-cols-3';
        case 4: return 'grid-cols-4';
        case 6: return 'grid-cols-6';
        case 5:
        default: return 'grid-cols-5';
      }
    };

    const getNameSizeClass = () => {
      switch (playerNameSize) {
        case 'xs': return 'text-[11px] leading-tight';
        case 'md': return 'text-[15px] leading-tight';
        case 'lg': return 'text-[17px] leading-tight';
        case 'sm':
        default: return 'text-[13px] leading-tight';
      }
    };

    const getCardDimensions = () => {
      const isPortrait = photoAspectRatio === 'portrait';
      switch (columns) {
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

    return (
      <div
        ref={ref}
        id={id}
        className="relative text-white font-sans overflow-hidden flex flex-col justify-between select-none"
        style={{
          width: '1080px',
          height: '1920px',
          ...getBackgroundStyle(),
          boxSizing: 'border-box',
        }}
      >
        {/* Stadium Lights & Flare Graphics (Overlay) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Top Left Floodlight Beam */}
          <div
            className="absolute -top-16 -left-16 w-80 h-80 rounded-full blur-3xl opacity-40"
            style={{ background: 'radial-gradient(circle, #ffffff 0%, #38bdf8 60%, transparent 80%)' }}
          />
          {/* Top Right Floodlight Beam */}
          <div
            className="absolute -top-16 -right-16 w-80 h-80 rounded-full blur-3xl opacity-40"
            style={{ background: 'radial-gradient(circle, #ffffff 0%, #38bdf8 60%, transparent 80%)' }}
          />
          {/* Subtle Stadium Crowd/Light Pattern Silhouette */}
          <div
            className="absolute top-12 left-0 right-0 h-44 opacity-25"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />
          {/* Gold Horizon Line Glow */}
          <div
            className="absolute top-72 left-0 right-0 h-1 blur-sm"
            style={{ background: 'linear-gradient(90deg, transparent 0%, #f59e0b 50%, transparent 100%)' }}
          />
          {/* User Darkness / Contrast Overlay */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(0, 0, 0, ${overlayDarkness / 100})` }}
          />
        </div>

        {/* ── HEADER SECTION ────────────────────────────────────────────── */}
        <div className="relative z-10 pt-8 px-10 text-center flex flex-col items-center">
          {/* Top Row: Logos & Organizer Subtitle */}
          <div className="w-full flex items-center justify-between mb-2">
            {/* Left Logo */}
            <div className="w-24 h-24 flex items-center justify-start">
              {showLeftLogo && leftLogoUrl ? (
                <div className="p-1 rounded-full bg-gradient-to-b from-amber-400 via-amber-600 to-amber-900 shadow-xl">
                  <img
                    src={leftLogoUrl}
                    alt="Logo Left"
                    className="w-20 h-20 rounded-full object-cover bg-slate-900"
                  />
                </div>
              ) : showLeftLogo ? (
                <div className="w-20 h-20 rounded-full bg-slate-800/90 border-2 border-amber-400 flex items-center justify-center shadow-xl">
                  <Shield size={36} className="text-amber-400" />
                </div>
              ) : null}
            </div>

            {/* Organizer Subtitle */}
            <div className="flex-1 px-4">
              {showOrganizer && organizerText && (
                <p className="text-xs uppercase tracking-[0.3em] font-black text-amber-200/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {organizerText}
                </p>
              )}
            </div>

            {/* Right Logo */}
            <div className="w-24 h-24 flex items-center justify-end">
              {showRightLogo && rightLogoUrl ? (
                <div className="p-1 rounded-full bg-gradient-to-b from-amber-400 via-amber-600 to-amber-900 shadow-xl">
                  <img
                    src={rightLogoUrl}
                    alt="Logo Right"
                    className="w-20 h-20 rounded-full object-cover bg-slate-900"
                  />
                </div>
              ) : showRightLogo ? (
                <div className="w-20 h-20 rounded-full bg-slate-800/90 border-2 border-amber-400 flex items-center justify-center shadow-xl">
                  <Trophy size={34} className="text-amber-400" />
                </div>
              ) : null}
            </div>
          </div>

          {/* Tournament Title (3D Gold Metallic Styling) */}
          <div className="relative mt-1 mb-2">
            <h1
              className="text-6xl md:text-7xl font-black uppercase tracking-wider leading-none"
              style={{
                fontFamily: 'Impact, sans-serif',
                color: '#FACC15',
                textShadow:
                  '0 2px 0 #D97706, 0 4px 0 #B45309, 0 6px 0 #78350F, 0 8px 14px rgba(0, 0, 0, 0.95), 0 0 25px rgba(245, 158, 11, 0.5)',
              }}
            >
              {tournamentName}
            </h1>

            {/* Subtitle / Season */}
            {showSubtitle && subtitle && (
              <p
                className="text-3xl font-black tracking-widest uppercase mt-1"
                style={{
                  fontFamily: 'Arial Black, sans-serif',
                  color: '#FDE68A',
                  textShadow: '0 2px 0 #D97706, 0 4px 8px rgba(0, 0, 0, 0.8)',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* Tournament Dates Ribbon (Optional) */}
          {showDates && datesText && (
            <div className="my-2 inline-flex items-center justify-center">
              <div
                className="px-8 py-2 rounded-lg font-black tracking-widest text-lg uppercase shadow-2xl relative border border-amber-400/60"
                style={{
                  background: 'linear-gradient(180deg, #991b1b 0%, #7f1d1d 50%, #450a0a 100%)',
                  boxShadow: '0 4px 20px rgba(185, 28, 28, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                }}
              >
                <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  {datesText}
                </span>
              </div>
            </div>
          )}

          {/* Venue Badge (Optional) */}
          {showVenue && venueText && (
            <div className="mb-2">
              <div
                className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-slate-900/90 border border-amber-400/70 text-amber-300 font-black text-sm tracking-wider uppercase shadow-xl"
                style={{
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(251, 191, 36, 0.4)',
                }}
              >
                <MapPin size={16} className="text-amber-400 shrink-0" />
                <span>{venueText}</span>
              </div>
            </div>
          )}

          {/* Team Name Banner */}
          <div className="mt-4 mb-2 flex items-center justify-center gap-4">
            {showTeamLogo && teamLogoUrl && (
              <img
                src={teamLogoUrl}
                alt="Team Logo"
                className="w-12 h-12 rounded-xl object-cover border border-amber-400/60 shadow-lg"
              />
            )}
            <h2
              className="text-4xl md:text-5xl font-black italic uppercase tracking-wider"
              style={{
                color: teamColor || '#FACC15',
                textShadow: '0 4px 12px rgba(0, 0, 0, 0.95), 0 0 20px rgba(250, 204, 21, 0.4)',
              }}
            >
              {teamName}
            </h2>
          </div>
        </div>

        {/* ── PLAYER PHOTO GRID ─────────────────────────────────────────── */}
        <div className="relative z-10 flex-1 px-8 py-4 flex flex-col justify-center">
          {playersList.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <p className="text-xl font-bold">No players assigned to this team yet</p>
              <p className="text-sm mt-1 opacity-70">Players bought in the auction will appear here automatically</p>
            </div>
          ) : (
            <div className={`grid ${getGridColsClass()} gap-4 justify-items-center items-start`}>
              {playersList.map((player, idx) => (
                <div
                  key={player.id || idx}
                  className="flex flex-col items-center self-start"
                  style={{ width: `${cardDim.width}px` }}
                >
                  {/* Photo Container with explicit pixel dimensions */}
                  <div
                    className="relative overflow-hidden shadow-2xl transition-transform shrink-0"
                    style={{
                      width: `${cardDim.width}px`,
                      height: `${cardDim.height}px`,
                      borderRadius: `${cardBorderRadius}px`,
                      border: '2px solid rgba(255, 255, 255, 0.35)',
                      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.7), inset 0 0 15px rgba(0, 0, 0, 0.4)',
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
                    {showPlayerRole && player.role && (
                      <div className="absolute top-1.5 right-1.5 bg-black/85 backdrop-blur-xs text-[9px] font-bold px-1.5 py-0.5 rounded text-amber-300 border border-amber-400/40 uppercase">
                        {player.role}
                      </div>
                    )}

                    {/* Optional Price Badge */}
                    {showPlayerPrice && (player.soldPrice ?? player.basePrice) && (
                      <div className="absolute bottom-1.5 right-1.5 bg-emerald-950/95 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded text-emerald-300 border border-emerald-500/50">
                        ₹{(player.soldPrice ?? player.basePrice).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>

                  {/* Player Name */}
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
          )}
        </div>

        {/* ── FOOTER & WATERMARKS ────────────────────────────────────────── */}
        {showFooter && (
          <div className="relative z-10 px-10 py-6 border-t border-white/10 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end justify-between">
            {/* Left Watermark / Host */}
            <div className="text-left">
              {footerLeftText.split('\n').map((line, i) => (
                <p
                  key={i}
                  className={
                    i === 0
                      ? 'text-xs text-slate-300 font-medium tracking-wider drop-shadow'
                      : 'text-sm text-white font-black tracking-wide drop-shadow'
                  }
                >
                  {line}
                </p>
              ))}
            </div>

            {/* Right Watermark / Sponsor / Streaming */}
            <div className="flex items-center gap-3 text-right">
              {footerRightLogoUrl && (
                <img
                  src={footerRightLogoUrl}
                  alt="Sponsor Logo"
                  className="h-9 w-auto object-contain drop-shadow-md"
                />
              )}
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest text-slate-400 font-bold drop-shadow">
                  Powered by
                </p>
                <p className="text-sm font-black tracking-wider text-white uppercase drop-shadow">
                  {footerRightText}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

TeamPosterCanvas.displayName = 'TeamPosterCanvas';
