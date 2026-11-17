import React, { useCallback, useState } from 'react';
import { LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, withTiming, Easing } from 'react-native-reanimated';
import { ChevronDown } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

/**
 * Height-animated container. Content is measured off-flow, so it animates to
 * its natural height without layout jumps.
 */
export function Collapse({ open, children }: { open: boolean; children: React.ReactNode }) {
  const [measured, setMeasured] = useState(0);
  const progress = useDerivedValue(
    () => withTiming(open ? 1 : 0, { duration: 300, easing: Easing.out(Easing.cubic) }),
    [open],
  );

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    setMeasured((prev) => (prev === h ? prev : h));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    height: measured * progress.value,
    opacity: progress.value,
  }));

  return (
    <Animated.View style={[{ overflow: 'hidden' }, animatedStyle]}>
      <View style={styles.measure} onLayout={onLayout}>
        {children}
      </View>
    </Animated.View>
  );
}

/** Rotating chevron that follows an open/closed state. */
export function Chevron({ open, color, size = 18 }: { open: boolean; color: string; size?: number }) {
  const rot = useDerivedValue(() => withTiming(open ? 180 : 0, { duration: 260 }), [open]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  return (
    <Animated.View style={style}>
      <ChevronDown size={size} color={color} strokeWidth={2.2} />
    </Animated.View>
  );
}

/** Card-style expandable section with header, subtitle and animated body. */
export function ExpandableSection({
  title,
  subtitle,
  icon: Icon,
  initiallyOpen = false,
  children,
  style,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  initiallyOpen?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <View
      style={[
        {
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.colors.border,
          overflow: 'hidden',
        },
        t.shadow(1),
        style,
      ]}
    >
      <PressableScale
        onPress={() => setOpen((o) => !o)}
        haptic
        scaleTo={0.99}
        accessibilityState={{ expanded: open }}
        style={styles.header}
      >
        {Icon ? (
          <View style={[styles.icon, { backgroundColor: t.colors.accentSoft }]}>
            <Icon size={17} color={t.colors.accent} strokeWidth={1.9} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <AppText variant="title">{title}</AppText>
          {subtitle ? (
            <AppText variant="caption" style={{ marginTop: 2 }}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        <Chevron open={open} color={t.colors.textTertiary} />
      </PressableScale>
      <Collapse open={open}>
        <View style={{ paddingHorizontal: t.spacing.lg, paddingBottom: t.spacing.md }}>{children}</View>
      </Collapse>
    </View>
  );
}

const styles = StyleSheet.create({
  measure: { position: 'absolute', left: 0, right: 0, top: 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  icon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
