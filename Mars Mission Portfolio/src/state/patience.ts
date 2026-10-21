/**
 * F12: rare sightings are earned by staying. Counts only time with the tab
 * visible (Page Visibility API), in this page load; nothing is stored.
 */
export const patience = { visibleS: 0, lastMs: 0 };

export function tickPatience(nowMs: number): number {
  if (typeof document !== "undefined" && document.visibilityState === "visible" && patience.lastMs) {
    // A long gap means the page was frozen or asleep, not watched.
    patience.visibleS += Math.min((nowMs - patience.lastMs) / 1000, 1);
  }
  patience.lastMs = nowMs;
  return patience.visibleS;
}

/** Seconds of watching before each sighting can show. */
export const EARNED_AFTER_S = { comet: 120, voyager: 150, night: 0 } as const;
