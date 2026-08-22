import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Linking,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import type { CaseSummary } from '../types';

interface CaseTableProps {
  cases: CaseSummary[];
  entityName?: string;
}

function formatDate(d?: string | null) {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatOutcome(outcome: string | null) {
  if (!outcome) return 'PENDING REVIEW';
  return outcome.replace(/_/g, ' ');
}

function getOutcomeColor(outcome: string | null) {
  if (!outcome) return colors.textMuted;
  const u = outcome.toUpperCase();
  if (u.includes('WIN') || u.includes('AFFIRMED') || u.includes('MAJORITY') || u.includes('CONVICTION')) {
    return colors.brass;
  }
  if (u.includes('PLEA') || u.includes('PARTIAL') || u.includes('SETTLEMENT') || u.includes('CONCURRING') || u.includes('GRANTED')) {
    return colors.brassLight;
  }
  if (u.includes('LOSS') || u.includes('DISSENT') || u.includes('DISMISS') || u.includes('ACQUITTAL')) {
    return colors.error;
  }
  return colors.text;
}

function openCaseLink(c: CaseSummary, entityName?: string) {
  let url = 'https://www.courtlistener.com/';
  if (c.courtListenerDocketId) {
    url = `https://www.courtlistener.com/docket/${c.courtListenerDocketId}/`;
  } else if (entityName) {
    url = `https://www.courtlistener.com/?q=${encodeURIComponent('"' + entityName + '" ' + c.caseType)}&type=r`;
  } else {
    url = `https://www.courtlistener.com/?q=${encodeURIComponent(c.caseType)}&type=r`;
  }
  Linking.openURL(url).catch((err) => console.error('Error opening URL:', err));
}

export default function CaseTable({ cases, entityName }: CaseTableProps) {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    cases.forEach((c) => {
      if (c.caseType) set.add(c.caseType);
    });
    return Array.from(set).sort();
  }, [cases]);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (selectedType !== 'ALL' && c.caseType !== selectedType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = c.caseId.toLowerCase().includes(q);
        const matchType = c.caseType.toLowerCase().includes(q);
        const matchJuris = (c.jurisdiction || '').toLowerCase().includes(q);
        const matchOutcome = (c.outcome || '').toLowerCase().includes(q);
        if (!matchId && !matchType && !matchJuris && !matchOutcome) return false;
      }
      return true;
    });
  }, [cases, selectedType, searchQuery]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>CASE RECORD TABLE</Text>
        <Text style={styles.subtitle}>Tap card to view docket &bull; Tap ID for CourtListener</Text>
      </View>

      {/* Filter & Search Bar */}
      <View style={styles.controls}>
        {/* Quick Search */}
        <TextInput
          style={styles.searchInput}
          placeholder="Filter cases..."
          placeholderTextColor={colors.textSubtle}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Legal Domain Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.domainPills}>
          <TouchableOpacity
            style={[styles.pill, selectedType === 'ALL' && styles.pillActive]}
            onPress={() => setSelectedType('ALL')}
          >
            <Text style={[styles.pillText, selectedType === 'ALL' && styles.pillTextActive]}>
              All Domains ({cases.length})
            </Text>
          </TouchableOpacity>
          {availableTypes.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.pill, selectedType === t && styles.pillActive]}
              onPress={() => setSelectedType(t)}
            >
              <Text style={[styles.pillText, selectedType === t && styles.pillTextActive]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Cases List */}
      {filteredCases.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No case records found matching filter criteria.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filteredCases.map((c) => {
            const shortId = c.caseId.replace(/-/g, '').slice(0, 8);
            const outcomeColor = getOutcomeColor(c.outcome);

            return (
              <TouchableOpacity
                key={c.caseId}
                activeOpacity={0.75}
                style={styles.caseCard}
                onPress={() => navigation.navigate('CaseDetail', { id: c.caseId })}
              >
                <View style={styles.caseTop}>
                  <TouchableOpacity
                    style={styles.caseIdBadge}
                    onPress={() => openCaseLink(c, entityName)}
                  >
                    <Text style={styles.caseIdText}>{shortId} ↗</Text>
                  </TouchableOpacity>
                  <Text style={styles.caseJurisdiction}>{c.jurisdiction || 'scotus'}</Text>
                  <Text style={styles.caseDate}>{formatDate(c.filingDate)}</Text>
                </View>

                <Text style={styles.caseType}>{c.caseType}</Text>

                <View style={styles.outcomeRow}>
                  <Text style={styles.outcomeLabel}>DISPOSITION:</Text>
                  <Text style={[styles.outcomeValue, { color: outcomeColor }]}>
                    {formatOutcome(c.outcome)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Text style={styles.footerNote}>
        Data derived strictly from public records. Historical data only.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerRow: {
    marginBottom: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
  subtitle: {
    fontSize: 11,
    color: colors.textSubtle,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  controls: {
    marginVertical: 8,
    gap: 10,
  },
  searchInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.text,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  domainPills: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  pillActive: {
    borderColor: colors.brass,
    backgroundColor: colors.surface,
  },
  pillText: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  pillTextActive: {
    color: colors.brass,
    fontWeight: '700',
  },
  list: {
    gap: 10,
  },
  caseCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
  },
  caseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  caseIdBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  caseIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brass,
    fontFamily: 'monospace',
  },
  caseJurisdiction: {
    fontSize: 10,
    color: colors.textSubtle,
    textTransform: 'lowercase',
    fontFamily: 'monospace',
  },
  caseDate: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  caseType: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginVertical: 4,
  },
  outcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  outcomeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSubtle,
    fontFamily: 'monospace',
  },
  outcomeValue: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  footerNote: {
    fontSize: 10,
    color: colors.textSubtle,
    textAlign: 'center',
    marginTop: 14,
    fontFamily: 'monospace',
  },
});
