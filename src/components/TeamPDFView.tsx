import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { Team, Player } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (value: number) => {
  if (value >= 10000000) return `Rs ${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `Rs ${(value / 100000).toFixed(2)} L`;
  return `Rs ${value.toLocaleString('en-IN')}`;
};

const ROLE_COLORS: Record<string, string> = {
  Batsman: '#3b82f6',
  Bowler: '#ef4444',
  'All-Rounder': '#a855f7',
  'Wicket Keeper': '#f59e0b',
};

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    backgroundColor: '#0f172a',
    padding: 32,
    fontFamily: 'Helvetica',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 20,
    marginBottom: 24,
    gap: 16,
  },
  badge: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
  },
  headerTitle: {
    flex: 1,
  },
  teamName: {
    color: '#f8fafc',
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
  },
  teamSubtitle: {
    color: '#a78bfa',
    fontSize: 9,
    letterSpacing: 3,
    marginTop: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    minWidth: 90,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 7,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
  },
  statValueGreen: {
    color: '#4ade80',
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
  },
  statValuePurple: {
    color: '#c084fc',
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Grid ──────────────────────────────────────────────────────────────────
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 8,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  // ── Player Card ───────────────────────────────────────────────────────────
  card: {
    width: '22.5%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  photoBox: {
    height: 100,
    backgroundColor: '#0f172a',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'top',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#1e293b',
  },
  roleBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 99,
  },
  roleBadgeText: {
    color: '#ffffff',
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  cardBody: {
    padding: 10,
  },
  playerName: {
    color: '#f8fafc',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 8,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  priceLabel: {
    color: '#64748b',
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  basePrice: {
    color: '#94a3b8',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  soldBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#052e16',
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: '#166534',
  },
  soldLabel: {
    color: '#4ade80',
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  soldPrice: {
    color: '#4ade80',
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    color: '#475569',
    fontSize: 8,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 16,
    borderStyle: 'dashed',
  },
  emptyText: {
    color: '#475569',
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
  },
});

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  team: Team;
  players: Player[];
}

export function SquadPDFDocument({ team, players }: Props) {
  const totalSpent =
    team.totalSpent ??
    players.reduce((sum, p) => sum + (p.soldPrice ?? 0), 0);

  return (
    <Document
      title={`${team.name} – Squad`}
      author="AUCTION 47"
    >
      <Page
        size="A4"
        orientation="landscape"
        style={s.page}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.badge}>
            <Text style={s.badgeText}>
              {team.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>

          <View style={s.headerTitle}>
            <Text style={s.teamName}>{team.name}</Text>
            <Text style={s.teamSubtitle}>OFFICIAL SQUAD</Text>
          </View>

          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statLabel}>Remaining Purse</Text>
              <Text style={s.statValue}>{fmt(team.budget)}</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statLabel}>Total Spent</Text>
              <Text style={s.statValueGreen}>{fmt(totalSpent)}</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statLabel}>Players</Text>
              <Text style={s.statValuePurple}>{players.length}</Text>
            </View>
          </View>
        </View>

        {/* Section Title */}
        <Text style={s.sectionTitle}>Purchased Players</Text>

        {/* Players */}
        {players.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>No players purchased yet</Text>
          </View>
        ) : (
          <View style={s.grid}>
            {players.map((player) => {
              const roleClr = ROLE_COLORS[player.role] ?? '#64748b';
              return (
                <View key={player.id} style={s.card}>
                  {/* Photo */}
                  <View style={s.photoBox}>
                    {player.photo ? (
                      <Image src={player.photo} style={s.photo} />
                    ) : (
                      <View
                        style={[
                          s.photoBox,
                          { backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
                        ]}
                      >
                        <Text style={{ color: '#475569', fontSize: 28, fontFamily: 'Helvetica-Bold' }}>
                          {player.name.substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={[s.roleBadge, { backgroundColor: roleClr }]}>
                      <Text style={s.roleBadgeText}>{player.role}</Text>
                    </View>
                  </View>

                  {/* Body */}
                  <View style={s.cardBody}>
                    <Text style={s.playerName} numberOfLines={1}>
                      {player.name}
                    </Text>

                    <View style={s.priceRow}>
                      <Text style={s.priceLabel}>Base</Text>
                      <Text style={s.basePrice}>{fmt(player.basePrice)}</Text>
                    </View>

                    <View style={s.soldBox}>
                      <Text style={s.soldLabel}>SOLD</Text>
                      <Text style={s.soldPrice}>
                        {fmt(player.soldPrice ?? 0)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>AUCTION 47</Text>
          <Text style={s.footerText}>
            {new Date().toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
