/* ------------------------------------------------------------------ Auth */
// Auth still goes through the Benchmark Justice backend.

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

/* ---------------------------------------------------------------- Search */

export type EntityType = 'judge' | 'attorney' | 'prosecutor' | 'legislator' | 'case';

export interface SearchResultItem {
  /** Route id. Cases use "cluster:<id>" or "docket:<id>". */
  id: string;
  type: EntityType;
  name: string;
  /** Secondary line (court, office, party · state…). */
  subtitle?: string;
  court?: string;
  jurisdiction?: string;
  date?: string | null;
  /** Small tag shown on the row, e.g. "Opinion", "Docket", "D-CA". */
  tag?: string;
  imageUrl?: string;
}

export interface SearchResults {
  judges: SearchResultItem[];
  attorneys: SearchResultItem[];
  prosecutors: SearchResultItem[];
  legislators: SearchResultItem[];
  cases: SearchResultItem[];
  /** Total matches reported by the source, when known. */
  totals: Partial<Record<'judges' | 'attorneys' | 'prosecutors' | 'legislators' | 'cases', number>>;
  /** Per-source failures (other sources may still have results). */
  errors: string[];
}

/* ---------------------------------------------------------------- Courts */

export interface Court {
  id: string;
  shortName: string;
  fullName: string;
  citation: string;
  jurisdiction: string;
  jurisdictionLabel: string;
  url?: string;
  startDate?: string | null;
  endDate?: string | null;
  inUse?: boolean;
}

/* ----------------------------------------------------------- Case records */

/** A row in a case list: either a case-law opinion cluster or a docket. */
export interface CaseRecord {
  id: string;
  kind: 'opinion' | 'docket';
  title: string;
  court: string;
  courtId?: string;
  date?: string | null;
  docketNumber?: string;
  citations?: string[];
  citeCount?: number;
  /** Grouping label for filter chips (opinion type, nature of suit…). */
  group?: string;
  status?: string;
  snippet?: string;
  /** Absolute CourtListener URL. */
  url?: string;
}

/* ----------------------------------------------------------------- Judges */

export interface JudgePosition {
  id: string;
  title: string;
  court?: string;
  courtId?: string;
  dateNominated?: string | null;
  dateConfirmation?: string | null;
  dateStart?: string | null;
  dateTermination?: string | null;
  terminationReason?: string;
  howSelected?: string;
  appointer?: string;
  isJudicial: boolean;
}

export interface JudgeProfile {
  id: string;
  name: string;
  slug?: string;
  photoUrl?: string;
  dateOfBirth?: string | null;
  dateOfDeath?: string | null;
  birthplace?: string;
  educations: { school: string; degree?: string; year?: number | null }[];
  affiliations: { party: string; start?: string | null; end?: string | null }[];
  abaRatings: { rating: string; year?: number | null }[];
  positions: JudgePosition[];
  appointers: string[];
  selectionMethods: string[];
  url: string;
}

/* -------------------------------------------------------------- Attorneys */

export interface AttorneyProfile {
  id: string;
  name: string;
  contact: string;
  phone?: string;
  email?: string;
  fax?: string;
  /** First line of the contact block — usually the firm or office. */
  office?: string;
  isGovernment: boolean;
  roles: { docketId: string; role: number | null; partyId?: string }[];
}

/* ---------------------------------------------------------- Case details */

export interface ClusterDetail {
  id: string;
  caseName: string;
  caseNameFull?: string;
  dateFiled?: string | null;
  judges?: string;
  citations: string[];
  status?: string;
  citationCount?: number;
  syllabus?: string;
  summary?: string;
  proceduralHistory?: string;
  posture?: string;
  disposition?: string;
  attorneys?: string;
  docketId?: string;
  subOpinionIds: string[];
  url: string;
}

export interface DocketDetail {
  id: string;
  caseName: string;
  docketNumber?: string;
  courtId?: string;
  dateFiled?: string | null;
  dateTerminated?: string | null;
  dateLastFiling?: string | null;
  dateArgued?: string | null;
  assignedTo?: string;
  assignedToId?: string;
  referredTo?: string;
  cause?: string;
  natureOfSuit?: string;
  juryDemand?: string;
  jurisdictionType?: string;
  appealFrom?: string;
  clusterIds: string[];
  url: string;
}

export interface OpinionMeta {
  id: string;
  type: string;
  author?: string;
  authorId?: string;
  joinedBy?: string;
  perCuriam: boolean;
  downloadUrl?: string;
}

export interface DocketParty {
  id: string;
  name: string;
  roles: string[];
  attorneys: string[];
}

export interface DocketEntry {
  id: string;
  entryNumber?: number | null;
  dateFiled?: string | null;
  description: string;
  documents: { id: string; description: string; number?: string; pageCount?: number | null; available: boolean; url?: string }[];
}

/* ------------------------------------------------------------- Congress */

export interface LegislatorTerm {
  chamber: string;
  congress?: number;
  startYear?: number;
  endYear?: number | null;
  memberType?: string;
  stateCode?: string;
  district?: number | null;
}

export interface LegislatorProfile {
  bioguideId: string;
  name: string;
  honorific?: string;
  party: string;
  partyAbbr?: string;
  state: string;
  district?: number | null;
  chamber: string;
  imageUrl?: string;
  website?: string;
  birthYear?: string;
  office?: { address?: string; phone?: string };
  terms: LegislatorTerm[];
  sponsoredCount: number;
  cosponsoredCount: number;
  currentMember: boolean;
  url: string;
}

export interface Bill {
  id: string;
  congress?: number;
  type?: string;
  number?: string;
  title: string;
  introducedDate?: string | null;
  latestAction?: { date?: string; text: string };
  policyArea?: string;
  becameLaw: boolean;
  url?: string;
}

/* -------------------------------------------------------------- Dashboard */

export interface CoverageStats {
  opinions?: number;
  dockets?: number;
  judges?: number;
  courts?: number;
  attorneys?: number;
  legislators?: number;
}

export interface FeedItem {
  id: string;
  kind: 'opinion' | 'docket';
  title: string;
  court: string;
  date?: string | null;
  detail?: string;
  judge?: string;
  citeCount?: number;
  routeId: string;
}
