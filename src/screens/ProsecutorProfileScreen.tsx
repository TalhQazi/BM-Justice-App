import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import Header from '../components/Header';
import DeviationBar from '../components/DeviationBar';
import TrendGraph from '../components/TrendGraph';
import DecadeTimelineTabs, { DecadeKey } from '../components/DecadeTimelineTabs';
import CaseTable from '../components/CaseTable';
import { api } from '../services/api';
import type { Prosecutor, ScoreResult, CaseSummary } from '../types';

export default function ProsecutorProfileScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const id = route.params?.id;

  const [loading, setLoading] = useState(true);
  const [prosecutor, setProsecutor] = useState<Prosecutor | null>(null);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selectedDecade, setSelectedDecade] = useState<DecadeKey>('ALL');

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);

    Promise.all([
      api.prosecutor(id).catch(() => null),
      api.prosecutorScore(id).catch(() => ({
        entityId: id,
        entityType: 'PROSECUTOR' as const,
        scoreType: 'PDI' as const,
        value: 0,
        confidence: 0,
        sampleSize: 0,
        disclaimer: 'Score pending sufficient verified prosecutorial filings',
      })),
      api.prosecutorCases(id).catch(() => []),
    ])
      .then(([p, s, c]) => {
        if (mounted) {
          setProsecutor(p);
          setScore(s);
          setCases(c);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  // Compute career bounds
  const years = useMemo(() => {
    return cases
      .map((c) => new Date(c.filingDate).getFullYear())
      .filter((y) => !isNaN(y))
      .sort((a, b) => a - b);
  }, [cases]);

  const earliestYear = years.length > 0 ? years[0] : 2010;
  const latestYear = years.length > 0 ? years[years.length - 1] : 2026;

  // Decade Counts
  // Decade Counts across 1965 to 2026
  const decadeCounts = useMemo(() => {
    const counts = {
      ALL: cases.length,
      '2020s': 0,
      '2010s': 0,
      '2000s': 0,
      '1990s': 0,
      '1980s': 0,
      '1970s': 0,
      '1960s': 0,
    };
    for (const c of cases) {
      const year = new Date(c.filingDate).getFullYear();
      if (year >= 2020) counts['2020s']++;
      else if (year >= 2010) counts['2010s']++;
      else if (year >= 2000) counts['2000s']++;
      else if (year >= 1990) counts['1990s']++;
      else if (year >= 1980) counts['1980s']++;
      else if (year >= 1970) counts['1970s']++;
      else if (year >= 1960) counts['1960s']++;
    }
    return counts;
  }, [cases]);

  // Decade Filtered Cases
  const decadeFilteredCases = useMemo(() => {
    if (selectedDecade === 'ALL') return cases;
    return cases.filter((c) => {
      const year = new Date(c.filingDate).getFullYear();
      if (selectedDecade === '2020s') return year >= 2020 && year <= 2026;
      if (selectedDecade === '2010s') return year >= 2010 && year <= 2019;
      if (selectedDecade === '2000s') return year >= 2000 && year <= 2009;
      if (selectedDecade === '1990s') return year >= 1990 && year <= 1999;
      if (selectedDecade === '1980s') return year >= 1980 && year <= 1989;
      if (selectedDecade === '1970s') return year >= 1970 && year <= 1979;
      if (selectedDecade === '1960s') return year >= 1960 && year <= 1969;
      return true;
    });
  }, [cases, selectedDecade]);

  const allTabs: { key: DecadeKey; label: string; count: number; minYear: number; maxYear: number }[] = [
    { key: 'ALL', label: `All (${earliestYear}–${latestYear})`, count: decadeCounts.ALL, minYear: earliestYear, maxYear: latestYear },
    { key: '2020s', label: '2020–2026', count: decadeCounts['2020s'], minYear: 2020, maxYear: 2026 },
    { key: '2010s', label: '2010–2019', count: decadeCounts['2010s'], minYear: 2010, maxYear: 2019 },
    { key: '2000s', label: '2000–2009', count: decadeCounts['2000s'], minYear: 2000, maxYear: 2009 },
    { key: '1990s', label: '1990–1999', count: decadeCounts['1990s'], minYear: 1990, maxYear: 1999 },
    { key: '1980s', label: '1980–1989', count: decadeCounts['1980s'], minYear: 1980, maxYear: 1989 },
    { key: '1970s', label: '1970–1979', count: decadeCounts['1970s'], minYear: 1970, maxYear: 1979 },
    { key: '1960s', label: '1965–1969', count: decadeCounts['1960s'], minYear: 1960, maxYear: 1969 },
  ];

  const decadeTabs = allTabs.filter((tab) => {
    if (tab.key === 'ALL') return true;
    if (tab.count > 0) return true;
    return tab.maxYear >= earliestYear && tab.minYear <= latestYear;
  });

  const outcomeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of cases) {
      const key = c.outcome ?? 'PENDING';
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [cases]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading Prosecutor Profile & Records...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!prosecutor) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <Header />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Prosecutor record not found.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>&larr; Return to Search</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const courtListenerSearchUrl = `https://www.courtlistener.com/?q=${encodeURIComponent(prosecutor.fullName)}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <Header />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Top Breadcrumb */}
        <TouchableOpacity style={styles.breadcrumb} onPress={() => navigation.goBack()}>
          <Text style={styles.breadcrumbBack}>&larr; Home</Text>
          <Text style={styles.breadcrumbDivider}>/</Text>
          <Text style={styles.breadcrumbText}>Prosecution</Text>
          <Text style={styles.breadcrumbDivider}>/</Text>
          <Text style={styles.breadcrumbCurrent} numberOfLines={1}>
            {prosecutor.fullName}
          </Text>
        </TouchableOpacity>

        {/* Header Profile Card */}
        <View style={styles.headerCard}>
          <View style={styles.badgeRow}>
            <View style={styles.prosecutorBadge}>
              <Text style={styles.prosecutorBadgeText}>EXECUTIVE / STATE PROSECUTOR</Text>
            </View>
            <View style={styles.officeBadge}>
              <Text style={styles.officeBadgeText}>{prosecutor.office}</Text>
            </View>
          </View>

          <Text style={styles.name}>{prosecutor.fullName}</Text>
          <Text style={styles.officeSubtitle}>
            {prosecutor.office} &middot; {prosecutor.jurisdiction ? prosecutor.jurisdiction.toUpperCase() : 'US-FEDERAL'}
          </Text>

          {/* CourtListener Button */}
          <TouchableOpacity
            style={styles.courtListenerBtn}
            onPress={() => Linking.openURL(courtListenerSearchUrl)}
          >
            <Text style={styles.courtListenerBtnText}>View CourtListener Filings &rsaquo;</Text>
          </TouchableOpacity>

          {/* Official Appointment & Commission Bar (3 Cards) */}
          <View style={styles.commissionGrid}>
            <View style={styles.commissionCard}>
              <Text style={styles.commissionLabel}>APPOINTMENT / SWORN-IN DATE</Text>
              <Text style={styles.commissionValue}>{prosecutor.appointedDate || 'Prosecutorial Commission'}</Text>
              <Text style={styles.commissionSub}>Official Oath of Office</Text>
            </View>

            <View style={styles.commissionCard}>
              <Text style={styles.commissionLabel}>APPOINTING AUTHORITY</Text>
              <Text style={styles.commissionValue}>
                {prosecutor.appointingAuthority || 'Department of Justice / Executive Commission'}
              </Text>
              <Text style={styles.commissionSub}>Executive Appointment</Text>
            </View>

            <View style={styles.commissionCard}>
              <Text style={styles.commissionLabel}>PROSECUTORIAL JURISDICTION</Text>
              <Text style={styles.commissionValue}>{prosecutor.office || 'Public Prosecution Office'}</Text>
              <Text style={styles.commissionSub}>Enforcement Authority</Text>
            </View>
          </View>
        </View>

        {/* PDI Deviation Bar Card */}
        <DeviationBar score={score} scoreTypeLabel="PROSECUTORIAL DISPOSITION INDEX · PDI" />

        {/* Case Outcomes Breakdown Grid */}
        <View style={styles.breakdownSection}>
          <Text style={styles.sectionHeader}>CASE OUTCOMES BREAKDOWN</Text>
          <View style={styles.breakdownGrid}>
            {Object.entries(outcomeCounts).map(([outcome, count]) => (
              <View key={outcome} style={styles.breakdownCard}>
                <Text style={styles.breakdownType} numberOfLines={1}>{outcome.replace(/_/g, ' ')}</Text>
                <Text style={styles.breakdownCount}>{count}</Text>
                <Text style={styles.breakdownUnit}>matters</Text>
              </View>
            ))}
            {Object.keys(outcomeCounts).length === 0 && (
              <Text style={styles.emptyBreakdownText}>No outcome breakdown available.</Text>
            )}
          </View>
        </View>

        {/* Synchronized Historical Trend Graph */}
        <TrendGraph cases={decadeFilteredCases} />

        {/* Dynamic Decade Timeline Tabs */}
        <DecadeTimelineTabs
          selectedDecade={selectedDecade}
          onSelectDecade={setSelectedDecade}
          decadeTabs={decadeTabs}
        />

        {/* Case Record Table */}
        <CaseTable cases={decadeFilteredCases} entityName={prosecutor.fullName} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    color: colors.primary,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  breadcrumbBack: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'monospace',
  },
  breadcrumbDivider: {
    fontSize: 12,
    color: colors.textSubtle,
    fontFamily: 'monospace',
  },
  breadcrumbText: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  breadcrumbCurrent: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'monospace',
    maxWidth: 160,
  },
  headerCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  prosecutorBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  prosecutorBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A855F7',
    fontFamily: 'monospace',
  },
  officeBadge: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  officeBadgeText: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    lineHeight: 30,
    marginBottom: 4,
  },
  officeSubtitle: {
    fontSize: 11.5,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  courtListenerBtn: {
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  courtListenerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A855F7',
    fontFamily: 'monospace',
  },
  commissionGrid: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  commissionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
  },
  commissionLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#A855F7',
    fontFamily: 'monospace',
    marginBottom: 3,
  },
  commissionValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  commissionSub: {
    fontSize: 9.5,
    color: colors.textSubtle,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  breakdownSection: {
    marginVertical: 12,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.2,
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  breakdownCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    width: '48%',
  },
  breakdownType: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  breakdownCount: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },
  breakdownUnit: {
    fontSize: 10,
    color: colors.textSubtle,
    fontFamily: 'monospace',
  },
});
