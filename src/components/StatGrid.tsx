import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';
import type { ToneKey } from '../theme/themes';
import { useTheme } from '../theme/ThemeProvider';
import { AppText, IconTile, Skeleton, enterUp } from './ui';

export interface StatItem {
  label: string;
  value?: string;
  icon: LucideIcon;
  tone?: ToneKey;
  hint?: string;
  loading?: boolean;
}

/** 2-up grid of headline metrics derived from live records. */
export function StatGrid({ items }: { items: StatItem[] }) {
  const t = useTheme();
  return (
    <View style={styles.grid}>
      {items.map((s, i) => (
        <Animated.View
          key={s.label}
          entering={enterUp(i)}
          style={[styles.tile, { backgroundColor: t.colors.surface, borderColor: t.colors.border }, t.shadow(1)]}
        >
          <IconTile icon={s.icon} tone={s.tone ?? 'gold'} size={30} />
          {s.loading ? (
            <Skeleton width="55%" height={20} style={{ marginTop: 10 }} />
          ) : (
            <AppText variant="stat" style={{ marginTop: 8 }} numberOfLines={1} adjustsFontSizeToFit>
              {s.value ?? '—'}
            </AppText>
          )}
          <AppText variant="overline" style={{ fontSize: 9.5, marginTop: 2 }} numberOfLines={2}>
            {s.label}
          </AppText>
          {s.hint ? (
            <AppText variant="caption" style={{ fontSize: 10.5, marginTop: 2 }} numberOfLines={2}>
              {s.hint}
            </AppText>
          ) : null}
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  tile: { width: '48.5%', padding: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
});
