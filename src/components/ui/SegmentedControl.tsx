import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

export interface Segment<K extends string> {
  key: K;
  label: string;
  icon?: LucideIcon;
}

/** iOS-style segmented control with a spring-animated sliding thumb. */
export function SegmentedControl<K extends string>({
  segments,
  value,
  onChange,
}: {
  segments: Segment<K>[];
  value: K;
  onChange: (k: K) => void;
}) {
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, segments.findIndex((s) => s.key === value));
  const segW = width > 0 ? (width - 8) / segments.length : 0;
  const x = useSharedValue(0);

  useEffect(() => {
    x.value = withSpring(index * segW, t.motion.spring);
  }, [index, segW, x, t.motion.spring]);

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.track, { backgroundColor: t.colors.surfaceSunken, borderColor: t.colors.border }]}
      accessibilityRole="tablist"
    >
      {segW > 0 ? (
        <Animated.View
          style={[
            styles.thumb,
            { width: segW, backgroundColor: t.colors.surfaceElevated, borderColor: t.colors.accentBorder },
            t.shadow(1),
            thumbStyle,
          ]}
        />
      ) : null}
      {segments.map((s) => {
        const active = s.key === value;
        const fg = active ? t.colors.text : t.colors.textTertiary;
        return (
          <PressableScale
            key={s.key}
            onPress={() => onChange(s.key)}
            haptic
            scaleTo={0.96}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={styles.segment}
          >
            {s.icon ? <s.icon size={15} color={active ? t.colors.accent : fg} strokeWidth={2} /> : null}
            <AppText variant="callout" color={fg}>
              {s.label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: 4, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  thumb: { position: 'absolute', top: 4, bottom: 4, left: 4, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  segment: { flex: 1, height: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
