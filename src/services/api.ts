import { Platform, NativeModules } from 'react-native';
import type {
  Judge,
  Attorney,
  Prosecutor,
  Legislator,
  ScoreResult,
  CaseSummary,
  SearchResults,
  AuthResponse,
  AuthUser,
  CaseTypeBreakdown,
  CaseDetail,
  LiveIntelligenceData,
  CoverageStatsData,
} from '../types';

const PROD_BACKEND_URL = 'https://bmj-be.vercel.app';
const LOCAL_BACKEND_URL = 'http://localhost:4000';
const EMULATOR_BACKEND_URL = 'http://10.0.2.2:4000';
const LAN_BACKEND_URL = 'http://192.168.1.5:4000';

let API_URL = PROD_BACKEND_URL;

export function setCustomApiUrl(url: string) {
  API_URL = url;
}

export function getApiUrl() {
  return API_URL;
}

async function getJson<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ message: `API request failed (${res.status})` }));
      throw new Error(errData.message || `API request failed: ${path} (${res.status})`);
    }
    return res.json() as Promise<T>;
  } catch (err: any) {
    clearTimeout(timeoutId);
    // Resilient fallback across production and local environments
    const fallbacks = [LOCAL_BACKEND_URL, PROD_BACKEND_URL, LAN_BACKEND_URL, EMULATOR_BACKEND_URL].filter(
      (u) => u !== API_URL
    );
    for (const fbUrl of fallbacks) {
      try {
        const fbRes = await fetch(`${fbUrl}${path}`, { headers });
        if (fbRes.ok) return fbRes.json() as Promise<T>;
      } catch {}
    }
    throw err;
  }
}

async function postJson<T>(path: string, body: any, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ message: `API request failed (${res.status})` }));
      throw new Error(errData.message || `API request failed: ${path} (${res.status})`);
    }
    return res.json() as Promise<T>;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export const api = {
  search: (q: string) => getJson<SearchResults>(`/search?q=${encodeURIComponent(q)}`),
  getRecentIntelligence: () =>
    getJson<LiveIntelligenceData>(`/intelligence/recent`)
      .catch(() => getJson<LiveIntelligenceData>(`/search/intelligence`)),
  getIntelligenceFeed: () =>
    getJson<any[]>(`/intelligence/feed`)
      .catch(() => []),
  getCoverageStats: () => getJson<CoverageStatsData>(`/intelligence/stats`),

  // Auth
  signup: (data: { email: string; name: string; password: string; role?: string }) =>
    postJson<AuthResponse>('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    postJson<AuthResponse>('/auth/login', data),
  me: (token: string) => getJson<AuthUser>('/auth/me', token),

  // Judges
  judge: (id: string) => getJson<Judge>(`/judges/${id}`),
  judgeScore: (id: string) => getJson<ScoreResult>(`/judges/${id}/score`),
  judgeCases: (id: string) => getJson<CaseSummary[]>(`/judges/${id}/cases`),
  judgeCaseTypes: (id: string) => getJson<CaseTypeBreakdown[]>(`/judges/${id}/case-types`),

  // Attorneys
  attorney: (id: string) => getJson<Attorney>(`/attorneys/${id}`),
  attorneyScore: (id: string) => getJson<ScoreResult>(`/attorneys/${id}/score`),
  attorneyCases: (id: string) => getJson<CaseSummary[]>(`/attorneys/${id}/cases`),
  attorneyByCaseType: (id: string) => getJson<CaseTypeBreakdown[]>(`/attorneys/${id}/performance/case-types`),

  // Prosecutors
  prosecutor: (id: string) => getJson<Prosecutor>(`/prosecutors/${id}`),
  prosecutorScore: (id: string) => getJson<ScoreResult>(`/prosecutors/${id}/score`),
  prosecutorCases: (id: string) => getJson<CaseSummary[]>(`/prosecutors/${id}/cases`),

  // Legislators
  legislator: (id: string) => getJson<Legislator>(`/legislators/${id}`),
  legislatorScore: (id: string) => getJson<ScoreResult>(`/legislators/${id}/score`),

  // Cases
  case: (id: string) => getJson<CaseDetail>(`/cases/${encodeURIComponent(id)}`),
};
