import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowRight, BookOpen, CalendarDays, ChevronDown, FileCheck2, Flag, Landmark, ScrollText, UserRound, Users } from 'lucide-react-native';
import * as congress from '../services/congress';
import { useTheme } from '../theme/ThemeProvider';
import { useAsync } from '../hooks/useAsync';
import { formatDate } from '../utils/format';
import { DetailScaffold } from '../components/DetailScaffold';
import { ProfileHero, HeroBadge } from '../components/ProfileHero';
import { StatGrid } from '../components/StatGrid';
import { ErrorState } from '../components/ErrorState';
import { AppText, Badge, Button, Card, ExpandableSection, InfoRow, PressableScale, SectionHeader, enterUp } from '../components/ui';

const ACTIONS_PAGE = 12;

/** Full bill record shown inside the app: summary, sponsor, actions and cosponsors. */
export default function BillDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const t = useTheme();
  const { congress: congressNum, type, number } = route.params ?? {};
  const bill = useAsync(() => congress.getBill(Number(congressNum), String(type), String(number)), [congressNum, type, number], {
    enabled: !!congressNum && !!type && !!number,
  });
  const [visibleActions, setVisibleActions] = useState(ACTIONS_PAGE);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const b = bill.data;

  const badges: HeroBadge[] = [];
  if (b?.laws.length) badges.push({ label: `Became law · ${b.laws[0]}`, tone: 'success', dot: true });
  if (b?.originChamber) badges.push({ label: b.originChamber, tone: 'gold', icon: Landmark });
  if (b?.policyArea) badges.push({ label: b.policyArea, tone: 'info' });

  const summary = b?.summary?.text || '';

  return (
    <DetailScaffold
      title={b?.label}
      loading={bill.loading && !b}
      loadingLabel="Loading bill…"
      notFound={!bill.loading && !b && !bill.error}
      notFoundTitle="Bill not found"
    >
      {bill.error && !b ? (
        <ErrorState error={bill.error} onRetry={bill.reload} />
      ) : b ? (
        <>
          <ProfileHero name={b.title} icon={ScrollText} eyebrow={`${b.label} · ${b.congress}th Congress`} badges={badges} />

          <StatGrid
            items={[
              { label: 'Introduced', value: formatDate(b.introducedDate), icon: CalendarDays },
              { label: 'Cosponsors', value: String(b.cosponsorCount), icon: Users, tone: 'info' },
              { label: 'Actions taken', value: String(b.actions.length), icon: Flag, tone: 'teal' },
              { label: 'Status', value: b.laws.length ? 'Law' : 'Pending', icon: FileCheck2, tone: b.laws.length ? 'success' : 'neutral' },
            ]}
          />

          {b.sponsor ? (
            <Animated.View entering={enterUp(1)}>
              <Card onPress={b.sponsor.bioguideId ? () => navigation.push('LegislatorProfile', { id: b.sponsor!.bioguideId }) : undefined} haptic>
                <View style={styles.row}>
                  <View style={[styles.iconWrap, { backgroundColor: t.colors.accentSoft }]}>
                    <UserRound size={18} color={t.colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="overline" style={{ fontSize: 9.5 }}>
                      Sponsor
                    </AppText>
                    <AppText variant="title">{b.sponsor.name}</AppText>
                    {b.sponsor.party || b.sponsor.state ? (
                      <AppText variant="caption">{[b.sponsor.party, b.sponsor.state].filter(Boolean).join(' · ')}</AppText>
                    ) : null}
                  </View>
                  {b.sponsor.bioguideId ? <ArrowRight size={16} color={t.colors.accent} /> : null}
                </View>
              </Card>
            </Animated.View>
          ) : null}

          {summary ? (
            <Card>
              <View style={styles.row}>
                <BookOpen size={16} color={t.colors.accent} />
                <AppText variant="overline">Summary{b.summary?.stage ? ` · ${b.summary.stage}` : ''}</AppText>
              </View>
              <AppText variant="body" style={{ marginTop: 10, lineHeight: 22 }} selectable>
                {summaryOpen ? summary : summary.slice(0, 900)}
                {!summaryOpen && summary.length > 900 ? '…' : ''}
              </AppText>
              {summary.length > 900 ? (
                <Button
                  label={summaryOpen ? 'Show less' : 'Read full summary'}
                  variant="secondary"
                  size="sm"
                  iconRight={ChevronDown}
                  onPress={() => setSummaryOpen((o) => !o)}
                  style={{ marginTop: 12 }}
                />
              ) : null}
            </Card>
          ) : null}

          {b.actions.length ? (
            <View>
              <SectionHeader eyebrow="Legislative history" title="Actions" />
              <View>
                {b.actions.slice(0, visibleActions).map((a, i, list) => (
                  <Animated.View key={`${a.date}-${i}`} entering={enterUp(i % ACTIONS_PAGE)} style={styles.stepRow}>
                    <View style={styles.rail}>
                      <View style={[styles.dot, { backgroundColor: i === 0 ? t.colors.accent : t.colors.borderStrong }]} />
                      {i < list.length - 1 ? <View style={[styles.line, { backgroundColor: t.colors.border }]} /> : null}
                    </View>
                    <View style={{ flex: 1, paddingBottom: 16 }}>
                      <View style={styles.row}>
                        <AppText variant="caption">{formatDate(a.date)}</AppText>
                        {a.type ? <Badge label={a.type} tone="navy" /> : null}
                      </View>
                      <AppText variant="body" style={{ marginTop: 4 }}>
                        {a.text}
                      </AppText>
                    </View>
                  </Animated.View>
                ))}
              </View>
              {b.actions.length > visibleActions ? (
                <Button
                  label={`Show ${Math.min(ACTIONS_PAGE, b.actions.length - visibleActions)} more actions`}
                  variant="secondary"
                  size="sm"
                  iconRight={ChevronDown}
                  onPress={() => setVisibleActions((n) => n + ACTIONS_PAGE)}
                  style={{ alignSelf: 'center' }}
                />
              ) : null}
            </View>
          ) : null}

          {b.cosponsors.length ? (
            <ExpandableSection title="Cosponsors" subtitle={`${b.cosponsorCount} members`} icon={Users}>
              {b.cosponsors.map((c, i) => (
                <PressableScale
                  key={`${c.bioguideId}-${i}`}
                  onPress={c.bioguideId ? () => navigation.push('LegislatorProfile', { id: c.bioguideId }) : undefined}
                  scaleTo={0.985}
                >
                  <InfoRow
                    icon={UserRound}
                    label={c.original ? 'Original cosponsor' : 'Cosponsor'}
                    value={c.name}
                    sub={[c.party, c.state, c.date ? `joined ${formatDate(c.date)}` : undefined].filter(Boolean).join(' · ')}
                    last={i === b.cosponsors.length - 1}
                  />
                </PressableScale>
              ))}
            </ExpandableSection>
          ) : null}
        </>
      ) : null}
    </DetailScaffold>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepRow: { flexDirection: 'row', gap: 12 },
  rail: { width: 14, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  line: { flex: 1, width: 2, marginTop: 4, borderRadius: 1 },
});
