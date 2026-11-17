/**
 * Unified search across CourtListener (judges, case law, dockets, attorneys)
 * and Congress.gov (members). Sources run in parallel and fail independently.
 */
import * as cl from './courtlistener';
import * as congress from './congress';
import { ConfigError, errorMessage } from './http';
import type { SearchResults } from '../types';
import type { SearchFilterKey } from '../utils/entities';

export async function searchAll(query: string, filter: SearchFilterKey): Promise<SearchResults> {
  const q = query.trim();
  const want = (k: SearchFilterKey) => filter === k;
  const out: SearchResults = { judges: [], attorneys: [], prosecutors: [], legislators: [], cases: [], totals: {}, errors: [] };
  const errors: unknown[] = [];

  const tasks: Promise<void>[] = [];

  if (want('JUDGE')) {
    tasks.push(
      cl.searchJudges(q).then((p) => {
        out.judges = p.results;
        out.totals.judges = p.count;
      }),
    );
  }

  if (want('CASE')) {
    tasks.push(
      Promise.all([
        cl.searchOpinions(q ? { q, order_by: 'score desc' } : { q: cl.recentRange(60), order_by: 'dateFiled desc' }),
        cl.searchDockets(q ? { q, order_by: 'score desc' } : { q: cl.recentRange(14), order_by: 'dateFiled desc' }),
      ]).then(([ops, dks]) => {
        // Interleave so both kinds surface near the top.
        const a = ops.results.map(cl.recordToSearchItem);
        const b = dks.results.map(cl.recordToSearchItem);
        const merged = [];
        for (let i = 0; i < Math.max(a.length, b.length); i++) {
          if (a[i]) merged.push(a[i]);
          if (b[i]) merged.push(b[i]);
        }
        out.cases = merged;
        out.totals.cases = (ops.count ?? 0) + (dks.count ?? 0) || undefined;
      }),
    );
  }

  if (want('ATTORNEY') || want('PROSECUTOR')) {
    tasks.push(
      cl.searchAttorneys(q).then((p) => {
        out.attorneys = p.results.filter((r) => r.type === 'attorney');
        out.prosecutors = p.results.filter((r) => r.type === 'prosecutor');
        out.totals.attorneys = out.attorneys.length;
        out.totals.prosecutors = out.prosecutors.length;
      }),
    );
  }

  if (want('LEGISLATOR')) {
    tasks.push(
      congress.searchMembers(q).then((p) => {
        out.legislators = p.results;
        out.totals.legislators = p.count;
      }),
    );
  }

  const settled = await Promise.allSettled(tasks);
  settled.forEach((s) => {
    if (s.status === 'rejected') errors.push(s.reason);
  });

  out.errors = Array.from(new Set(errors.map(errorMessage)));
  const empty = !out.judges.length && !out.attorneys.length && !out.prosecutors.length && !out.legislators.length && !out.cases.length;
  // If nothing came back and something failed, surface the failure (prefer config problems).
  if (empty && errors.length) {
    throw errors.find((e) => e instanceof ConfigError) ?? errors[0];
  }
  return out;
}
