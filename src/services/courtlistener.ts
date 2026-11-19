/**
 * CourtListener REST API v4 client.
 * Docs: https://www.courtlistener.com/help/api/rest/v4/
 *
 * Every endpoint except /courts/ requires a token
 * (EXPO_PUBLIC_COURTLISTENER_TOKEN). Responses are normalised defensively so
 * that missing or differently-shaped fields degrade gracefully.
 */
import { config, hasCourtListenerToken } from '../config';
import { ApiError, ConfigError, Priority, buildQuery, configureLimiter, requestJson } from './http';
import type {
  AttorneyProfile,
  CaseRecord,
  ClusterDetail,
  Court,
  DocketDetail,
  DocketEntry,
  DocketParty,
  FeedItem,
  JudgePosition,
  JudgeProfile,
  OpinionMeta,
  SearchResultItem,
} from '../types';

const BASE = config.courtListener.baseUrl;
const SITE = config.courtListener.siteUrl;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const LIMITER = 'courtlistener';
configureLimiter(LIMITER, config.courtListener.requestsPerMinute);

type Params = Record<string, string | number | boolean | undefined | null>;

export interface Page<T> {
  results: T[];
  count?: number;
  next: string | null;
}

/* --------------------------------------------------------------- helpers */

const str = (v: unknown): string => {
  if (v == null) return '';
  if (Array.isArray(v)) return v.filter((x) => x != null && x !== '').map(String).join(', ');
  if (typeof v === 'object') return '';
  return String(v).trim();
};
const firstOf = (v: unknown): string => (Array.isArray(v) ? str(v[0]) : str(v));
const arr = <T = any>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const num = (v: unknown): number | undefined => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return isNaN(n) ? undefined : n;
};
/** Extracts the id from a hyperlinked resource URL like ".../people/1124/". */
export const idFromUrl = (url: unknown, kind: string): string | undefined => {
  if (typeof url === 'number') return String(url);
  if (typeof url !== 'string') return undefined;
  const m = new RegExp(`/${kind}/([^/?#]+)/?`).exec(url);
  return m ? m[1] : undefined;
};
const absolute = (path: unknown) => {
  const p = str(path);
  if (!p) return undefined;
  return p.startsWith('http') ? p : `${SITE}${p}`;
};
const stripHtml = (html: string) =>
  html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h\d|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&sect;/g, '§')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

function authHeaders(requireToken: boolean): Record<string, string> {
  if (hasCourtListenerToken()) return { Authorization: `Token ${config.courtListener.token}` };
  if (requireToken) {
    throw new ConfigError(
      'courtlistener',
      'CourtListener API token missing. Add EXPO_PUBLIC_COURTLISTENER_TOKEN to your .env file and restart Metro.',
    );
  }
  return {};
}

/**
 * GET helper. Token requests go through the shared rate limiter (the token's
 * budget is small); `anonymous` requests (public /courts/) skip the token so
 * they don't consume that budget.
 */
async function get<T>(
  pathOrUrl: string,
  params: Params = {},
  opts: { ttl?: number; anonymous?: boolean; priority?: Priority } = {},
) {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${BASE}${pathOrUrl}${buildQuery(params)}`;
  if (opts.anonymous) return requestJson<T>(url, { service: 'courtlistener', ttl: opts.ttl });
  return requestJson<T>(url, {
    service: 'courtlistener',
    headers: authHeaders(true),
    ttl: opts.ttl ?? 30 * 60 * 1000,
    limiter: LIMITER,
    priority: opts.priority ?? 'high',
  });
}

/** Reads a count that may be an integer or (in v4) a URL that returns it. */
async function resolveCount(raw: unknown): Promise<number | undefined> {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string' && raw.startsWith('http')) {
    const r = await get<{ count?: number }>(raw, {}, { ttl: HOUR });
    return num(r?.count);
  }
  return undefined;
}

async function listPage<T>(raw: any, map: (r: any) => T): Promise<Page<T>> {
  return {
    results: arr(raw?.results).map(map),
    count: await resolveCount(raw?.count).catch(() => undefined),
    next: typeof raw?.next === 'string' ? raw.next : null,
  };
}

/* ---------------------------------------------------------------- courts */

export const JURISDICTIONS: Record<string, string> = {
  F: 'Federal Appellate',
  FD: 'Federal District',
  FB: 'Federal Bankruptcy',
  FBP: 'Federal Bankruptcy Panel',
  FS: 'Federal Special',
  S: 'State Supreme',
  SA: 'State Appellate',
  ST: 'State Trial',
  SS: 'State Special',
  TRS: 'Tribal Supreme',
  TRA: 'Tribal Appellate',
  TRT: 'Tribal Trial',
  TRX: 'Tribal Special',
  TS: 'Territory Supreme',
  TA: 'Territory Appellate',
  TT: 'Territory Trial',
  TSP: 'Territory Special',
  SAG: 'State Attorney General',
  MA: 'Military Appellate',
  MT: 'Military Trial',
  C: 'Committee',
  I: 'International',
  T: 'Testing',
};

const COURT_FIELDS = 'id,short_name,full_name,citation_string,jurisdiction,url,start_date,end_date,in_use';

function mapCourt(r: any): Court {
  const j = str(r?.jurisdiction);
  return {
    id: str(r?.id),
    shortName: str(r?.short_name) || str(r?.full_name),
    fullName: str(r?.full_name) || str(r?.short_name),
    citation: str(r?.citation_string),
    jurisdiction: j,
    jurisdictionLabel: JURISDICTIONS[j] || j || 'Court',
    url: str(r?.url) || undefined,
    startDate: r?.start_date ?? null,
    endDate: r?.end_date ?? null,
    inUse: r?.in_use,
  };
}

export async function listCourts(opts: { jurisdiction?: string; nameStartsWith?: string; next?: string | null }) {
  if (opts.next) return listPage(await get<any>(opts.next, {}, { anonymous: true, ttl: HOUR }), mapCourt);
  const base: Params = {
    in_use: 'true',
    jurisdiction: opts.jurisdiction,
    fields: COURT_FIELDS,
    page_size: 50,
    order_by: 'position',
  };
  if (!opts.nameStartsWith) {
    return listPage(await get<any>('/courts/', base, { anonymous: true, ttl: HOUR }), mapCourt);
  }
  // Name search: merge full-name, short-name and citation prefix matches.
  const q = opts.nameStartsWith.trim();
  const pages = await Promise.all([
    get<any>('/courts/', { ...base, full_name__istartswith: q }, { anonymous: true, ttl: HOUR }),
    get<any>('/courts/', { ...base, short_name__istartswith: q }, { anonymous: true, ttl: HOUR }),
    get<any>('/courts/', { ...base, citation_string__istartswith: q }, { anonymous: true, ttl: HOUR }),
  ]);
  const seen = new Set<string>();
  const results: Court[] = [];
  pages.forEach((p) =>
    arr(p?.results).forEach((r) => {
      const c = mapCourt(r);
      if (!seen.has(c.id)) {
        seen.add(c.id);
        results.push(c);
      }
    }),
  );
  return { results, count: results.length, next: null } as Page<Court>;
}

export async function getCourt(id: string): Promise<Court> {
  return mapCourt(await get<any>(`/courts/${encodeURIComponent(id)}/`, { fields: COURT_FIELDS }, { anonymous: true, ttl: 24 * HOUR }));
}

/** Best-effort court name lookup (cached); falls back to the id. */
export async function courtName(id?: string): Promise<string | undefined> {
  if (!id) return undefined;
  try {
    return (await getCourt(id)).fullName;
  } catch {
    return id;
  }
}

/* ---------------------------------------------------------------- search */

type SearchType = 'o' | 'r' | 'd' | 'p' | 'rd' | 'oa';

export async function search(
  type: SearchType,
  params: Params & { q?: string },
  next?: string | null,
  priority: Priority = 'high',
) {
  if (next) return get<any>(next, {}, { ttl: 30 * 60 * 1000, priority });
  return get<any>('/search/', { type, ...params }, { ttl: 30 * 60 * 1000, priority });
}

const OPINION_TYPE_LABELS: Record<string, string> = {
  'combined-opinion': 'Combined opinion',
  'unanimous-opinion': 'Unanimous opinion',
  'lead-opinion': 'Lead opinion',
  'plurality-opinion': 'Plurality opinion',
  'concurrence-opinion': 'Concurrence',
  'in-part-opinion': 'Concurring in part',
  dissent: 'Dissent',
  addendum: 'Addendum',
  remittitur: 'Remittitur',
  rehearing: 'Rehearing',
  'on-the-merits': 'On the merits',
  'on-motion-to-strike': 'On motion to strike',
};

export function opinionTypeLabel(raw?: string) {
  if (!raw) return 'Opinion';
  const key = raw.replace(/^\d+/, '').replace(/^[-_]/, '').toLowerCase();
  return OPINION_TYPE_LABELS[key] || key.replace(/[-_]/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) || 'Opinion';
}

/** Case-law search hit → CaseRecord. `authorId` picks that judge's opinion type as the group. */
export function opinionHitToRecord(r: any, authorId?: string): CaseRecord {
  const ops = arr<any>(r?.opinions);
  const authored = authorId ? ops.find((o) => String(o?.author_id) === authorId) : undefined;
  const lead = authored || ops[0];
  return {
    id: `cluster:${str(r?.cluster_id)}`,
    kind: 'opinion',
    title: str(r?.caseName) || str(r?.caseNameFull) || 'Untitled case',
    court: str(r?.court) || str(r?.court_id),
    courtId: str(r?.court_id) || undefined,
    date: r?.dateFiled ?? null,
    docketNumber: str(r?.docketNumber) || undefined,
    citations: arr<string>(r?.citation).map(String),
    citeCount: num(r?.citeCount),
    group: authorId ? opinionTypeLabel(lead?.type) : str(r?.status) || 'Opinion',
    status: str(r?.status) || undefined,
    snippet: lead?.snippet ? stripHtml(str(lead.snippet)).slice(0, 280) : undefined,
    url: absolute(r?.absolute_url),
  };
}

/** Docket search hit (type d/r) → CaseRecord. */
export function docketHitToRecord(r: any): CaseRecord {
  return {
    id: `docket:${str(r?.docket_id)}`,
    kind: 'docket',
    title: str(r?.caseName) || str(r?.caseNameFull) || 'Untitled docket',
    court: str(r?.court) || str(r?.court_id),
    courtId: str(r?.court_id) || undefined,
    date: r?.dateFiled ?? null,
    docketNumber: str(r?.docketNumber) || undefined,
    group: str(r?.suitNature) || str(r?.cause) || 'Federal docket',
    status: r?.dateTerminated ? 'Terminated' : 'Open',
    url: absolute(r?.docket_absolute_url || r?.absolute_url),
  };
}

export function recordToSearchItem(rec: CaseRecord): SearchResultItem {
  return {
    id: rec.id,
    type: 'case',
    name: rec.title,
    subtitle: [rec.court, rec.docketNumber].filter(Boolean).join(' · '),
    court: rec.court,
    date: rec.date,
    tag: rec.kind === 'opinion' ? 'Opinion' : 'Docket',
  };
}

export function personHitToItem(r: any): SearchResultItem {
  const positions = arr<any>(r?.positions);
  const court =
    str(positions[0]?.court_full_name) || str(positions[0]?.court) || firstOf(r?.court) || firstOf(r?.court_exact);
  const title = str(positions[0]?.position_type) || firstOf(r?.position_type);
  return {
    id: str(r?.id),
    type: 'judge',
    name: str(r?.name) || 'Unnamed judge',
    subtitle: [title, court].filter(Boolean).join(' · ') || undefined,
    court: court || undefined,
    tag: firstOf(r?.political_affiliation) || undefined,
  };
}

export async function searchJudges(q: string, opts: { court?: string; order?: 'relevance' | 'name'; next?: string | null } = {}) {
  const raw = await search(
    'p',
    {
      q: q.trim() || undefined,
      court: opts.court,
      order_by: opts.order === 'name' || !q.trim() ? 'name_reverse asc' : 'score desc',
    },
    opts.next,
  );
  return listPage(raw, personHitToItem);
}

export async function searchOpinions(params: Params & { q?: string }, next?: string | null, authorId?: string) {
  const raw = await search('o', params, next);
  return listPage(raw, (r) => opinionHitToRecord(r, authorId));
}

export async function searchDockets(params: Params & { q?: string }, next?: string | null) {
  const raw = await search('d', params, next);
  return listPage(raw, docketHitToRecord);
}

/* ------------------------------------------------------------- dashboard */

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/** Date-range clause that excludes future-dated typos in source data. */
export function recentRange(days: number) {
  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * HOUR);
  return `dateFiled:[${isoDate(from)} TO ${isoDate(now)}]`;
}

export async function countSearch(type: SearchType, params: Params = {}) {
  const raw = await search(type, params, null, 'low');
  return resolveCount(raw?.count);
}

/** Background count (low priority, cached for a day). */
export async function countList(path: string, params: Params = {}, anonymous = false) {
  const raw = await get<any>(path, { ...params, count: 'on' }, { ttl: DAY, anonymous, priority: 'low' });
  return resolveCount(raw?.count);
}

function opinionToFeed(rec: CaseRecord): FeedItem {
  return {
    id: rec.id,
    kind: 'opinion',
    title: rec.title,
    court: rec.court,
    date: rec.date,
    detail: rec.citations?.[0] || rec.status,
    citeCount: rec.citeCount,
    routeId: rec.id,
  };
}

function docketToFeed(r: any): FeedItem {
  const rec = docketHitToRecord(r);
  return {
    id: rec.id,
    kind: 'docket',
    title: rec.title,
    court: rec.court,
    date: rec.date,
    detail: [rec.docketNumber, rec.group].filter(Boolean).join(' · '),
    judge: str(r?.assignedTo) || undefined,
    routeId: rec.id,
  };
}

const notFuture = (d?: string | null) => !d || d <= isoDate(new Date());

/**
 * Newest case-law opinions from the last 30 days. A date window is required:
 * sorting the whole archive by date surfaces future-dated data-entry errors.
 * `count` is the number of opinions in that window.
 */
export async function latestOpinions(next?: string | null) {
  const raw = await search('o', { q: recentRange(30), order_by: 'dateFiled desc' }, next);
  const page = await listPage(raw, (r) => opinionHitToRecord(r));
  // Source data occasionally has future-dated typos; hide them from "latest".
  const results = page.results.filter((r) => notFuture(r.date));
  return { ...page, results, feed: results.map(opinionToFeed) };
}

/** Newest federal dockets from the last 14 days (same future-date issue as above). */
export async function latestDockets(next?: string | null) {
  const raw = await search('d', { q: recentRange(14), order_by: 'dateFiled desc' }, next);
  const feed = arr(raw?.results).map(docketToFeed).filter((f) => notFuture(f.date));
  return {
    feed,
    count: await resolveCount(raw?.count).catch(() => undefined),
    next: typeof raw?.next === 'string' ? raw.next : null,
  };
}

/* ---------------------------------------------------------------- judges */

const POSITION_LABELS: Record<string, string> = {
  jud: 'Judge',
  'jus': 'Justice',
  'c-jud': 'Chief Judge',
  'c-jus': 'Chief Justice',
  'ass-jus': 'Associate Justice',
  'act-jud': 'Acting Judge',
  'act-jus': 'Acting Justice',
  'ret-jud': 'Retired Judge',
  'ret-jus': 'Retired Justice',
  'ret-c-jud': 'Retired Chief Judge',
  'ret-c-jus': 'Retired Chief Justice',
  'ret-ass-jus': 'Retired Associate Justice',
  'sen-jud': 'Senior Judge',
  'sen-jus': 'Senior Justice',
  'p-jud': 'Presiding Judge',
  'pres-jud': 'Presiding Judge',
  'mag': 'Magistrate Judge',
  'c-mag': 'Chief Magistrate Judge',
  'ret-mag': 'Retired Magistrate Judge',
  'sp-mag': 'Special Magistrate',
  'r-mag': 'Recalled Magistrate',
  'mag-part': 'Part-Time Magistrate',
  'ad-law-jud': 'Administrative Law Judge',
  'c-ad-law-jud': 'Chief Administrative Law Judge',
  'c-spec-m': 'Chief Special Master',
  'spec-m': 'Special Master',
  'c-bank-jud': 'Chief Bankruptcy Judge',
  'bank-jud': 'Bankruptcy Judge',
  'ret-bank-jud': 'Retired Bankruptcy Judge',
  'tax-jud': 'Tax Judge',
  pres: 'President of the United States',
  gov: 'Governor',
  clerk: 'Clerk',
  'clerk-chief-deputy': 'Chief Deputy Clerk',
  'staff-atty': 'Staff Attorney',
  prof: 'Professor',
  prac: 'Practitioner',
  pros: 'Prosecutor',
  pub_def: 'Public Defender',
  legis: 'Legislator',
};

const SELECTION_LABELS: Record<string, string> = {
  e_part: 'Partisan election',
  e_non_part: 'Non-partisan election',
  a_pres: 'Appointed by the President',
  a_gov: 'Appointed by the Governor',
  a_legis: 'Appointed by the Legislature',
  a_judge: 'Appointed by judges',
  ct_trans: 'Court transfer',
};

const isJudicialType = (code: string) =>
  /jud|jus|mag|bank|spec-m|tax/.test(code) || /judge|justice|magistrate/i.test(code);

/**
 * One judge-search hit carries flattened positions (court names, appointer
 * names, selection method, termination reason), schools, ABA ratings and
 * political affiliations — a single request instead of six or more.
 */
export async function getJudge(id: string): Promise<JudgeProfile> {
  const raw = await search('p', { q: `id:${id}` });
  const hit = arr<any>(raw?.results).find((r) => str(r?.id) === id) ?? arr<any>(raw?.results)[0];
  if (!hit) throw new ApiError('courtlistener', 404, 'Judge record not found.');

  const positions: JudgePosition[] = arr<any>(hit?.positions).map((p, i) => {
    const title = str(p?.position_type) || str(p?.job_title) || 'Position';
    const courtFull = str(p?.court_full_name) || str(p?.court);
    return {
      id: `${id}-${i}`,
      title: POSITION_LABELS[title] || title,
      court: courtFull || str(p?.organization_name) || undefined,
      courtId: str(p?.court_exact) || undefined,
      dateNominated: p?.date_nominated ?? null,
      dateConfirmation: p?.date_confirmation ?? null,
      dateStart: p?.date_start ?? null,
      dateTermination: p?.date_termination ?? null,
      terminationReason: str(p?.termination_reason) || undefined,
      howSelected: str(p?.selection_method) || SELECTION_LABELS[str(p?.selection_method_id)] || undefined,
      appointer: str(p?.appointer) ? flipName(str(p.appointer)) : undefined,
      isJudicial: !!courtFull || isJudicialType(title),
    };
  });
  positions.sort((a, b) => (b.dateStart || '').localeCompare(a.dateStart || ''));

  const absUrl = str(hit?.absolute_url);
  const slug = /\/person\/\d+\/([^/]+)\//.exec(absUrl)?.[1];
  const abaYears = arr<string>(hit?.aba_rating).map(String);

  return {
    id,
    name: str(hit?.name) || 'Unnamed judge',
    slug,
    // Portrait exists only for some judges; the UI falls back to a monogram on load error.
    photoUrl: slug ? `https://portraits.free.law/v2/256/${slug}.jpeg` : undefined,
    dateOfBirth: hit?.dob ?? null,
    dateOfDeath: hit?.dod ?? null,
    birthplace: [str(hit?.dob_city), str(hit?.dob_state)].filter(Boolean).join(', ') || undefined,
    educations: arr<string>(hit?.school).map((school) => ({ school: String(school) })),
    affiliations: arr<string>(hit?.political_affiliation).map((party) => ({ party: String(party) })),
    abaRatings: abaYears.map((rating) => ({ rating })),
    positions,
    appointers: Array.from(new Set(positions.map((p) => p.appointer).filter((x): x is string => !!x))),
    selectionMethods: Array.from(new Set(positions.map((p) => p.howSelected).filter((x): x is string => !!x))),
    url: absolute(absUrl) || `${SITE}/person/${id}/`,
  };
}

/** "Carter, Jimmy" → "Jimmy Carter". */
function flipName(n: string) {
  const [last, first] = n.split(',').map((x) => x.trim());
  return first ? `${first} ${last}` : n;
}

/** Fetches up to `pages` pages of search results, following cursors. */
export async function collectPages<T>(
  first: () => Promise<Page<T>>,
  more: (next: string) => Promise<Page<T>>,
  pages: number,
): Promise<Page<T>> {
  const head = await first();
  const results = [...head.results];
  let next = head.next;
  for (let i = 1; i < pages && next; i++) {
    const p = await more(next);
    results.push(...p.results);
    next = p.next;
  }
  return { results, count: head.count, next };
}

export function judgeOpinions(id: string, pages = 3) {
  const params = { q: `author_id:${id}`, order_by: 'dateFiled desc', stat_Published: 'on', stat_Unpublished: 'on' };
  return collectPages(
    () => searchOpinions(params, null, id),
    (n) => searchOpinions({}, n, id),
    pages,
  );
}

export function judgeDockets(id: string, pages = 2) {
  return collectPages(
    () => searchDockets({ q: `assigned_to_id:${id}`, order_by: 'dateFiled desc' }),
    (n) => searchDockets({}, n),
    pages,
  );
}

/* ------------------------------------------------------------- attorneys */

const GOVERNMENT_RE =
  /(u\.?\s?s\.?\s+attorney|united states attorney|district attorney|attorney general|department of justice|\bdoj\b|prosecut|state'?s attorney|solicitor general|commonwealth'?s attorney|county attorney|city attorney)/i;

function mapAttorney(r: any): AttorneyProfile {
  const contact = str(r?.contact_raw);
  const lines = contact.split('\n').map((l) => l.trim()).filter(Boolean);
  return {
    id: str(r?.id),
    name: str(r?.name) || 'Unnamed attorney',
    contact,
    phone: str(r?.phone) || undefined,
    email: str(r?.email) || undefined,
    fax: str(r?.fax) || undefined,
    office: lines[0] && !/^\d/.test(lines[0]) ? lines[0] : undefined,
    isGovernment: GOVERNMENT_RE.test(contact),
    roles: arr<any>(r?.parties_represented).map((p) => ({
      docketId: idFromUrl(p?.docket, 'dockets') || str(p?.docket_id),
      role: num(p?.role) ?? null,
      partyId: idFromUrl(p?.party, 'parties'),
    })),
  };
}

export const ROLE_LABELS: Record<number, string> = {
  1: 'Attorney to be noticed',
  2: 'Lead attorney',
  3: 'Attorney in sealed group',
  4: 'Pro hac vice',
  5: 'Self-terminated',
  6: 'Terminated',
  7: 'Suspended',
  8: 'Inactive',
  9: 'Disbarred',
  10: 'Unknown role',
};

export function titleCaseName(name: string) {
  if (name !== name.toUpperCase()) return name;
  return name.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());
}

function attorneyToItem(a: AttorneyProfile): SearchResultItem {
  return {
    id: a.id,
    type: a.isGovernment ? 'prosecutor' : 'attorney',
    name: titleCaseName(a.name),
    subtitle: a.office ? titleCaseName(a.office) : `${a.roles.length} docket appearances`,
    tag: a.isGovernment ? 'Government' : undefined,
  };
}

export async function searchAttorneys(q: string, next?: string | null) {
  const query = q.trim();
  const fields = 'id,name,contact_raw,phone,email,fax';
  let raw: any;
  if (next) raw = await get<any>(next);
  else if (!query) raw = await get<any>('/attorneys/', { fields, order_by: '-date_modified' });
  // The attorneys endpoint only supports exact / prefix name filters
  // (verified via OPTIONS), so this matches names that start with the query.
  else raw = await get<any>('/attorneys/', { fields, name__istartswith: query, order_by: '-date_modified' });
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const people = arr(raw?.results)
    .map(mapAttorney)
    // Guard against a server that silently ignores an unsupported filter.
    .filter((a) => tokens.every((t) => a.name.toLowerCase().includes(t)));
  return {
    results: people.map(attorneyToItem),
    count: await resolveCount(raw?.count).catch(() => undefined),
    next: typeof raw?.next === 'string' ? raw.next : null,
  } as Page<SearchResultItem>;
}

export async function getAttorney(id: string) {
  return mapAttorney(await get<any>(`/attorneys/${encodeURIComponent(id)}/`, {}, { ttl: HOUR }));
}

/** Docket metadata for a set of docket ids (chunked search queries). */
export async function docketsByIds(ids: string[], max = 60): Promise<CaseRecord[]> {
  const unique = Array.from(new Set(ids.filter(Boolean))).slice(0, max);
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += 20) chunks.push(unique.slice(i, i + 20));
  const pages = await Promise.all(
    chunks.map((c) => search('d', { q: `docket_id:(${c.join(' OR ')})`, order_by: 'dateFiled desc' }).catch(() => null)),
  );
  return pages.flatMap((p) => arr(p?.results).map(docketHitToRecord));
}

/* ----------------------------------------------------------------- cases */

function citationString(c: any): string {
  if (typeof c === 'string') return c;
  return [str(c?.volume), str(c?.reporter), str(c?.page)].filter(Boolean).join(' ');
}

export async function getCluster(id: string): Promise<ClusterDetail> {
  const r = await get<any>(`/clusters/${encodeURIComponent(id)}/`, {}, { ttl: HOUR });
  return {
    id: str(r?.id) || id,
    caseName: str(r?.case_name) || str(r?.case_name_full) || 'Untitled case',
    caseNameFull: str(r?.case_name_full) || undefined,
    dateFiled: r?.date_filed ?? null,
    judges: str(r?.judges) || undefined,
    citations: arr(r?.citations).map(citationString).filter(Boolean),
    status: str(r?.precedential_status) || undefined,
    citationCount: num(r?.citation_count),
    syllabus: str(r?.syllabus) ? stripHtml(str(r.syllabus)) : undefined,
    summary: str(r?.summary) ? stripHtml(str(r.summary)) : undefined,
    proceduralHistory: str(r?.procedural_history) ? stripHtml(str(r.procedural_history)) : undefined,
    posture: str(r?.posture) ? stripHtml(str(r.posture)) : undefined,
    disposition: str(r?.disposition) || undefined,
    attorneys: str(r?.attorneys) ? stripHtml(str(r.attorneys)) : undefined,
    docketId: str(r?.docket_id) || idFromUrl(r?.docket, 'dockets'),
    subOpinionIds: arr(r?.sub_opinions)
      .map((u) => idFromUrl(u, 'opinions'))
      .filter((x): x is string => !!x),
    url: absolute(r?.absolute_url) || `${SITE}/opinion/${id}/`,
  };
}

export async function getDocket(id: string): Promise<DocketDetail> {
  const r = await get<any>(`/dockets/${encodeURIComponent(id)}/`, {}, { ttl: HOUR });
  return {
    id: str(r?.id) || id,
    caseName: str(r?.case_name) || str(r?.case_name_full) || str(r?.case_name_short) || 'Untitled docket',
    docketNumber: str(r?.docket_number) || undefined,
    courtId: str(r?.court_id) || idFromUrl(r?.court, 'courts'),
    dateFiled: r?.date_filed ?? null,
    dateTerminated: r?.date_terminated ?? null,
    dateLastFiling: r?.date_last_filing ?? null,
    dateArgued: r?.date_argued ?? null,
    assignedTo: str(r?.assigned_to_str) || undefined,
    assignedToId: idFromUrl(r?.assigned_to, 'people'),
    referredTo: str(r?.referred_to_str) || undefined,
    cause: str(r?.cause) || undefined,
    natureOfSuit: str(r?.nature_of_suit) || undefined,
    juryDemand: str(r?.jury_demand) || undefined,
    jurisdictionType: str(r?.jurisdiction_type) || undefined,
    appealFrom: str(r?.appeal_from_str) || undefined,
    clusterIds: arr(r?.clusters)
      .map((u) => idFromUrl(u, 'clusters'))
      .filter((x): x is string => !!x),
    url: absolute(r?.absolute_url) || `${SITE}/docket/${id}/`,
  };
}

/** One opinion's metadata and full text in a single request (loaded on demand). */
export async function getOpinion(id: string): Promise<OpinionMeta & { text: string }> {
  const o = await get<any>(
    `/opinions/${encodeURIComponent(id)}/`,
    {
      fields:
        'id,type,author_str,author_id,author,joined_by_str,per_curiam,download_url,html_with_citations,html,html_lawbox,html_columbia,plain_text',
    },
    { ttl: DAY },
  );
  const html = str(o?.html_with_citations) || str(o?.html) || str(o?.html_lawbox) || str(o?.html_columbia);
  return {
    id: str(o?.id) || id,
    type: opinionTypeLabel(str(o?.type)),
    author: str(o?.author_str) || undefined,
    authorId: str(o?.author_id) || idFromUrl(o?.author, 'people'),
    joinedBy: str(o?.joined_by_str) || undefined,
    perCuriam: !!o?.per_curiam,
    downloadUrl: str(o?.download_url) || undefined,
    text: html ? stripHtml(html) : str(o?.plain_text),
  };
}

/** Resolves any case route id to a concrete cluster or docket. */
export async function resolveCase(id: string): Promise<{ kind: 'cluster' | 'docket'; id: string } | null> {
  const m = /^(cluster|docket):(.+)$/.exec(id);
  if (m) return { kind: m[1] as 'cluster' | 'docket', id: m[2] };
  const text = id.trim();
  if (/\d+\s+[A-Za-z][\w.\s']*\s+\d+/.test(text)) {
    const clusters = await lookupCitation(text).catch(() => []);
    if (clusters[0]) return { kind: 'cluster', id: clusters[0] };
  }
  const dockets = await docketsByNumber(text);
  return dockets[0] ? { kind: 'docket', id: dockets[0] } : null;
}

export async function getDocketParties(docketId: string): Promise<DocketParty[]> {
  const [partiesRaw, attorneysRaw] = await Promise.all([
    get<any>('/parties/', { docket: docketId, page_size: 50 }, { ttl: HOUR }),
    get<any>('/attorneys/', { docket: docketId, filter_nested_results: 'True', page_size: 100, fields: 'id,name,parties_represented' }, { ttl: HOUR }).catch(
      () => ({ results: [] }),
    ),
  ]);
  // Map party id → attorney names (only roles on this docket).
  const byParty = new Map<string, string[]>();
  arr<any>(attorneysRaw?.results).forEach((a) => {
    arr<any>(a?.parties_represented).forEach((pr) => {
      const dId = idFromUrl(pr?.docket, 'dockets') || str(pr?.docket_id);
      if (dId && dId !== docketId) return;
      const pId = idFromUrl(pr?.party, 'parties');
      if (!pId) return;
      const list = byParty.get(pId) || [];
      const n = titleCaseName(str(a?.name));
      if (n && !list.includes(n)) list.push(n);
      byParty.set(pId, list);
    });
  });
  return arr<any>(partiesRaw?.results).map((p) => {
    const id = str(p?.id);
    return {
      id,
      name: titleCaseName(str(p?.name)) || 'Unnamed party',
      roles: Array.from(
        new Set(
          arr<any>(p?.party_types)
            .filter((pt) => !pt?.docket_id || String(pt.docket_id) === docketId || idFromUrl(pt?.docket, 'dockets') === docketId)
            .map((pt) => str(pt?.name))
            .filter(Boolean),
        ),
      ),
      attorneys: byParty.get(id) || [],
    };
  });
}

export async function getDocketEntries(docketId: string, next?: string | null) {
  const raw = next
    ? await get<any>(next)
    : await get<any>('/docket-entries/', { docket: docketId, order_by: '-date_filed', page_size: 20 }, { ttl: 10 * 60 * 1000 });
  const entries: DocketEntry[] = arr<any>(raw?.results).map((e) => ({
    id: str(e?.id),
    entryNumber: num(e?.entry_number) ?? null,
    dateFiled: e?.date_filed ?? null,
    description: stripHtml(str(e?.description)) || 'Docket entry',
    documents: arr<any>(e?.recap_documents).map((d) => ({
      id: str(d?.id),
      description: str(d?.description) || str(d?.short_description) || 'Document',
      number: str(d?.document_number) || undefined,
      pageCount: num(d?.page_count) ?? null,
      available: !!d?.is_available,
      url: absolute(d?.absolute_url) || (str(d?.filepath_local) ? `https://storage.courtlistener.com/${str(d.filepath_local)}` : undefined),
    })),
  }));
  return { entries, next: typeof raw?.next === 'string' ? raw.next : null };
}

/** Resolves a citation like "410 U.S. 113" to cluster ids. */
export async function lookupCitation(text: string): Promise<string[]> {
  const body = `text=${encodeURIComponent(text)}`;
  const res = await requestJson<any[]>(`${BASE}/citation-lookup/`, {
    service: 'courtlistener',
    method: 'POST',
    body,
    headers: { ...authHeaders(true), 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return arr<any>(res)
    .flatMap((c) => arr<any>(c?.clusters))
    .map((cl) => str(cl?.id) || idFromUrl(cl?.resource_uri, 'clusters') || '')
    .filter(Boolean);
}

/** Finds dockets by docket number. */
export async function docketsByNumber(docketNumber: string): Promise<string[]> {
  const raw = await get<any>('/dockets/', { docket_number: docketNumber, fields: 'id' });
  return arr<any>(raw?.results).map((d) => str(d?.id)).filter(Boolean);
}

/* --------------------------------------------------------- documents */

export interface RecapDocument {
  id: string;
  description: string;
  documentNumber?: string;
  attachmentNumber?: string;
  pageCount?: number | null;
  available: boolean;
  dateUploaded?: string | null;
  docketEntryId?: string;
  text: string;
}

/** A court filing's metadata and extracted text, shown in-app. */
export async function getRecapDocument(id: string): Promise<RecapDocument> {
  const d = await get<any>(
    `/recap-documents/${encodeURIComponent(id)}/`,
    {
      fields:
        'id,description,document_number,attachment_number,page_count,is_available,date_upload,docket_entry,plain_text',
    },
    { ttl: DAY },
  );
  return {
    id: str(d?.id) || id,
    description: str(d?.description) || 'Court filing',
    documentNumber: str(d?.document_number) || undefined,
    attachmentNumber: str(d?.attachment_number) || undefined,
    pageCount: num(d?.page_count) ?? null,
    available: !!d?.is_available,
    dateUploaded: d?.date_upload ?? null,
    docketEntryId: idFromUrl(d?.docket_entry, 'docket-entries'),
    text: str(d?.plain_text).replace(/\n{3,}/g, '\n\n'),
  };
}
