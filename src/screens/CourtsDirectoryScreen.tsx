import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2, CalendarDays, ChevronRight, Landmark } from 'lucide-react-native';
import * as cl from '../services/courtlistener';
import type { Court, SearchResultItem } from '../types';
import { FALLBACK_COURTS } from '../data/curatedData';
import type { ToneKey } from '../theme/themes';
import { useTheme } from '../theme/ThemeProvider';
import { CONTENT_MAX_WIDTH, useResponsive, useTabBarSpace } from '../theme/responsive';
import { navigateToResult } from '../utils/entities';
import { formatCount, yearOf } from '../utils/format';
import { useAsync } from '../hooks/useAsync';
import { usePaginated } from '../hooks/usePaginated';
import { ResultRow } from '../components/ResultRow';
import { ErrorState } from '../components/ErrorState';
import {
  AppText,
  Badge,
  BottomSheet,
  Card,
  Chip,
  EmptyState,
  IconTile,
  SearchField,
  Skeleton,
  SkeletonList,
  enterFade,
  enterUp,
} from '../components/ui';

const FILTERS: { key: string; label: string }[] = [
  { key: 'F', label: 'Federal Appellate' },
  { key: 'FD', label: 'Federal District' },
  { key: 'FB', label: 'Bankruptcy' },
  { key: 'FS', label: 'Federal Special' },
  { key: 'S', label: 'State Supreme' },
  { key: 'SA', label: 'State Appellate' },
  { key: 'ST', label: 'State Trial' },
  { key: 'SS', label: 'State Special' },
  { key: 'MA', label: 'Military' },
  { key: 'TRS', label: 'Tribal' },
];

function toneFor(j: string): ToneKey {
  if (j === 'F' || j === 'S') return 'gold';
  if (j.startsWith('F')) return 'info';
  if (j.startsWith('S')) return 'teal';
  if (j.startsWith('M')) return 'plum';
  return 'neutral';
}

/** Live detail for one court: its judges and recent opinions (loaded when opened). */
function CourtSheetBody({ court, onOpen }: { court: Court; onOpen: (item: SearchResultItem) => void }) {
  const t = useTheme();
  const { data, error, loading, reload } = useAsync(async () => {
    const [judges, opinions] = await Promise.allSettled([
      cl.searchJudges('', { court: court.id }),
      cl.searchOpinions({ court: court.id, order_by: 'dateFiled desc' }),
    ]);
    if (judges.status === 'rejected' && opinions.status === 'rejected') throw judges.reason;
    return {
      judges: judges.status === 'fulfilled' ? judges.value : null,
      opinions: opinions.status === 'fulfilled' ? opinions.value : null,
    };
  }, [court.id]);

  const facts = [
    court.citation ? { label: 'Citation', value: court.citation } : null,
    { label: 'Jurisdiction', value: court.jurisdictionLabel },
    court.startDate ? { label: 'Established', value: String(yearOf(court.startDate) ?? court.startDate) } : null,
    court.endDate ? { label: 'Closed', value: String(yearOf(court.endDate) ?? court.endDate) } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 10 }}>
      <View style={styles.facts}>
        {facts.map((f) => (
          <View key={f.label} style={[styles.fact, { backgroundColor: t.colors.surfaceSunken }]}>
            <AppText variant="overline" style={{ fontSize: 9 }}>
              {f.label}
            </AppText>
            <AppText variant="bodyStrong" style={{ fontSize: 13, marginTop: 2 }} numberOfLines={1}>
              {f.value}
            </AppText>
          </View>
        ))}
      </View>

      {loading ? (
        <View style={{ gap: 10, marginTop: 6 }}>
          <Skeleton width="40%" height={12} />
          <SkeletonList count={3} />
        </View>
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        <>
          <AppText variant="overline" style={{ marginTop: 8 }}>
            Bench · {formatCount(data?.judges?.count)} judges
          </AppText>
          {data?.judges?.results.length ? (
            data.judges.results.slice(0, 15).map((j) => <ResultRow key={`j-${j.id}`} item={j} onPress={onOpen} showType={false} />)
          ) : (
            <AppText variant="caption">No judges indexed for this court.</AppText>
          )}

          <AppText variant="overline" style={{ marginTop: 12 }}>
            Recent opinions · {formatCount(data?.opinions?.count)} total
          </AppText>
          {data?.opinions?.results.length ? (
            data.opinions.results
              .slice(0, 10)
              .map((o) => <ResultRow key={o.id} item={cl.recordToSearchItem(o)} onPress={onOpen} showType={false} />)
          ) : (
            <AppText variant="caption">No published opinions indexed for this court.</AppText>
          )}
        </>
      )}
    </ScrollView>
  );
}

export default function CourtsDirectoryScreen() {
  const navigation = useNavigation<any>();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { gutter } = useResponsive();
  const tabSpace = useTabBarSpace();

  const [query, setQuery] = useState('');
  // The searched term — set only when the user taps Search.
  const [q, setQ] = useState('');
  const onChangeQuery = (v: string) => {
    setQuery(v);
    if (!v.trim()) setQ('');
  };
  const [jurisdiction, setJurisdiction] = useState('F');
  const [selected, setSelected] = useState<Court | null>(null);
  // Keep the last court rendered while the sheet animates closed.
  const lastSelected = useRef<Court | null>(null);
  if (selected) lastSelected.current = selected;
  const sheetCourt = selected ?? lastSelected.current;

  // /courts/ is public, so these requests don't use the token's budget.
  const { items, count, loading, loadingMore, refreshing, error, loadMore, refresh, hasMore } = usePaginated<Court>(
    (next) => cl.listCourts({ jurisdiction: q ? undefined : jurisdiction, nameStartsWith: q || undefined, next }),
    [q, jurisdiction],
  );

  const fallbackFiltered = useMemo(() => {
    return FALLBACK_COURTS.filter((c) => {
      if (q.trim()) {
        const norm = q.toLowerCase();
        return c.fullName.toLowerCase().includes(norm) || c.shortName.toLowerCase().includes(norm);
      }
      return !jurisdiction || c.jurisdiction === jurisdiction;
    });
  }, [q, jurisdiction]);

  const displayItems = items.length > 0 ? items : fallbackFiltered;

  const openItem = useCallback(
    (item: SearchResultItem) => {
      setSelected(null);
      setTimeout(() => navigateToResult(navigation, item), 180);
    },
    [navigation],
  );

  const showSkeleton = loading && !items.length && !error;

  const header = (
    <View>
      <Animated.View entering={enterFade()}>
        <AppText variant="overline" color={t.colors.accent}>
          Directory
        </AppText>
        <AppText variant="h1" style={{ marginTop: 4 }}>
          Courts
        </AppText>
        <AppText variant="body" style={{ marginTop: 4, marginBottom: 16 }}>
          Every active federal and state court, with its bench and opinions.
        </AppText>
      </Animated.View>

      <SearchField
        value={query}
        onChangeText={onChangeQuery}
        onSubmit={setQ}
        loading={loading && !!items.length}
        placeholder="Court name or citation (e.g. Ninth, Cal.)…"
        accessibilityLabel="Search courts"
      />

      {!q ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -gutter }}
          contentContainerStyle={{ gap: 8, paddingTop: 12, paddingBottom: 6 }}
        >
          <View style={{ width: gutter - 8 }} />
          {FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              count={jurisdiction === f.key ? count : undefined}
              selected={jurisdiction === f.key}
              onPress={() => setJurisdiction(f.key)}
            />
          ))}
          <View style={{ width: gutter - 8 }} />
        </ScrollView>
      ) : null}
      <View style={{ height: 12 }} />
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: t.colors.background }]}>
      <FlatList
        data={showSkeleton && !items.length && !displayItems.length ? [] : displayItems}
        keyExtractor={(c) => c.id}
        renderItem={({ item, index }) => (
          <Animated.View entering={enterUp(index % 20)}>
            <Card onPress={() => setSelected(item)} haptic accessibilityLabel={item.fullName}>
              <View style={styles.courtTop}>
                <IconTile
                  icon={item.jurisdiction === 'F' || item.jurisdiction === 'S' ? Landmark : Building2}
                  tone={toneFor(item.jurisdiction)}
                  size={46}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText variant="title" numberOfLines={2}>
                    {item.fullName}
                  </AppText>
                  <View style={styles.row}>
                    {item.citation ? (
                      <AppText variant="mono" style={{ fontSize: 11 }}>
                        {item.citation}
                      </AppText>
                    ) : null}
                    {item.startDate ? (
                      <View style={styles.row}>
                        <CalendarDays size={11} color={t.colors.textTertiary} />
                        <AppText variant="caption">Since {yearOf(item.startDate)}</AppText>
                      </View>
                    ) : null}
                  </View>
                </View>
                <ChevronRight size={18} color={t.colors.textTertiary} />
              </View>
              <View style={[styles.courtFooter, { borderTopColor: t.colors.divider }]}>
                <Badge label={item.jurisdictionLabel} tone={toneFor(item.jurisdiction)} />
                <AppText variant="caption" numberOfLines={1} style={{ flexShrink: 1 }}>
                  {item.shortName !== item.fullName ? item.shortName : ''}
                </AppText>
              </View>
            </Card>
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          showSkeleton ? (
            <SkeletonList count={6} />
          ) : error ? (
            <ErrorState error={error} onRetry={refresh} />
          ) : (
            <EmptyState icon={Landmark} title="No courts found" message={q ? `No court names start with “${q}”.` : undefined} />
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
        initialNumToRender={8}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: gutter,
          paddingBottom: tabSpace,
          width: '100%',
          maxWidth: CONTENT_MAX_WIDTH,
          alignSelf: 'center',
        }}
      />

      <BottomSheet
        visible={!!selected}
        onClose={() => setSelected(null)}
        title={sheetCourt?.fullName}
        subtitle={sheetCourt ? `${sheetCourt.jurisdictionLabel}${sheetCourt.citation ? ` · ${sheetCourt.citation}` : ''}` : undefined}
      >
        {sheetCourt ? <CourtSheetBody key={sheetCourt.id} court={sheetCourt} onOpen={openItem} /> : null}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  courtTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  courtFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fact: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, minWidth: '30%' },
});
