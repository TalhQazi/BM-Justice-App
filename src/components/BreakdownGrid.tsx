import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { PieChart } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useResponsive } from '../theme/responsive';
import { AppText, EmptyState, SectionHeader, enterUp } from './ui';

export interface BreakdownItem {
  label: string;
  count: number;
}

function Bar({ pct, delay, color, track }: { pct: number; delay: number; color: string; track: string }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withTiming(pct, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [pct, delay, p]);
  const style = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));
  return (
    <View style={[styles.track, { backgroundColor: track }]}>
      <Animated.View style={[styles.fill, { backgroundColor: color }, style]} />
    </View>
  );
}

/** Grid of category counts with proportional, animated share bars. */
export function BreakdownGrid({
  title,
  eyebrow = 'Breakdown',
  items,
  unit,
  emptyText,
}: {
  title: string;
  eyebrow?: string;
  items: BreakdownItem[];
  unit: string;
  emptyText: string;
}) {
  const t = useTheme();
  const { gridColumns } = useResponsive();
  const max = Math.max(1, ...items.map((i) => i.count));
  const total = items.reduce((s, i) => s + i.count, 0);
  const width = gridColumns === 3 ? '32.3%' : '48.5%';

  return (
    <View>
      <SectionHeader eyebrow={eyebrow} title={title} />
      {items.length === 0 ? (
        <View style={[styles.emptyWrap, { backgroundColor: t.colors.surfaceSunken, borderColor: t.colors.divider }]}>
          <EmptyState icon={PieChart} title={emptyText} style={{ paddingVertical: 20 }} />
        </View>
      ) : (
        <View style={styles.grid}>
          {items.map((item, i) => (
            <Animated.View
              key={item.label}
              entering={enterUp(i)}
              style={[
                styles.card,
                { width: width as any, backgroundColor: t.colors.surface, borderColor: t.colors.border },
                t.shadow(1),
              ]}
            >
              <AppText variant="caption" numberOfLines={1} style={{ fontFamily: t.fonts.sansMedium }}>
                {item.label}
              </AppText>
              <View style={styles.valueRow}>
                <AppText variant="stat">{item.count}</AppText>
                <AppText variant="caption" style={{ marginBottom: 4 }}>
                  {unit}
                </AppText>
              </View>
              <Bar pct={item.count / max} delay={120 + i * 50} color={t.colors.accent} track={t.colors.surfaceSunken} />
              {total > 0 ? (
                <AppText variant="caption" style={{ fontSize: 10.5, marginTop: 6 }}>
                  {Math.round((item.count / total) * 100)}% of record
                </AppText>
              ) : null}
            </Animated.View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  card: { padding: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 6, marginBottom: 10 },
  track: { height: 5, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  emptyWrap: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
});
