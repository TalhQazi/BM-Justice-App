import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  FileCheck2,
  Flag,
  Landmark,
  MapPin,
  Phone,
  ScrollText,
  Users,
} from 'lucide-react-native';
import * as congress from '../services/congress';
import { useTheme } from '../theme/ThemeProvider';
import { useAsync } from '../hooks/useAsync';
import { countBy, countByYear } from '../hooks/useDecadeTimeline';
import { formatCount, formatDate } from '../utils/format';
import TrendGraph from '../components/TrendGraph';
import { DetailScaffold } from '../components/DetailScaffold';
import { ProfileHero } from '../components/ProfileHero';
import { BreakdownGrid } from '../components/BreakdownGrid';
import { StatGrid } from '../components/StatGrid';
import { ErrorState } from '../components/ErrorState';
import { AppText, Badge, Card, ExpandableSection, InfoRow, SectionHeader, SkeletonCard, enterUp } from '../components/ui';

export default function LegislatorProfileScreen() {
  const route = useRoute<any>();
  const t = useTheme();
  const id: string = String(route.params?.id ?? '');

  const member = useAsync(() => congress.getMember(id), [id], { enabled: !!id });
  const bills = useAsync(() => congress.sponsoredLegislation(id), [id], { enabled: !!id });
  const m = member.data;

  const list = bills.data?.bills ?? [];
  const becameLaw = useMemo(() => list.filter((b) => b.becameLaw).length, [list]);
  const policyAreas = useMemo(() => countBy(list, (b) => b.policyArea), [list]);
  const perYear = useMemo(() => countByYear(list.map((b) => ({ date: b.introducedDate }))), [list]);

  const firstYear = m?.terms.map((x) => x.startYear).filter((y): y is number => !!y).sort()[0];
  const yearsServed = firstYear ? new Date().getFullYear() - firstYear : undefined;
  const navigation = useNavigation<any>();

  return (
    <DetailScaffold
      title={m?.name}
      loading={member.loading && !m}
      loadingLabel="Loading member profile…"
      notFound={!member.loading && !m && !member.error}
      notFoundTitle="Legislator record not found."
    >
      {member.error && !m ? (
        <ErrorState error={member.error} onRetry={member.reload} />
      ) : m ? (
        <>
          <ProfileHero
            name={m.name}
            imageUrl={m.imageUrl}
            eyebrow={m.chamber === 'Senate' ? 'U.S. Senate' : 'U.S. House of Representatives'}
            subtitle={`${m.state}${m.district ? ` · District ${m.district}` : ''} · ${m.party}`}
            badges={[
              m.currentMember ? { label: 'Serving', tone: 'success', dot: true } : { label: 'Former member', tone: 'neutral' },
              { label: `${m.partyAbbr || m.party[0]}-${m.state}`, tone: 'gold', icon: Flag },
            ]}
          />

          <StatGrid
            items={[
              { label: 'Bills sponsored', value: formatCount(m.sponsoredCount), icon: ScrollText },
              { label: 'Bills cosponsored', value: formatCount(m.cosponsoredCount), icon: Users, tone: 'info' },
              {
                label: 'Years in Congress',
                value: yearsServed !== undefined ? String(yearsServed) : '—',
                icon: CalendarClock,
                tone: 'success',
                hint: firstYear ? `Since ${firstYear} · ${m.terms.length} terms` : undefined,
              },
              {
                label: 'Became law',
                value: formatCount(becameLaw),
                icon: FileCheck2,
                tone: 'warning',
                hint: list.length ? `Of ${list.length} most recent sponsored` : undefined,
                loading: bills.loading && !bills.data,
              },
            ]}
          />

          <Animated.View entering={enterUp(1)}>
            <ExpandableSection title="Service & office" subtitle={`${m.terms.length} terms on record`} icon={Landmark} initiallyOpen>
              {[...m.terms].reverse().map((term, i) => (
                <InfoRow
                  key={`${term.congress}-${term.chamber}-${i}`}
                  icon={CalendarDays}
                  label={term.congress ? `${term.congress}th Congress` : 'Term'}
                  value={`${term.memberType || term.chamber}${term.district ? ` · District ${term.district}` : ''}`}
                  sub={`${term.startYear ?? ''}${term.endYear ? ` – ${term.endYear}` : term.startYear ? ' – present' : ''}`}
                />
              ))}
              {m.office?.address ? <InfoRow icon={MapPin} label="Office" value={m.office.address} /> : null}
              {m.office?.phone ? <InfoRow icon={Phone} label="Phone" value={m.office.phone} /> : null}
            </ExpandableSection>
          </Animated.View>

          {bills.loading && !bills.data ? (
            <SkeletonCard lines={4} />
          ) : bills.error ? (
            <ErrorState error={bills.error} onRetry={bills.reload} />
          ) : (
            <>
              <BreakdownGrid
                eyebrow="Sponsored legislation"
                title="Policy areas"
                items={policyAreas}
                unit="bills"
                emptyText="No sponsored legislation on record."
              />
              <TrendGraph title="Bills introduced per year" unit="bills" points={perYear} />

              <View>
                <SectionHeader eyebrow="Legislative record" title="Recent sponsored bills" />
                <View style={{ gap: 10 }}>
                  {list.slice(0, 25).map((b, i) => (
                    <Animated.View key={b.id} entering={enterUp(i % 10)}>
                      <Card
                        onPress={
                          b.congress && b.type && b.number
                            ? () => navigation.navigate('BillDetail', { congress: b.congress, type: b.type, number: b.number })
                            : undefined
                        }
                        haptic
                      >
                        <View style={styles.billTop}>
                          <Badge label={congress.billLabel(b)} tone="gold" />
                          {b.becameLaw ? <Badge label="Became law" tone="success" dot /> : null}
                          <View style={{ flex: 1 }} />
                          <AppText variant="caption">{formatDate(b.introducedDate)}</AppText>
                        </View>
                        <AppText variant="title" style={{ marginTop: 10 }}>
                          {b.title}
                        </AppText>
                        {b.latestAction ? (
                          <AppText variant="caption" style={{ marginTop: 6, lineHeight: 17 }} numberOfLines={3}>
                            {b.latestAction.date ? `${formatDate(b.latestAction.date)} · ` : ''}
                            {b.latestAction.text}
                          </AppText>
                        ) : null}
                        <View style={styles.billFoot}>
                          {b.policyArea ? <Badge label={b.policyArea} tone="navy" /> : <View />}
                          {b.congress && b.type && b.number ? <ArrowRight size={16} color={t.colors.accent} /> : null}
                        </View>
                      </Card>
                    </Animated.View>
                  ))}
                </View>
                {bills.data && bills.data.count !== undefined && bills.data.count > list.length ? (
                  <AppText variant="caption" align="center" style={{ marginTop: 12 }}>
                    Showing {list.length} of {bills.data.count} most recent sponsored measures
                  </AppText>
                ) : null}
              </View>
            </>
          )}

        </>
      ) : null}
    </DetailScaffold>
  );
}

const styles = StyleSheet.create({
  billTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  billFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
});
