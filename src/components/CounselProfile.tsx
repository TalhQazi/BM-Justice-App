import React, { useMemo, useState } from 'react';
import Animated from 'react-native-reanimated';
import { Building2, FolderOpen, Landmark, Mail, MapPin, Phone, Printer, ShieldCheck, Star, Timer } from 'lucide-react-native';
import * as cl from '../services/courtlistener';
import type { CaseRecord } from '../types';
import { useAsync } from '../hooks/useAsync';
import { countBy, countByYear, useDecadeTimeline } from '../hooks/useDecadeTimeline';
import { formatCount } from '../utils/format';
import TrendGraph from './TrendGraph';
import DecadeTimelineTabs from './DecadeTimelineTabs';
import CaseTable from './CaseTable';
import { DetailScaffold } from './DetailScaffold';
import { ProfileHero, HeroBadge } from './ProfileHero';
import { BreakdownGrid } from './BreakdownGrid';
import { StatGrid } from './StatGrid';
import { ErrorState } from './ErrorState';
import { ExpandableSection, InfoRow, SkeletonCard, enterUp } from './ui';

const CHUNK = 20;

/**
 * Live attorney profile from CourtListener's PACER data: contact block,
 * docket appearances (with roles) and analytics derived from those dockets.
 */
export function CounselProfile({ id, variant }: { id: string; variant: 'attorney' | 'prosecutor' }) {
  const attorney = useAsync(() => cl.getAttorney(id), [id], { enabled: !!id });
  const a = attorney.data;

  const docketIds = useMemo(() => Array.from(new Set((a?.roles ?? []).map((r) => r.docketId).filter(Boolean))), [a]);
  const leadCount = useMemo(
    () => new Set((a?.roles ?? []).filter((r) => r.role === 2).map((r) => r.docketId)).size,
    [a],
  );

  const firstChunk = useAsync(() => cl.docketsByIds(docketIds.slice(0, CHUNK)), [docketIds.join(',')], {
    enabled: docketIds.length > 0,
  });
  const [extra, setExtra] = useState<CaseRecord[]>([]);
  const [loaded, setLoaded] = useState(CHUNK);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const more = await cl.docketsByIds(docketIds.slice(loaded, loaded + CHUNK));
      setExtra((prev) => [...prev, ...more]);
      setLoaded((n) => n + CHUNK);
    } finally {
      setLoadingMore(false);
    }
  };

  const records = useMemo(
    () => [...(firstChunk.data ?? []), ...extra].sort((x, y) => (y.date || '').localeCompare(x.date || '')),
    [firstChunk.data, extra],
  );
  const { selectedDecade, setSelectedDecade, decadeTabs, decadeFilteredItems } = useDecadeTimeline(records);
  const suitBreakdown = useMemo(() => countBy(records, (r) => r.group), [records]);
  const perYear = useMemo(() => countByYear(records), [records]);
  const courts = useMemo(() => new Set(records.map((r) => r.court).filter(Boolean)).size, [records]);
  const open = useMemo(() => records.filter((r) => r.status === 'Open').length, [records]);

  const name = a ? cl.titleCaseName(a.name) : undefined;
  const contactLines = (a?.contact || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const address = contactLines.filter((l) => l !== a?.phone && l !== a?.email && !/^(fax|email|phone)/i.test(l)).join(', ');

  const badges: HeroBadge[] = [];
  if (a) {
    badges.push(
      a.isGovernment
        ? { label: 'Government counsel', tone: 'plum', icon: ShieldCheck }
        : { label: variant === 'prosecutor' ? 'Not listed under a government office' : 'Counsel of record', tone: 'info' },
    );
    if (leadCount) badges.push({ label: `Lead attorney · ${leadCount}`, tone: 'gold', icon: Star });
  }

  return (
    <DetailScaffold
      title={name}
      loading={attorney.loading && !a}
      loadingLabel="Loading attorney profile…"
      notFound={!attorney.loading && !a && !attorney.error}
      notFoundTitle={variant === 'prosecutor' ? 'Prosecutor record not found.' : 'Attorney record not found.'}
    >
      {attorney.error && !a ? (
        <ErrorState error={attorney.error} onRetry={attorney.reload} />
      ) : a ? (
        <>
          <ProfileHero
            name={name!}
            eyebrow={variant === 'prosecutor' ? 'Prosecution' : 'Attorneys'}
            subtitle={a.office ? cl.titleCaseName(a.office) : undefined}
            badges={badges}
          />

          <StatGrid
            items={[
              { label: 'Docket appearances', value: formatCount(docketIds.length), icon: FolderOpen },
              { label: 'Lead attorney', value: formatCount(leadCount), icon: Star, tone: 'warning' },
              {
                label: 'Courts',
                value: formatCount(courts),
                icon: Landmark,
                tone: 'info',
                hint: records.length ? `Across ${records.length} loaded dockets` : undefined,
                loading: firstChunk.loading && !firstChunk.data,
              },
              {
                label: 'Open dockets',
                value: formatCount(open),
                icon: Timer,
                tone: 'success',
                loading: firstChunk.loading && !firstChunk.data,
              },
            ]}
          />

          {a.phone || a.email || a.fax || address ? (
            <Animated.View entering={enterUp(1)}>
              <ExpandableSection title="Contact on record" subtitle="As listed in court filings" icon={Building2} initiallyOpen>
                {address ? <InfoRow icon={MapPin} label="Office" value={address} /> : null}
                {a.phone ? <InfoRow icon={Phone} label="Phone" value={a.phone} /> : null}
                {a.email ? <InfoRow icon={Mail} label="Email" value={a.email} /> : null}
                {a.fax ? <InfoRow icon={Printer} label="Fax" value={a.fax} last /> : null}
              </ExpandableSection>
            </Animated.View>
          ) : null}

          {firstChunk.loading && !firstChunk.data ? (
            <SkeletonCard lines={4} />
          ) : firstChunk.error ? (
            <ErrorState error={firstChunk.error} onRetry={firstChunk.reload} />
          ) : (
            <>
              <BreakdownGrid
                eyebrow="Practice"
                title="Nature of suit"
                items={suitBreakdown}
                unit="dockets"
                emptyText="No docket details available."
              />
              <TrendGraph title="Dockets per year" unit="dockets" points={perYear} />
            </>
          )}

          {records.length ? (
            <DecadeTimelineTabs selectedDecade={selectedDecade} onSelectDecade={setSelectedDecade} decadeTabs={decadeTabs} />
          ) : null}

          <CaseTable
            eyebrow="Docket record"
            title="Appearances"
            records={decadeFilteredItems}
            total={docketIds.length}
            onLoadMore={loaded < docketIds.length ? loadMore : undefined}
            loadingMore={loadingMore}
          />
        </>
      ) : null}
    </DetailScaffold>
  );
}
