import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown } from 'lucide-react-native';
import * as cl from '../services/courtlistener';
import type { FeedItem } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { CONTENT_MAX_WIDTH, useResponsive } from '../theme/responsive';
import { FeedCard, LivePulse } from '../components/LiveIntelligencePanel';
import { FALLBACK_FEED_ITEMS } from '../data/curatedData';
import { ErrorState } from '../components/ErrorState';
import { AppText, Button, HEADER_BAR_HEIGHT, ScreenHeader, SkeletonCard } from '../components/ui';

const byDateDesc = (a: FeedItem, b: FeedItem) => (b.date || '').localeCompare(a.date || '');

/** Live feed: newest case-law opinions and federal dockets, merged by date. */
export default function ActivityScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { gutter } = useResponsive();

  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const cursors = useRef<{ ops: string | null; dks: string | null }>({ ops: null, dks: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.allSettled([cl.latestOpinions(), cl.latestDockets()])
      .then(([ops, dks]) => {
        if (!active) return;
        const merged: FeedItem[] = [];
        cursors.current = { ops: null, dks: null };
        if (ops.status === 'fulfilled') {
          merged.push(...ops.value.feed);
          cursors.current.ops = ops.value.next;
        }
        if (dks.status === 'fulfilled') {
          merged.push(...dks.value.feed);
          cursors.current.dks = dks.value.next;
        }
        if (!merged.length) {
          setItems(FALLBACK_FEED_ITEMS);
        } else {
          setItems(merged.sort(byDateDesc));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => {
      active = false;
    };
  }, [tick]);

  const loadMore = useCallback(async () => {
    const { ops, dks } = cursors.current;
    if (loadingMore || (!ops && !dks)) return;
    setLoadingMore(true);
    const [a, b] = await Promise.allSettled([
      ops ? cl.latestOpinions(ops) : Promise.resolve(null),
      dks ? cl.latestDockets(dks) : Promise.resolve(null),
    ]);
    const more: FeedItem[] = [];
    if (a.status === 'fulfilled' && a.value) {
      more.push(...a.value.feed);
      cursors.current.ops = a.value.next;
    }
    if (b.status === 'fulfilled' && b.value) {
      more.push(...b.value.feed);
      cursors.current.dks = b.value.next;
    }
    setItems((prev) => {
      const seen = new Set(prev.map((p) => p.id));
      return [...prev, ...more.filter((m) => !seen.has(m.id))].sort(byDateDesc);
    });
    setLoadingMore(false);
  }, [loadingMore]);

  const hasMore = !!(cursors.current.ops || cursors.current.dks);

  const header = (
    <View style={{ marginBottom: 18 }}>
      <View style={[styles.livePill, { backgroundColor: t.tone('success').bg, borderColor: t.tone('success').border }]}>
        <LivePulse color={t.colors.success} size={7} />
        <AppText variant="overline" color={t.colors.success} style={{ fontSize: 10 }}>
          Live public record stream
        </AppText>
      </View>
      <AppText variant="h1" style={{ marginTop: 12 }}>
        Justice Intelligence Activity
      </AppText>
      <AppText variant="body" style={{ marginTop: 6 }}>
        The newest published opinions and federal court filings.
      </AppText>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: t.colors.background }]}>
      <ScreenHeader title="Activity" solid />
      <FlatList
        data={loading ? [] : items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        renderItem={({ item, index }) => <FeedCard item={item} index={index % 10} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          loading ? (
            <View style={{ gap: 12 }}>
              <SkeletonCard lines={2} />
              <SkeletonCard lines={2} />
              <SkeletonCard lines={2} />
            </View>
          ) : error ? (
            <ErrorState error={error} onRetry={() => setTick((x) => x + 1)} />
          ) : (
            <AppText variant="caption" align="center">
              No recent records.
            </AppText>
          )
        }
        ListFooterComponent={
          !loading && items.length && hasMore ? (
            <Button
              label="Load more"
              variant="secondary"
              size="sm"
              iconRight={ChevronDown}
              loading={loadingMore}
              onPress={loadMore}
              style={{ alignSelf: 'center', marginTop: 16 }}
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTick((x) => x + 1);
            }}
            tintColor={t.colors.accent}
            colors={[t.colors.accent]}
            progressBackgroundColor={t.colors.surface}
            progressViewOffset={insets.top + HEADER_BAR_HEIGHT}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + HEADER_BAR_HEIGHT + 12,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: gutter,
          width: '100%',
          maxWidth: CONTENT_MAX_WIDTH,
          alignSelf: 'center',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    paddingRight: 12,
    paddingLeft: 4,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
});
