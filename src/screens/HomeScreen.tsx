import React, { useCallback, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Scale, ShieldCheck } from 'lucide-react-native';
import Header from '../components/Header';
import UniversalSearch from '../components/UniversalSearch';
import CoverageCounters from '../components/CoverageCounters';
import EntityCards from '../components/EntityCards';
import LiveIntelligencePanel from '../components/LiveIntelligencePanel';
import { AppText, Badge, SectionHeader, enterFade, enterUp } from '../components/ui';
import { useTheme } from '../theme/ThemeProvider';
import { CONTENT_MAX_WIDTH, useResponsive, useTabBarSpace } from '../theme/responsive';
import { palette } from '../theme/tokens';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { gutter, isCompact } = useResponsive();
  const bottomSpace = useTabBarSpace();
  const scrollY = useSharedValue(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  // Subtle parallax on the hero watermark.
  const watermarkStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [-100, 0, 300], [-30, 0, 60], Extrapolation.CLAMP) },
      { rotate: '-12deg' },
    ],
  }));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 900);
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: t.colors.background }]}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={t.colors.accent}
            colors={[t.colors.accent]}
            progressBackgroundColor={t.colors.surface}
          />
        }
        contentContainerStyle={{
          paddingTop: insets.top + 4,
          paddingBottom: bottomSpace,
          paddingHorizontal: gutter,
          width: '100%',
          maxWidth: CONTENT_MAX_WIDTH,
          alignSelf: 'center',
        }}
      >
        <Animated.View entering={enterFade(0)}>
          <Header />
        </Animated.View>

        {/* Hero */}
        <Animated.View entering={enterUp(0, 60)} style={styles.hero}>
          <LinearGradient
            colors={[palette.navy700, palette.navy800, palette.navy950]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View style={[styles.watermark, watermarkStyle]} pointerEvents="none">
            <Scale size={190} color="rgba(210,182,118,0.07)" strokeWidth={1} />
          </Animated.View>
          <LinearGradient
            colors={['transparent', 'rgba(210,182,118,0.75)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroRule}
          />

          <AppText variant="overline" color={palette.gold300} style={{ letterSpacing: 1.8 }}>
            {greeting()} · Judicial Research
          </AppText>
          <AppText
            variant="display"
            color={palette.parchment}
            style={{ marginTop: 10, fontSize: isCompact ? 26 : 30, lineHeight: isCompact ? 32 : 37 }}
          >
            See the record behind the justice system.
          </AppText>
          <AppText variant="body" color={palette.navy300} style={{ marginTop: 10 }}>
            Search any judge, attorney, prosecutor, court, or case.
          </AppText>
          <View style={styles.heroBadges}>
            <View style={styles.heroPill}>
              <ShieldCheck size={12} color={palette.gold400} strokeWidth={2.2} />
              <AppText variant="overline" color={palette.gold300} style={{ fontSize: 9, letterSpacing: 1.2 }}>
                Real data · Real outcomes · Real justice
              </AppText>
            </View>
          </View>
        </Animated.View>

        {/* Universal search (overlaps hero edge) */}
        <Animated.View entering={enterUp(1, 60)} style={styles.searchWrap}>
          <UniversalSearch key={`search-${refreshKey}`} />
        </Animated.View>

        {/* Coverage */}
        <SectionHeader eyebrow="Coverage" title="Intelligence at a glance" style={{ marginTop: 28 }} />
        <CoverageCounters key={`cov-${refreshKey}`} />

        {/* Browse */}
        <SectionHeader eyebrow="Browse" title="Explore by category" style={{ marginTop: 30 }} />
        <EntityCards key={`ent-${refreshKey}`} />

        {/* Live intelligence */}
        <View style={{ marginTop: 32 }}>
          <LiveIntelligencePanel key={`live-${refreshKey}`} />
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: t.colors.divider }]}>
          <Badge label="Public records only" tone="neutral" />
          <AppText variant="caption" align="center" style={{ marginTop: 10 }}>
            Benchmark Justice™ · Public Records & Judicial Intelligence · 2026
          </AppText>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: {
    marginTop: 14,
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 54,
    overflow: 'hidden',
  },
  heroRule: { position: 'absolute', top: 0, left: 24, right: 24, height: 1.5 },
  watermark: { position: 'absolute', right: -40, bottom: -50 },
  heroBadges: { flexDirection: 'row', marginTop: 18 },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(210,182,118,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(210,182,118,0.28)',
  },
  searchWrap: { marginTop: -28, paddingHorizontal: 10, zIndex: 10 },
  footer: { marginTop: 32, paddingTop: 20, borderTopWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
});
