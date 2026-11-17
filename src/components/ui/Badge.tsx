import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import type { ToneKey } from '../../theme/themes';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

/* ------------------------------------------------------------------ Badge */

export interface BadgeProps {
  label: string;
  tone?: ToneKey;
  icon?: LucideIcon;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md';
}

export function Badge({ label, tone = 'neutral', icon: Icon, dot, style, size = 'sm' }: BadgeProps) {
  const t = useTheme();
  const c = t.tone(tone);
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: c.bg,
          borderColor: c.border,
          paddingVertical: size === 'sm' ? 3 : 5,
          paddingHorizontal: size === 'sm' ? 8 : 10,
        },
        style,
      ]}
    >
      {dot ? <View style={[styles.dot, { backgroundColor: c.fg }]} /> : null}
      {Icon ? <Icon size={size === 'sm' ? 11 : 13} color={c.fg} strokeWidth={2.2} /> : null}
      <AppText
        variant="overline"
        color={c.fg}
        numberOfLines={1}
        style={{ fontSize: size === 'sm' ? 9.5 : 10.5, letterSpacing: 0.9, flexShrink: 1 }}
      >
        {label}
      </AppText>
    </View>
  );
}

/* ------------------------------------------------------------------- Chip */

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  count?: number;
  icon?: LucideIcon;
}

/** Selectable filter chip with an animated fill transition. */
export function Chip({ label, selected = false, onPress, count, icon: Icon }: ChipProps) {
  const t = useTheme();
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, { duration: t.motion.base });
  }, [selected, progress, t.motion.base]);

  const inactiveBg = t.colors.surface;
  const activeBg = t.dark ? t.colors.accent : t.colors.navy;
  const inactiveBorder = t.colors.border;

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [inactiveBg, activeBg]),
    borderColor: interpolateColor(progress.value, [0, 1], [inactiveBorder, activeBg]),
  }));

  const fg = selected ? (t.dark ? t.colors.onAccent : t.colors.onNavy) : t.colors.textSecondary;

  return (
    <PressableScale
      onPress={onPress}
      haptic
      scaleTo={0.94}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      style={styles.chipOuter}
    >
      <Animated.View style={[styles.chip, animatedStyle]}>
        {Icon ? <Icon size={13} color={fg} strokeWidth={2.2} /> : null}
        <AppText variant="callout" color={fg} style={{ fontSize: 12.5 }} numberOfLines={1}>
          {label}
        </AppText>
        {typeof count === 'number' ? (
          <View
            style={[
              styles.count,
              { backgroundColor: selected ? 'rgba(0,0,0,0.16)' : t.colors.surfaceSunken },
            ]}
          >
            <AppText variant="caption" color={fg} style={{ fontSize: 10.5, fontFamily: t.fonts.sansSemi }}>
              {count}
            </AppText>
          </View>
        ) : null}
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    maxWidth: '100%',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  chipOuter: { borderRadius: 999 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
  },
  count: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999, minWidth: 20, alignItems: 'center' },
});
