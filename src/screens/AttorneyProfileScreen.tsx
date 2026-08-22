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
import type { Attorney, ScoreResult, CaseSummary, CaseTypeBreakdown } from '../types';

export default function AttorneyProfileScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const id = route.params?.id;

  const [loading, setLoading] = useState(true);
  const [attorney, setAttorney] = useState<Attorney | null>(null);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [caseTypes, setCaseTypes] = useState<CaseTypeBreakdown[]>([]);
  const [selectedDecade, setSelectedDecade] = useState<DecadeKey>('ALL');

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);

    Promise.all([
      api.attorney(id).catch(() => null),
      api.attorneyScore(id).catch(() => ({
        entityId: id,
        entityType: 'ATTORNEY' as const,
        scoreType: 'API' as const,
        value: 0,
        confidence: 0,
        sampleSize: 0,
        disclaimer: 'Score pending sufficient verified trial and appellate filings',
      })),
      api.attorneyCases(id).catch(() => []),
      api.attorneyByCaseType(id).catch(() => []),
    ])
      .then(([a, s, c, ct]) => {
        if (mounted) {
          setAttorney(a);
          setScore(s);
          setCases(c);
          setCaseTypes(ct);
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

  const displayCaseTypes = useMemo(() => {
    if (caseTypes.length > 0) {
      return caseTypes.map((c) => ({
        caseType: c.caseType,
        count: (c as any).count ?? (c as any).caseCount ?? (c as any).sampleSize ?? 1,
      }));
    }
    const map = new Map<string, number>();
    cases.forEach((c) => {
      if (c.caseType) map.set(c.caseType, (map.get(c.caseType) || 0) + 1);
    });
    return Array.from(map.entries()).map(([caseType, count]) => ({ caseType, count }));
  }, [cases, caseTypes]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading Attorney Profile & Records...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!attorney) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <Header />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Attorney record not found.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>&larr; Return to Search</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const courtListenerSearchUrl = `https://www.courtlistener.com/?q=${encodeURIComponent(attorney.fullName)}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <Header />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Top Breadcrumb */}
        <TouchableOpacity style={styles.breadcrumb} onPress={() => navigation.goBack()}>
          <Text style={styles.breadcrumbBack}>&larr; Home</Text>
          <Text style={styles.breadcrumbDivider}>/</Text>
          <Text style={styles.breadcrumbText}>Attorneys</Text>
          <Text style={styles.breadcrumbDivider}>/</Text>
          <Text style={styles.breadcrumbCurrent} numberOfLines={1}>
            {attorney.fullName}
          </Text>
        </TouchableOpacity>

        {/* Header Profile Card */}
        <View style={styles.headerCard}>
          <View style={styles.badgeRow}>
            <View style={styles.counselBadge}>
              <Text style={styles.counselBadgeText}>LICENSED LEGAL COUNSEL</Text>
            </View>
            <View style={styles.barBadge}>
              <Text style={styles.barBadgeText}>
                {attorney.barNumber ? `BAR ID #${attorney.barNumber}` : 'VERIFIED BAR LICENSE'}
              </Text>
            </View>
          </View>

          <Text style={styles.name}>{attorney.fullName}</Text>
          <Text style={styles.firmSubtitle}>
            {attorney.firmName || 'Appellate & Defense Practice'} &middot; {attorney.jurisdiction ? attorney.jurisdiction.toUpperCase() : 'FEDERAL BAR'}
          </Text>

          {/* CourtListener Button */}
          <TouchableOpacity
            style={styles.courtListenerBtn}
            onPress={() => Linking.openURL(courtListenerSearchUrl)}
          >
            <Text style={styles.courtListenerBtnText}>View CourtListener Filings &rsaquo;</Text>
          </TouchableOpacity>

          {/* Official Bar Admission & License Details (3 Cards) */}
          <View style={styles.admissionGrid}>
            <View style={styles.admissionCard}>
              <Text style={styles.admissionLabel}>BAR ADMISSION DATE</Text>
              <Text style={styles.admissionValue}>{attorney.barAdmissionDate || 'Admitted to Bar'}</Text>
              <Text style={styles.admissionSub}>Official State & Federal Bar Entry</Text>
            </View>

            <View style={styles.admissionCard}>
              <Text style={styles.admissionLabel}>LICENSING JURISDICTION</Text>
              <Text style={styles.admissionValue}>
                {attorney.admissionJurisdiction || attorney.jurisdiction || 'District of Columbia & Federal Bar'}
              </Text>
              <Text style={styles.admissionSub}>State Supreme Court & Federal Circuit</Text>
            </View>

            <View style={styles.admissionCard}>
              <Text style={styles.admissionLabel}>STANDING & FIRM ASSOCIATION</Text>
              <Text style={styles.admissionValue}>{attorney.firmName || 'Active Appellate Practitioner'}</Text>
              <Text style={styles.admissionSub}>In Good Standing</Text>
            </View>
          </View>
        </View>

        {/* API Deviation Bar Card */}
        <DeviationBar score={score} scoreTypeLabel="ATTORNEY PERFORMANCE INDEX" />

        {/* Case Breakdown Grid */}
        <View style={styles.breakdownSection}>
          <Text style={styles.sectionHeader}>CASE BREAKDOWN BY PRACTICE SPECIALTY</Text>
          <View style={styles.breakdownGrid}>
            {displayCaseTypes.map((item) => (
              <View key={item.caseType} style={styles.breakdownCard}>
                <Text style={styles.breakdownType} numberOfLines={1}>{item.caseType}</Text>
                <Text style={styles.breakdownCount}>{item.count}</Text>
                <Text style={styles.breakdownUnit}>cases</Text>
              </View>
            ))}
            {displayCaseTypes.length === 0 && (
              <Text style={styles.emptyBreakdownText}>No practice breakdown available.</Text>
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
        <CaseTable cases={decadeFilteredCases} entityName={attorney.fullName} />
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
  counselBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  counselBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    fontFamily: 'monospace',
  },
  barBadge: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  barBadgeText: {
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
  firmSubtitle: {
    fontSize: 11.5,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  courtListenerBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  courtListenerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
    fontFamily: 'monospace',
  },
  admissionGrid: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  admissionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
  },
  admissionLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#38BDF8',
    fontFamily: 'monospace',
    marginBottom: 3,
  },
  admissionValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  admissionSub: {
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
  emptyBreakdownText: {
    fontSize: 11,
    color: colors.textSubtle,
    fontFamily: 'monospace',
  },
});
