import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowDownAZ, Gavel, Sparkles, UserSearch } from 'lucide-react-native';
import * as cl from '../services/courtlistener';
import type { SearchResultItem } from '../types';
import { CURATED_JUDGES } from '../data/curatedData';
import { useTheme } from '../theme/ThemeProvider';
import { CONTENT_MAX_WIDTH, useResponsive, useTabBarSpace } from '../theme/responsive';
import { navigateToResult } from '../utils/entities';
import { formatCount } from '../utils/format';
import { usePaginated } from '../hooks/usePaginated';
import { ResultRow } from '../components/ResultRow';
import { ErrorState } from '../components/ErrorState';
import { AppText, EmptyState, SearchField, SegmentedControl, SkeletonList, enterFade, enterUp } from '../components/ui';

type SortKey = 'name' | 'relevance';

export default function JudgesDirectoryScreen() {
  const navigation = useNavigation<any>();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { gutter } = useResponsive();
  const tabSpace = useTabBarSpace();

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('name');
  // The searched term — set only when the user taps Search (no requests while typing).
  const [q, setQ] = useState('');
  const onChangeQuery = (v: string) => {
    setQuery(v);
    if (!v.trim()) setQ('');
  };

  const { items, count, loading, loadingMore, refreshing, error, loadMore, refresh, hasMore } = usePaginated<SearchResultItem>(
    (next) => cl.searchJudges(q, { order: sort, next }),
    [q, sort],
  );

  const fallbackFiltered = useMemo(() => {
    if (!q.trim()) return CURATED_JUDGES;
    const norm = q.toLowerCase();
    return CURATED_JUDGES.filter(
      (j) => j.name.toLowerCase().includes(norm) || (j.subtitle && j.subtitle.toLowerCase().includes(norm)),
    );
  }, [q]);

  const displayItems = items.length > 0 ? items : fallbackFiltered;

  const onPress = useCallback((item: SearchResultItem) => navigateToResult(navigation, item), [navigation]);
  const showSkeleton = loading && !items.length && !error;

  const header = (
    <View>
      <Animated.View entering={enterFade()}>
        <AppText variant="overline" color={t.colors.accent}>
          Directory
        </AppText>
        <AppText variant="h1" style={{ marginTop: 4 }}>
          Judges & Justices
        </AppText>
        <AppText variant="body" style={{ marginTop: 4 }}>
          Federal and state judges, their careers and opinions.
        </AppText>
      </Animated.View>

      <Animated.View
        entering={enterUp(0)}
        style={[styles.stat, { backgroundColor: t.colors.surface, borderColor: t.colors.border }, t.shadow(1)]}
      >
        <Gavel size={16} color={t.colors.accent} strokeWidth={2} />
        <View>
          <AppText variant="statSm">{loading && count === undefined ? '—' : formatCount(count)}</AppText>
          <AppText variant="caption">{q.trim() ? `judges matching “${q.trim()}”` : 'judges indexed'}</AppText>
        </View>
      </Animated.View>

      <SearchField
        value={query}
        onChangeText={onChangeQuery}
        onSubmit={setQ}
        loading={loading && !!items.length}
        placeholder="Search judges by name…"
        accessibilityLabel="Search judges"
      />

      <View style={{ marginTop: 12, marginBottom: 16 }}>
        <SegmentedControl<SortKey>
          value={sort}
          onChange={setSort}
          segments={[
            { key: 'name', label: 'A–Z', icon: ArrowDownAZ },
            { key: 'relevance', label: 'Relevance', icon: Sparkles },
          ]}
        />
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: t.colors.background }]}>
      <FlatList
        data={showSkeleton && !items.length && !displayItems.length ? [] : displayItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Animated.View entering={enterUp(index % 20)}>
            <ResultRow item={item} onPress={onPress} showType={false} />
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          showSkeleton ? (
            <SkeletonList count={7} />
          ) : error ? (
            <ErrorState error={error} onRetry={refresh} />
          ) : (
            <EmptyState icon={UserSearch} title="No judges found" message={q ? `No judicial records match “${q}”.` : undefined} />
          )
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator color={t.colors.accent} style={{ marginTop: 16 }} /> : null}
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={t.colors.accent}
            colors={[t.colors.accent]}
            progressBackgroundColor={t.colors.surface}
          />
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        windowSize={9}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: gutter,
          paddingBottom: tabSpace,
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
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 18,
    marginBottom: 16,
  },
});
