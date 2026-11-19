import React, { useCallback, useState, useRef, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { ArrowRight, ChevronRight, FileSearch, SearchX } from 'lucide-react-native';
import { searchAll } from '../services/search';
import { friendlyError } from './ErrorState';
import type { SearchResults, SearchResultItem } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { cleanDocketQuery, isCaseDocketQuery } from '../utils/docketValidator';
import {
  ENTITY_META,
  SEARCH_FILTERS,
  SearchFilterKey,
  flattenResults,
  filterToCategory,
  navigateToResult,
  resultSubtitle,
} from '../utils/entities';
import { AppText, Chip, IconTile, PressableScale, SearchField, Skeleton } from './ui';

export default function UniversalSearch() {
  const navigation = useNavigation<any>();
  const t = useTheme();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<SearchFilterKey>('JUDGE');
  /** The query that was last searched (null until the user taps Search). */
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  // Nothing is fetched while typing — only when the user taps Search.
  const runSearch = useCallback(async (q: string, filter: SearchFilterKey) => {
    const id = ++seq.current;
    setSubmitted(q);
    setLoading(true);
    setError(null);
    try {
      const res = await searchAll(q, filter);
      if (id === seq.current) setResults(res);
    } catch (err) {
      if (id === seq.current) {
        setResults(null);
        setError(friendlyError(err).message);
      }
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, []);

  const onChangeQuery = (v: string) => {
    setQuery(v);
    if (!v.trim()) {
      seq.current++;
      setSubmitted(null);
      setResults(null);
      setError(null);
      setLoading(false);
    }
  };

  const onSelectFilter = (f: SearchFilterKey) => {
    setSelectedFilter(f);
    // Re-run only if a search has already been made.
    if (submitted) runSearch(submitted, f);
  };

  const allItems = useMemo(() => flattenResults(results, selectedFilter), [results, selectedFilter]);
  const looksLikeDocket = useMemo(() => isCaseDocketQuery(query), [query]);

  const reset = () => {
    setQuery('');
    setSubmitted(null);
    setResults(null);
  };

  const handleSelectItem = (item: SearchResultItem) => {
    reset();
    navigateToResult(navigation, item);
  };

  const openDocket = () => {
    const id = cleanDocketQuery(query);
    reset();
    navigation.navigate('CaseDetail', { id });
  };

  const seeAll = () => {
    const q = submitted ?? query.trim();
    reset();
    navigation.navigate('SearchResults', { query: q, initialCategory: filterToCategory(selectedFilter) });
  };

  const showDropdown = submitted !== null || looksLikeDocket;

  return (
    <View style={styles.container}>
      <SearchField
        size="lg"
        value={query}
        onChangeText={onChangeQuery}
        loading={loading}
        placeholder="Search names, cases, dockets…"
        onSubmit={(q) => runSearch(q, selectedFilter)}
        accessibilityLabel="Search legal records"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        keyboardShouldPersistTaps="handled"
      >
        {SEARCH_FILTERS.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            selected={selectedFilter === f.key}
            onPress={() => onSelectFilter(f.key)}
          />
        ))}
      </ScrollView>

      {showDropdown && (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
          layout={LinearTransition.duration(220)}
          style={[
            styles.dropdown,
            { backgroundColor: t.colors.surfaceElevated, borderColor: t.colors.border },
            t.shadow(3),
          ]}
        >
          {looksLikeDocket && (
            <PressableScale onPress={openDocket} haptic style={[styles.docketRow, { borderBottomColor: t.colors.divider }]}>
              <IconTile icon={FileSearch} tone="teal" size={36} />
              <View style={{ flex: 1 }}>
                <AppText variant="overline" color={t.colors.teal} style={{ fontSize: 9.5 }}>
                  Docket / citation detected
                </AppText>
                <AppText variant="title" numberOfLines={1}>
                  Open {cleanDocketQuery(query)}
                </AppText>
              </View>
              <ArrowRight size={18} color={t.colors.teal} />
            </PressableScale>
          )}

          {submitted === null ? null : loading && allItems.length === 0 ? (
            <View style={{ padding: 14, gap: 12 }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Skeleton width={36} height={36} radius={11} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Skeleton width="60%" height={12} />
                    <Skeleton width="38%" height={10} />
                  </View>
                </View>
              ))}
              <AppText variant="caption" align="center">
                Searching court records…
              </AppText>
            </View>
          ) : allItems.length === 0 ? (
            <View style={styles.empty}>
              <SearchX size={20} color={error ? t.colors.danger : t.colors.textTertiary} />
              <AppText variant="caption" align="center" style={{ marginTop: 6 }}>
                {error ? error : `No matching records found for “${submitted}”`}
              </AppText>
            </View>
          ) : (
            <>
              <ScrollView style={styles.list} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {allItems.map((item, i) => {
                  const meta = ENTITY_META[item.type];
                  return (
                    <Animated.View key={`${item.type}-${item.id}`} entering={FadeIn.delay(Math.min(i, 8) * 30).duration(200)}>
                      <PressableScale onPress={() => handleSelectItem(item)} style={styles.resultItem} scaleTo={0.985}>
                        <IconTile icon={meta.icon} tone={meta.tone} size={36} />
                        <View style={{ flex: 1 }}>
                          <AppText variant="title" numberOfLines={1}>
                            {item.name}
                          </AppText>
                          <AppText variant="caption" numberOfLines={1} style={{ marginTop: 1 }}>
                            {resultSubtitle(item)}
                          </AppText>
                        </View>
                        <AppText variant="overline" color={t.tone(meta.tone).fg} style={{ fontSize: 9 }}>
                          {meta.label}
                        </AppText>
                      </PressableScale>
                    </Animated.View>
                  );
                })}
              </ScrollView>
              <PressableScale onPress={seeAll} haptic style={[styles.seeAll, { borderTopColor: t.colors.divider }]}>
                <AppText variant="callout" color={t.colors.accent}>
                  See all {allItems.length} results
                </AppText>
                <ChevronRight size={15} color={t.colors.accent} />
              </PressableScale>
            </>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { zIndex: 100 },
  filterRow: { gap: 8, paddingTop: 12, paddingBottom: 2, paddingRight: 8 },
  dropdown: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, marginTop: 10, overflow: 'hidden' },
  docketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  list: { maxHeight: 300, paddingVertical: 4 },
  resultItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10 },
  empty: { padding: 20, alignItems: 'center' },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
