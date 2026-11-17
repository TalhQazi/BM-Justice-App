import React, { useEffect } from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { palette } from '../theme/tokens';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './ui';

interface AnimatedSplashScreenProps {
  onFinish: () => void;
}

export default function AnimatedSplashScreen({ onFinish }: AnimatedSplashScreenProps) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const logoSize = Math.min(width * 0.78, 320);

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.88);
  const tagline = useSharedValue(0);
  const progress = useSharedValue(0);
  const exit = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSpring(1, { damping: 14, stiffness: 90 });
    tagline.value = withDelay(600, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
    progress.value = withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.quad) });
    exit.value = withDelay(
      3200,
      withTiming(0, { duration: 450, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(onFinish)();
      }),
    );
  }, [onFinish, logoOpacity, logoScale, tagline, progress, exit]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: exit.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: tagline.value,
    transform: [{ translateY: (1 - tagline.value) * 12 }],
  }));
  const progressStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.value }] }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <LinearGradient
        colors={['#050B14', '#071223', '#050B14']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.center}>
        <Animated.View style={logoStyle}>
          <Image
            source={require('../../assets/images/benchmark_justice_logo.png')}
            style={{ width: logoSize, height: logoSize * 0.5 }}
            resizeMode="cover"
          />
        </Animated.View>

        <Animated.View style={[styles.taglineWrap, taglineStyle]}>
          <View style={styles.rule} />
          <AppText
            variant="overline"
            color={palette.gold400}
            style={{ letterSpacing: 2.4, fontSize: 10.5 }}
            align="center"
          >
            Real Data · Real Outcomes · Real Justice
          </AppText>
          <View style={styles.rule} />
        </Animated.View>
      </View>

      <View style={styles.bottom}>
        <View style={styles.track}>
          <Animated.View style={[styles.fillWrap, progressStyle]}>
            <LinearGradient
              colors={[palette.gold600, palette.gold300, palette.gold600]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <AppText
          variant="overline"
          color={palette.navy300}
          style={{ fontSize: 9.5, letterSpacing: 1.8, fontFamily: t.fonts.sansMedium }}
          align="center"
        >
          Initializing judicial intelligence
        </AppText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050B14',
  },
  center: { alignItems: 'center', justifyContent: 'center', width: '100%', paddingHorizontal: 24 },
  taglineWrap: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rule: { width: 18, height: 1, backgroundColor: 'rgba(210,182,118,0.5)' },
  bottom: { position: 'absolute', bottom: 56, width: '100%', paddingHorizontal: 64, alignItems: 'center' },
  track: {
    width: '100%',
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(194,161,90,0.15)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  fillWrap: { ...StyleSheet.absoluteFillObject, transformOrigin: 'left' },
});
