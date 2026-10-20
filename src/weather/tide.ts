import type { TideData } from "./schema";

export type TideReading = {
  /** -1 lowest of the day to 1 highest. */
  level: number;
  rising: boolean;
  /** True when no marine data covered this spot and the moon model was used. */
  estimated: boolean;
};

const HOUR = 3600_000;
const M2_HOURS = 12.4206;
// Typical delay between the moon passing overhead and high water.
const LUNITIDAL_HOURS = 2;

/** Reads the level now from hourly sea level, scaled to the day's own range. */
export function tideFromData(data: TideData, now: number): TideReading | null {
  const pts = data.points;
  const i = pts.findIndex((p) => p.t > now);
  if (i <= 0) return null;
  const a = pts[i - 1]!;
  const b = pts[i]!;
  const h = a.h + ((b.h - a.h) * (now - a.t)) / (b.t - a.t);

  // Range over roughly a day around now, so a calm sea still reads as tidal.
  const window = pts.filter((p) => Math.abs(p.t - now) < 13 * HOUR).map((p) => p.h);
  const min = Math.min(...window);
  const max = Math.max(...window);
  const level = max - min < 0.01 ? 0 : ((h - min) / (max - min)) * 2 - 1;
  return { level, rising: b.h > a.h, estimated: false };
}

/**
 * A two part estimate from the moon: the main lunar tide every 12.42 hours,
 * stronger near new and full moon (spring tides) and weaker at the quarters.
 */
export function estimateTide(now: number, moonPhase: number, lon: number | null): TideReading {
  // Local solar hour, from longitude when known, else the device clock.
  const d = new Date(now);
  const solarHour = lon === null ? d.getHours() + d.getMinutes() / 60 : (d.getUTCHours() + d.getUTCMinutes() / 60 + lon / 15 + 24) % 24;
  // The moon crosses overhead about noon at new moon and about 50 minutes later each day.
  const transit = 12 + moonPhase * 24.84;
  const since = solarHour - transit - LUNITIDAL_HOURS;
  const angle = (2 * Math.PI * since) / M2_HOURS;
  const spring = 0.7 + 0.3 * Math.cos(4 * Math.PI * moonPhase);
  return { level: spring * Math.cos(angle), rising: Math.sin(angle) < 0, estimated: true };
}
