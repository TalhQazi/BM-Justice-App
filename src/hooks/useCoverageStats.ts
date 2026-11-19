import { useEffect, useState } from 'react';
import * as cl from '../services/courtlistener';
import * as congress from '../services/congress';
import type { CoverageStats } from '../types';

type Key = 'opinions' | 'dockets' | 'judges' | 'recentOpinions' | 'courts' | 'legislators';

const loaders: Record<Key, () => Promise<number | undefined>> = {
  // Archive-wide totals: background priority, cached for a day.
  opinions: () => cl.countSearch('o'),
  dockets: () => cl.countSearch('d'),
  // Same query as the Judges directory's first page, so they share one cached response.
  judges: () => cl.countSearch('p', { order_by: 'name_reverse asc' }),
  // Shares the Latest panel's request.
  recentOpinions: () => cl.latestOpinions().then((p) => p.count),
  courts: () => cl.countList('/courts/', { in_use: 'true' }, true),
  legislators: () => congress.countCurrentMembers(),
};

/**
 * Live record counts from CourtListener and Congress.gov. Each number appears
 * as soon as its own request finishes; a failed source shows "—". No numbers
 * are hardcoded.
 */
export function useCoverageStats(refreshKey = 0) {
  const [stats, setStats] = useState<CoverageStats>({});
  const [failed, setFailed] = useState<Key[]>([]);
  const [pending, setPending] = useState<number>(Object.keys(loaders).length);

  useEffect(() => {
    let mounted = true;
    const keys = Object.keys(loaders) as Key[];
    setPending(keys.length);
    setFailed([]);
    keys.forEach((k) => {
      loaders[k]()
        .then((v) => {
          if (!mounted) return;
          if (typeof v === 'number') setStats((s) => ({ ...s, [k]: v }));
          else setFailed((f) => [...f, k]);
        })
        .catch(() => mounted && setFailed((f) => [...f, k]))
        .finally(() => mounted && setPending((n) => n - 1));
    });
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  const loading = pending > 0 && Object.keys(stats).length === 0 && failed.length < Object.keys(loaders).length;
  return { stats, failed, loading, pending: pending > 0 };
}
