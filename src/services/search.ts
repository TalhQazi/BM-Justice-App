/**
 * Unified search across CourtListener (judges, case law, dockets, attorneys),
 * Congress.gov (members), and verified curated legal directory records.
 * Sources run in parallel and fail gracefully without wiping results.
 */
import * as cl from './courtlistener';
import * as congress from './congress';
import { ConfigError, errorMessage } from './http';
import type { SearchResults, SearchResultItem } from '../types';
import type { SearchFilterKey } from '../utils/entities';
import {
  CURATED_JUDGES,
  CURATED_CASES,
  CURATED_ATTORNEYS,
  CURATED_PROSECUTORS,
  CURATED_LEGISLATORS,
} from '../data/curatedData';

function cleanToken(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesItem(query: string, item: SearchResultItem): boolean {
  if (!query) return true;
  const qNorm = cleanToken(query);
  if (!qNorm) return true;
  const combined = cleanToken(`${item.name} ${item.subtitle || ''} ${item.court || ''} ${item.tag || ''}`);
  if (combined.includes(qNorm)) return true;
  const tokens = qNorm.split(' ').filter(Boolean);
  const targets = combined.split(' ').filter(Boolean);
  return tokens.every((t) =>
    targets.some((target) => target === t || target.startsWith(t) || (t.length >= 3 && target.includes(t))),
  );
}

export async function searchAll(query: string, filter: SearchFilterKey): Promise<SearchResults> {
  const q = query.trim();
  const want = (k: SearchFilterKey) => filter === 'ALL' || filter === k;

  // Initialize with matching curated records so search is instant and never 0 for known entities
  const out: SearchResults = {
    judges: want('JUDGE') ? CURATED_JUDGES.filter((j) => matchesItem(q, j)) : [],
    cases: want('CASE') ? CURATED_CASES.filter((c) => matchesItem(q, c)) : [],
    attorneys: want('ATTORNEY') ? CURATED_ATTORNEYS.filter((a) => matchesItem(q, a)) : [],
    prosecutors: want('PROSECUTOR') ? CURATED_PROSECUTORS.filter((p) => matchesItem(q, p)) : [],
    legislators: want('LEGISLATOR') ? CURATED_LEGISLATORS.filter((l) => matchesItem(q, l)) : [],
    totals: {},
    errors: [],
  };

  const errors: unknown[] = [];
  const tasks: Promise<void>[] = [];

  if (want('JUDGE')) {
    tasks.push(
      cl
        .searchJudges(q)
        .then((p) => {
          const seen = new Set(out.judges.map((j) => cleanToken(j.name)));
          const fresh = p.results.filter((r) => !seen.has(cleanToken(r.name)));
          out.judges = [...out.judges, ...fresh];
          out.totals.judges = Math.max(out.judges.length, p.count ?? 0);
        })
        .catch((err) => {
          errors.push(err);
        }),
    );
  }

  if (want('CASE')) {
    tasks.push(
      Promise.allSettled([
        cl.searchOpinions(q ? { q, order_by: 'score desc' } : { q: cl.recentRange(60), order_by: 'dateFiled desc' }),
        cl.searchDockets(q ? { q, order_by: 'score desc' } : { q: cl.recentRange(14), order_by: 'dateFiled desc' }),
      ])
        .then(([ops, dks]) => {
          const a = ops.status === 'fulfilled' ? ops.value.results.map(cl.recordToSearchItem) : [];
          const b = dks.status === 'fulfilled' ? dks.value.results.map(cl.recordToSearchItem) : [];
          const merged: SearchResultItem[] = [];
          for (let i = 0; i < Math.max(a.length, b.length); i++) {
            if (a[i]) merged.push(a[i]);
            if (b[i]) merged.push(b[i]);
          }
          const seen = new Set(out.cases.map((c) => cleanToken(c.name)));
          const fresh = merged.filter((c) => !seen.has(cleanToken(c.name)));
          out.cases = [...out.cases, ...fresh];
          const countA = ops.status === 'fulfilled' ? ops.value.count ?? 0 : 0;
          const countB = dks.status === 'fulfilled' ? dks.value.count ?? 0 : 0;
          out.totals.cases = Math.max(out.cases.length, countA + countB);
        })
        .catch((err) => {
          errors.push(err);
        }),
    );
  }

  if (want('ATTORNEY') || want('PROSECUTOR')) {
    tasks.push(
      cl
        .searchAttorneys(q)
        .then((p) => {
          const attyFresh = p.results.filter((r) => r.type === 'attorney');
          const prosFresh = p.results.filter((r) => r.type === 'prosecutor');

          const seenAtty = new Set(out.attorneys.map((a) => cleanToken(a.name)));
          out.attorneys = [...out.attorneys, ...attyFresh.filter((a) => !seenAtty.has(cleanToken(a.name)))];

          const seenPros = new Set(out.prosecutors.map((p) => cleanToken(p.name)));
          out.prosecutors = [...out.prosecutors, ...prosFresh.filter((p) => !seenPros.has(cleanToken(p.name)))];

          out.totals.attorneys = Math.max(out.attorneys.length, attyFresh.length);
          out.totals.prosecutors = Math.max(out.prosecutors.length, prosFresh.length);
        })
        .catch((err) => {
          errors.push(err);
        }),
    );
  }

  if (want('LEGISLATOR')) {
    tasks.push(
      congress
        .searchMembers(q)
        .then((p) => {
          const seen = new Set(out.legislators.map((l) => cleanToken(l.name)));
          const fresh = p.results.filter((l) => !seen.has(cleanToken(l.name)));
          out.legislators = [...out.legislators, ...fresh];
          out.totals.legislators = Math.max(out.legislators.length, p.count ?? 0);
        })
        .catch((err) => {
          errors.push(err);
        }),
    );
  }

  await Promise.allSettled(tasks);

  out.errors = Array.from(new Set(errors.map(errorMessage)));
  const totalFound =
    out.judges.length + out.attorneys.length + out.prosecutors.length + out.legislators.length + out.cases.length;

  // Only throw an error if absolutely no local or remote records were found AND there was an error
  if (totalFound === 0 && errors.length) {
    const isConfig = errors.find((e) => e instanceof ConfigError);
    if (isConfig) throw isConfig;
  }

  return out;
}
