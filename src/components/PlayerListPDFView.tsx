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
    gap: 16,
    alignItems: 'center',
  },
  docStatBox: {
    backgroundColor: '#2c2c2c',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  docStatValue: {
    color: '#4caf50',
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
  },
  docStatLabel: {
    color: '#757575',
    fontSize: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 1,
  },
  docDateBox: {
    alignItems: 'flex-end',
  },
  docDateValue: {
    color: '#bdbdbd',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  docEventName: {
    color: '#757575',
    fontSize: 6.5,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
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

  // Card header (dark asymmetric band)
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

  // Index tab (darker right section of header)
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

  // Role accent stripe below header
  roleStripe: {
    height: 3,
  },

  // Card body
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
    objectFit: 'cover',        // center-crops image to fill circle
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

  // Thin vertical divider
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

  // Base price box
  basePriceBox: {
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
  basePriceLabel: {
    color: '#2e7d32',
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  basePriceValue: {
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
});

// ── Single player card ────────────────────────────────────────────────────────

interface CardProps {
  player: Player;
  globalIdx: number;   // 1-based serial number across all pages
  schemaFields: any[];
}

function PlayerCard({ player, globalIdx, schemaFields }: CardProps) {
  const accentColor = ROLE_ACCENT[player.role ?? ''] ?? '#424242';

  // All non-file schema fields with a value
  const fields = schemaFields.filter(
    (f) =>
      f.type !== 'file' &&
      f.id !== 'name' &&
      f.id !== 'photo' &&
      player[f.id] !== undefined &&
      player[f.id] !== null &&
      String(player[f.id]).trim() !== ''
  );

  return (
    <View style={s.card}>

      {/* ─── Asymmetric dark header ─── */}
      <View style={s.cardHeader}>
        {/* Name + role text */}
        <View style={s.headerMain}>
          <Text style={s.playerName}>
            {player.name}
          </Text>
          {player.role && (
            <Text style={[s.roleText, { color: accentColor }]}>
              {player.role}
            </Text>
          )}
        </View>

        {/* Index tab — distinct darker right-side block */}
        <View style={s.indexTab}>
          <Text style={s.indexNumber}>{globalIdx}</Text>
          <Text style={s.indexLabel}>NO.</Text>
        </View>
      </View>

      {/* Thin role-coloured accent stripe */}
      <View style={[s.roleStripe, { backgroundColor: accentColor }]} />

      {/* ─── Card body ─── */}
      <View style={s.cardBody}>

        {/* Circular photo (center-cropped) */}
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

        {/* Thin vertical separator */}
        <View style={s.vDivider} />

        {/* Data labels + values */}
        <View style={s.dataSection}>
          {fields.slice(0, 6).map((field) => (
            <View key={field.id} style={s.dataRow}>
              <Text style={s.dataLabel}>{field.label}</Text>
              <Text style={s.dataColon}>:</Text>
              <Text style={s.dataValue}>
                {String(player[field.id]).substring(0, 24)}
              </Text>
            </View>
          ))}

          {/* Base price highlight */}
          <View style={s.basePriceBox}>
            <Text style={s.basePriceLabel}>Base Price</Text>
            <Text style={s.basePriceValue}>{fmt(player.basePrice)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Document ──────────────────────────────────────────────────────────────────

interface Props {
  players: Player[];
  schema?: any;
  eventName?: string;
}

const PLAYERS_PER_PAGE = 8; // 2 columns × 4 rows

export function ApprovedPlayersPDFDocument({
  players,
  schema,
  eventName = 'AUCTION 47',
}: Props) {
  // Schema fields (exclude file/photo/name)
  const schemaFields: any[] =
    schema?.fields?.filter(
      (f: any) => f.type !== 'file' && f.id !== 'name' && f.id !== 'photo'
    ) ?? [];

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
    <Document title={`Approved Players – ${eventName}`} author={eventName}>

      {players.length === 0 ? (
        /* ── Empty state page ── */
        <Page size="A4" orientation="portrait" style={s.page}>
          <View style={s.docHeader}>
            <View style={s.docLeft}>
              <Text style={s.docTitle}>Approved Players</Text>
              <Text style={s.docSubtitle}>Player Catalog — {eventName}</Text>
            </View>
          </View>
          <View style={s.emptyWrap}>
            <Text style={s.emptyText}>No approved players found</Text>
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
              {/* ── First page: full document header ── */}
              {pageIdx === 0 ? (
                <View style={s.docHeader}>
                  <View style={s.docLeft}>
                    <Text style={s.docTitle}>Approved Players</Text>
                    <Text style={s.docSubtitle}>Player Catalog — {eventName}</Text>
                  </View>
                  <View style={s.docRight}>
                    <View style={s.docStatBox}>
                      <Text style={s.docStatValue}>{players.length}</Text>
                      <Text style={s.docStatLabel}>Total Approved</Text>
                    </View>
                    <View style={s.docDateBox}>
                      <Text style={s.docDateValue}>{today}</Text>
                      <Text style={s.docEventName}>{eventName}</Text>
                    </View>
                  </View>
                </View>
              ) : (
                /* ── Subsequent pages: compact header ── */
                <View style={s.contHeader}>
                  <Text style={s.contHeaderTitle}>
                    Approved Players — {eventName}
                  </Text>
                  <Text style={s.contHeaderPage}>
                    Page {pageIdx + 1} of {totalPages}
                  </Text>
                </View>
              )}

              {/* Section info row */}
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>
                  {pageIdx === 0 ? 'Players Directory' : 'Continued'}
                </Text>
                <Text style={s.sectionRange}>
                  Showing #{startNum} – #{endNum} of {players.length}
                </Text>
              </View>

              {/* 2-column player card grid */}
              <View style={s.grid}>
                {pageGroup.map((player, cardIdx) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    globalIdx={pageIdx * PLAYERS_PER_PAGE + cardIdx + 1}
                    schemaFields={schemaFields}
                  />
                ))}
              </View>

              {/* Footer */}
              <View style={s.footer}>
                <Text style={s.footerLeft}>{eventName} — Approved Players List</Text>
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
