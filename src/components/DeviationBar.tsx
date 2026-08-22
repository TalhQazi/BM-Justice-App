import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ScoreResult } from '../types';

const SCORE_LABELS: Record<string, string> = {
  API: 'BENCHMARK ATTORNEY INDEX · API',
  BJI: 'BENCHMARK JUDICIAL INDEX · BJI',
  PDI: 'PROSECUTORIAL DISPOSITION INDEX · PDI',
  LII: 'LEGISLATIVE INTEGRITY INDEX · LII',
  LVI: 'LEGISLATIVE INTEGRITY INDEX · LVI',
};

const TICKS = [-3, -1.5, 0, 1.5, 3];

interface DeviationBarProps {
  score?: ScoreResult | null;
  scoreTypeLabel?: string;
}

export default function DeviationBar({ score, scoreTypeLabel }: DeviationBarProps) {
  const rawVal =
    typeof score?.value === 'number' && !isNaN(score.value)
      ? score.value
      : typeof (score as any)?.score === 'number' && !isNaN((score as any).score)
        ? (score as any).score
        : 0.0;

  const clamped = Math.max(-3, Math.min(3, rawVal));
  const percent = Math.max(0, Math.min(100, ((clamped + 3) / 6) * 100));
  const positive = clamped >= 0;
  const confidencePct = Math.round((score?.confidence ?? 0.85) * 100);
  const sampleN = score?.sampleSize ?? 0;
  const scoreType = score?.scoreType || 'BJI';

  const label = scoreTypeLabel || SCORE_LABELS[scoreType] || `${scoreType} DEVIATION INDEX`;

  const getScoreDescription = () => {
    if (scoreType === 'BJI') {
      if (clamped < -1.0) return 'Liberal Leaning Decision Baseline';
      if (clamped > 1.0) return 'Conservative Leaning Decision Baseline';
      return 'Centrist / Moderate Judicial Baseline';
    }
    if (scoreType === 'API') {
      if (clamped > 1.0) return 'High Win-Rate Trial Performance';
      if (clamped < -1.0) return 'Defense Weighted Trial Alignment';
      return 'Balanced Appellate & Trial Performance';
    }
    if (scoreType === 'PDI') {
      if (clamped > 1.0) return 'High Trial Conviction & Indictment Uphold';
      return 'Balanced Plea & Pre-Trial Resolution Flow';
    }
    return 'Bipartisan Congressional Alignment';
  };

  const scoreColor = positive ? '#C0996E' : '#DC2626';

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.scoreType} numberOfLines={2}>
          {label}
        </Text>
        <Text style={[styles.scoreValue, { color: scoreColor }]}>
          {clamped > 0 ? `+${clamped.toFixed(2)}` : clamped.toFixed(2)}
        </Text>
      </View>

      <Text style={styles.description}>{getScoreDescription()}</Text>

      {/* Meter Track */}
      <View style={styles.meterContainer}>
        <View style={styles.track}>
          {/* Center Zero Line */}
          <View style={styles.centerNotch} />

          {/* Active Range Fill */}
          <View
            style={[
              styles.rangeFill,
              {
                backgroundColor: scoreColor,
                left: positive ? '50%' : `${percent}%`,
                width: positive ? `${percent - 50}%` : `${50 - percent}%`,
              },
            ]}
          />

          {/* Diamond Marker Indicator */}
          <View
            style={[
              styles.diamondMarker,
              {
                left: `${percent}%`,
                backgroundColor: scoreColor,
                borderColor: scoreColor,
              },
            ]}
          />
        </View>

        {/* Scale Markers */}
        <View style={styles.markersRow}>
          {TICKS.map((t) => (
            <Text key={t} style={[styles.markerText, t === 0 ? styles.markerCenter : null]}>
              {t === 0 ? '0.0 (Baseline)' : t > 0 ? `+${t.toFixed(1)}` : t.toFixed(1)}
            </Text>
          ))}
        </View>
      </View>

      {/* Meta Stats Footer */}
      <View style={styles.bottomStats}>
        <Text style={styles.statLabel}>
          CONFIDENCE {confidencePct}% &middot; SAMPLE N={sampleN}
        </Text>
        <Text style={styles.statDisclaimer}>
          Historical data only. Not predictive. Full source trace available per case.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0A121E',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  scoreType: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#8E9AA8',
    letterSpacing: 0.8,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    marginRight: 12,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'monospace',
    flexShrink: 0,
  },
  description: {
    fontSize: 12.5,
    color: '#F5F7FA',
    marginTop: 2,
    marginBottom: 12,
    fontWeight: '600',
  },
  meterContainer: {
    marginVertical: 6,
  },
  track: {
    height: 10,
    backgroundColor: '#1E293B',
    borderRadius: 5,
    position: 'relative',
    justifyContent: 'center',
  },
  centerNotch: {
    position: 'absolute',
    left: '50%',
    width: 2,
    height: 16,
    backgroundColor: '#475569',
    transform: [{ translateX: -1 }],
  },
  rangeFill: {
    position: 'absolute',
    height: 4,
    top: 3,
    borderRadius: 2,
  },
  diamondMarker: {
    position: 'absolute',
    width: 14,
    height: 14,
    transform: [{ translateX: -7 }, { rotate: '45deg' }],
    borderWidth: 1.5,
    shadowColor: '#C0996E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
  },
  markersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  markerText: {
    fontSize: 10.5,
    color: '#8E9AA8',
    fontFamily: 'monospace',
  },
  markerCenter: {
    color: '#F5F7FA',
    fontWeight: '700',
  },
  bottomStats: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(30, 41, 59, 0.6)',
  },
  statLabel: {
    fontSize: 10.5,
    color: '#8E9AA8',
    fontWeight: '600',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  statDisclaimer: {
    fontSize: 9.5,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 3,
    fontFamily: 'monospace',
  },
});
