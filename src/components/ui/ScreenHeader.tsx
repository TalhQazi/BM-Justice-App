import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, SharedValue, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

export const HEADER_BAR_HEIGHT = 52;

export interface HeaderAction {
  icon: LucideIcon;
  onPress: () => void;
  label: string;
}

interface ScreenHeaderProps {
  /** Title revealed once the user scrolls past the hero. */
  title?: string;
  scrollY?: SharedValue<number>;
  /** Scroll offset at which the bar becomes fully opaque. */
  revealAt?: number;
  showBack?: boolean;
  onBack?: () => void;
  actions?: HeaderAction[];
  /** Always show the solid bar and title (no scroll reveal). */
  solid?: boolean;
}

/**
 * Floating translucent top bar. Starts transparent above the hero and fades
 * into a frosted bar with a centered title as content scrolls beneath it.
 */
export function ScreenHeader({
  title,
  scrollY,
  revealAt = 140,
  showBack = true,
  onBack,
  actions = [],
  solid = false,
}: ScreenHeaderProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const bgStyle = useAnimatedStyle(() => {
    if (solid || !scrollY) return { opacity: 1 };
    return { opacity: interpolate(scrollY.value, [revealAt * 0.4, revealAt], [0, 1], Extrapolation.CLAMP) };
  });

  const titleStyle = useAnimatedStyle(() => {
    if (solid || !scrollY) return { opacity: 1, transform: [{ translateY: 0 }] };
    const p = interpolate(scrollY.value, [revealAt * 0.7, revealAt + 20], [0, 1], Extrapolation.CLAMP);
    return { opacity: p, transform: [{ translateY: (1 - p) * 8 }] };
  });

  const handleBack = () => {
    if (onBack) onBack();
    else if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Home');
  };

  const roundBtn = [
    styles.roundBtn,
    { backgroundColor: t.colors.glass, borderColor: t.colors.glassBorder },
  ];

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]} pointerEvents="none">
        {Platform.OS === 'ios' ? (
          <BlurView intensity={60} tint={t.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        ) : null}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: Platform.OS === 'ios' ? t.colors.glass : t.colors.background,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: t.colors.border,
            },
          ]}
        />
      </Animated.View>

      <View style={styles.bar}>
        <View style={styles.side}>
          {showBack ? (
            <PressableScale onPress={handleBack} haptic hitSlop={8} accessibilityLabel="Go back" style={roundBtn}>
              <ChevronLeft size={21} color={t.colors.text} strokeWidth={2.2} />
            </PressableScale>
          ) : null}
        </View>

        <Animated.View style={[styles.titleWrap, titleStyle]} pointerEvents="none">
          {title ? (
            <AppText variant="title" numberOfLines={1} align="center">
              {title}
            </AppText>
          ) : null}
        </Animated.View>

        <View style={[styles.side, { justifyContent: 'flex-end' }]}>
          {actions.map((a) => (
            <PressableScale
              key={a.label}
              onPress={a.onPress}
              haptic
              hitSlop={6}
              accessibilityLabel={a.label}
              style={roundBtn}
            >
              <a.icon size={18} color={t.colors.text} strokeWidth={2} />
            </PressableScale>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50 },
  bar: { height: HEADER_BAR_HEIGHT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  side: { minWidth: 84, flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  roundBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
