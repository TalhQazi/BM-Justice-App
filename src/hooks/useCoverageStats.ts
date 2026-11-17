import { useEffect, useState } from 'react';
import * as cl from '../services/courtlistener';
import * as congress from '../services/congress';
import type { CoverageStats } from '../types';

type Key = keyof CoverageStats;

// These reuse the exact requests behind the Latest panel, Activity feed and
// Judges directory, so the counts cost no extra calls once those are cached.
const loaders: Record<Key, () => Promise<number | undefined>> = {
  opinions: () => cl.latestOpinions().then((p) => p.count),
  dockets: () => cl.latestDockets().then((p) => p.count),
  // Same query as the Judges directory's first page, so they share one cached response.
  judges: () => cl.countSearch('p', { order_by: 'name_reverse asc' }),
  courts: () => cl.countList('/courts/', { in_use: 'true' }, true),
  attorneys: () => cl.countList('/attorneys/'),
  legislators: () => congress.countCurrentMembers(),
};

let shared: Promise<{ stats: CoverageStats; failed: Key[] }> | null = null;

function fetchAll() {
  if (!shared) {
    shared = (async () => {
      const keys = Object.keys(loaders) as Key[];
      const settled = await Promise.allSettled(keys.map((k) => loaders[k]()));
      const stats: CoverageStats = {};
      const failed: Key[] = [];
      settled.forEach((s, i) => {
        if (s.status === 'fulfilled' && typeof s.value === 'number') stats[keys[i]] = s.value;
        else failed.push(keys[i]);
      });
      return { stats, failed };
    })().finally(() => {
      // Let the next mount (or a refresh) fetch again; responses are HTTP-cached.
      setTimeout(() => {
        shared = null;
      }, 0);
    });
  }
  return shared;
}

/** Live record counts from CourtListener and Congress.gov (each source fails independently). */
export function useCoverageStats(refreshKey = 0) {
  const [stats, setStats] = useState<CoverageStats>({});
  const [failed, setFailed] = useState<Key[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchAll()
      .then((r) => {
        if (!mounted) return;
        setStats(r.stats);
        setFailed(r.failed);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  return { stats, failed, loading };
}
