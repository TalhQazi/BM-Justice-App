import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { api } from '../services/api';
import type { CoverageStatsData } from '../types';

export default function CoverageCounters() {
  const [stats, setStats] = useState<CoverageStatsData>({
    casesAnalyzed: '0',
    activeBenchJurists: '0',
    attorneysAnalyzed: '0',
    prosecutorsTracked: '0',
    courtsCovered: '0',
    judicialDataPoints: '0',
  });

  useEffect(() => {
    let mounted = true;
    api
      .getCoverageStats()
      .then((data) => {
        if (mounted && data) {
          setStats({
            casesAnalyzed:
              data.casesAnalyzed ||
              (data.casesCount ? `${data.casesCount.toLocaleString()}+` : '0'),
            activeBenchJurists:
              data.activeBenchJurists ||
              (data.judgesCount ? `${data.judgesCount.toLocaleString()}+` : '0'),
            attorneysAnalyzed:
              data.attorneysAnalyzed ||
              (data.attorneysCount ? `${data.attorneysCount.toLocaleString()}+` : '0'),
            prosecutorsTracked:
              data.prosecutorsTracked ||
              (data.prosecutorsCount ? `${data.prosecutorsCount.toLocaleString()}+` : '0'),
            courtsCovered: data.courtsCovered || (data.courtsCount ? `${data.courtsCount.toLocaleString()}+` : '0'),
            judicialDataPoints: data.judicialDataPoints || (data.dataPoints ? `${data.dataPoints.toLocaleString()}+` : '0'),
          });
        }
      })
      .catch(() => {
        if (mounted) {
          setStats({
            casesAnalyzed: '0',
            activeBenchJurists: '0',
            attorneysAnalyzed: '0',
            prosecutorsTracked: '0',
            courtsCovered: '0',
            judicialDataPoints: '0',
          });
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const items = [
    {
      value: stats.casesAnalyzed || '0',
      label: 'CASES ANALYZED',
      color: '#4D7CFE', // Sapphire Blue
    },
    {
      value: stats.activeBenchJurists || '0',
      label: 'ACTIVE BENCH JURISTS',
      color: '#4FD675', // Emerald Green
    },
    {
      value: stats.attorneysAnalyzed || '0',
      label: 'ATTORNEYS ANALYZED',
      color: '#38BDF8', // Sky Blue
    },
    {
      value: stats.prosecutorsTracked || '0',
      label: 'PROSECUTORS TRACKED',
      color: '#A855F7', // Neon Purple
    },
    {
      value: stats.courtsCovered || '0',
      label: 'COURTS COVERED',
      color: '#FBBF24', // Amber Gold
    },
    {
      value: stats.judicialDataPoints || '0',
      label: 'JUDICIAL DATA POINTS',
      color: '#22D3EE', // Cyan
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {items.map((stat, idx) => (
          <View key={stat.label || idx} style={styles.card}>
            <Text style={[styles.value, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.label}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    backgroundColor: '#070F1E',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    width: '48.5%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  label: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#8E9AA8',
    fontFamily: 'monospace',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
});
