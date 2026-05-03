import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import type { Team, Player } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (value: number) => {
  if (value >= 10000000) return `Rs ${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000)   return `Rs ${(value / 100000).toFixed(2)} L`;
  return `Rs ${value.toLocaleString('en-IN')}`;
};

const ROLE_ACCENT: Record<string, string> = {
  Batsman:         '#1565c0',
  Bowler:          '#c62828',
  'All-Rounder':   '#6a1b9a',
  'Wicket Keeper': '#e65100',
};

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // ── Page ──────────────────────────────────────────────────────────────────
  page: {
    backgroundColor: '#e8e8e8',
    padding: 22,
    fontFamily: 'Helvetica',
  },

  // ── Document header (first page only) ─────────────────────────────────────
  docHeader: {
    backgroundColor: '#1c1c1c',
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docLeft: {
    flex: 1,
  },
  docTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
  },
  docSubtitle: {
    color: '#9e9e9e',
    fontSize: 7,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginTop: 3,
  },
  docRight: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  docStatBox: {
    backgroundColor: '#2c2c2c',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    minWidth: 70,
  },
  docStatValue: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
  },
  docStatLabel: {
    color: '#757575',
    fontSize: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 2,
  },

  // ── Continuation header (subsequent pages) ────────────────────────────────
  contHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  contHeaderTitle: {
    color: '#9e9e9e',
    fontSize: 7.5,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  contHeaderPage: {
    color: '#bdbdbd',
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Section title row ─────────────────────────────────────────────────────
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#616161',
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  sectionRange: {
    color: '#9e9e9e',
    fontSize: 7,
  },

  // ── 2-column grid ─────────────────────────────────────────────────────────
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  // ── Player card ───────────────────────────────────────────────────────────
  card: {
    width: '49%',
    backgroundColor: '#ffffff',
    borderRadius: 7,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cccccc',
  },

  cardHeader: {
    backgroundColor: '#2d2d2d',
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  headerMain: {
    flex: 1,
    paddingTop: 9,
    paddingBottom: 9,
    paddingLeft: 12,
    paddingRight: 6,
    justifyContent: 'center',
  },
  playerName: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  roleText: {
    fontSize: 6.5,
    marginTop: 2,
    letterSpacing: 0.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },

  indexTab: {
    backgroundColor: '#111111',
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#3d3d3d',
  },
  indexNumber: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
  },
  indexLabel: {
    color: '#555555',
    fontSize: 5.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 1,
  },

  roleStripe: {
    height: 3,
  },

  cardBody: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 9,
    backgroundColor: '#ffffff',
  },

  // ── Circular photo ────────────────────────────────────────────────────────
  photoWrapper: {
    width: 74,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  photoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#bdbdbd',
    borderWidth: 2.5,
    borderColor: '#2d2d2d',
  },
  photo: {
    width: 72,
    height: 72,
    objectFit: 'cover',
    objectPosition: 'center',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#2d2d2d',
  },
  avatarInitials: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#424242',
  },

  vDivider: {
    width: 1,
    backgroundColor: '#eeeeee',
    marginVertical: 2,
  },

  // ── Data section ──────────────────────────────────────────────────────────
  dataSection: {
    flex: 1,
    justifyContent: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: 3.5,
    alignItems: 'flex-start',
  },
  dataLabel: {
    width: '40%',
    color: '#000000',
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dataColon: {
    color: '#888888',
    fontSize: 6.5,
    marginRight: 3,
  },
  dataValue: {
    flex: 1,
    color: '#333333',
    fontSize: 7,
  },

  basePriceBox: {
    marginTop: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#9e9e9e',
  },
  basePriceLabel: {
    color: '#616161',
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  basePriceValue: {
    color: '#424242',
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
  },

  soldPriceBox: {
    marginTop: 4,
    backgroundColor: '#f1f8f1',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#2e7d32',
  },
  soldPriceLabel: {
    color: '#2e7d32',
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  soldPriceValue: {
    color: '#1b5e20',
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#bdbdbd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    color: '#9e9e9e',
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerRight: {
    color: '#9e9e9e',
    fontSize: 7,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    borderWidth: 2,
    borderColor: '#cccccc',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  emptyText: {
    color: '#9e9e9e',
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Watermark ─────────────────────────────────────────────────────────────
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100, // Render on top of cards
    justifyContent: 'center',
    alignItems: 'center',
  },
  watermarkText: {
    fontSize: 80,
    color: '#000000',
    opacity: 0.04,
    fontFamily: 'Helvetica-Bold',
    transform: 'rotate(-45deg)',
    textTransform: 'uppercase',
  },
});

// ── Single player card ────────────────────────────────────────────────────────

interface CardProps {
  player: Player;
  globalIdx: number;
}

function PlayerCard({ player, globalIdx }: CardProps) {
  const accentColor = ROLE_ACCENT[player.role ?? ''] ?? '#424242';

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.headerMain}>
          <Text style={s.playerName}>{player.name}</Text>
          {player.role && (
            <Text style={[s.roleText, { color: accentColor }]}>
              {player.role}
            </Text>
          )}
        </View>

        <View style={s.indexTab}>
          <Text style={s.indexNumber}>{globalIdx}</Text>
          <Text style={s.indexLabel}>NO.</Text>
        </View>
      </View>

      <View style={[s.roleStripe, { backgroundColor: accentColor }]} />

      <View style={s.cardBody}>
        <View style={s.photoWrapper}>
          {player.photo ? (
            <View style={s.photoCircle}>
              <Image src={player.photo} style={s.photo} />
            </View>
          ) : (
            <View style={s.avatarCircle}>
              <Text style={s.avatarInitials}>
                {player.name.substring(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={s.vDivider} />

        <View style={s.dataSection}>
          <View style={s.dataRow}>
            <Text style={s.dataLabel}>ROLE</Text>
            <Text style={s.dataColon}>:</Text>
            <Text style={s.dataValue}>{player.role || 'N/A'}</Text>
          </View>

          {player.batting_style && (
            <View style={s.dataRow}>
              <Text style={s.dataLabel}>BATTING</Text>
              <Text style={s.dataColon}>:</Text>
              <Text style={s.dataValue}>{String(player.batting_style)}</Text>
            </View>
          )}

          {player.bowling_style && (
            <View style={s.dataRow}>
              <Text style={s.dataLabel}>BOWLING</Text>
              <Text style={s.dataColon}>:</Text>
              <Text style={s.dataValue}>{String(player.bowling_style)}</Text>
            </View>
          )}

          <View style={s.basePriceBox}>
            <Text style={s.basePriceLabel}>Base Price</Text>
            <Text style={s.basePriceValue}>{fmt(player.basePrice)}</Text>
          </View>

          <View style={s.soldPriceBox}>
            <Text style={s.soldPriceLabel}>Sold for</Text>
            <Text style={s.soldPriceValue}>{fmt(player.soldPrice ?? 0)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Document ──────────────────────────────────────────────────────────────────

interface Props {
  team: Team;
  players: Player[];
}

const PLAYERS_PER_PAGE = 8; // 2 columns × 4 rows

export function SquadPDFDocument({ team, players }: Props) {
  const totalSpent = team.totalSpent ?? players.reduce((sum, p) => sum + (p.soldPrice ?? 0), 0);

  // Split into pages of 8
  const pages: Player[][] = [];
  for (let i = 0; i < players.length; i += PLAYERS_PER_PAGE) {
    pages.push(players.slice(i, i + PLAYERS_PER_PAGE));
  }
  const totalPages = Math.max(pages.length, 1);

  const today = new Date().toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <Document title={`${team.name} – Squad`} author="AUCTION 47">
      {players.length === 0 ? (
        <Page size="A4" orientation="portrait" style={s.page}>
          <View style={s.watermarkContainer} fixed>
            <Text style={s.watermarkText}>AUCTION 47</Text>
          </View>
          <View style={s.docHeader}>
            <View style={s.docLeft}>
              <Text style={s.docTitle}>{team.name}</Text>
              <Text style={s.docSubtitle}>Official Squad</Text>
            </View>
          </View>
          <View style={s.emptyWrap}>
            <Text style={s.emptyText}>No players purchased yet</Text>
          </View>
        </Page>
      ) : (
        pages.map((pageGroup, pageIdx) => {
          const startNum = pageIdx * PLAYERS_PER_PAGE + 1;
          const endNum   = Math.min(startNum + pageGroup.length - 1, players.length);

          return (
            <Page
              key={pageIdx}
              size="A4"
              orientation="portrait"
              style={s.page}
            >
              <View style={s.watermarkContainer} fixed>
                <Text style={s.watermarkText}>AUCTION 47</Text>
              </View>
              {pageIdx === 0 ? (
                <View style={s.docHeader}>
                  <View style={s.docLeft}>
                    <Text style={s.docTitle}>{team.name}</Text>
                    <Text style={s.docSubtitle}>Official Squad</Text>
                  </View>
                  <View style={s.docRight}>
                    <View style={s.docStatBox}>
                      <Text style={[s.docStatValue, { color: '#c084fc' }]}>{players.length}</Text>
                      <Text style={s.docStatLabel}>Players</Text>
                    </View>
                    <View style={s.docStatBox}>
                      <Text style={[s.docStatValue, { color: '#4ade80' }]}>{fmt(totalSpent)}</Text>
                      <Text style={s.docStatLabel}>Total Spent</Text>
                    </View>
                    <View style={s.docStatBox}>
                      <Text style={[s.docStatValue, { color: '#ffffff' }]}>{fmt(team.budget)}</Text>
                      <Text style={s.docStatLabel}>Remaining</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={s.contHeader}>
                  <Text style={s.contHeaderTitle}>
                    {team.name} — Squad
                  </Text>
                  <Text style={s.contHeaderPage}>
                    Page {pageIdx + 1} of {totalPages}
                  </Text>
                </View>
              )}

              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>
                  {pageIdx === 0 ? 'Purchased Players' : 'Continued'}
                </Text>
                <Text style={s.sectionRange}>
                  Showing #{startNum} – #{endNum} of {players.length}
                </Text>
              </View>

              <View style={s.grid}>
                {pageGroup.map((player, cardIdx) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    globalIdx={pageIdx * PLAYERS_PER_PAGE + cardIdx + 1}
                  />
                ))}
              </View>

              <View style={s.footer}>
                <Text style={s.footerLeft}>{team.name} — Squad List</Text>
                <Text style={s.footerRight}>
                  Page {pageIdx + 1} / {totalPages} · {today}
                </Text>
              </View>
            </Page>
          );
        })
      )}
    </Document>
  );
}

