import React, { useEffect, useState } from 'react';
import { Keyboard, LayoutChangeEvent, Platform, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { TAB_BAR_HEIGHT, CONTENT_MAX_WIDTH } from '../theme/responsive';
import { AppText, PressableScale, haptic } from '../components/ui';

export interface TabMeta {
  icon: LucideIcon;
  label: string;
}

function TabItem({
  focused,
  meta,
  onPress,
  onLongPress,
}: {
  focused: boolean;
  meta: TabMeta;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const t = useTheme();
  const progress = useDerivedValue(() => withSpring(focused ? 1 : 0, t.motion.spring), [focused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.value, [0, 1], [3, -1]) }, { scale: interpolate(progress.value, [0, 1], [1, 1.08]) }],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.7, 1]),
  }));

  const color = focused ? t.colors.accent : t.colors.textTertiary;
  const Icon = meta.icon;

  return (
    <PressableScale
      onPress={onPress}
      onLongPress={onLongPress}
      scaleTo={0.9}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={meta.label}
      style={styles.item}
    >
      <Animated.View style={iconStyle}>
        <Icon size={21} color={color} strokeWidth={focused ? 2.3 : 1.9} />
      </Animated.View>
      <Animated.View style={labelStyle}>
        <AppText
          variant="caption"
          color={color}
          style={{ fontSize: 10.5, marginTop: 3, fontFamily: focused ? t.fonts.sansSemi : t.fonts.sansMedium }}
          maxFontSizeMultiplier={1.1}
          numberOfLines={1}
        >
          {meta.label}
        </AppText>
      </Animated.View>
    </PressableScale>
  );
}

/**
 * Floating frosted tab bar with a spring-animated gold indicator that slides
 * between tabs. Hides while the keyboard is open on Android.
 */
export function createAnimatedTabBar(metaByRoute: Record<string, TabMeta>) {
  return function AnimatedTabBar({ state, navigation }: BottomTabBarProps) {
    const t = useTheme();
    const insets = useSafeAreaInsets();
    const [barWidth, setBarWidth] = useState(0);
    const [keyboardOpen, setKeyboardOpen] = useState(false);
    const count = state.routes.length;
    const itemW = barWidth > 0 ? (barWidth - 12) / count : 0;

    const x = useSharedValue(0);
    const hide = useSharedValue(0);

    useEffect(() => {
      x.value = withSpring(state.index * itemW, t.motion.spring);
    }, [state.index, itemW, x, t.motion.spring]);

    useEffect(() => {
      if (Platform.OS !== 'android') return;
      const s1 = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
      const s2 = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
      return () => {
        s1.remove();
        s2.remove();
      };
    }, []);

    useEffect(() => {
      hide.value = withTiming(keyboardOpen ? 1 : 0, { duration: 180 });
    }, [keyboardOpen, hide]);

    const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
    const wrapStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: hide.value * 140 }],
      opacity: 1 - hide.value,
    }));

    const bottom = Math.max(insets.bottom, 12);

    return (
      <Animated.View
        style={[styles.wrap, { bottom }, wrapStyle]}
        pointerEvents={keyboardOpen ? 'none' : 'box-none'}
      >
        <View
          onLayout={(e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width)}
          style={[
            styles.bar,
            {
              height: TAB_BAR_HEIGHT,
              // Opaque on Android: elevation shadows bleed through translucent fills.
              backgroundColor: Platform.OS === 'ios' ? 'transparent' : t.colors.surfaceElevated,
              borderColor: t.colors.glassBorder,
            },
            t.shadow(3),
          ]}
        >
          {Platform.OS === 'ios' ? (
            <>
              <BlurView intensity={70} tint={t.dark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, styles.round]} />
              <View style={[StyleSheet.absoluteFill, styles.round, { backgroundColor: t.colors.glass }]} />
            </>
          ) : null}

          {itemW > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.indicator,
                { width: itemW, backgroundColor: t.colors.accentSoft, borderColor: t.colors.accentBorder },
                indicatorStyle,
              ]}
            />
          ) : null}

          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const meta = metaByRoute[route.name] ?? { icon: metaByRoute.Dashboard.icon, label: route.name };
            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                haptic.selection();
                navigation.navigate(route.name, route.params);
              }
            };
            const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });
            return <TabItem key={route.key} focused={focused} meta={meta} onPress={onPress} onLongPress={onLongPress} />;
          })}
        </View>
      </Animated.View>
    );
  };
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 16 },
  bar: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH - 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
  },
  round: { borderRadius: 26, overflow: 'hidden' },
  item: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' },
  indicator: {
    position: 'absolute',
    left: 6,
    top: 7,
    bottom: 7,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
