import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, FileSearch, Search, SearchX } from 'lucide-react-native';
import { searchAll } from '../services/search';
import { ErrorState } from '../components/ErrorState';
import type { SearchResults, SearchResultItem } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { CONTENT_MAX_WIDTH, useResponsive, useTabBarSpace } from '../theme/responsive';
import { cleanDocketQuery, isCaseDocketQuery } from '../utils/docketValidator';
import {
  SEARCH_FILTERS,
  SearchFilterKey,
  categoryToFilter,
  flattenResults,
  totalFor,
  navigateToResult,
} from '../utils/entities';
import { ResultRow } from '../components/ResultRow';
import {
  AppText,
  Chip,
  EmptyState,
  HEADER_BAR_HEIGHT,
  IconTile,
  PressableScale,
  ScreenHeader,
  SearchField,
  SkeletonList,
  enterFade,
  enterUp,
} from '../components/ui';

export default function SearchResultsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { gutter } = useResponsive();
  const tabSpace = useTabBarSpace();

  // Rendered both as the "Search" tab and as the pushed "SearchResults" stack screen.
  const isPushed = route.name === 'SearchResults';
  const initialCategory: string | undefined = route.params?.initialCategory;
  const initialQuery: string = route.params?.query || '';

  const [query, setQuery] = useState<string>(initialQuery);
  const [selectedFilter, setSelectedFilter] = useState<SearchFilterKey>(categoryToFilter(initialCategory));
  /**
   * The last searched query. Opening a category or a query from Home loads it
   * once; otherwise nothing is fetched until the user taps Search.
   */
  const [submitted, setSubmitted] = useState<string | null>(initialQuery || initialCategory ? initialQuery : null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (submitted === null) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    searchAll(submitted, selectedFilter)
      .then((res) => {
        if (mounted) setResults(res);
      })
      .catch((err) => {
        if (mounted) {
          setResults(null);
          setError(err);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [submitted, selectedFilter, tick]);

  const onChangeQuery = (v: string) => {
    setQuery(v);
    if (!v.trim() && !initialCategory) {
      setSubmitted(null);
      setResults(null);
      setError(null);
    }
  };

  const onSubmit = (q: string) => {
    if (q === submitted) setTick((x) => x + 1);
    else setSubmitted(q);
  };

  const allItems = useMemo(() => flattenResults(results, selectedFilter), [results, selectedFilter]);
  const looksLikeDocket = useMemo(() => isCaseDocketQuery(query), [query]);

  const handleSelectItem = useCallback((item: SearchResultItem) => navigateToResult(navigation, item), [navigation]);

  const filterLabel = SEARCH_FILTERS.find((f) => f.key === selectedFilter)?.label ?? 'Records';
  const topPad = isPushed ? insets.top + HEADER_BAR_HEIGHT : insets.top + 8;
  const showSkeleton = loading && !results && !error;

  const listHeader = (
    <View>
      {!isPushed ? (
        <Animated.View entering={enterFade()} style={{ marginBottom: 16 }}>
          <AppText variant="overline" color={t.colors.accent}>
            Case search
          </AppText>
          <AppText variant="h1" style={{ marginTop: 4 }}>
            Search the record
          </AppText>
          <AppText variant="body" style={{ marginTop: 4 }}>
            Names, courts, offices, dockets and citations.
          </AppText>
        </Animated.View>
      ) : (
        <Animated.View entering={enterFade()} style={{ marginBottom: 14 }}>
          <AppText variant="h1">{filterLabel}</AppText>
        </Animated.View>
      )}

      <SearchField
        value={query}
        onChangeText={onChangeQuery}
        onSubmit={onSubmit}
        loading={loading && !!results}
        placeholder="Search by name, court, or office…"
        accessibilityLabel="Search records"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={{ marginHorizontal: -gutter }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: gutter - 8 }} />
        {SEARCH_FILTERS.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            count={selectedFilter === f.key ? totalFor(results, f.key) : undefined}
            selected={selectedFilter === f.key}
            onPress={() => setSelectedFilter(f.key)}
          />
        ))}
        <View style={{ width: gutter - 8 }} />
      </ScrollView>

      {looksLikeDocket ? (
        <Animated.View entering={enterUp(0)}>
          <PressableScale
            haptic
            onPress={() => navigation.navigate('CaseDetail', { id: cleanDocketQuery(query) })}
            style={[
              styles.docket,
              { backgroundColor: t.tone('teal').bg, borderColor: t.tone('teal').border },
            ]}
          >
            <IconTile icon={FileSearch} tone="teal" size={38} />
            <View style={{ flex: 1 }}>
              <AppText variant="overline" color={t.colors.teal} style={{ fontSize: 9.5 }}>
                Docket / citation detected
              </AppText>
              <AppText variant="title" numberOfLines={1}>
                Open docket {cleanDocketQuery(query)}
              </AppText>
            </View>
            <ArrowRight size={18} color={t.colors.teal} />
          </PressableScale>
        </Animated.View>
      ) : null}

      {submitted !== null && !showSkeleton && !error ? (
        <AppText variant="caption" style={{ marginTop: 16, marginBottom: 10 }}>
          {results?.errors.length
            ? `Showing ${allItems.length} records · some results may be missing`
            : `Showing ${allItems.length} records${submitted.trim() ? ` for “${submitted.trim()}”` : ''}`}
        </AppText>
      ) : (
        <View style={{ height: 16 }} />
      )}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: t.colors.background }]}>
      {isPushed ? <ScreenHeader title="Search Results" solid /> : null}
      <FlatList
        data={showSkeleton ? [] : allItems}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={({ item, index }) => (
          <Animated.View entering={enterUp(index)}>
            <ResultRow item={item} onPress={handleSelectItem} />
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          submitted === null ? (
            <EmptyState
              icon={Search}
              title="Search the record"
              message="Choose a category, type a name, court or docket number, then tap Search."
            />
          ) : showSkeleton ? (
            <SkeletonList count={7} />
          ) : error ? (
            <ErrorState error={error} onRetry={() => setTick((x) => x + 1)} />
          ) : (
            <EmptyState
              icon={SearchX}
              title="No records found"
              message={
                selectedFilter === 'ATTORNEY' || selectedFilter === 'PROSECUTOR'
                  ? 'Attorney names match from the start — try the first name first (e.g. “John Smith”).'
                  : 'Try a different name, court, docket number or citation.'
              }
            />
          )
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        windowSize={9}
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: gutter,
          paddingBottom: isPushed ? insets.bottom + 32 : tabSpace,
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
  filterRow: { gap: 8, paddingTop: 12, paddingBottom: 4 },
  docket: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
});
