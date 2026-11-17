export function formatDate(d?: string | null, style: 'short' | 'long' = 'short') {
  if (!d) return '—';
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return d;
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function yearOf(d?: string | null) {
  if (!d) return undefined;
  const y = new Date(d).getUTCFullYear();
  return isNaN(y) ? undefined : y;
}

/** "3 days ago", "2 months ago" … for feed timestamps. */
export function timeAgo(d?: string | null) {
  if (!d) return '';
  const then = new Date(d).getTime();
  if (isNaN(then)) return '';
  const diff = Date.now() - then;
  const day = 86400000;
  if (diff < day) return 'Today';
  if (diff < 2 * day) return 'Yesterday';
  if (diff < 30 * day) return `${Math.floor(diff / day)} days ago`;
  if (diff < 365 * day) return `${Math.floor(diff / (30 * day))} mo ago`;
  return `${Math.floor(diff / (365 * day))} yr ago`;
}

export function formatCount(n?: number) {
  if (n === undefined || n === null || isNaN(n)) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000).toLocaleString()}K`;
  return n.toLocaleString();
}

/** Years between two dates (or until today). */
export function yearsBetween(start?: string | null, end?: string | null) {
  if (!start) return undefined;
  const a = new Date(start).getTime();
  const b = end ? new Date(end).getTime() : Date.now();
  if (isNaN(a) || isNaN(b)) return undefined;
  return Math.max(0, Math.round((b - a) / (365.25 * 86400000)));
}

/** Shows a server message only if it reads like plain language; otherwise a fallback. */
export function userFacing(message: string | undefined, fallback: string) {
  if (!message) return fallback;
  if (/api|request failed|network|abort|timeout|fetch|status|\(\d{3}\)|\/auth\//i.test(message)) return fallback;
  return message;
}
