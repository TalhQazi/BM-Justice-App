import React, { useEffect } from 'react';
import { DimensionValue, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';
import { useResponsive } from '../../theme/responsive';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Shimmering placeholder block. The sweep runs on the UI thread. */
export function Skeleton({ width = '100%', height = 14, radius = 8, style }: SkeletonProps) {
  const t = useTheme();
  const { width: screenW } = useResponsive();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) }), -1, false);
    return () => cancelAnimation(progress);
  }, [progress]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [-screenW * 0.6, screenW]) }],
  }));

  return (
    <View
      style={[
        { width, height, borderRadius: radius, backgroundColor: t.colors.skeletonBase, overflow: 'hidden' },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { width: screenW * 0.6 }, sweepStyle]}>
        <LinearGradient
          colors={['transparent', t.colors.skeletonHighlight, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

/* ------------------------------------------------------------- presets */

function SkeletonShell({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.colors.border,
          padding: t.spacing.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** A list row: avatar + two text lines. */
export function SkeletonRow({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <SkeletonShell style={[{ flexDirection: 'row', alignItems: 'center', gap: 14 }, style]}>
      <Skeleton width={46} height={46} radius={23} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="62%" height={14} />
        <Skeleton width="40%" height={11} />
      </View>
      <Skeleton width={54} height={20} radius={10} />
    </SkeletonShell>
  );
}

export function SkeletonList({ count = 6, gap = 10 }: { count?: number; gap?: number }) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}

export function SkeletonCard({ lines = 3, style }: { lines?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <SkeletonShell style={style}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <Skeleton width={40} height={40} radius={12} />
        <View style={{ flex: 1, gap: 7 }}>
          <Skeleton width="45%" height={10} />
          <Skeleton width="70%" height={14} />
        </View>
      </View>
      <View style={{ gap: 8 }}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} width={i === lines - 1 ? '55%' : '100%'} height={11} />
        ))}
      </View>
    </SkeletonShell>
  );
}

export function SkeletonStatGrid({ count = 6 }: { count?: number }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonShell key={i} style={{ width: '48.6%', gap: 8, paddingVertical: 14 }}>
          <Skeleton width={28} height={28} radius={9} />
          <Skeleton width="60%" height={18} />
          <Skeleton width="80%" height={9} />
        </SkeletonShell>
      ))}
    </View>
  );
}

/** Full-page placeholder for profile & case-detail screens. */
export function SkeletonProfile() {
  const t = useTheme();
  return (
    <View style={{ gap: t.spacing.lg }}>
      <SkeletonShell style={{ alignItems: 'center', paddingVertical: 28, gap: 12 }}>
        <Skeleton width={84} height={84} radius={42} />
        <Skeleton width="55%" height={22} />
        <Skeleton width="38%" height={12} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
          <Skeleton width={90} height={24} radius={12} />
          <Skeleton width={110} height={24} radius={12} />
        </View>
      </SkeletonShell>
      <SkeletonCard lines={2} />
      <SkeletonStatGrid count={4} />
      <SkeletonCard lines={4} />
    </View>
  );
}
