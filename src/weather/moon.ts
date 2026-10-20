const SYNODIC_DAYS = 29.530588853;
// A known new moon: 2000-01-06 18:14 UTC.
const REFERENCE_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

/** 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter. */
export function moonPhase(date: Date): number {
  const days = (date.getTime() - REFERENCE_NEW_MOON) / 86_400_000;
  return ((days / SYNODIC_DAYS) % 1 + 1) % 1;
}
