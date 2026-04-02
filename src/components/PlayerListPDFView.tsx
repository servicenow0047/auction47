import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import type { Player } from '../types';

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
    backgroundColor: '#059669',
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
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
  },
  subtitle: {
    color: '#34d399',
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
  approvedBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 99,
    backgroundColor: '#059669',
  },
  approvedBadgeText: {
    color: '#ffffff',
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    color: '#64748b',
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailValue: {
    color: '#94a3b8',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  basePriceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f3a27',
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: '#065f3e',
    marginTop: 4,
  },
  basePriceLabel: {
    color: '#34d399',
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  basePriceValue: {
    color: '#34d399',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Serial number ─────────────────────────────────────────────────────────
  serialCircle: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 18,
    height: 18,
    borderRadius: 99,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serialText: {
    color: '#94a3b8',
    fontSize: 7,
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
  players: Player[];
  eventName?: string;
}

export function ApprovedPlayersPDFDocument({ players, eventName = 'AUCTION 47' }: Props) {
  return (
    <Document
      title={`Approved Players – ${eventName}`}
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
            <Text style={s.badgeText}>✓</Text>
          </View>

          <View style={s.headerTitle}>
            <Text style={s.title}>Approved Players</Text>
            <Text style={s.subtitle}>FULL REGISTERED & APPROVED POOL</Text>
          </View>

          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statLabel}>Total Approved</Text>
              <Text style={s.statValueGreen}>{players.length}</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statLabel}>Tournament</Text>
              <Text style={s.statValue}>{eventName}</Text>
            </View>
          </View>
        </View>

        {/* Section Title */}
        <Text style={s.sectionTitle}>Approved Players Pool</Text>

        {/* Players */}
        {players.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>No approved players found</Text>
          </View>
        ) : (
          <View style={s.grid}>
            {players.map((player, idx) => {
              const roleClr = player.role ? ROLE_COLORS[player.role] ?? '#64748b' : '#64748b';
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
                    {/* Serial number */}
                    <View style={s.serialCircle}>
                      <Text style={s.serialText}>{idx + 1}</Text>
                    </View>
                    {/* Role badge */}
                    {player.role && (
                      <View style={[s.roleBadge, { backgroundColor: roleClr }]}>
                        <Text style={s.roleBadgeText}>{player.role}</Text>
                      </View>
                    )}
                    {/* Approved badge */}
                    <View style={s.approvedBadge}>
                      <Text style={s.approvedBadgeText}>✓ Approved</Text>
                    </View>
                  </View>

                  {/* Body */}
                  <View style={s.cardBody}>
                    <Text style={s.playerName}>{player.name}</Text>

                    {player.age && (
                      <View style={s.detailRow}>
                        <Text style={s.detailLabel}>Age</Text>
                        <Text style={s.detailValue}>{player.age}</Text>
                      </View>
                    )}

                    {player.experience && (
                      <View style={s.detailRow}>
                        <Text style={s.detailLabel}>Experience</Text>
                        <Text style={s.detailValue}>{String(player.experience).substring(0, 12)}</Text>
                      </View>
                    )}

                    {player.phone && (
                      <View style={s.detailRow}>
                        <Text style={s.detailLabel}>Phone</Text>
                        <Text style={s.detailValue}>{player.phone}</Text>
                      </View>
                    )}

                    <View style={s.basePriceBox}>
                      <Text style={s.basePriceLabel}>Base Price</Text>
                      <Text style={s.basePriceValue}>{fmt(player.basePrice)}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>AUCTION 47 — Approved Players List</Text>
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
