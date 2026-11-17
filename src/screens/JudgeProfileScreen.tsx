import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRoute } from '@react-navigation/native';
import {
  Award,
  BookOpen,
  Briefcase,
  CalendarClock,
  FileText,
  FolderOpen,
  GraduationCap,
  Landmark,
  Quote,
  UserRound,
} from 'lucide-react-native';
import * as cl from '../services/courtlistener';
import type { CaseRecord, JudgePosition } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { useAsync } from '../hooks/useAsync';
import { countBy, countByYear, useDecadeTimeline } from '../hooks/useDecadeTimeline';
import { formatCount, formatDate, yearOf, yearsBetween } from '../utils/format';
import TrendGraph from '../components/TrendGraph';
import DecadeTimelineTabs from '../components/DecadeTimelineTabs';
import CaseTable from '../components/CaseTable';
import { DetailScaffold } from '../components/DetailScaffold';
import { ProfileHero, HeroBadge } from '../components/ProfileHero';
import { BreakdownGrid } from '../components/BreakdownGrid';
import { StatGrid } from '../components/StatGrid';
import { ErrorState } from '../components/ErrorState';
import { AppText, Badge, ExpandableSection, InfoRow, SkeletonCard, enterUp } from '../components/ui';

function PositionRow({ p, last }: { p: JudgePosition; last: boolean }) {
  const t = useTheme();
  const range = [yearOf(p.dateStart), p.dateTermination ? yearOf(p.dateTermination) : p.dateStart ? 'Present' : undefined]
    .filter((x) => x !== undefined)
    .join(' – ');
  return (
    <View style={[styles.position, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.colors.divider }]}>
      <View style={[styles.dot, { backgroundColor: p.dateTermination ? t.colors.borderStrong : t.colors.success }]} />
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">{p.title}</AppText>
        {p.court ? <AppText variant="caption">{p.court}</AppText> : null}
        <View style={styles.badgeRow}>
          {range ? <Badge label={range} tone={p.dateTermination ? 'neutral' : 'success'} /> : null}
          {p.howSelected ? <Badge label={p.howSelected} tone="navy" /> : null}
        </View>
        {p.appointer ? (
          <AppText variant="caption" style={{ marginTop: 6 }}>
            Appointed by <AppText variant="caption" color={t.colors.text}>{p.appointer}</AppText>
            {p.dateConfirmation ? ` · confirmed ${formatDate(p.dateConfirmation)}` : ''}
          </AppText>
        ) : null}
        {p.terminationReason ? (
          <AppText variant="caption" style={{ marginTop: 2 }}>
            Ended: {p.terminationReason}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

export default function JudgeProfileScreen() {
  const route = useRoute<any>();
  const id: string = String(route.params?.id ?? '');

  const judge = useAsync(() => cl.getJudge(id), [id], { enabled: !!id });
  // All three load in parallel; each section renders as soon as its data arrives.
  const opinions = useAsync(() => cl.searchOpinions({ q: `author_id:${id}`, order_by: 'dateFiled desc' }, null, id), [id], {
    enabled: !!id,
  });
  const dockets = useAsync(() => cl.searchDockets({ q: `assigned_to_id:${id}`, order_by: 'dateFiled desc' }), [id], {
    enabled: !!id,
  });

  const [moreOpinions, setMoreOpinions] = useState<CaseRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null | undefined>(undefined);
  const [loadingMore, setLoadingMore] = useState(false);
  const cursor = nextCursor === undefined ? opinions.data?.next ?? null : nextCursor;

  const loadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const p = await cl.searchOpinions({}, cursor, id);
      setMoreOpinions((prev) => [...prev, ...p.results]);
      setNextCursor(p.next);
    } finally {
      setLoadingMore(false);
    }
  };

  const authored = useMemo(() => [...(opinions.data?.results ?? []), ...moreOpinions], [opinions.data, moreOpinions]);
  const records = useMemo(
    () => [...authored, ...(dockets.data?.results ?? [])].sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [authored, dockets.data],
  );
  const { selectedDecade, setSelectedDecade, decadeTabs, decadeFilteredItems } = useDecadeTimeline(records);
  const typeBreakdown = useMemo(() => countBy(authored, (r) => r.group), [authored]);
  const perYear = useMemo(() => countByYear(authored), [authored]);
  const citations = useMemo(() => authored.reduce((s, r) => s + (r.citeCount || 0), 0), [authored]);

  const j = judge.data;
  const judicial = j?.positions.filter((p) => p.isJudicial) ?? [];
  const current = judicial.find((p) => !p.dateTermination) ?? judicial[0];
  const firstStart = judicial.map((p) => p.dateStart).filter(Boolean).sort()[0];
  const lastEnd = judicial.some((p) => !p.dateTermination)
    ? null
    : judicial.map((p) => p.dateTermination).filter(Boolean).sort().reverse()[0];
  const benchYears = yearsBetween(firstStart, lastEnd);


  const badges: HeroBadge[] = [];
  if (current && !current.dateTermination) badges.push({ label: 'Active', tone: 'success', dot: true });
  j?.affiliations.slice(0, 1).forEach((a) => badges.push({ label: a.party, tone: 'navy' }));
  j?.abaRatings.slice(0, 1).forEach((r) => badges.push({ label: `ABA: ${r.rating}`, tone: 'gold', icon: Award }));

  return (
    <DetailScaffold
      title={j?.name}
      loading={judge.loading && !j}
      loadingLabel="Loading judicial profile…"
      notFound={!judge.loading && !j && !judge.error}
      notFoundTitle="Judge record not found."
    >
      {judge.error && !j ? (
        <ErrorState error={judge.error} onRetry={judge.reload} />
      ) : j ? (
        <>
          <ProfileHero
            name={j.name}
            imageUrl={j.photoUrl}
            eyebrow={current?.title || 'Judiciary'}
            subtitle={current?.court}
            badges={badges}
          />

          <StatGrid
            items={[
              {
                label: 'Opinions authored',
                value: formatCount(opinions.data?.count),
                icon: FileText,
                loading: opinions.loading && !opinions.data,
              },
              {
                label: 'Dockets assigned',
                value: formatCount(dockets.data?.count),
                icon: FolderOpen,
                tone: 'teal',
                loading: (dockets.loading || !dockets.data) && !dockets.error,
              },
              {
                label: 'Years on the bench',
                value: benchYears !== undefined ? String(benchYears) : '—',
                icon: CalendarClock,
                tone: 'success',
                hint: firstStart ? `Since ${yearOf(firstStart)}` : undefined,
              },
              {
                label: 'Times cited',
                value: formatCount(citations),
                icon: Quote,
                tone: 'info',
                hint: authored.length ? `Across ${authored.length} loaded opinions` : undefined,
                loading: opinions.loading && !opinions.data,
              },
            ]}
          />

          {j.positions.length ? (
            <Animated.View entering={enterUp(1)}>
              <ExpandableSection
                title="Career & appointments"
                subtitle={`${j.positions.length} positions on record`}
                icon={Briefcase}
                initiallyOpen
              >
                {j.positions.map((p, i) => (
                  <PositionRow key={p.id} p={p} last={i === j.positions.length - 1} />
                ))}
              </ExpandableSection>
            </Animated.View>
          ) : null}

          {j.dateOfBirth || j.birthplace || j.educations.length || j.affiliations.length ? (
            <Animated.View entering={enterUp(2)}>
              <ExpandableSection title="Biography" subtitle="Background & education" icon={UserRound}>
                {j.dateOfBirth || j.birthplace ? (
                  <InfoRow
                    icon={UserRound}
                    label="Born"
                    value={[yearOf(j.dateOfBirth), j.birthplace].filter(Boolean).join(' · ') || '—'}
                    sub={j.dateOfDeath ? `Died ${yearOf(j.dateOfDeath)}` : undefined}
                  />
                ) : null}
                {j.educations.map((e, i) => (
                  <InfoRow key={`${e.school}-${i}`} icon={GraduationCap} label="Education" value={e.school} sub={e.degree} />
                ))}
                {j.affiliations.length ? (
                  <InfoRow icon={Landmark} label="Political affiliation" value={j.affiliations.map((a) => a.party).join(', ')} />
                ) : null}
                {j.selectionMethods.length ? (
                  <InfoRow icon={BookOpen} label="Selection" value={j.selectionMethods.join(', ')} last />
                ) : null}
              </ExpandableSection>
            </Animated.View>
          ) : null}

          {opinions.loading && !opinions.data ? (
            <SkeletonCard lines={4} />
          ) : opinions.error ? (
            <ErrorState error={opinions.error} onRetry={opinions.reload} />
          ) : (
            <>
              <BreakdownGrid
                eyebrow="Authored opinions"
                title="Opinion types"
                items={typeBreakdown}
                unit="opinions"
                emptyText="No authored opinions indexed."
              />
              <TrendGraph
                title="Opinions per year"
                unit="opinions"
                points={perYear}
                headline={authored.length ? `${authored.length} most recent opinions` : undefined}
              />
            </>
          )}

          {records.length ? (
            <DecadeTimelineTabs selectedDecade={selectedDecade} onSelectDecade={setSelectedDecade} decadeTabs={decadeTabs} />
          ) : null}

          <CaseTable
            eyebrow="Case record"
            title="Opinions & dockets"
            records={decadeFilteredItems}
            total={(opinions.data?.count ?? 0) + (dockets.data?.count ?? 0) || undefined}
            onLoadMore={cursor ? loadMore : undefined}
            loadingMore={loadingMore}
          />
          {!opinions.data && !opinions.error ? (
            <AppText variant="caption" align="center">
              Loading records…
            </AppText>
          ) : null}
        </>
      ) : null}
    </DetailScaffold>
  );
}

const styles = StyleSheet.create({
  position: { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  dot: { width: 9, height: 9, borderRadius: 5, marginTop: 6 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
});
