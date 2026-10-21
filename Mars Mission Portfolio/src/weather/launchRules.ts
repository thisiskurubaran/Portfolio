import type { Forecast, Weather } from "./schema";

/**
 * A short version of real launch weather rules. Range safety will not
 * launch into thunderstorms (triggered lightning), through peak ground
 * winds above about 30 knots, or in heavy rain. Cloud alone only matters
 * where it carries lightning, so it changes the look, not the decision.
 */
export const GUST_LIMIT_KMH = 56;
const THUNDER = new Set([95, 96, 99]);
const HEAVY = new Set([65, 67, 75, 82, 86]);

export type Violation = "lightning" | "wind" | "rain";

export function violations(w: { code: number; gusts: number }): Violation[] {
  const out: Violation[] = [];
  if (THUNDER.has(w.code)) out.push("lightning");
  if (w.gusts > GUST_LIMIT_KMH) out.push("wind");
  if (HEAVY.has(w.code)) out.push("rain");
  return out;
}

export function isGo(w: Weather | null): boolean {
  return !w || violations(w).length === 0;
}

/** First forecast hour, from now, that passes every rule; null if none in the forecast. */
export function nextClearSlot(forecast: Forecast, nowMs: number): number | null {
  for (const h of forecast) {
    if (h.t + 3_600_000 <= nowMs) continue;
    if (violations(h).length === 0) return Math.max(h.t, nowMs);
  }
  return null;
}

/** Plain words for a WMO weather code, for the pad readout. */
export function describe(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return code >= 65 ? "Heavy rain" : "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return code === 82 ? "Violent showers" : "Showers";
  if (code === 85 || code === 86) return "Snow showers";
  if (code >= 95) return "Thunderstorm";
  return "Unsettled";
}
