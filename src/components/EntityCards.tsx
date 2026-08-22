import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors } from '../theme/colors';
import { api } from '../services/api';
import type { CoverageStatsData } from '../types';

interface EntityCardsProps {
  onSelectCategory?: (category: 'judges' | 'attorneys' | 'prosecutors' | 'legislators' | 'cases' | 'courts') => void;
}

export default function EntityCards({ onSelectCategory }: EntityCardsProps) {
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<CoverageStatsData | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .getCoverageStats()
      .then((data) => {
        if (mounted && data) {
          setStats(data);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const handleSelect = (category: string) => {
    if (onSelectCategory) {
      onSelectCategory(category as any);
    } else {
      navigation.navigate('SearchResults', { initialCategory: category });
    }
  };

  // Quick 5-Entity Shortcuts matching Website Grid
  const quickEntities = [
    {
      id: 'judges',
      label: 'JUDGES',
      icon: (
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={7} r={3.2} stroke="#3B82F6" strokeWidth={1.8} />
          <Path d="M6.5 15a5.5 5.5 0 0 1 11 0" stroke="#3B82F6" strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M4 16.5h16" stroke="#3B82F6" strokeWidth={1.8} />
          <Path d="M5.5 16.5L3.5 20.5h17l-2-4" stroke="#3B82F6" strokeWidth={1.8} strokeLinejoin="round" />
          <Path d="M2 21h20" stroke="#3B82F6" strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      ),
    },
    {
      id: 'attorneys',
      label: 'LAWYERS',
      icon: (
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
          <Rect x={4} y={7} width={16} height={13} rx={2} stroke="#3B82F6" strokeWidth={1.8} />
          <Path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="#3B82F6" strokeWidth={1.8} />
          <Path d="M12 11v4M4 12h16" stroke="#3B82F6" strokeWidth={1.5} />
        </Svg>
      ),
    },
    {
      id: 'prosecutors',
      label: 'PROSECUTORS',
      icon: (
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
          <Path d="M12 3v18M6 8l6-5 6 5M6 8a4 4 0 0 0 0 8M18 8a4 4 0 0 1 0 8" stroke="#3B82F6" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      ),
    },
    {
      id: 'courts',
      label: 'COURTS',
      icon: (
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
          <Path d="M3 21h18M4 18h16M12 2l8 6H4l8-6z" stroke="#3B82F6" strokeWidth={1.8} />
          <Path d="M6 8v10M10 8v10M14 8v10M18 8v10" stroke="#3B82F6" strokeWidth={1.8} />
        </Svg>
      ),
    },
    {
      id: 'cases',
      label: 'CASES',
      icon: (
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
          <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#3B82F6" strokeWidth={1.8} />
          <Path d="M22 6l-10 7L2 6" stroke="#3B82F6" strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      ),
    },
  ];

  const directoryCards = [
    {
      id: 'judges',
      title: 'Judges & Justices',
      subtitle: 'Benchmark Judicial Index (BJI)',
      desc: 'Track judicial rulings, tenure trends, and deviation scores.',
      count: stats?.activeBenchJurists || '12,450+ Indexed',
      color: '#4FD675',
      icon: (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={6} r={3.2} stroke="#4FD675" strokeWidth={1.8} />
          <Path d="M7 11.5c0-1.5 2.2-2.5 5-2.5s5 1 5 2.5v2H7v-2z" fill="#4FD675" fillOpacity={0.2} stroke="#4FD675" strokeWidth={1.5} />
          <Rect x={3} y={15} width={18} height={4} rx={1} stroke="#4FD675" strokeWidth={1.8} />
          <Path d="M9 19v2.5M15 19v2.5M6 22h12" stroke="#4FD675" strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      ),
    },
    {
      id: 'attorneys',
      title: 'Trial & Appellate Attorneys',
      subtitle: 'Attorney Performance Index (API)',
      desc: 'Win rates, settlement ratios, and co-counsel metrics.',
      count: stats?.attorneysAnalyzed || '98,300+ Active',
      color: '#4D7CFE',
      icon: (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Rect x={4} y={7} width={16} height={13} rx={2} stroke="#4D7CFE" strokeWidth={1.8} />
          <Path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="#4D7CFE" strokeWidth={1.8} />
          <Path d="M12 11v4M4 12h16" stroke="#4D7CFE" strokeWidth={1.5} />
        </Svg>
      ),
    },
    {
      id: 'prosecutors',
      title: 'Public Prosecutors & DAs',
      subtitle: 'Prosecutorial Disposition Index (PDI)',
      desc: 'Plea bargains, conviction rates, and public accountability.',
      count: stats?.prosecutorsTracked || '2,850+ Profiled',
      color: '#A855F7',
      icon: (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#A855F7" strokeWidth={1.8} />
          <Path d="M9 12l2 2 4-4" stroke="#A855F7" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      ),
    },
    {
      id: 'cases',
      title: 'Audited Cases & Dockets',
      subtitle: 'CourtListener Public Verification',
      desc: 'Federal and State appellate rulings, dockets, and trial filings.',
      count: stats?.casesAnalyzed || '185,000+ Dockets',
      color: '#38BDF8',
      icon: (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#38BDF8" strokeWidth={1.8} />
          <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#38BDF8" strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      ),
    },
    {
      id: 'legislators',
      title: 'Members of Congress',
      subtitle: 'Legislative Voting Index (LVI)',
      desc: 'Roll call records, bipartisan alignment, and bill sponsorship.',
      count: '535 Tracked',
      color: '#FBBF24',
      icon: (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path d="M3 21h18M4 18h16M12 2l8 6H4l8-6z" stroke="#FBBF24" strokeWidth={1.8} />
          <Path d="M6 8v10M10 8v10M14 8v10M18 8v10" stroke="#FBBF24" strokeWidth={1.8} />
        </Svg>
      ),
    },
  ];

  return (
    <View style={styles.container}>
      {/* 1. Quick 5 Shortcuts Row */}
      <View style={styles.quickRow}>
        {quickEntities.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.quickCard}
            activeOpacity={0.7}
            onPress={() => handleSelect(item.id)}
          >
            <View style={styles.quickIconBox}>{item.icon}</View>
            <Text style={styles.quickLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 2. Detailed Legal Directories List */}
      <Text style={styles.sectionHeader}>EXPLORE LEGAL DIRECTORIES</Text>
      <View style={styles.list}>
        {directoryCards.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => handleSelect(c.id)}
          >
            <View style={styles.cardTop}>
              <View style={styles.iconContainer}>{c.icon}</View>
              <View style={styles.badge}>
                <Text style={[styles.badgeText, { color: c.color }]}>{c.count}</Text>
              </View>
            </View>
            <Text style={styles.title}>{c.title}</Text>
            <Text style={[styles.subtitle, { color: c.color }]}>{c.subtitle}</Text>
            <Text style={styles.desc}>{c.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 6,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#070F1E',
    borderWidth: 1,
    borderColor: '#172338',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIconBox: {
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#F5F7FA',
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: '#070F1E',
    borderWidth: 1,
    borderColor: '#172338',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  desc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
