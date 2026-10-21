import { lambert } from "./lambert";
import { type State } from "./kepler";
import { sub, type Vec3 } from "./vec";

export const GM_SUN_KM = 1.32712440018e11;
export const GM_EARTH_KM = 398_600.4418;
export const GM_MARS_KM = 42_828.37;
const DAY_S = 86_400;

export type Ephemeris = (ms: number) => State;

export type Transfer = {
  departMs: number;
  arriveMs: number;
  /** Heliocentric velocity just after leaving Earth's sphere of influence, km/s. */
  v1: Vec3;
  /** Heliocentric velocity on reaching Mars, km/s. */
  v2: Vec3;
  /** Hyperbolic excess speed at departure, km/s. Its square is the launch energy C3. */
  vInfDepart: number;
  vInfArrive: number;
  /** Burn from a circular parking orbit to the departure hyperbola, km/s. */
  departBurn: number;
};

/** Burn from a circular orbit of radius r to a hyperbola with excess speed vInf. */
export function escapeBurn(vInf: number, r: number, mu: number): number {
  return Math.sqrt(vInf * vInf + (2 * mu) / r) - Math.sqrt(mu / r);
}

export function solveTransfer(
  departMs: number,
  tofDays: number,
  earth: Ephemeris,
  mars: Ephemeris,
  parkingRadiusKm: number,
): Transfer | null {
  const arriveMs = departMs + tofDays * DAY_S * 1000;
  const e = earth(departMs);
  const m = mars(arriveMs);
  const sol = lambert(e.r, m.r, tofDays * DAY_S, GM_SUN_KM);
  if (!sol) return null;
  const vInfDepart = Math.hypot(...sub(sol.v1, e.v));
  const vInfArrive = Math.hypot(...sub(sol.v2, m.v));
  return {
    departMs,
    arriveMs,
    v1: sol.v1,
    v2: sol.v2,
    vInfDepart,
    vInfArrive,
    departBurn: escapeBurn(vInfDepart, parkingRadiusKm, GM_EARTH_KM),
  };
}

/**
 * Finds the next launch window: a coarse grid over departure date and time
 * of flight (a porkchop plot), then a finer pass around the best cell. The
 * cost is the departure burn plus the arrival excess speed, which is what
 * aerocapture at Mars has to shed.
 */
export function nextWindow(
  fromMs: number,
  earth: Ephemeris,
  mars: Ephemeris,
  parkingRadiusKm: number,
  searchDays = 800,
): Transfer | null {
  const cost = (t: Transfer) => t.departBurn + t.vInfArrive;
  let best: Transfer | null = null;
  const scan = (d0: number, d1: number, dStep: number, f0: number, f1: number, fStep: number) => {
    for (let d = d0; d <= d1; d += dStep) {
      for (let tof = f0; tof <= f1; tof += fStep) {
        const t = solveTransfer(fromMs + d * DAY_S * 1000, tof, earth, mars, parkingRadiusKm);
        if (t && (!best || cost(t) < cost(best))) best = t;
      }
    }
  };
  scan(0, searchDays, 4, 120, 360, 8);
  if (!best) return null;
  const b = best as Transfer;
  const d = (b.departMs - fromMs) / (DAY_S * 1000);
  const tof = (b.arriveMs - b.departMs) / (DAY_S * 1000);
  scan(Math.max(0, d - 6), d + 6, 0.5, Math.max(100, tof - 10), tof + 10, 1);
  return best;
}
