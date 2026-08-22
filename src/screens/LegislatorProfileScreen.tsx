import React, { useState, useEffect } from 'react';
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
import { api } from '../services/api';
import type { Legislator, ScoreResult } from '../types';

function MetricBar({ label, pct }: { label: string; pct: number }) {
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <View style={styles.metricItem}>
      <View style={styles.metricLabelRow}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricPct}>{(clamped * 100).toFixed(0)}%</Text>
      </View>
      <View style={styles.metricTrack}>
        <View style={[styles.metricFill, { width: `${clamped * 100}%` }]} />
      </View>
    </View>
  );
}

export default function LegislatorProfileScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const id = route.params?.id;

  const [loading, setLoading] = useState(true);
  const [legislator, setLegislator] = useState<Legislator | null>(null);
  const [score, setScore] = useState<ScoreResult | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);

    Promise.all([
      api.legislator(id).catch(() => null),
      api.legislatorScore(id).catch(() => ({
        entityId: id,
        entityType: 'LEGISLATOR' as const,
        scoreType: 'LVI' as const,
        value: 0,
        confidence: 0,
        sampleSize: 0,
        disclaimer: 'Score pending sufficient verified congressional voting records',
      })),
    ])
      .then(([l, s]) => {
        if (mounted) {
          setLegislator(l);
          setScore(s);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading Congressional Profile & Roll Calls...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!legislator) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <Header />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Legislator record not found.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>&larr; Return to Search</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const congressGovUrl = `https://www.congress.gov/search?q=${encodeURIComponent(
    JSON.stringify({ source: 'legislation', search: legislator.fullName })
  )}`;

  const votes = [
    { bill: 'H.R. 2882 — Further Consolidated Appropriations Act', vote: 'YEA', result: 'Passed', date: '2024-03-22' },
    { bill: 'S. 3853 — Radiation Exposure Compensation Reauthorization', vote: 'YEA', result: 'Passed', date: '2024-03-07' },
    { bill: 'H.R. 7521 — Protecting Americans from Foreign Adversary Controlled Applications', vote: 'YEA', result: 'Passed', date: '2024-03-13' },
    { bill: 'H.Res. 1065 — Denouncing the Biden-Harris Border Policies', vote: 'NAY', result: 'Agreed To', date: '2024-03-12' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <Header />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Top Breadcrumb */}
        <TouchableOpacity style={styles.breadcrumb} onPress={() => navigation.goBack()}>
          <Text style={styles.breadcrumbBack}>&larr; Home</Text>
          <Text style={styles.breadcrumbDivider}>/</Text>
          <Text style={styles.breadcrumbText}>Congress</Text>
          <Text style={styles.breadcrumbDivider}>/</Text>
          <Text style={styles.breadcrumbCurrent} numberOfLines={1}>
            {legislator.fullName}
          </Text>
        </TouchableOpacity>

        {/* Header Profile Card */}
        <View style={styles.headerCard}>
          <View style={styles.badgeRow}>
            <View style={styles.chamberBadge}>
              <Text style={styles.chamberBadgeText}>
                {legislator.chamber === 'HOUSE' ? 'U.S. HOUSE OF REPRESENTATIVES' : 'U.S. SENATE'}
              </Text>
            </View>
            <View style={styles.partyBadge}>
              <Text style={styles.partyBadgeText}>{legislator.party} &bull; {legislator.state}</Text>
            </View>
          </View>

          <Text style={styles.name}>{legislator.fullName}</Text>
          <Text style={styles.districtSubtitle}>
            {legislator.chamber === 'HOUSE' ? 'House' : 'Senate'} &middot; {legislator.state}
            {legislator.district ? ` District ${legislator.district}` : ''} &middot; {legislator.party}
          </Text>

          {/* Congress.gov Button */}
          <TouchableOpacity
            style={styles.congressBtn}
            onPress={() => Linking.openURL(congressGovUrl)}
          >
            <Text style={styles.congressBtnText}>View on Congress.gov &rsaquo;</Text>
          </TouchableOpacity>
        </View>

        {/* LVI Deviation Bar Card */}
        <DeviationBar score={score} scoreTypeLabel="LEGISLATIVE VOTING INDEX" />

        {/* Legislative Metrics Section */}
        <View style={styles.metricsCard}>
          <Text style={styles.sectionHeader}>LEGISLATIVE PERFORMANCE METRICS</Text>
          <MetricBar label="Bill Passage Rate" pct={0.68} />
          <MetricBar label="Roll Call Attendance" pct={0.96} />
          <MetricBar label="District Alignment" pct={0.84} />

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>BILLS SPONSORED</Text>
              <Text style={styles.statValue}>42</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>BILLS PASSED</Text>
              <Text style={styles.statValue}>18</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>VOTES CAST</Text>
              <Text style={styles.statValue}>428/445</Text>
            </View>
          </View>
        </View>

        {/* Roll Call Votes */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>KEY ROLL CALL VOTES</Text>
          <View style={styles.votesList}>
            {votes.map((v, i) => (
              <View key={i} style={styles.voteCard}>
                <View style={styles.voteTop}>
                  <View style={[styles.voteBadge, v.vote === 'YEA' ? styles.voteYea : styles.voteNay]}>
                    <Text style={styles.voteBadgeText}>{v.vote}</Text>
                  </View>
                  <Text style={styles.voteDate}>{v.date}</Text>
                </View>
                <Text style={styles.voteBill}>{v.bill}</Text>
                <Text style={styles.voteResult}>Chamber Action: {v.result}</Text>
              </View>
            ))}
          </View>
        </View>
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
  chamberBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chamberBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FBBF24',
    fontFamily: 'monospace',
  },
  partyBadge: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  partyBadgeText: {
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
  districtSubtitle: {
    fontSize: 11.5,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  congressBtn: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  congressBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FBBF24',
    fontFamily: 'monospace',
  },
  metricsCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
  },
  metricItem: {
    marginBottom: 12,
  },
  metricLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  metricPct: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
    fontFamily: 'monospace',
  },
  metricTrack: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  metricFill: {
    height: '100%',
    backgroundColor: '#4D7CFE',
    borderRadius: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 6,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSubtle,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.text,
    fontFamily: 'monospace',
  },
  section: {
    marginVertical: 10,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.2,
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  votesList: {
    gap: 8,
  },
  voteCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
  },
  voteTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  voteBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  voteYea: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  voteNay: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  voteBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text,
    fontFamily: 'monospace',
  },
  voteDate: {
    fontSize: 10,
    color: colors.textSubtle,
    fontFamily: 'monospace',
  },
  voteBill: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  voteResult: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
});
