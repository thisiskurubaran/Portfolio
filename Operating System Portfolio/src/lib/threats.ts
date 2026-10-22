import { getStore } from "./store";

export type ThreatType = "probe" | "honeypot" | "injection" | "ratelimit";

export interface ThreatEvent {
  at: number;
  type: ThreatType;
  // From the request's own geo header, at most a country code. Never looked up.
  country: string | null;
  path: string | null;
  visitor: string;
}

const DAYS = 7;
const dayKey = (t: number) => `folioos:threats:${new Date(t).toISOString().slice(0, 10)}`;

// F37: one line per blocked attempt, kept for 7 days, with a salted IP hash
// instead of the address. Logging never blocks or breaks the request.
export async function logThreat(event: Omit<ThreatEvent, "at">) {
  const store = getStore();
  if (!store) return;
  const at = Date.now();
  const entry: ThreatEvent = { ...event, at, path: event.path?.slice(0, 80) ?? null, country: event.country?.slice(0, 2).toUpperCase() ?? null };
  try {
    await store.listPush(dayKey(at), JSON.stringify(entry), 5000, (DAYS + 1) * 86400);
  } catch {
    // A failed log is not worth failing the response over.
  }
}

// Repeat offenders: more than this many blocked attempts in an hour earns a
// one hour 429 on every page.
const OFFENDER_LIMIT = 10;

export async function recordOffence(visitor: string): Promise<void> {
  const store = getStore();
  if (!store) return;
  const count = await store.incr(`folioos:offences:${visitor}`, 3600);
  if (count > OFFENDER_LIMIT) await store.set(`folioos:blocked:${visitor}`, "1", 3600);
}

export async function isBlocked(visitor: string): Promise<boolean> {
  const store = getStore();
  if (!store) return false;
  return (await store.get(`folioos:blocked:${visitor}`)) === "1";
}

export interface ThreatSummary {
  days: number;
  total: number;
  byType: Record<string, number>;
  byCountry: Record<string, number>;
}

// F39: counts only. No hashes, paths or times leave the server.
export async function summarizeThreats(): Promise<ThreatSummary> {
  const store = getStore();
  const summary: ThreatSummary = { days: DAYS, total: 0, byType: {}, byCountry: {} };
  if (!store) return summary;
  for (let i = 0; i < DAYS; i++) {
    const raw = await store.listRange(dayKey(Date.now() - i * 86400_000), 5000);
    for (const r of raw) {
      try {
        const e = (typeof r === "string" ? JSON.parse(r) : r) as ThreatEvent;
        summary.total++;
        summary.byType[e.type] = (summary.byType[e.type] ?? 0) + 1;
        const c = e.country ?? "Unknown";
        summary.byCountry[c] = (summary.byCountry[c] ?? 0) + 1;
      } catch {
        // skip malformed lines
      }
    }
  }
  return summary;
}
