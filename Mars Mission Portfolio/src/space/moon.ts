import type { Vec3 } from "@/physics/vec";
import { eclipticOfDateToJ2000 } from "./frames";
import { daysSinceJ2000, toRad } from "./time";

/**
 * Geocentric Moon position from the largest terms of Meeus, Astronomical
 * Algorithms, chapter 47. Good to about 0.3 degrees in longitude and a few
 * hundred km in distance: plenty for placing the Moon in the sky and for
 * deciding whether a departure passes near it.
 *
 * Returns km in the J2000 ecliptic frame, like the rest of the scene.
 */
export function moonGeocentric(ms: number): Vec3 {
  const T = daysSinceJ2000(ms) / 36525;
  const Lp = toRad(218.3164477 + 481267.88123421 * T);
  const D = toRad(297.8501921 + 445267.1114034 * T);
  const M = toRad(357.5291092 + 35999.0502909 * T);
  const Mp = toRad(134.9633964 + 477198.8675055 * T);
  const F = toRad(93.272095 + 483202.0175233 * T);

  const lon =
    Lp +
    toRad(
      6.289 * Math.sin(Mp) +
        1.274 * Math.sin(2 * D - Mp) +
        0.658 * Math.sin(2 * D) +
        0.214 * Math.sin(2 * Mp) -
        0.186 * Math.sin(M) -
        0.114 * Math.sin(2 * F),
    );
  const lat = toRad(
    5.128 * Math.sin(F) + 0.281 * Math.sin(Mp + F) + 0.278 * Math.sin(Mp - F) + 0.173 * Math.sin(2 * D - F),
  );
  const r =
    385_000.56 -
    20_905.355 * Math.cos(Mp) -
    3_699.111 * Math.cos(2 * D - Mp) -
    2_955.968 * Math.cos(2 * D) -
    569.925 * Math.cos(2 * Mp);

  const c = Math.cos(lat);
  return eclipticOfDateToJ2000([r * c * Math.cos(lon), r * c * Math.sin(lon), r * Math.sin(lat)], T);
}

export const MOON_RADIUS_KM = 1737.4;
export const GM_MOON_KM = 4_902.8;
