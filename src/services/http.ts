/**
 * Shared HTTP layer: timeouts, typed errors, a persistent TTL cache,
 * in-flight dedupe and a client-side rate limiter that queues requests
 * instead of letting them fail with HTTP 429.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ServiceName = 'courtlistener' | 'congress' | 'backend';

/** Thrown when a required API credential is missing from `.env`. */
export class ConfigError extends Error {
  service: ServiceName;
  constructor(service: ServiceName, message: string) {
    super(message);
    this.name = 'ConfigError';
    this.service = service;
  }
}

export class ApiError extends Error {
  status: number;
  service: ServiceName;
  constructor(service: ServiceName, status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.service = service;
  }
}

/* ----------------------------------------------------------- rate limiter */

type Listener = (queued: number) => void;
export type Priority = 'high' | 'normal' | 'low';
const PRIORITY_RANK: Record<Priority, number> = { high: 0, normal: 1, low: 2 };

interface Window {
  limit: number;
  ms: number;
}

/**
 * Multi-window sliding limiter (e.g. 5/minute AND 45/hour). A request starts
 * only when every window has room. Background (low-priority) work may not use
 * the last ~25% of any window, so what the user taps can always start.
 */
class RateLimiter {
  private starts: number[] = [];
  private queue: { run: () => void; rank: number }[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pausedUntil = 0;
  private listeners = new Set<Listener>();
  private longest: number;

  constructor(private windows: Window[]) {
    this.longest = Math.max(...windows.map((w) => w.ms));
  }

  /** Higher-priority work (what the user just tapped) runs before background work. */
  schedule<T>(task: () => Promise<T>, priority: Priority = 'normal'): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const rank = PRIORITY_RANK[priority];
      const item = { run: () => void task().then(resolve, reject), rank };
      // Insert after the last item of equal or higher priority (FIFO within a priority).
      let i = this.queue.length;
      while (i > 0 && this.queue[i - 1].rank > rank) i--;
      this.queue.splice(i, 0, item);
      this.emit();
      this.pump();
    });
  }

  /** Called on HTTP 429 — stop issuing requests until the server says so. */
  pause(ms: number) {
    this.pausedUntil = Math.max(this.pausedUntil, Date.now() + ms);
    this.pump();
  }

  get pending() {
    return this.queue.length;
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    this.listeners.forEach((l) => l(this.queue.length));
  }

  /** How long until `rank` may start (0 = now). */
  private waitFor(rank: number, now: number) {
    let wait = 0;
    for (const w of this.windows) {
      const inWindow = this.starts.filter((t) => now - t < w.ms);
      const reserve = Math.min(w.limit - 1, Math.max(Math.min(2, w.limit - 1), Math.round(w.limit * 0.25)));
      const cap = rank === PRIORITY_RANK.low ? w.limit - reserve : w.limit;
      if (inWindow.length >= cap) {
        // The slot frees when the oldest start that keeps us at the cap ages out.
        const oldest = inWindow[inWindow.length - cap];
        wait = Math.max(wait, w.ms - (now - oldest) + 50);
      }
    }
    return wait;
  }

  private pump() {
    // Re-evaluate on every call: a newly queued high-priority request must not
    // wait for a timer that was armed for queued background work.
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    let now = Date.now();
    this.starts = this.starts.filter((t) => now - t < this.longest);
    if (now < this.pausedUntil) {
      this.timer = setTimeout(() => {
        this.timer = null;
        this.pump();
      }, this.pausedUntil - now + 50);
      return;
    }
    let wait = 0;
    while (this.queue.length) {
      wait = this.waitFor(this.queue[0].rank, now);
      if (wait > 0) break;
      this.starts.push(now);
      this.queue.shift()!.run();
      now = Date.now();
    }
    this.emit();
    if (this.queue.length) {
      this.timer = setTimeout(() => {
        this.timer = null;
        this.pump();
      }, Math.max(wait, 50));
    }
  }
}

const limiters: Partial<Record<string, RateLimiter>> = {};

export function configureLimiter(key: string, perMinute: number, perHour?: number) {
  if (!limiters[key]) {
    const windows: Window[] = [{ limit: Math.max(1, perMinute), ms: 60_000 }];
    if (perHour) windows.push({ limit: Math.max(1, perHour), ms: 3_600_000 });
    limiters[key] = new RateLimiter(windows);
  }
  return limiters[key]!;
}

/** Number of requests waiting for the CourtListener budget (for UI hints). */
export function subscribeQueue(key: string, fn: Listener) {
  const l = limiters[key];
  if (!l) return () => {};
  return l.subscribe(fn);
}

/* ------------------------------------------------------------------ cache */

interface CacheEntry {
  expires: number;
  data: unknown;
}

const memory = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();
const STORE_PREFIX = '@bj_http:';
const MAX_PERSIST_BYTES = 250_000;
/** Expired entries are still shown (then refreshed in the background) for up to this long. */
const STALE_MAX_MS = 7 * 24 * 60 * 60 * 1000;

async function readPersisted(key: string): Promise<CacheEntry | null> {
  try {
    const raw = await AsyncStorage.getItem(STORE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (entry.expires + STALE_MAX_MS > Date.now()) {
      memory.set(key, entry);
      return entry;
    }
    AsyncStorage.removeItem(STORE_PREFIX + key).catch(() => {});
  } catch {
    /* storage unavailable — fall through to network */
  }
  return null;
}

function persist(key: string, entry: CacheEntry) {
  try {
    const raw = JSON.stringify(entry);
    if (raw.length <= MAX_PERSIST_BYTES) AsyncStorage.setItem(STORE_PREFIX + key, raw).catch(() => {});
  } catch {
    /* ignore */
  }
}

export async function clearCache() {
  memory.clear();
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith(STORE_PREFIX)));
  } catch {
    /* ignore */
  }
}

/* ---------------------------------------------------------------- request */

export interface RequestOptions {
  service: ServiceName;
  headers?: Record<string, string>;
  /** Cache successful GET responses (memory + device storage) for this many ms. */
  ttl?: number;
  timeout?: number;
  method?: 'GET' | 'POST';
  body?: string;
  /** Route through this rate limiter. */
  limiter?: string;
  /** Cache key override (e.g. to exclude auth headers). */
  cacheKey?: string;
  /** Queue priority when a rate limiter is used. */
  priority?: Priority;
}

function describeStatus(service: ServiceName, status: number) {
  if (status === 401 || status === 403) {
    return service === 'courtlistener'
      ? 'CourtListener rejected the API token. Check EXPO_PUBLIC_COURTLISTENER_TOKEN.'
      : service === 'congress'
        ? 'Congress.gov rejected the API key. Check EXPO_PUBLIC_CONGRESS_API_KEY.'
        : 'Not authorized.';
  }
  if (status === 404) return 'Record not found.';
  if (status === 429) return 'Rate limit reached. Please wait a moment and try again.';
  if (status >= 500) return 'The data service is temporarily unavailable.';
  return `Request failed (${status}).`;
}

/** "Expected available in 42 seconds." → 42000 */
function retryAfterMs(res: Response, detail: string) {
  const header = Number(res.headers.get('retry-after'));
  if (!isNaN(header) && header > 0) return header * 1000;
  const m = /available in (\d+) second/i.exec(detail);
  return m ? Number(m[1]) * 1000 : 60_000;
}

async function doFetch<T>(url: string, opts: RequestOptions, attempt = 0): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeout ?? 30000);
  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? 'GET',
      headers: { Accept: 'application/json', ...(opts.headers || {}) },
      body: opts.body,
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === 'AbortError') throw new ApiError(opts.service, 0, 'The request timed out. Check your connection and try again.');
    throw new ApiError(opts.service, 0, 'Network error. Check your connection and try again.');
  }
  clearTimeout(timer);

  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = j?.detail || j?.error?.message || j?.message || '';
    } catch {
      /* non-JSON body */
    }
    if (res.status === 429 && attempt < 4 && opts.limiter && limiters[opts.limiter]) {
      // Back off for as long as the server asks, then retry through the queue.
      const limiter = limiters[opts.limiter]!;
      limiter.pause(retryAfterMs(res, detail));
      return limiter.schedule(() => doFetch<T>(url, opts, attempt + 1), opts.priority ?? 'normal');
    }
    throw new ApiError(opts.service, res.status, detail || describeStatus(opts.service, res.status));
  }
  return (await res.json()) as T;
}

function fetchAndStore<T>(key: string, url: string, opts: RequestOptions): Promise<T> {
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;
  const run = (async () => {
    const exec = () => doFetch<T>(url, opts);
    const limiter = opts.limiter ? limiters[opts.limiter] : undefined;
    const data = limiter ? await limiter.schedule(exec, opts.priority ?? 'normal') : await exec();
    if ((opts.method ?? 'GET') === 'GET' && opts.ttl) {
      const entry = { expires: Date.now() + opts.ttl, data };
      memory.set(key, entry);
      persist(key, entry);
    }
    return data;
  })();
  inflight.set(key, run);
  run.finally(() => inflight.delete(key)).catch(() => {});
  return run;
}

/**
 * Cached request with stale-while-revalidate: fresh cache returns instantly;
 * expired cache also returns instantly and is refreshed quietly in the
 * background, so screens never wait on data the device already has.
 */
export async function requestJson<T>(url: string, opts: RequestOptions): Promise<T> {
  const method = opts.method ?? 'GET';
  const key = opts.cacheKey ?? (method === 'GET' ? url : `${method} ${url} ${opts.body ?? ''}`);

  if (method === 'GET' && opts.ttl) {
    const entry = memory.get(key) ?? (await readPersisted(key));
    if (entry) {
      if (entry.expires <= Date.now() && !inflight.has(key)) {
        fetchAndStore<T>(key, url, { ...opts, priority: 'low' }).catch(() => {});
      }
      return entry.data as T;
    }
  }
  return fetchAndStore<T>(key, url, opts);
}

export function buildQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const parts: string[] = [];
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  });
  return parts.length ? `?${parts.join('&')}` : '';
}

/** Human-readable message for any error thrown by the data layer. */
export function errorMessage(err: unknown): string {
  if (err instanceof ConfigError || err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong.';
}
