import { useMemo, useState } from 'react';
import type { DecadeKey } from '../components/DecadeTimelineTabs';

export interface DecadeTab {
  key: DecadeKey;
  label: string;
  count: number;
}

const DECADES: { key: Exclude<DecadeKey, 'ALL'>; min: number; max: number }[] = [
  { key: '2020s', min: 2020, max: 2029 },
  { key: '2010s', min: 2010, max: 2019 },
  { key: '2000s', min: 2000, max: 2009 },
  { key: '1990s', min: 1990, max: 1999 },
  { key: '1980s', min: 1980, max: 1989 },
  { key: '1970s', min: 1970, max: 1979 },
  { key: '1960s', min: 1960, max: 1969 },
  { key: 'earlier', min: -Infinity, max: 1959 },
];

const yearOf = (d?: string | null) => {
  if (!d) return NaN;
  const y = new Date(d).getFullYear();
  return isNaN(y) ? NaN : y;
};

/**
 * Buckets dated records by decade. Tabs and labels are derived entirely from
 * the records — no fixed year ranges are assumed.
 */
export function useDecadeTimeline<T extends { date?: string | null }>(items: T[]) {
  const [selectedDecade, setSelectedDecade] = useState<DecadeKey>('ALL');

  const years = useMemo(() => items.map((i) => yearOf(i.date)).filter((y) => !isNaN(y)), [items]);
  const earliestYear = years.length ? Math.min(...years) : undefined;
  const latestYear = years.length ? Math.max(...years) : undefined;

  const decadeTabs = useMemo<DecadeTab[]>(() => {
    const tabs: DecadeTab[] = [
      {
        key: 'ALL',
        label: earliestYear !== undefined ? `All (${earliestYear}–${latestYear})` : 'All',
        count: items.length,
      },
    ];
    DECADES.forEach((d) => {
      const inRange = years.filter((y) => y >= d.min && y <= d.max);
      if (!inRange.length) return;
      const lo = Math.max(d.min === -Infinity ? Math.min(...inRange) : d.min, Math.min(...inRange));
      const hi = Math.min(d.max, Math.max(...inRange));
      tabs.push({ key: d.key, label: lo === hi ? `${lo}` : `${lo}–${hi}`, count: inRange.length });
    });
    return tabs;
  }, [items.length, years, earliestYear, latestYear]);

  const decadeFilteredItems = useMemo(() => {
    if (selectedDecade === 'ALL') return items;
    const d = DECADES.find((x) => x.key === selectedDecade);
    if (!d) return items;
    return items.filter((i) => {
      const y = yearOf(i.date);
      return !isNaN(y) && y >= d.min && y <= d.max;
    });
  }, [items, selectedDecade]);

  return { selectedDecade, setSelectedDecade, decadeTabs, decadeFilteredItems, earliestYear, latestYear };
}

/** Counts records per year — feeds the activity trend chart. */
export function countByYear<T extends { date?: string | null }>(items: T[]) {
  const map = new Map<number, number>();
  items.forEach((i) => {
    const y = yearOf(i.date);
    if (!isNaN(y)) map.set(y, (map.get(y) || 0) + 1);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, value]) => ({ year, value }));
}

/** Counts records by a string key, sorted descending. */
export function countBy<T>(items: T[], key: (t: T) => string | undefined, limit = 8) {
  const map = new Map<string, number>();
  items.forEach((i) => {
    const k = key(i);
    if (k) map.set(k, (map.get(k) || 0) + 1);
  });
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}
