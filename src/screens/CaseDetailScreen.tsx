import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  FileText,
  Gavel,
  Landmark,
  Paperclip,
  Quote,
  Scale,
  ScrollText,
  Users,
} from 'lucide-react-native';
import * as cl from '../services/courtlistener';
import type { ClusterDetail, DocketDetail, DocketEntry } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { useAsync } from '../hooks/useAsync';
import { formatDate } from '../utils/format';
import { DetailScaffold } from '../components/DetailScaffold';
import { ProfileHero, HeroBadge } from '../components/ProfileHero';
import { ErrorState } from '../components/ErrorState';
import {
  AppText,
  Badge,
  Button,
  Card,
  Chevron,
  Collapse,
  ExpandableSection,
  IconTile,
  InfoRow,
  PressableScale,
  SectionHeader,
  Skeleton,
  SkeletonCard,
  enterUp,
} from '../components/ui';

/* ------------------------------------------------------------- opinion */

/** A sub-opinion whose text is fetched only when expanded. */
function OpinionCard({ opinionId, index }: { opinionId: string; index: number }) {
  const t = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const op = useAsync(() => cl.getOpinion(opinionId), [opinionId], { enabled: expanded });
  const text = op.data?.text || '';
  const preview = showAll ? text : text.slice(0, 2500);

  return (
    <Animated.View entering={enterUp(index)}>
      <View style={[styles.opCard, { backgroundColor: t.colors.surface, borderColor: t.colors.border }, t.shadow(1)]}>
        <PressableScale onPress={() => setExpanded((e) => !e)} scaleTo={0.99} style={styles.opHeader}>
          <IconTile icon={ScrollText} tone="gold" size={38} />
          <View style={{ flex: 1 }}>
            <AppText variant="title">{op.data ? op.data.type : `Opinion ${index + 1}`}</AppText>
            <AppText variant="caption" numberOfLines={1}>
              {op.data
                ? op.data.perCuriam
                  ? 'Per curiam'
                  : op.data.author || 'Author not identified'
                : 'Tap to load the opinion text'}
            </AppText>
          </View>
          <Chevron open={expanded} color={t.colors.textTertiary} />
        </PressableScale>
        <Collapse open={expanded}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {op.loading ? (
              <View style={{ gap: 8 }}>
                <Skeleton height={11} />
                <Skeleton height={11} />
                <Skeleton width="70%" height={11} />
              </View>
            ) : op.error ? (
              <ErrorState error={op.error} onRetry={op.reload} />
            ) : op.data ? (
              <>
                {op.data.joinedBy ? (
                  <AppText variant="caption" style={{ marginBottom: 10 }}>
                    Joined by {op.data.joinedBy}
                  </AppText>
                ) : null}
                <AppText variant="body" style={{ fontFamily: t.fonts.sans, lineHeight: 22 }} selectable>
                  {preview || 'No text is available for this opinion.'}
                </AppText>
                {text.length > 2500 ? (
                  <Button
                    label={showAll ? 'Show less' : `Read full opinion (${Math.round(text.length / 1000)}k characters)`}
                    variant="secondary"
                    size="sm"
                    iconRight={ChevronDown}
                    onPress={() => setShowAll((s) => !s)}
                    style={{ marginTop: 12 }}
                  />
                ) : null}
              </>
            ) : null}
          </View>
        </Collapse>
      </View>
    </Animated.View>
  );
}

/* --------------------------------------------------------- docket entry */

function EntryRow({ entry, index, isLast, caseName }: { entry: DocketEntry; index: number; isLast: boolean; caseName: string }) {
  const t = useTheme();
  const navigation = useNavigation<any>();
  const [openRow, setOpenRow] = useState(index === 0);
  const long = entry.description.length > 160 || entry.documents.length > 0;
  return (
    <Animated.View entering={enterUp(index % 10)} style={styles.stepRow}>
      <View style={styles.rail}>
        <View style={[styles.stepDot, { backgroundColor: t.tone('teal').bg, borderColor: t.colors.teal }]}>
          <AppText variant="caption" color={t.colors.teal} style={{ fontFamily: t.fonts.sansBold, fontSize: 10.5 }} numberOfLines={1}>
            {entry.entryNumber ?? '•'}
          </AppText>
        </View>
        {!isLast ? <View style={[styles.railLine, { backgroundColor: t.colors.border }]} /> : null}
      </View>
      <View style={{ flex: 1, paddingBottom: isLast ? 0 : 14 }}>
        <PressableScale
          onPress={() => long && setOpenRow((o) => !o)}
          scaleTo={long ? 0.985 : 1}
          style={[styles.stepCard, { backgroundColor: t.colors.surface, borderColor: t.colors.border }, t.shadow(1)]}
        >
          <View style={styles.stepTop}>
            <AppText variant="caption">{formatDate(entry.dateFiled)}</AppText>
            <View style={{ flex: 1 }} />
            {entry.documents.length ? <Badge label={`${entry.documents.length} doc${entry.documents.length > 1 ? 's' : ''}`} tone="teal" icon={Paperclip} /> : null}
            {long ? <Chevron open={openRow} color={t.colors.textTertiary} size={16} /> : null}
          </View>
          <AppText variant="body" style={{ marginTop: 6 }} numberOfLines={openRow ? undefined : 3}>
            {entry.description}
          </AppText>
          <Collapse open={openRow && entry.documents.length > 0}>
            <View style={{ paddingTop: 10, gap: 6 }}>
              {entry.documents.map((d) => (
                <PressableScale
                  key={d.id}
                  onPress={() => navigation.push('Document', { id: d.id, caseName })}
                  style={[styles.doc, { backgroundColor: t.colors.surfaceSunken }]}
                >
                  <FileText size={14} color={d.available ? t.colors.accent : t.colors.textTertiary} />
                  <AppText variant="caption" style={{ flex: 1 }} numberOfLines={2}>
                    {d.description}
                    {d.pageCount ? ` · ${d.pageCount} pp.` : ''}
                    {d.available ? '' : ' · not yet available'}
                  </AppText>
                  <ArrowRight size={13} color={t.colors.accent} />
                </PressableScale>
              ))}
            </View>
          </Collapse>
        </PressableScale>
      </View>
    </Animated.View>
  );
}

/* --------------------------------------------------------------- parts */

function PartiesSection({ docketId }: { docketId: string }) {
  const t = useTheme();
  const [expanded, setExpanded] = useState(false);
  const parties = useAsync(() => cl.getDocketParties(docketId), [docketId], { enabled: expanded });
  return (
    <View style={[styles.opCard, { backgroundColor: t.colors.surface, borderColor: t.colors.border }, t.shadow(1)]}>
      <PressableScale onPress={() => setExpanded((e) => !e)} scaleTo={0.99} style={styles.opHeader}>
        <IconTile icon={Users} tone="plum" size={38} />
        <View style={{ flex: 1 }}>
          <AppText variant="title">Parties & counsel</AppText>
          <AppText variant="caption">
            {parties.data ? `${parties.data.length} parties on the docket` : 'Tap to view parties and their lawyers'}
          </AppText>
        </View>
        <Chevron open={expanded} color={t.colors.textTertiary} />
      </PressableScale>
      <Collapse open={expanded}>
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          {parties.loading ? (
            <ActivityIndicator color={t.colors.accent} style={{ marginVertical: 12 }} />
          ) : parties.error ? (
            <ErrorState error={parties.error} onRetry={parties.reload} />
          ) : parties.data && parties.data.length ? (
            parties.data.map((p, i) => (
              <View
                key={p.id}
                style={[styles.party, i < parties.data!.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.colors.divider }]}
              >
                <View style={styles.partyTop}>
                  <AppText variant="bodyStrong" style={{ flex: 1 }}>
                    {p.name}
                  </AppText>
                  {p.roles[0] ? <Badge label={p.roles[0]} tone={/defend|respond|appellee/i.test(p.roles[0]) ? 'plum' : 'teal'} /> : null}
                </View>
                {p.attorneys.length ? (
                  <AppText variant="caption" style={{ marginTop: 4 }}>
                    Counsel: {p.attorneys.join(', ')}
                  </AppText>
                ) : null}
              </View>
            ))
          ) : (
            <AppText variant="caption">No party records are available for this docket.</AppText>
          )}
        </View>
      </Collapse>
    </View>
  );
}

function DateTiles({ tiles }: { tiles: { label: string; value?: string | null; icon: any }[] }) {
  const t = useTheme();
  const shown = tiles.filter((x) => x.value);
  if (!shown.length) return null;
  return (
    <Animated.View entering={enterUp(1)} style={styles.metaGrid}>
      {shown.map((m) => (
        <View key={m.label} style={[styles.metaTile, { backgroundColor: t.colors.surface, borderColor: t.colors.border }, t.shadow(1)]}>
          <m.icon size={15} color={t.colors.accent} />
          <AppText variant="overline" style={{ fontSize: 9, marginTop: 8 }} numberOfLines={1}>
            {m.label}
          </AppText>
          <AppText variant="bodyStrong" style={{ marginTop: 2, fontSize: 13 }} numberOfLines={2}>
            {formatDate(m.value)}
          </AppText>
        </View>
      ))}
    </Animated.View>
  );
}

/* --------------------------------------------------------------- screen */

interface CaseData {
  kind: 'cluster' | 'docket';
  cluster?: ClusterDetail;
  docket?: DocketDetail;
  courtName?: string;
}

async function loadCase(routeId: string): Promise<CaseData | null> {
  const target = await cl.resolveCase(routeId);
  if (!target) return null;
  if (target.kind === 'cluster') {
    const cluster = await cl.getCluster(target.id);
    const docket = cluster.docketId ? await cl.getDocket(cluster.docketId).catch(() => undefined) : undefined;
    return { kind: 'cluster', cluster, docket, courtName: await cl.courtName(docket?.courtId) };
  }
  const docket = await cl.getDocket(target.id);
  return { kind: 'docket', docket, courtName: await cl.courtName(docket.courtId) };
}

export default function CaseDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const t = useTheme();
  const id: string = String(route.params?.id ?? '');

  const data = useAsync(() => loadCase(id), [id], { enabled: !!id });
  // For docket links the id is known up front, so entries load in parallel with the docket.
  const routeDocketId = /^docket:(.+)$/.exec(id)?.[1];
  const docketId = routeDocketId ?? (data.data?.kind === 'docket' ? data.data.docket?.id : undefined);
  const entries = useAsync(() => cl.getDocketEntries(docketId!), [docketId], { enabled: !!docketId });
  const [moreEntries, setMoreEntries] = useState<DocketEntry[]>([]);
  const [entryCursor, setEntryCursor] = useState<string | null | undefined>(undefined);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const cursor = entryCursor === undefined ? entries.data?.next ?? null : entryCursor;

  const loadMoreEntries = async () => {
    if (!cursor || !docketId) return;
    setLoadingEntries(true);
    try {
      const p = await cl.getDocketEntries(docketId, cursor);
      setMoreEntries((prev) => [...prev, ...p.entries]);
      setEntryCursor(p.next);
    } finally {
      setLoadingEntries(false);
    }
  };

  const d = data.data;
  const c = d?.cluster;
  const k = d?.docket;
  const title = c?.caseName || k?.caseName || '';
  const allEntries = [...(entries.data?.entries ?? []), ...moreEntries];

  const badges: HeroBadge[] = [];
  if (c?.status) badges.push({ label: c.status, tone: 'success', dot: true });
  if (k && !c) badges.push(k.dateTerminated ? { label: 'Terminated', tone: 'neutral' } : { label: 'Open', tone: 'success', dot: true });
  if (d?.courtName) badges.push({ label: d.courtName, tone: 'gold', icon: Landmark });
  if (k?.natureOfSuit) badges.push({ label: k.natureOfSuit, tone: 'info' });

  return (
    <DetailScaffold
      title={k?.docketNumber ? `#${k.docketNumber}` : title}
      loading={data.loading && !d}
      loadingLabel="Loading case record…"
      notFound={!data.loading && !d && !data.error}
      notFoundTitle="Case record not found"
    >
      {data.error && !d ? (
        <ErrorState error={data.error} onRetry={data.reload} />
      ) : d ? (
        <>
          <ProfileHero
            name={title}
            icon={FileText}
            eyebrow={c?.citations[0] || (k?.docketNumber ? `Docket ${k.docketNumber}` : c ? 'Case law' : 'Federal docket')}
            subtitle={c?.caseNameFull && c.caseNameFull !== title ? c.caseNameFull : undefined}
            badges={badges}
          />

          <DateTiles
            tiles={[
              { label: c ? 'Decided' : 'Filed', value: c?.dateFiled || k?.dateFiled, icon: CalendarDays },
              { label: c ? 'Docket filed' : 'Terminated', value: c ? k?.dateFiled : k?.dateTerminated, icon: CalendarCheck },
              { label: c ? 'Argued' : 'Last filing', value: c ? k?.dateArgued : k?.dateLastFiling, icon: Gavel },
            ]}
          />

          <Animated.View entering={enterUp(2)}>
            <ExpandableSection title="Case details" subtitle="From the court record" icon={Scale} initiallyOpen>
              {k?.assignedTo ? (
                <InfoRow icon={Gavel} label="Assigned judge" value={k.assignedTo} sub={k.referredTo ? `Referred to ${k.referredTo}` : undefined} />
              ) : null}
              {c?.judges ? <InfoRow icon={Gavel} label="Judges" value={c.judges} /> : null}
              {c?.citations.length ? <InfoRow icon={Quote} label="Citations" value={c.citations.join(' · ')} /> : null}
              {typeof c?.citationCount === 'number' ? (
                <InfoRow icon={Quote} label="Cited by" value={`${c.citationCount.toLocaleString()} opinions`} />
              ) : null}
              {k?.cause ? <InfoRow icon={ScrollText} label="Cause" value={k.cause} /> : null}
              {k?.jurisdictionType ? <InfoRow icon={Landmark} label="Jurisdiction" value={k.jurisdictionType} /> : null}
              {k?.juryDemand ? <InfoRow icon={Users} label="Jury demand" value={k.juryDemand} /> : null}
              {k?.appealFrom ? <InfoRow icon={Landmark} label="Appeal from" value={k.appealFrom} /> : null}
              {c?.disposition ? <InfoRow icon={CalendarCheck} label="Disposition" value={c.disposition} /> : null}
              {c?.attorneys ? <InfoRow icon={Users} label="Attorneys" value={c.attorneys} last /> : null}
            </ExpandableSection>
          </Animated.View>

          {k?.assignedToId ? (
            <PressableScale
              haptic
              onPress={() => navigation.navigate('JudgeProfile', { id: k.assignedToId })}
              style={[styles.judgeLink, { backgroundColor: t.colors.accentSoft, borderColor: t.colors.accentBorder }]}
            >
              <AppText variant="callout" color={t.colors.accentStrong}>
                View {k.assignedTo ? `${k.assignedTo}’s` : 'the judge’s'} profile
              </AppText>
              <ArrowRight size={15} color={t.colors.accentStrong} />
            </PressableScale>
          ) : null}

          {c?.syllabus || c?.summary || c?.proceduralHistory || c?.posture ? (
            <ExpandableSection title="Summary" subtitle="Syllabus, history & posture" icon={BookOpen}>
              {[
                ['Syllabus', c?.syllabus],
                ['Summary', c?.summary],
                ['Procedural history', c?.proceduralHistory],
                ['Posture', c?.posture],
              ]
                .filter(([, v]) => v)
                .map(([label, v]) => (
                  <View key={label} style={{ paddingVertical: 8 }}>
                    <AppText variant="overline" style={{ fontSize: 9.5 }}>
                      {label}
                    </AppText>
                    <AppText variant="body" style={{ marginTop: 4 }} selectable>
                      {v}
                    </AppText>
                  </View>
                ))}
            </ExpandableSection>
          ) : null}

          {c && c.subOpinionIds.length ? (
            <View>
              <SectionHeader eyebrow={`${c.subOpinionIds.length} opinion${c.subOpinionIds.length > 1 ? 's' : ''}`} title="Opinions" />
              <View style={{ gap: 10 }}>
                {c.subOpinionIds.map((oid, i) => (
                  <OpinionCard key={oid} opinionId={oid} index={i} />
                ))}
              </View>
            </View>
          ) : null}

          {k && !c && k.clusterIds.length ? (
            <View>
              <SectionHeader eyebrow="Case law" title="Opinions in this case" />
              <View style={{ gap: 10 }}>
                {k.clusterIds.map((cid, i) => (
                  <Card key={cid} onPress={() => navigation.push('CaseDetail', { id: `cluster:${cid}` })} haptic>
                    <View style={styles.sourceRow}>
                      <IconTile icon={ScrollText} tone="gold" size={38} />
                      <AppText variant="title" style={{ flex: 1 }}>
                        Opinion {i + 1}
                      </AppText>
                      <ArrowRight size={16} color={t.colors.accent} />
                    </View>
                  </Card>
                ))}
              </View>
            </View>
          ) : null}

          {d.kind === 'cluster' && k ? (
            <Button
              label="Open the full docket"
              variant="secondary"
              iconRight={ArrowRight}
              onPress={() => navigation.push('CaseDetail', { id: `docket:${k.id}` })}
              style={{ alignSelf: 'center' }}
            />
          ) : null}

          {d.kind === 'docket' && k ? (
            <>
              <PartiesSection docketId={k.id} />
              <View>
                <SectionHeader eyebrow="Court filings" title="Docket entries" />
                {entries.loading && !entries.data ? (
                  <View style={{ gap: 10 }}>
                    <SkeletonCard lines={2} />
                    <SkeletonCard lines={2} />
                  </View>
                ) : entries.error ? (
                  <ErrorState error={entries.error} onRetry={entries.reload} />
                ) : allEntries.length ? (
                  <View>
                    {allEntries.map((e, i) => (
                      <EntryRow key={e.id} entry={e} index={i} isLast={i === allEntries.length - 1} caseName={title} />
                    ))}
                    {cursor ? (
                      <Button
                        label="Load earlier entries"
                        variant="secondary"
                        size="sm"
                        iconRight={ChevronDown}
                        loading={loadingEntries}
                        onPress={loadMoreEntries}
                        style={{ alignSelf: 'center', marginTop: 14 }}
                      />
                    ) : null}
                  </View>
                ) : (
                  <AppText variant="caption">No docket entries are available for this case yet.</AppText>
                )}
              </View>
            </>
          ) : null}

          <AppText variant="caption" align="center" style={{ fontStyle: 'italic', paddingHorizontal: 8 }}>
            Official public court record.
          </AppText>
        </>
      ) : null}
    </DetailScaffold>
  );
}

const styles = StyleSheet.create({
  metaGrid: { flexDirection: 'row', gap: 8 },
  metaTile: { flex: 1, padding: 12, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  judgeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  opCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  opHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  stepRow: { flexDirection: 'row', gap: 12 },
  rail: { width: 32, alignItems: 'center' },
  stepDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  railLine: { flex: 1, width: 2, marginTop: 4, borderRadius: 1 },
  stepCard: { padding: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  stepTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  doc: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10 },
  party: { paddingVertical: 10 },
  partyTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
