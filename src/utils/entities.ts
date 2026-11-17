import { Briefcase, FileText, Gavel, Landmark, Scale, ShieldCheck, Vote } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { ToneKey } from '../theme/themes';
import type { EntityType, SearchResultItem, SearchResults } from '../types';

/** One source per search keeps each search to a single request. */
export type SearchFilterKey = 'JUDGE' | 'ATTORNEY' | 'PROSECUTOR' | 'LEGISLATOR' | 'CASE';

export const SEARCH_FILTERS: { key: SearchFilterKey; label: string }[] = [
  { key: 'JUDGE', label: 'Judges' },
  { key: 'ATTORNEY', label: 'Attorneys' },
  { key: 'PROSECUTOR', label: 'Prosecutors' },
  { key: 'CASE', label: 'Cases' },
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
      return 'JUDGE';
  }
}

/** Flattens grouped search results, honoring the selected filter. */
export function flattenResults(results: SearchResults | null, filter: SearchFilterKey): SearchResultItem[] {
  if (!results) return [];
  const arr: SearchResultItem[] = [];
  if (filter === 'JUDGE') (results.judges || []).forEach((j) => arr.push({ ...j, type: 'judge' }));
  if (filter === 'ATTORNEY') (results.attorneys || []).forEach((a) => arr.push({ ...a, type: 'attorney' }));
  if (filter === 'PROSECUTOR') (results.prosecutors || []).forEach((p) => arr.push({ ...p, type: 'prosecutor' }));
  if (filter === 'LEGISLATOR') (results.legislators || []).forEach((l) => arr.push({ ...l, type: 'legislator' }));
  if (filter === 'CASE') (results.cases || []).forEach((c) => arr.push({ ...c, type: 'case' }));
  return arr;
}

const TOTAL_KEY: Record<SearchFilterKey, keyof SearchResults['totals']> = {
  JUDGE: 'judges',
  ATTORNEY: 'attorneys',
  PROSECUTOR: 'prosecutors',
  LEGISLATOR: 'legislators',
  CASE: 'cases',
};

/** Loaded result count for a filter chip. */
export function countFor(results: SearchResults | null, filter: SearchFilterKey): number | undefined {
  if (!results) return undefined;
  return flattenResults(results, filter).length;
}

/** Total matches reported by the source (may exceed what's loaded). */
export function totalFor(results: SearchResults | null, filter: SearchFilterKey): number | undefined {
  if (!results) return undefined;
  return results.totals[TOTAL_KEY[filter]];
}

/** Secondary line shown under a result name. */
export function resultSubtitle(item: SearchResultItem) {
  return item.subtitle || item.court || item.jurisdiction || '';
}

/** Navigates to the correct detail screen for a search result. */
export function navigateToResult(navigation: any, item: SearchResultItem) {
  navigation.navigate(ENTITY_META[item.type].route, { id: item.id });
}

/** Maps a filter back to the `initialCategory` route param. */
export function filterToCategory(filter: SearchFilterKey) {
  return { JUDGE: 'judges', ATTORNEY: 'attorneys', PROSECUTOR: 'prosecutors', LEGISLATOR: 'legislators', CASE: 'cases' }[filter];
}
