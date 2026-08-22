export type EntityType = 'JUDGE' | 'ATTORNEY' | 'PROSECUTOR' | 'LEGISLATOR' | 'CASE' | 'COURT';
export type ScoreType = 'BJI' | 'API' | 'PDI' | 'LVI';

export interface ScoreResult {
  entityId: string;
  entityType: EntityType;
  scoreType: ScoreType;
  value?: number;
  score?: number;
  confidence: number;
  sampleSize: number;
  breakdown?: Record<string, number>;
  disclaimer?: string;
}

export interface Judge {
  id: string;
  fullName: string;
  normalizedName?: string;
  court: string;
  jurisdiction: string;
  appointedDate?: string | null;
  appointingAuthority?: string | null;
  nominationDate?: string | null;
  courtListenerId?: number | null;
  createdAt: string;
}

export interface Attorney {
  id: string;
  fullName: string;
  normalizedName?: string;
  barNumber?: string | null;
  jurisdiction: string;
  firmName?: string | null;
  barAdmissionDate?: string | null;
  admissionJurisdiction?: string | null;
  createdAt: string;
}

export interface Prosecutor {
  id: string;
  fullName: string;
  normalizedName?: string;
  office: string;
  jurisdiction: string;
  appointedDate?: string | null;
  appointingAuthority?: string | null;
  createdAt: string;
}

export interface Legislator {
  id: string;
  fullName: string;
  chamber: string;
  party: string;
  state: string;
  district?: string | null;
  jurisdiction: string;
  createdAt: string;
}

export interface CaseSummary {
  caseId: string;
  jurisdiction: string;
  caseType: string;
  severityScore: number;
  filingDate: string;
  outcome: string | null;
  normalizedOutcome: number | null;
  courtListenerDocketId?: number | null;
}

export interface SearchResultItem {
  id: string;
  type: 'judge' | 'prosecutor' | 'attorney' | 'legislator' | 'case';
  name: string;
  court?: string;
  office?: string;
  jurisdiction: string;
  score?: number;
  scoreType?: string;
  barNumber?: string;
  party?: string;
  chamber?: string;
  state?: string;
}

export interface SearchResults {
  judges: SearchResultItem[];
  attorneys: SearchResultItem[];
  prosecutors: SearchResultItem[];
  legislators: SearchResultItem[];
  cases: SearchResultItem[];
}

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

export interface CaseTypeBreakdown {
  caseType: string;
  count?: number;
  caseCount?: number;
  sampleSize?: number;
  favorableRate?: number;
}

export interface FilingStep {
  stepNumber: number;
  date: string;
  entryNumber?: number;
  title: string;
  description: string;
  filedBy?: string;
  actionType: 'FILING' | 'MOTION' | 'ORDER' | 'DISPOSITION' | 'VERDICT' | string;
  documentUrl?: string;
}

export interface CaseDetail {
  id: string;
  docketNumber?: string;
  caseName?: string;
  plaintiffName?: string;
  defendantName?: string;
  plaintiffCounsel?: string;
  defenseCounsel?: string;
  presidingJudge?: string;
  judgeId?: string;
  courtName?: string;
  jurisdiction: string;
  caseType: string;
  filingDate?: string;
  resolutionDate?: string;
  status?: string;
  courtListenerUrl?: string;
  courtListenerDocketId?: number;
  filingSteps?: FilingStep[];
}

export interface LiveIntelligenceDecision {
  caseId?: string;
  title: string;
  court: string;
  caseType?: string;
  outcome?: string;
  deviation: string;
  timeAgo: string;
  route?: string;
}

export interface LiveIntelligenceJudge {
  id: string;
  name: string;
  court: string;
  casesAnalyzed: number;
  score: number;
  trend: number[];
  route?: string;
}

export interface LiveIntelligenceAttorney {
  id: string;
  name: string;
  firm: string;
  jurisdiction: string;
  casesAnalyzed: number;
  favorableRate: string;
  route?: string;
}

export interface LiveIntelligenceData {
  recentDecision?: LiveIntelligenceDecision;
  trendingJudge?: LiveIntelligenceJudge;
  attorneyPerformance?: LiveIntelligenceAttorney;
}

export interface CoverageStatsData {
  casesAnalyzed?: string;
  activeBenchJurists?: string;
  attorneysAnalyzed?: string;
  prosecutorsTracked?: string;
  courtsCovered?: string;
  judicialDataPoints?: string;
  casesCount?: number;
  judgesCount?: number;
  attorneysCount?: number;
  prosecutorsCount?: number;
}

