import { Briefcase, FileText, Gavel, Landmark, Scale, ShieldCheck, Vote } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { ToneKey } from '../theme/themes';
import type { EntityType, SearchResultItem, SearchResults } from '../types';

export type SearchFilterKey = 'ALL' | 'JUDGE' | 'CASE' | 'ATTORNEY' | 'PROSECUTOR' | 'LEGISLATOR';

export const SEARCH_FILTERS: { key: SearchFilterKey; label: string }[] = [
  { key: 'ALL', label: 'All Records' },
  { key: 'JUDGE', label: 'Judges' },
  { key: 'CASE', label: 'Cases' },
  { key: 'ATTORNEY', label: 'Attorneys' },
  { key: 'PROSECUTOR', label: 'Prosecutors' },
  { key: 'LEGISLATOR', label: 'Congress' },
];

export const ENTITY_META: Record<
  EntityType,
  { label: string; icon: LucideIcon; tone: ToneKey; route: string }
> = {
  judge: { label: 'Judge', icon: Gavel, tone: 'gold', route: 'JudgeProfile' },
  attorney: { label: 'Attorney', icon: Briefcase, tone: 'info', route: 'AttorneyProfile' },
  prosecutor: { label: 'Prosecutor', icon: ShieldCheck, tone: 'plum', route: 'ProsecutorProfile' },
  legislator: { label: 'Congress', icon: Vote, tone: 'warning', route: 'LegislatorProfile' },
  case: { label: 'Case', icon: FileText, tone: 'teal', route: 'CaseDetail' },
};

export const CourtIcon = Landmark;
export const JusticeIcon = Scale;

/** Maps the `initialCategory` route param (e.g. "judges") to a filter key. */
export function categoryToFilter(category?: string): SearchFilterKey {
  switch (category) {
    case 'all':
      return 'ALL';
    case 'judges':
      return 'JUDGE';
    case 'attorneys':
      return 'ATTORNEY';
    case 'prosecutors':
      return 'PROSECUTOR';
    case 'legislators':
      return 'LEGISLATOR';
    case 'cases':
      return 'CASE';
    default:
      return 'ALL';
  }
}

/** Flattens grouped search results, honoring the selected filter. */
export function flattenResults(results: SearchResults | null, filter: SearchFilterKey): SearchResultItem[] {
  if (!results) return [];
  const arr: SearchResultItem[] = [];
  if (filter === 'ALL' || filter === 'JUDGE') (results.judges || []).forEach((j) => arr.push({ ...j, type: 'judge' }));
  if (filter === 'ALL' || filter === 'CASE') (results.cases || []).forEach((c) => arr.push({ ...c, type: 'case' }));
  if (filter === 'ALL' || filter === 'ATTORNEY') (results.attorneys || []).forEach((a) => arr.push({ ...a, type: 'attorney' }));
  if (filter === 'ALL' || filter === 'PROSECUTOR') (results.prosecutors || []).forEach((p) => arr.push({ ...p, type: 'prosecutor' }));
  if (filter === 'ALL' || filter === 'LEGISLATOR') (results.legislators || []).forEach((l) => arr.push({ ...l, type: 'legislator' }));
  return arr;
}

const TOTAL_KEY: Record<Exclude<SearchFilterKey, 'ALL'>, keyof SearchResults['totals']> = {
  JUDGE: 'judges',
  ATTORNEY: 'attorneys',
  PROSECUTOR: 'prosecutors',
  LEGISLATOR: 'legislators',
  CASE: 'cases',
};

/** Loaded result count for a filter chip. */
export function countFor(results: SearchResults | null, filter: SearchFilterKey): number | undefined {
  if (!results) return undefined;
  if (filter === 'ALL') {
    return (
      (results.judges?.length || 0) +
      (results.cases?.length || 0) +
      (results.attorneys?.length || 0) +
      (results.prosecutors?.length || 0) +
      (results.legislators?.length || 0)
    );
  }
  return results[TOTAL_KEY[filter]]?.length ?? undefined;
}

/** Source-reported total matches for a filter chip. */
export function totalFor(results: SearchResults | null, filter: SearchFilterKey): number | undefined {
  if (!results) return undefined;
  if (filter === 'ALL') {
    const sum = Object.values(results.totals || {}).reduce((acc: number, v) => acc + (typeof v === 'number' ? v : 0), 0);
    return sum > 0 ? sum : undefined;
  }
  return results.totals[TOTAL_KEY[filter]];
}

export function filterToCategory(filter: SearchFilterKey): string {
  switch (filter) {
    case 'ALL':
      return 'all';
    case 'JUDGE':
      return 'judges';
    case 'ATTORNEY':
      return 'attorneys';
    case 'PROSECUTOR':
      return 'prosecutors';
    case 'LEGISLATOR':
      return 'legislators';
    case 'CASE':
      return 'cases';
  }
}

export function navigateToResult(navigation: any, item: SearchResultItem) {
  const meta = ENTITY_META[item.type];
  if (!meta) return;
  navigation.navigate(meta.route, { id: item.id });
}

export function resultSubtitle(item: SearchResultItem): string | undefined {
  return item.subtitle || item.court || item.jurisdiction || undefined;
}
