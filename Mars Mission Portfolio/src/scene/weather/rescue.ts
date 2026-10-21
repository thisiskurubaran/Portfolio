import { effective, useConditions } from "@/state/conditions";
import { activeShowers } from "@/space/meteors";
import { gScale } from "@/space/spaceWeather";

/** Seconds the reticle has to stay on the drifting craft. */
export const RESCUE_HOLD_S = 5;

/**
 * F09: a small cargo drone knocked out of attitude control by a storm.
 * Holding on it sends a correction burn. Module state, read by the scene
 * and the HUD.
 */
export const rescue = {
  /** Wall clock ms the hold started, or 0. */
  holdingSince: 0,
  done: false,
};

/** A drone is in trouble during a severe storm, live or staged with dramatic events on. */
export function rescueNeeded(simMs: number): boolean {
  const c = useConditions.getState();
  const e = effective(c.mode, c.spaceWeather, activeShowers(simMs).length > 0, c.dramatic);
  return (e.staged ? c.dramatic && c.mode === "solarStorm" : gScale(e.kp) >= 3 || e.radiation >= 2) && !rescue.done;
}

export function holdProgress(now = Date.now()): number {
  return rescue.holdingSince ? Math.min((now - rescue.holdingSince) / 1000 / RESCUE_HOLD_S, 1) : 0;
}

export function startHold(): void {
  if (!rescue.done && !rescue.holdingSince) rescue.holdingSince = Date.now();
}

export function endHold(): void {
  if (holdProgress() >= 1) rescue.done = true;
  rescue.holdingSince = 0;
}
