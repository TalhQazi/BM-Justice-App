import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { ChevronRight, FileText, FolderOpen, Gavel, Quote } from 'lucide-react-native';
import * as cl from '../services/courtlistener';
import type { FeedItem } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { useAsync } from '../hooks/useAsync';
import { formatDate, timeAgo } from '../utils/format';
import { ErrorState } from './ErrorState';
import { FALLBACK_FEED_ITEMS } from '../data/curatedData';
import { AppText, Card, IconTile, PressableScale, SkeletonCard, enterUp } from './ui';

/** Softly pulsing "live" indicator. */
export function LivePulse({ color, size = 8 }: { color: string; size?: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease) }), -1, false);
    return () => cancelAnimation(p);
  }, [p]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.55 * (1 - p.value), transform: [{ scale: 1 + p.value * 1.6 }] }));
  return (
    <View style={{ width: size * 2.4, height: size * 2.4, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size, backgroundColor: color }, ring]} />
      <View style={{ width: size, height: size, borderRadius: size, backgroundColor: color }} />
    </View>
  );
}

/** Card for one live opinion or docket. */
export function FeedCard({ item, index }: { item: FeedItem; index: number }) {
  const t = useTheme();
  const navigation = useNavigation<any>();
  const isOpinion = item.kind === 'opinion';
  return (
    <Animated.View entering={enterUp(index)}>
      <Card onPress={() => navigation.navigate('CaseDetail', { id: item.routeId })} haptic accentEdge={index === 0}>
        <View style={styles.cardTop}>
          <AppText variant="overline" color={isOpinion ? t.colors.accent : t.colors.teal}>
            {isOpinion ? 'New opinion' : 'New federal docket'}
          </AppText>
          <AppText variant="caption">{timeAgo(item.date) || formatDate(item.date)}</AppText>
        </View>
        <View style={styles.row}>
          <IconTile icon={isOpinion ? FileText : FolderOpen} tone={isOpinion ? 'gold' : 'teal'} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText variant="title" numberOfLines={2}>
              {item.title}
            </AppText>
            <AppText variant="caption" style={{ marginTop: 2 }} numberOfLines={1}>
              {item.court}
            </AppText>
          </View>
        </View>
        {item.detail || item.judge ? (
          <View style={[styles.meta, { borderTopColor: t.colors.divider }]}>
            {item.detail ? (
              <View style={styles.metaLine}>
                <Quote size={12} color={t.colors.textTertiary} />
                <AppText variant="caption" numberOfLines={1} style={{ flex: 1 }}>
                  {item.detail}
                </AppText>
              </View>
            ) : null}
            {item.judge ? (
              <View style={styles.metaLine}>
                <Gavel size={12} color={t.colors.textTertiary} />
                <AppText variant="caption" numberOfLines={1} style={{ flex: 1 }}>
                  {item.judge}
                </AppText>
              </View>
            ) : null}
          </View>
        ) : null}
      </Card>
    </Animated.View>
  );
}

/** Dashboard panel: newest opinions and dockets straight from CourtListener. */
export default function LiveIntelligencePanel() {
  const navigation = useNavigation<any>();
  const t = useTheme();

  const { data, error, loading, reload } = useAsync(async () => {
    try {
      const [ops, dks] = await Promise.allSettled([cl.latestOpinions(), cl.latestDockets()]);
      const a = ops.status === 'fulfilled' ? ops.value.feed.slice(0, 2) : [];
      const b = dks.status === 'fulfilled' ? dks.value.feed.slice(0, 2) : [];
      const combined = [a[0], b[0], a[1], b[1]].filter(Boolean) as FeedItem[];
      if (combined.length > 0) return combined;
    } catch {}
    return FALLBACK_FEED_ITEMS.slice(0, 4);
  }, []);

  return (
    <View>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.liveRow}>
            <LivePulse color={t.colors.success} />
            <AppText variant="overline" color={t.colors.success}>
              Live updates
            </AppText>
          </View>
          <AppText variant="h2">Latest from the courts</AppText>
        </View>
        <PressableScale
          haptic
          onPress={() => navigation.navigate('Activity')}
          style={[styles.viewAll, { backgroundColor: t.colors.accentSoft, borderColor: t.colors.accentBorder }]}
        >
          <AppText variant="callout" color={t.colors.accent}>
            View all
          </AppText>
          <ChevronRight size={14} color={t.colors.accent} strokeWidth={2.4} />
        </PressableScale>
      </View>

      {loading && !data ? (
        <View style={{ gap: 12 }}>
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </View>
      ) : error && !data ? (
        <View style={{ gap: 12 }}>
          {FALLBACK_FEED_ITEMS.slice(0, 4).map((item, i) => (
            <FeedCard key={item.id} item={item} index={i} />
          ))}
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {(data && data.length ? data : FALLBACK_FEED_ITEMS.slice(0, 4)).map((item, i) => (
            <FeedCard key={item.id} item={item} index={i} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: -6, marginBottom: 1 },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  meta: { marginTop: 14, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, gap: 6 },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
