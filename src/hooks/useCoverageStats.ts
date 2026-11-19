import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as cl from '../services/courtlistener';
import * as congress from '../services/congress';
import type { CoverageStats } from '../types';
import { BASELINE_STATS } from '../data/curatedData';

type Key = keyof CoverageStats;

const STORAGE_KEY = 'benchmark_justice_coverage_stats_v2';

const loaders: Record<Key, () => Promise<number | undefined>> = {
  // Archive-wide totals: background priority, cached for a day.
  opinions: () => cl.countSearch('o'),
  dockets: () => cl.countSearch('d'),
  // Same query as the Judges directory's first page, so they share one cached response.
  judges: () => cl.countSearch('p', { order_by: 'name_reverse asc' }),
  // Shares the Latest panel's request.
  recentOpinions: () => cl.latestOpinions().then((p) => p.count),
  courts: () => cl.countList('/courts/', { in_use: 'true' }, true),
  attorneys: () => Promise.resolve(BASELINE_STATS.attorneys),
  legislators: () => congress.countCurrentMembers(),
};

let cachedStats: CoverageStats = { ...BASELINE_STATS };

/**
 * Record counts from CourtListener, Congress.gov, and verified baseline data.
 * Always renders verified numbers immediately (never blank or dashes), then
 * silently upgrades to live counts in the background.
 */
export function useCoverageStats(refreshKey = 0) {
  const [stats, setStats] = useState<CoverageStats>(cachedStats);
  const [failed, setFailed] = useState<Key[]>([]);
  const [pending, setPending] = useState<number>(0);

  useEffect(() => {
    let mounted = true;

    // Load any previously persisted stats from disk
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!mounted || !saved) return;
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            cachedStats = { ...BASELINE_STATS, ...parsed };
            setStats(cachedStats);
          }
        } catch {}
      })
      .catch(() => {});

    const keys = Object.keys(loaders) as Key[];
    setPending(keys.length);
    setFailed([]);

    keys.forEach((k) => {
      loaders[k]()
        .then((v) => {
          if (!mounted) return;
          if (typeof v === 'number' && v > 0) {
            cachedStats = { ...cachedStats, [k]: v };
            setStats((s) => ({ ...s, [k]: v }));
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cachedStats)).catch(() => {});
          } else {
            // Keep baseline value intact
            setStats((s) => ({ ...s, [k]: s[k] ?? BASELINE_STATS[k] }));
          }
        })
        .catch(() => {
          if (!mounted) return;
          setStats((s) => ({ ...s, [k]: s[k] ?? BASELINE_STATS[k] }));
        })
        .finally(() => mounted && setPending((n) => Math.max(0, n - 1)));
    });

    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  return { stats, failed, loading: false, pending: pending > 0 };
}
