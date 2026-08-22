import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Polyline } from 'react-native-svg';
import { colors } from '../theme/colors';
import { api } from '../services/api';
import type { LiveIntelligenceData } from '../types';

export default function LiveIntelligencePanel() {
  const navigation = useNavigation<any>();
  const [data, setData] = useState<LiveIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .getRecentIntelligence()
      .then((res) => {
        if (mounted && res && (res.recentDecision || res.trendingJudge || res.attorneyPerformance)) {
          setData(res);
        } else if (mounted) {
          setData(null);
        }
      })
      .catch(() => {
        if (mounted) setData(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const decision = data?.recentDecision;
  const judge = data?.trendingJudge;
  const attorney = data?.attorneyPerformance;

  const handleDecisionPress = () => {
    if (decision?.caseId) {
      navigation.navigate('CaseDetail', { id: decision.caseId });
    } else {
      navigation.navigate('SearchResults', { initialCategory: 'cases' });
    }
  };

  const handleJudgePress = () => {
    if (judge?.id) {
      navigation.navigate('JudgeProfile', { id: judge.id });
    } else {
      navigation.navigate('SearchResults', { initialCategory: 'judges' });
    }
  };

  const handleAttorneyPress = () => {
    if (attorney?.id) {
      navigation.navigate('AttorneyProfile', { id: attorney.id });
    } else {
      navigation.navigate('SearchResults', { initialCategory: 'attorneys' });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.pulseWrapper}>
            <View style={styles.pulseDot} />
          </View>
          <Text style={styles.title}>LIVE JUSTICE INTELLIGENCE</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.viewAllBtn}
          onPress={() => navigation.navigate('Activity')}
        >
          <Text style={styles.viewAllText}>View All &rsaquo;</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.emptyCard}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.emptyText}>Streaming live judicial intelligence...</Text>
        </View>
      ) : !data ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>NO LIVE TELEMETRY</Text>
          <Text style={styles.emptyText}>Real-time feed will populate automatically when backend streams data.</Text>
        </View>
      ) : (
        <View style={styles.cardsContainer}>
          {/* 1. Recently Analyzed Decision */}
          {decision && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.subCard}
              onPress={handleDecisionPress}
            >
              <Text style={styles.categoryLabelBlue}>RECENTLY ANALYZED DECISIONS</Text>
              <View style={styles.cardContentRow}>
                <View style={styles.iconBoxBlue}>
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                      stroke="#4D7CFE"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Polyline
                      points="14 2 14 8 20 8"
                      stroke="#4D7CFE"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M16 13H8M16 17H8M10 9H8"
                      stroke="#4D7CFE"
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>

                <View style={styles.textContainer}>
                  <Text style={styles.cardMainTitle}>{decision.title}</Text>
                  <Text style={styles.courtName}>{decision.court}</Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.deviationText}>
                      Sentencing / Review deviation:{' '}
                      <Text style={styles.deviationValueGreen}>{decision.deviation}</Text>
                    </Text>
                    <Text style={styles.timeAgo}>{decision.timeAgo}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* 2. Trending Judge */}
          {judge && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.subCard}
              onPress={handleJudgePress}
            >
              <Text style={styles.categoryLabelGreen}>TRENDING JUDGE</Text>
              <View style={styles.cardContentRow}>
                <View style={styles.iconBoxGreen}>
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 3l9 7H3l9-7z"
                      stroke="#4FD675"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>

                <View style={styles.textContainer}>
                  <View style={styles.judgeTitleRow}>
                    <Text style={styles.cardMainTitle}>{judge.name}</Text>
                    <Svg width={60} height={24} viewBox="0 0 60 24">
                      <Path
                        d="M 0,20 Q 20,18 35,8 T 60,4"
                        fill="none"
                        stroke="#4FD675"
                        strokeWidth={2}
                        strokeLinecap="round"
                      />
                      <Circle cx={60} cy={4} r={3} fill="#4FD675" />
                    </Svg>
                  </View>
                  <Text style={styles.courtName}>{judge.court}</Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.analyzedText}>
                      {judge.casesAnalyzed ? `${judge.casesAnalyzed.toLocaleString()} analyzed matters` : 'Audited judicial record'}
                    </Text>
                    <Text style={styles.scoreText}>
                      Benchmark Justice Score:{' '}
                      <Text style={styles.scoreValueGreen}>{judge.score}</Text>
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* 3. Attorney Performance */}
          {attorney && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.subCard}
              onPress={handleAttorneyPress}
            >
              <Text style={styles.categoryLabelBlue}>ATTORNEY PERFORMANCE</Text>
              <View style={styles.cardContentRow}>
                <View style={styles.iconBoxBlue}>
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M20 7h-4V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"
                      stroke="#4D7CFE"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path d="M8 7V4h8v3" stroke="#4D7CFE" strokeWidth={2} />
                  </Svg>
                </View>

                <View style={styles.textContainer}>
                  <Text style={styles.cardMainTitle}>{attorney.name}</Text>
                  <Text style={styles.courtName}>
                    {attorney.firm || attorney.jurisdiction || 'Appellate & Defense Counsel'}
                  </Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.analyzedText}>
                      {attorney.casesAnalyzed ? `${attorney.casesAnalyzed} analyzed cases` : 'Verified legal filings'}
                    </Text>
                    <Text style={styles.favorableText}>
                      Favorable Outcome Rate:{' '}
                      <Text style={styles.favorableValueGreen}>{attorney.favorableRate}</Text>
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#070F1E',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    marginVertical: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  pulseWrapper: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(79, 214, 117, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4FD675',
  },
  title: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#F5F7FA',
    letterSpacing: 1.2,
    fontFamily: 'monospace',
    flexShrink: 1,
  },
  viewAllBtn: {
    backgroundColor: 'rgba(77, 124, 254, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(77, 124, 254, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    alignSelf: 'center',
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4D7CFE',
    fontFamily: 'monospace',
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050B14',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  emptyTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E9AA8',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginTop: 6,
  },
  cardsContainer: {
    gap: 12,
  },
  subCard: {
    backgroundColor: '#050B14',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
  },
  categoryLabelBlue: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#4D7CFE',
    letterSpacing: 1,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  categoryLabelGreen: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#4FD675',
    letterSpacing: 1,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBoxBlue: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(77, 124, 254, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(77, 124, 254, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  iconBoxGreen: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(79, 214, 117, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(79, 214, 117, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  cardMainTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F5F7FA',
    marginBottom: 2,
  },
  judgeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  courtName: {
    fontSize: 11.5,
    color: '#8E9AA8',
    marginBottom: 8,
  },
  metaRow: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  deviationText: {
    fontSize: 11,
    color: '#8E9AA8',
    fontFamily: 'monospace',
  },
  deviationValueGreen: {
    color: '#4FD675',
    fontWeight: '700',
  },
  timeAgo: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'monospace',
  },
  analyzedText: {
    fontSize: 11,
    color: '#8E9AA8',
    fontFamily: 'monospace',
  },
  scoreText: {
    fontSize: 11,
    color: '#8E9AA8',
    fontFamily: 'monospace',
  },
  scoreValueGreen: {
    color: '#4FD675',
    fontWeight: '700',
  },
  favorableText: {
    fontSize: 11,
    color: '#8E9AA8',
    fontFamily: 'monospace',
  },
  favorableValueGreen: {
    color: '#4FD675',
    fontWeight: '700',
  },
});
