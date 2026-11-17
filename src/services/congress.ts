/**
 * Congress.gov API v3 client. Docs: https://api.congress.gov/
 * Uses EXPO_PUBLIC_CONGRESS_API_KEY (falls back to the rate-limited DEMO_KEY).
 */
import { config } from '../config';
import { buildQuery, requestJson } from './http';
import type { Bill, LegislatorProfile, LegislatorTerm, SearchResultItem } from '../types';

const BASE = config.congress.baseUrl;
const HOUR = 60 * 60 * 1000;

const str = (v: unknown) => (v == null ? '' : String(v).trim());
const arr = <T = any>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function get<T>(path: string, params: Record<string, string | number | undefined> = {}, ttl = HOUR) {
  const url = `${BASE}${path}${buildQuery({ ...params, format: 'json', api_key: config.congress.apiKey })}`;
  return requestJson<T>(url, { service: 'congress', ttl });
}

/** "Frost, Maxwell" → "Maxwell Frost". */
function directName(inverted: string) {
  const [last, rest] = inverted.split(',').map((s) => s.trim());
  return rest ? `${rest} ${last}` : inverted;
}

function chamberOf(terms: any): string {
  const items = arr<any>(terms?.item ?? terms);
  const latest = items[items.length - 1];
  return str(latest?.chamber) || 'Congress';
}

const shortChamber = (c: string) => (/senate/i.test(c) ? 'Senate' : /house/i.test(c) ? 'House' : c);
const partyLetter = (p: string) => (p ? p[0].toUpperCase() : '');

export interface MemberListItem {
  bioguideId: string;
  name: string;
  party: string;
  state: string;
  district?: number | null;
  chamber: string;
  imageUrl?: string;
}

function mapListMember(m: any): MemberListItem {
  return {
    bioguideId: str(m?.bioguideId),
    name: directName(str(m?.name)),
    party: str(m?.partyName),
    state: str(m?.state),
    district: typeof m?.district === 'number' ? m.district : null,
    chamber: shortChamber(chamberOf(m?.terms)),
    imageUrl: str(m?.depiction?.imageUrl) || undefined,
  };
}

let roster: Promise<MemberListItem[]> | null = null;

/**
 * Congress.gov has no name-search endpoint, so the current-member roster
 * (~540 members, three requests) is fetched once per session and filtered locally.
 */
export function currentMembers(): Promise<MemberListItem[]> {
  if (!roster) {
    roster = (async () => {
      const out: MemberListItem[] = [];
      let offset = 0;
      for (let i = 0; i < 4; i++) {
        const page = await get<any>('/member', { currentMember: 'true', limit: 250, offset }, 6 * HOUR);
        const members = arr(page?.members).map(mapListMember);
        out.push(...members);
        if (!page?.pagination?.next || members.length === 0) break;
        offset += 250;
      }
      return out;
    })().catch((e) => {
      roster = null;
      throw e;
    });
  }
  return roster;
}

export function memberToItem(m: MemberListItem): SearchResultItem {
  return {
    id: m.bioguideId,
    type: 'legislator',
    name: m.name,
    subtitle: `${m.chamber} · ${m.state}${m.district ? ` · District ${m.district}` : ''}`,
    tag: `${partyLetter(m.party)}-${m.state}`,
    imageUrl: m.imageUrl,
  };
}

export async function searchMembers(q: string, limit = 25) {
  const members = await currentMembers();
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = tokens.length
    ? members.filter((m) => {
        const hay = `${m.name} ${m.state} ${m.party}`.toLowerCase();
        return tokens.every((t) => hay.includes(t));
      })
    : members;
  return { results: matches.slice(0, limit).map(memberToItem), count: matches.length };
}

export async function countCurrentMembers(): Promise<number | undefined> {
  const page = await get<any>('/member', { currentMember: 'true', limit: 1 }, 6 * HOUR);
  return typeof page?.pagination?.count === 'number' ? page.pagination.count : undefined;
}

export async function getMember(bioguideId: string): Promise<LegislatorProfile> {
  const r = await get<any>(`/member/${encodeURIComponent(bioguideId)}`);
  const m = r?.member ?? {};
  const terms: LegislatorTerm[] = arr<any>(m?.terms?.item ?? m?.terms).map((t) => ({
    chamber: shortChamber(str(t?.chamber)),
    congress: typeof t?.congress === 'number' ? t.congress : undefined,
    startYear: typeof t?.startYear === 'number' ? t.startYear : undefined,
    endYear: typeof t?.endYear === 'number' ? t.endYear : null,
    memberType: str(t?.memberType) || undefined,
    stateCode: str(t?.stateCode) || undefined,
    district: typeof t?.district === 'number' ? t.district : null,
  }));
  const latest = terms[terms.length - 1];
  const party = arr<any>(m?.partyHistory);
  const lastParty = party[party.length - 1];
  return {
    bioguideId: str(m?.bioguideId) || bioguideId,
    name: str(m?.directOrderName) || directName(str(m?.invertedOrderName)) || bioguideId,
    honorific: str(m?.honorificName) || undefined,
    party: str(lastParty?.partyName) || 'Unknown party',
    partyAbbr: str(lastParty?.partyAbbreviation) || undefined,
    state: str(m?.state),
    district: typeof m?.district === 'number' ? m.district : latest?.district ?? null,
    chamber: latest?.chamber || 'Congress',
    imageUrl: str(m?.depiction?.imageUrl) || undefined,
    website: str(m?.officialWebsiteUrl) || undefined,
    birthYear: str(m?.birthYear) || undefined,
    office: m?.addressInformation
      ? {
          address: [str(m.addressInformation.officeAddress), str(m.addressInformation.city), str(m.addressInformation.district)]
            .filter(Boolean)
            .join(', '),
          phone: str(m.addressInformation.phoneNumber) || undefined,
        }
      : undefined,
    terms,
    sponsoredCount: Number(m?.sponsoredLegislation?.count) || 0,
    cosponsoredCount: Number(m?.cosponsoredLegislation?.count) || 0,
    currentMember: !!m?.currentMember,
    url: `${config.congress.siteUrl}/member/${encodeURIComponent(bioguideId)}`,
  };
}

const BILL_PATH: Record<string, string> = {
  HR: 'house-bill',
  S: 'senate-bill',
  HRES: 'house-resolution',
  SRES: 'senate-resolution',
  HJRES: 'house-joint-resolution',
  SJRES: 'senate-joint-resolution',
  HCONRES: 'house-concurrent-resolution',
  SCONRES: 'senate-concurrent-resolution',
};

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

export function billLabel(b: Bill) {
  const t = (b.type || '').toUpperCase();
  const pretty: Record<string, string> = {
    HR: 'H.R.',
    S: 'S.',
    HRES: 'H.Res.',
    SRES: 'S.Res.',
    HJRES: 'H.J.Res.',
    SJRES: 'S.J.Res.',
    HCONRES: 'H.Con.Res.',
    SCONRES: 'S.Con.Res.',
  };
  return t && b.number ? `${pretty[t] || t} ${b.number}` : 'Amendment';
}

function mapBill(b: any): Bill {
  const type = str(b?.type).toUpperCase();
  const congress = typeof b?.congress === 'number' ? b.congress : undefined;
  const number = str(b?.number) || str(b?.amendmentNumber);
  const actionText = str(b?.latestAction?.text);
  return {
    id: `${congress}-${type || 'AMDT'}-${number}`,
    congress,
    type: type || undefined,
    number: number || undefined,
    title: str(b?.title) || (b?.amendmentNumber ? `Amendment ${b.amendmentNumber}` : 'Untitled measure'),
    introducedDate: str(b?.introducedDate) || null,
    latestAction: actionText ? { date: str(b?.latestAction?.actionDate) || undefined, text: actionText } : undefined,
    policyArea: str(b?.policyArea?.name) || undefined,
    becameLaw: /became public law|signed by president/i.test(actionText),
    url:
      congress && BILL_PATH[type] && number
        ? `${config.congress.siteUrl}/bill/${ordinal(congress)}-congress/${BILL_PATH[type]}/${number}`
        : undefined,
  };
}

export async function sponsoredLegislation(bioguideId: string, limit = 50) {
  const r = await get<any>(`/member/${encodeURIComponent(bioguideId)}/sponsored-legislation`, { limit });
  return {
    bills: arr(r?.sponsoredLegislation).map(mapBill),
    count: typeof r?.pagination?.count === 'number' ? r.pagination.count : undefined,
  };
}

/* --------------------------------------------------------------- bills */

export interface BillDetail {
  congress: number;
  type: string;
  number: string;
  label: string;
  title: string;
  introducedDate?: string;
  originChamber?: string;
  policyArea?: string;
  sponsor?: { name: string; bioguideId?: string; party?: string; state?: string };
  latestAction?: { date?: string; text: string };
  laws: string[];
  cosponsorCount: number;
  actions: { date?: string; text: string; type?: string }[];
  summary?: { text: string; date?: string; stage?: string };
  cosponsors: { name: string; bioguideId?: string; party?: string; state?: string; original: boolean; date?: string }[];
}

function stripTags(html: string) {
  return html
    .replace(/<\/(p|li|div|h\d)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Full bill record: details, latest summary, action history and cosponsors. */
export async function getBill(congressNum: number, type: string, number: string): Promise<BillDetail> {
  const t = type.toLowerCase();
  const base = `/bill/${congressNum}/${encodeURIComponent(t)}/${encodeURIComponent(number)}`;
  const [billRes, actionsRes, summariesRes, cosponsorsRes] = await Promise.all([
    get<any>(base),
    get<any>(`${base}/actions`, { limit: 100 }).catch(() => null),
    get<any>(`${base}/summaries`).catch(() => null),
    get<any>(`${base}/cosponsors`, { limit: 100 }).catch(() => null),
  ]);
  const b = billRes?.bill ?? {};
  const sponsor = arr<any>(b?.sponsors)[0];
  const summaries = arr<any>(summariesRes?.summaries);
  const latestSummary = summaries[summaries.length - 1];
  const upper = type.toUpperCase();
  return {
    congress: congressNum,
    type: upper,
    number,
    label: billLabel({ id: '', title: '', becameLaw: false, type: upper, number }),
    title: str(b?.title) || 'Untitled measure',
    introducedDate: str(b?.introducedDate) || undefined,
    originChamber: str(b?.originChamber) || undefined,
    policyArea: str(b?.policyArea?.name) || undefined,
    sponsor: sponsor
      ? {
          name: str(sponsor.fullName) || directName(`${str(sponsor.lastName)}, ${str(sponsor.firstName)}`),
          bioguideId: str(sponsor.bioguideId) || undefined,
          party: str(sponsor.party) || undefined,
          state: str(sponsor.state) || undefined,
        }
      : undefined,
    latestAction: str(b?.latestAction?.text)
      ? { date: str(b.latestAction.actionDate) || undefined, text: str(b.latestAction.text) }
      : undefined,
    laws: arr<any>(b?.laws).map((l) => `${str(l?.type)} ${str(l?.number)}`.trim()).filter(Boolean),
    cosponsorCount: Number(b?.cosponsors?.count) || arr(cosponsorsRes?.cosponsors).length,
    actions: arr<any>(actionsRes?.actions).map((a) => ({
      date: str(a?.actionDate) || undefined,
      text: str(a?.text),
      type: str(a?.type) || undefined,
    })),
    summary: latestSummary
      ? { text: stripTags(str(latestSummary.text)), date: str(latestSummary.actionDate) || undefined, stage: str(latestSummary.actionDesc) || undefined }
      : undefined,
    cosponsors: arr<any>(cosponsorsRes?.cosponsors).map((c) => ({
      name: str(c?.fullName) || directName(`${str(c?.lastName)}, ${str(c?.firstName)}`),
      bioguideId: str(c?.bioguideId) || undefined,
      party: str(c?.party) || undefined,
      state: str(c?.state) || undefined,
      original: !!c?.isOriginalCosponsor,
      date: str(c?.sponsorshipDate) || undefined,
    })),
  };
}
