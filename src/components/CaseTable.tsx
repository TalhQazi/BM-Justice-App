import React, { useState, useMemo, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { CalendarDays, ChevronDown, FileX, Landmark, Quote } from 'lucide-react-native';
import type { CaseRecord } from '../types';
import type { ToneKey } from '../theme/themes';
import { useTheme } from '../theme/ThemeProvider';
import { formatDate } from '../utils/format';
import { AppText, Badge, Button, Chip, EmptyState, PressableScale, SearchField, SectionHeader, enterUp } from './ui';

interface CaseTableProps {
  records: CaseRecord[];
  title?: string;
  eyebrow?: string;
  /** Total records available at the source (may exceed `records.length`). */
  total?: number;
  /** Shown when more records exist upstream. */
  onLoadMore?: () => void;
  loadingMore?: boolean;
}

const PAGE_SIZE = 20;

function groupTone(group?: string, kind?: CaseRecord['kind']): ToneKey {
  const g = (group || '').toLowerCase();
  if (g.includes('dissent')) return 'danger';
  if (g.includes('concur')) return 'info';
  if (g.includes('lead') || g.includes('majority') || g.includes('unanimous') || g.includes('combined')) return 'gold';
  if (g.includes('plurality')) return 'plum';
  return kind === 'docket' ? 'teal' : 'navy';
}

export default function CaseTable({
  records,
  title = 'Case record',
  eyebrow = 'Records',
  total,
  onLoadMore,
  loadingMore,
}: CaseTableProps) {
  const navigation = useNavigation<any>();
  const t = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const groups = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((r) => r.group && map.set(r.group, (map.get(r.group) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [records]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return records.filter((r) => {
      if (selectedGroup !== 'ALL' && r.group !== selectedGroup) return false;
      if (!q) return true;
      return [r.title, r.court, r.docketNumber, r.group, ...(r.citations || [])]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q));
    });
  }, [records, selectedGroup, searchQuery]);

  useEffect(() => setVisibleCount(PAGE_SIZE), [records, selectedGroup, searchQuery]);

  const visible = filtered.slice(0, visibleCount);
  const remainingLocal = filtered.length - visible.length;

  return (
    <View>
      <SectionHeader eyebrow={eyebrow} title={title} />
      <AppText variant="caption" style={{ marginTop: -6, marginBottom: 12 }}>
        {total !== undefined && total > records.length
          ? `Showing ${records.length.toLocaleString()} of ${total.toLocaleString()} records · tap to open`
          : `${records.length.toLocaleString()} records · tap a record to open it`}
      </AppText>

      <SearchField value={searchQuery} onChangeText={setSearchQuery} placeholder="Filter records…" accessibilityLabel="Filter records" />

      {groups.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
          <Chip label="All" count={records.length} selected={selectedGroup === 'ALL'} onPress={() => setSelectedGroup('ALL')} />
          {groups.map(([g, n]) => (
            <Chip key={g} label={g} count={n} selected={selectedGroup === g} onPress={() => setSelectedGroup(g)} />
          ))}
        </ScrollView>
      ) : (
        <View style={{ height: 14 }} />
      )}

      {filtered.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: t.colors.surfaceSunken, borderColor: t.colors.divider }]}>
          <EmptyState
            icon={FileX}
            title="No records found"
            message={records.length ? 'No records match this filter.' : 'There are no records for this profile yet.'}
          />
        </View>
      ) : (
        <View style={styles.list}>
          {visible.map((r, i) => {
            const tone = groupTone(r.group, r.kind);
            return (
              <Animated.View key={r.id} entering={enterUp(i % PAGE_SIZE)}>
                <PressableScale
                  onPress={() => navigation.navigate('CaseDetail', { id: r.id })}
                  scaleTo={0.985}
                  accessibilityLabel={r.title}
                  style={[styles.caseCard, { backgroundColor: t.colors.surface, borderColor: t.colors.border }, t.shadow(1)]}
                >
                  <View style={[styles.toneBar, { backgroundColor: t.tone(tone).fg }]} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.caseTop}>
                      <Badge label={r.kind === 'opinion' ? 'Opinion' : 'Docket'} tone={r.kind === 'opinion' ? 'gold' : 'teal'} />
                      <View style={styles.row}>
                        <CalendarDays size={12} color={t.colors.textTertiary} />
                        <AppText variant="caption">{formatDate(r.date)}</AppText>
                      </View>
                    </View>

                    <AppText variant="title" style={{ marginTop: 10 }} numberOfLines={2}>
                      {r.title}
                    </AppText>
                    <View style={[styles.row, { marginTop: 4 }]}>
                      <Landmark size={11} color={t.colors.textTertiary} />
                      <AppText variant="caption" numberOfLines={1} style={{ flex: 1 }}>
                        {[r.court, r.docketNumber].filter(Boolean).join(' · ')}
                      </AppText>
                    </View>
                    {r.citations && r.citations.length ? (
                      <View style={[styles.row, { marginTop: 4 }]}>
                        <Quote size={11} color={t.colors.textTertiary} />
                        <AppText variant="mono" numberOfLines={1} style={{ flex: 1, fontSize: 11 }}>
                          {r.citations.slice(0, 2).join(' · ')}
                        </AppText>
                      </View>
                    ) : null}

                    <View style={styles.bottomRow}>
                      {r.group ? <Badge label={r.group} tone={tone} /> : <View />}
                      <View style={styles.row}>
                        {typeof r.citeCount === 'number' && r.citeCount > 0 ? (
                          <AppText variant="caption" color={t.colors.accent} style={{ fontFamily: t.fonts.sansSemi }}>
                            Cited {r.citeCount.toLocaleString()}×
                          </AppText>
                        ) : null}

                      </View>
                    </View>
                  </View>
                </PressableScale>
              </Animated.View>
            );
          })}

          {remainingLocal > 0 ? (
            <Button
              label={`Show ${Math.min(remainingLocal, PAGE_SIZE)} more · ${remainingLocal} remaining`}
              variant="secondary"
              size="sm"
              iconRight={ChevronDown}
              onPress={() => setVisibleCount((n) => n + PAGE_SIZE)}
              style={{ alignSelf: 'center', marginTop: 4 }}
            />
          ) : onLoadMore ? (
            <Button
              label="Load more records"
              variant="secondary"
              size="sm"
              iconRight={ChevronDown}
              loading={loadingMore}
              onPress={onLoadMore}
              style={{ alignSelf: 'center', marginTop: 4 }}
            />
          ) : null}
        </View>
      )}

      <AppText variant="caption" align="center" style={{ marginTop: 16, fontStyle: 'italic' }}>
        Public court records.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pills: { gap: 8, paddingTop: 12, paddingBottom: 14, paddingRight: 8 },
  list: { gap: 10 },
  caseCard: { flexDirection: 'row', gap: 12, padding: 14, paddingLeft: 12, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  toneBar: { width: 3, borderRadius: 2, alignSelf: 'stretch', opacity: 0.85 },
  caseTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8 },
  extBtn: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
});
