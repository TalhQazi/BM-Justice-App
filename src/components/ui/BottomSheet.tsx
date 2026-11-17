import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Max height as a fraction of the window height. */
  maxHeightRatio?: number;
}

/**
 * Gesture-driven bottom sheet: drag the handle/header down to dismiss,
 * tap the dimmed backdrop, or use the close button.
 */
export function BottomSheet({ visible, onClose, title, subtitle, children, maxHeightRatio = 0.82 }: BottomSheetProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowH } = useWindowDimensions();
  const sheetMax = windowH * maxHeightRatio;

  const [mounted, setMounted] = useState(visible);
  const translateY = useSharedValue(sheetMax);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = sheetMax;
      translateY.value = withSpring(0, t.motion.springSoft);
    } else if (mounted) {
      translateY.value = withTiming(sheetMax, { duration: 240, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pan = Gesture.Pan()
    .activeOffsetY(8)
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > 110 || e.velocityY > 900) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, t.motion.springSoft);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, sheetMax], [1, 0], Extrapolation.CLAMP),
  }));

  if (!mounted) return null;

  return (
    <Modal transparent visible={mounted} onRequestClose={onClose} animationType="none" statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: t.colors.overlay }, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close sheet" />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              maxHeight: sheetMax,
              backgroundColor: t.colors.surfaceElevated,
              borderTopLeftRadius: t.radius.xl,
              borderTopRightRadius: t.radius.xl,
              paddingBottom: Math.max(insets.bottom, 16),
              borderColor: t.colors.border,
            },
            t.shadow(3),
            sheetStyle,
          ]}
        >
          <GestureDetector gesture={pan}>
            <View style={styles.dragZone}>
              <View style={[styles.handle, { backgroundColor: t.colors.borderStrong }]} />
              {title ? (
                <View style={styles.headerRow}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <AppText variant="h2" numberOfLines={2}>
                      {title}
                    </AppText>
                    {subtitle ? (
                      <AppText variant="caption" style={{ marginTop: 3 }}>
                        {subtitle}
                      </AppText>
                    ) : null}
                  </View>
                  <PressableScale
                    onPress={onClose}
                    accessibilityLabel="Close"
                    hitSlop={8}
                    style={[styles.close, { backgroundColor: t.colors.surfaceSunken }]}
                  >
                    <X size={16} color={t.colors.textSecondary} strokeWidth={2.2} />
                  </PressableScale>
                </View>
              ) : null}
            </View>
          </GestureDetector>
          <View style={{ flexShrink: 1 }}>{children}</View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
  },
  dragZone: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 12 },
  handle: { alignSelf: 'center', width: 40, height: 4.5, borderRadius: 3, marginBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
